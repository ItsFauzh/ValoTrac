# ValoTrac API 代理（Cloudflare Worker）

Riot API 金鑰只存在 Cloudflare（加密的 Secret），ValoTrac 程式和 GitHub 上都不會有金鑰。

## 部署（第一次）

在 `D:\Claude\ValoTrac\worker` 資料夾開終端機：

```
npx wrangler login                 # 開瀏覽器登入 Cloudflare（免費帳號即可）
npx wrangler secret put RIOT_API_KEY   # 貼上 RGAPI- 開頭的金鑰，按 Enter
npx wrangler deploy                # 部署，完成後會顯示網址
```

部署完成會顯示類似 `https://valotrac-api.你的帳號.workers.dev` 的網址，
貼到 ValoTrac →「一般設定」→「Riot 官方 API（測試）」→ Worker 網址 → 測試連線。

## 金鑰過期 / 換正式金鑰

開發者金鑰每 24 小時會失效，到 https://developer.riotgames.com 重新產生後：

```
npx wrangler secret put RIOT_API_KEY
```

貼上新金鑰即可，不用重新部署，ValoTrac 也不用改。拿到正式金鑰時也是同樣做法。

## 開放的 API

| 路徑 | Riot API | 開發者金鑰 |
|---|---|---|
| `/health` | — | ✓ |
| `/account?name=&tag=&region=asia` | ACCOUNT-V1 | ✓ |
| `/val/content?shard=ap&locale=zh-TW` | VAL-CONTENT-V1 | ✕（需要正式金鑰） |
| `/val/matchlist?puuid=&shard=ap` | VAL-MATCH-V1 | ✕（需要正式金鑰） |
| `/val/match?id=&shard=ap` | VAL-MATCH-V1 | ✕（需要正式金鑰） |

只接受 GET、參數都會檢查，每個 IP 每分鐘最多 60 次。
