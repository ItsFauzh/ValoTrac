<p align="center">
  <img src="docs/img/icon.png" width="96" alt="ValoTrac">
</p>

<h1 align="center">ValoTrac</h1>

<p align="center">
  A free Windows companion app that tracks your VALORANT rank and RR, with an animated rank card for your stream or screen.<br>
  免費的 VALORANT 段位追蹤工具：打完一場，段位卡自己會動。
</p>

<p align="center">
  <a href="../../releases/latest"><b>⬇ Download v1.0.0 for Windows / 下載</b></a> ·
  <a href="https://itsfauzh.github.io/ValoTrac/">Website / 網站</a> ·
  <a href="https://itsfauzh.github.io/ValoTrac/privacy.html">Privacy / 隱私權</a>
</p>

<p align="center">
  <img src="docs/img/card-updown.gif" width="512" alt="Rank card: +18 RR win, −16 RR loss">
</p>

---

## Features / 功能

| | English | 中文 |
|---|---|---|
| 🎴 | **Rank card**: current tier, RR, today's wins / losses and net RR. Add it to OBS or show it on screen. | **段位卡**：即時顯示段位、RR、本日勝敗與淨 RR，可放進 OBS 或直接顯示在螢幕上。 |
| ✨ | **Animations**: win, loss, rank-up and rank-down animations about 30 seconds after each match. | **上分動畫**：上分、掉分、升段、降段都有專屬動畫，比賽結束約 30 秒內自動更新。 |
| ⌨️ | **Hold Tab to show**: always visible, or only while holding Tab. Clicks pass straight through. | **按 Tab 顯示**：一直顯示或按住 Tab 才出現，滑鼠直接穿透。 |
| 👤 | **Only your own data**: never looks up or shows other players. | **只看你自己**：不會查詢或顯示其他玩家的資料。 |
| 🌐 | **English / 中文** interface. | **中英文介面**。 |
| 🔒 | Never asks for your Riot password. Settings and stats stay on your PC. | 不需要帳號密碼，設定與戰績只存在你的電腦。 |

<p align="center">
  <img src="docs/img/rankup.gif" width="420" alt="Rank-up animation">
</p>

<p align="center">
  <img src="docs/img/shot-app.png" width="720" alt="ValoTrac settings">
</p>

## How it works / 運作方式

ValoTrac uses **Riot Sign On (RSO)**: players sign in on Riot's official page and explicitly opt in before any data is read. The API key and RSO secret are kept on a Cloudflare Worker, never inside the app.
ValoTrac 使用 **Riot Sign On（RSO）**：玩家在 Riot 官方頁面登入並同意後，才會讀取資料。API 金鑰與 RSO 密鑰保管在 Cloudflare Worker，不會放進程式裡。

```
ValoTrac (PC app)  ──HTTPS──▶  Cloudflare Worker (API key · RSO secret)  ──▶  Riot API
   "Sign in with Riot"              exchanges RSO code                          VAL-MATCH-V1
                                    calls API for the signed-in player only      ACCOUNT-V1 /accounts/me
                                    stores nothing                               VAL-CONTENT-V1
```

1. **Sign in / 登入**: click “Sign in with Riot” in ValoTrac. / 在 ValoTrac 按「使用 Riot 登入」。
2. **Opt in / 同意授權**: approve access on Riot's official page. / 在 Riot 官方頁面同意。
3. **Fetch / 查詢**: the Worker calls the official API for the signed-in player only. / Worker 只為登入的玩家本人呼叫官方 API。
4. **Update / 更新**: after each competitive match, the player's own rank card updates. / 每場競技對戰後，玩家自己的段位卡自動更新。

| API | Use / 用途 |
|---|---|
| RSO (OAuth 2.0) | Player sign-in and consent / 玩家登入與授權 |
| ACCOUNT-V1 `/accounts/me` | Identify the signed-in player / 確認登入的玩家 |
| VAL-MATCH-V1 | The player's own recent matches / 玩家自己的近期對戰 |
| VAL-CONTENT-V1 | Act and content names / 賽季與內容名稱 |

**Status / 目前進度**: the Cloudflare Worker and VAL-CONTENT-V1 integration are live. RSO sign-in and VAL-MATCH-V1 will be enabled once production access is granted.
Cloudflare Worker 與 VAL-CONTENT-V1 已上線；RSO 登入與 VAL-MATCH-V1 會在取得正式權限後啟用。
## Install / 安裝

1. Download **`ValoTrac-Setup.exe`** from [Releases](../../releases/latest).
   到 [Releases](../../releases/latest) 下載 **`ValoTrac-Setup.exe`**。
2. Run it. If Windows shows “Windows protected your PC”, click **More info → Run anyway** (the app isn't code-signed yet).
   執行安裝檔。如果出現「Windows 已保護您的電腦」，點 **其他資訊 → 仍要執行**（程式還沒有付費數位簽章）。
3. Click **Install**. No admin rights needed.
   按 **安裝**，不需要系統管理員權限。
4. Open VALORANT. To show the card over the game, set the display mode to **Windowed Fullscreen**. For OBS, click **Copy URL** and add it as a **Browser Source** (400 × 110).
   打開 VALORANT。要顯示在遊戲畫面上，顯示模式請設成 **視窗化全螢幕**。用 OBS 的話，按 **複製網址** 加到 **瀏覽器來源**（寬 400、高 110）。

Requirements / 需求：Windows 10 / 11.

## Data & privacy / 資料與隱私

- Reads only your own tier, RR and recent RR changes. Never looks up other players.
  只讀取你自己的段位、RR 與最近的 RR 變化，不會查詢其他玩家。
- Settings and stats are stored locally in `%LOCALAPPDATA%\ValoTrac`. No accounts, ads or analytics.
  設定與戰績只存在本機 `%LOCALAPPDATA%\ValoTrac`，沒有帳號、廣告或使用分析。
- Never reads game memory or modifies game files.
  不讀取遊戲記憶體，也不修改任何遊戲檔案。
- Riot official API calls go through a Cloudflare Worker ([`worker/`](worker)) that holds the API key, so the key is never inside the app. No player data is sent to it. You can turn this off in Settings → General.
  官方 API 透過 Cloudflare Worker（[`worker/`](worker)）連線，金鑰保管在 Worker，不會放進程式裡。不會送出任何玩家資料。可以在「一般設定」關閉。

Full policy / 完整內容：[Privacy Policy](https://itsfauzh.github.io/ValoTrac/privacy.html) · [Terms of Use](https://itsfauzh.github.io/ValoTrac/terms.html)

## Feedback / 回報問題

Please open an [issue](../../issues). / 請到 [Issues](../../issues) 回報。

---

<sub>Made by **Fauzh**.<br>
ValoTrac isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</sub>
