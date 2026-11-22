# 上海退休金预期计算器 Android 工程（支持云端政策自动更新）

- **适配版本**：Android 7.0 – Android 15/16（`minSdk 24` / `targetSdk 35`）
- **核心特性**：本地离线可用 + 启动自动拉取云端 `policy_config.json` 热更新上海最新年度社平工资、计发基数、上下限与居保标准，无需重新打包发版。

## 方式一：零配置云端自动打出 APK（推荐，无需装 Android Studio）
1. 在 GitHub 新建一个仓库（私有或公开均可），把本压缩包里的所有文件推送上去。
2. 打开仓库顶部的 **Actions** → 点击 **Build Android APK** → 点击 **Run workflow**。
3. 等待约 2 分钟，在页面下方 **Artifacts** 中下载 `ShanghaiPensionCalculator-APK`，解压后直接传到安卓手机安装即可。

## 方式二：本地 Android Studio 打包
1. 用 Android Studio 打开本文件夹，等待 Gradle 同步完成。
2. 菜单栏选择 **Build → Build Bundle(s) / APK(s) → Build APK(s)**，生成的 APK 位于 `app/build/outputs/apk/release/`。

## 如何启用“随时间推移自动获取最新政策”
1. 将 `remote-policy/policy_config.json` 放到你的 GitHub 仓库（或自有服务器/Cloudflare Pages），拿到它的 HTTPS Raw 访问链接。
2. 把 `app/src/main/assets/index.html` 中 `REMOTE_POLICY_URL` 替换成该链接后再打包。
3. 以后每年 7–8 月上海公布新的社平工资或政策调整时，只需修改云端 `policy_config.json` 里的数字，手机 App 打开即自动同步生效。
