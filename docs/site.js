// ValoTrac 網站共用腳本：GitHub 連結、版本號／下載次數、中英切換
(function () {
  // ↓↓↓ 改成你的 GitHub 帳號與專案名稱（只要改這裡）↓↓↓
  var GH_USER = "Fauzh";
  var GH_REPO = "ValoTrac";
  var ASSET = "ValoTrac-Setup.exe";
  // ↑↑↑

  var repo = "https://github.com/" + GH_USER + "/" + GH_REPO;
  var links = {
    repo: repo,
    releases: repo + "/releases",
    issues: repo + "/issues",
    download: repo + "/releases/latest/download/" + ASSET   // 永遠指向最新版
  };
  function fillLinks() {
    document.querySelectorAll("[data-gh]").forEach(function (a) {
      var u = links[a.getAttribute("data-gh")];
      if (u) a.href = u;
    });
  }

  // ---------- 中英切換 ----------
  var nodes = document.querySelectorAll("[data-en]");
  nodes.forEach(function (el) { el.setAttribute("data-zh", el.innerHTML); });
  function apply(lang) {
    nodes.forEach(function (el) { el.innerHTML = el.getAttribute(lang === "en" ? "data-en" : "data-zh"); });
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
    var b = document.getElementById("langBtn");
    if (b) b.textContent = lang === "en" ? "中文" : "EN";
    window.__lang = lang;
    fillLinks();   // 切換語言會重建內容，連結要重新填
    var c = document.getElementById("count");
    if (c && window.__count != null) c.textContent = window.__count.toLocaleString();
  }
  var saved = null;
  try { saved = localStorage.getItem("valotrac:lang"); } catch (e) {}
  var nav = (navigator.language || "").toLowerCase();
  var lang = saved || (nav.indexOf("zh") === 0 ? "zh" : "en");
  apply(lang);
  var btn = document.getElementById("langBtn");
  if (btn) btn.addEventListener("click", function () {
    lang = lang === "en" ? "zh" : "en";
    try { localStorage.setItem("valotrac:lang", lang); } catch (e) {}
    apply(lang);
  });

  // ---------- 版本號與累計下載次數（只有主頁有） ----------
  if (!document.getElementById("count")) return;
  fetch("https://api.github.com/repos/" + GH_USER + "/" + GH_REPO + "/releases?per_page=100")
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      var total = 0;
      list.forEach(function (rel) { (rel.assets || []).forEach(function (a) { total += a.download_count; }); });
      window.__count = total;
      document.getElementById("count").textContent = total.toLocaleString();
      var latest = list.find(function (r) { return !r.draft && !r.prerelease; });
      if (latest) document.getElementById("ver").textContent = latest.tag_name.charAt(0) === "v" ? latest.tag_name : "v" + latest.tag_name;
    })
    .catch(function () {});
})();
