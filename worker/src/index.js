// ValoTrac API 代理（Cloudflare Worker）
// 用途：Riot API 金鑰只放在這裡（Cloudflare 的加密 Secret），ValoTrac 程式本身不帶金鑰。
// 只開放 ValoTrac 需要的幾個 Riot API，參數都會檢查，不能拿來打任意網址。
//
// 金鑰設定：npx wrangler secret put RIOT_API_KEY
//
// 路由（全部 GET）：
//   /health                                      → 檢查 Worker 是否正常、金鑰有沒有設定
//   /account?name=Player&tag=TW1[&region=asia]   → ACCOUNT-V1：用 Riot ID 查 PUUID
//   /val/content[?shard=ap&locale=zh-TW]         → VAL-CONTENT-V1：完整遊戲內容（約 1.5MB）
//   /val/acts[?shard=ap]                         → VAL-CONTENT-V1 精簡版：只有賽季（ValoTrac 用這個）
//   /val/matchlist?puuid=...[&shard=ap]          → VAL-MATCH-V1：最近對戰清單（需要正式金鑰）
//   /val/match?id=...[&shard=ap]                 → VAL-MATCH-V1：單場對戰（需要正式金鑰）

const ACCOUNT_REGIONS = ["americas", "asia", "europe"];
const VAL_SHARDS = ["ap", "br", "eu", "kr", "latam", "na"];
const LOCALES = ["zh-TW", "en-US", "ja-JP", "ko-KR", "zh-CN"];
const ID_RE = /^[0-9a-zA-Z_-]{10,100}$/;   // puuid / matchId

// 簡單的速率限制（每個 IP，每個 Worker 實例），避免被濫用把金鑰的額度用光
const hits = new Map();
const LIMIT = 60, WINDOW_MS = 60_000;
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) { hits.set(ip, { start: now, n: 1 }); return false; }
  h.n++;
  if (hits.size > 5000) hits.clear();
  return h.n > LIMIT;
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

function bad(msg) { return json({ error: msg }, 400); }
function pick(v, list, def) { return v == null || v === "" ? def : list.includes(v) ? v : null; }

async function riot(env, url, cacheSeconds) {
  const r = await fetch(url, {
    headers: { "X-Riot-Token": env.RIOT_API_KEY, Accept: "application/json" },
    cf: cacheSeconds ? { cacheTtl: cacheSeconds, cacheEverything: true } : undefined,
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 300) }; }
  // Riot 的錯誤格式：{ status: { status_code, message } }
  const extra = {};
  const ra = r.headers.get("Retry-After");
  if (ra) extra["Retry-After"] = ra;
  if (!r.ok) {
    const hint = r.status === 403 ? "forbidden (this API key has no access to this endpoint — VALORANT APIs need a production key)"
      : r.status === 401 ? "unauthorized (API key missing or expired)"
      : r.status === 404 ? "not found"
      : r.status === 429 ? "rate limited"
      : "riot api error";
    return json({ error: hint, riotStatus: r.status, riot: body }, r.status, extra);
  }
  return json(body, 200, cacheSeconds ? { "Cache-Control": `public, max-age=${cacheSeconds}` } : extra);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
    const url = new URL(request.url);
    const q = url.searchParams;
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/" || path === "/health") {
      return json({ ok: true, service: "valotrac-api", keyConfigured: !!env.RIOT_API_KEY });
    }
    if (!env.RIOT_API_KEY) return json({ error: "RIOT_API_KEY is not set on the worker" }, 500);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (rateLimited(ip)) return json({ error: "too many requests" }, 429, { "Retry-After": "60" });

    if (path === "/account") {
      const name = (q.get("name") || "").trim(), tag = (q.get("tag") || "").trim();
      const region = pick(q.get("region"), ACCOUNT_REGIONS, "asia");
      if (!name || name.length > 32 || !tag || tag.length > 8 || !region) return bad("need name (≤32), tag (≤8), region");
      return riot(env, `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
    }

    const shard = pick(q.get("shard"), VAL_SHARDS, "ap");
    if (!shard) return bad("bad shard");

    if (path === "/val/content") {
      const locale = pick(q.get("locale"), LOCALES, "zh-TW");
      if (!locale) return bad("bad locale");
      return riot(env, `https://${shard}.api.riotgames.com/val/content/v1/contents?locale=${locale}`, 3600);
    }
    if (path === "/val/acts") {          // 精簡版：只回傳賽季資訊（完整內容約 1.5MB）
      const r = await riot(env, `https://${shard}.api.riotgames.com/val/content/v1/contents?locale=en-US`, 3600);
      if (r.status !== 200) return r;
      const c = await r.json();
      return json({ version: c.version, acts: (c.acts || []).map(a => ({ id: a.id, parentId: a.parentId, type: a.type, name: a.name, isActive: a.isActive })) },
        200, { "Cache-Control": "public, max-age=3600" });
    }
    if (path === "/val/matchlist") {
      const puuid = q.get("puuid") || "";
      if (!ID_RE.test(puuid)) return bad("bad puuid");
      return riot(env, `https://${shard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`);
    }
    if (path === "/val/match") {
      const id = q.get("id") || "";
      if (!ID_RE.test(id)) return bad("bad match id");
      return riot(env, `https://${shard}.api.riotgames.com/val/match/v1/matches/${id}`, 86400);
    }
    return json({ error: "not found" }, 404);
  },
};
