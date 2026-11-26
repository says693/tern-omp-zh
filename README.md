# Tern / omp 中文本地化（npm 包 + 安装 CLI）

本仓库把两套现有汉化拆成可独立发布的 npm 包，并提供一个无第三方依赖的安装/监测 CLI：

## npm 已发布

| 包 | 最新版本 | 用途 |
| --- | --- | --- |
| [`omp-di18n`](https://www.npmjs.com/package/omp-di18n) | `0.1.0` | omp 汉化 payload |
| [`tern-zh-plus`](https://www.npmjs.com/package/tern-zh-plus) | `0.1.1` | Tern 汉化 payload |
| [`tern-omp-zh`](https://www.npmjs.com/package/tern-omp-zh) | `0.1.2` | 安装/更新/监测 CLI（命令 `zh`） |

```bash
npx -p tern-omp-zh zh status
npx -p tern-omp-zh zh install all
```

镜像源同步可能滞后，必要时加 `--registry=https://registry.npmjs.org/` 或设置 `npm_config_registry`。

| 包 | 内容 | 宿主 |
| --- | --- | --- |
| `omp-di18n` | `omp-di18n.ts`、`omp-di18n.zh-CN.json`、`compat.json` | omp `>=19.0.0 <20.0.0` |
| `tern-zh-plus` | `plugin/**` 整套 Tern 插件（含 `compat/`、TSV、Luau）+ `compat.json` | Tern 构建白名单 |
| `tern-omp-zh` | `zh` 命令（`status` / `install` / `uninstall` / `update` / `watch` / `autostart`） | Node.js `>=20.11` |

Tern 白名单：`0.9.36 (7123a24)`、`0.9.33 (3a79092)`、`0.9.31 (147ea71)`、`0.9.30 (fe54a4c)`、`0.9.29 (379ecc4)`、`0.9.28 (3e7c863)`、`0.9.23 (35c63ab)`、`0.9.12 (e498b49)`、`0.9.9 (9c1c09f)`。Tern 的兼容判定按**构建号**精确匹配，同版本号但不同构建也视为不兼容。

## 未发布更新

- 适配 Tern `0.9.36 (7123a24)`：14 个设置分类按新 DOM 重新锚定，新增 `compat/0.9.36/` 与 `settings-controls-0.9.36.tsv`；补入标签页滑动切换、聊天宽度、欢迎动画及画布、笔记本、看板、SQLite、Git 快捷键分组说明。

- 适配 Tern `0.9.31 (147ea71)`：复核设置页 14 个分类的固定路径与英文原文，沿用 0.9.30 资源，新增 `compat/0.9.31/` 与 `settings-controls-0.9.31.tsv`。
- 适配 Tern `0.9.33 (3a79092)`：设置页新增文件、保存、系统和 ABKit 等分类，14 个分类按新 DOM 重新生成 `compat/0.9.33/` 与 `settings-controls-0.9.33.tsv`；快捷键页新增命令名复用现有词表。
- 新增 Tern `0.9.30 (fe54a4c)` 的 14 个设置分类样式，按实际英文原文重新定位，修复“复制会话链接”被套用“聚焦标签页列表”译文的问题；147 条固定控件路径及英文逐项核对。
- 补充焦点越过窗口边缘、进入文件面板等新设置提示。旧版资源保持不变，尚未核实的动态状态继续保留原文。
- 补充 omp 内置提交说明生成、工作树及分支差异总结两条命令提示，已验证原生菜单说明与 ANSI 文本翻译路径。
- 词典可通过 `/di18n reload` 热加载，无需重启正在运行的 omp 会话。本节改动尚未发布到 npm。
- 源码待发布版本：`omp-di18n@0.1.1`、`tern-zh-plus@0.1.5`（插件 `0.9.5`）、`tern-omp-zh@0.1.5`。上方 npm 已发布版本尚不包含本轮适配。

从本仓库源码安装本轮更新（在仓库根目录运行）：

```bash
npm ci --ignore-scripts
node packages/cli/bin/zh.js install all
```

Windows 若报 `EBUSY`，请保存工作并退出 Tern 后再安装；安装器不会强行关闭窗口或覆盖被锁定的插件目录。

## 快速开始

```bash
# 查看当前安装与宿主版本
npx -p tern-omp-zh zh status

# 安装全部（已有文件先备份为 .backup-<时间戳>）
npx -p tern-omp-zh zh install all

# 或只装一个
npx -p tern-omp-zh zh install tern
npx -p tern-omp-zh zh install omp

# 常驻监测（默认每 30 分钟）
npx -p tern-omp-zh zh watch --interval 30m

# 注册 Windows 登录自启
npx -p tern-omp-zh zh autostart on
```

也可以全局安装：

```bash
npm install -g tern-omp-zh
zh status
```

## 命令

| 命令 | 行为 |
| --- | --- |
| `zh status [--json]` | 输出组件表，并逐行显示 `Tern 插件版本`、`omp 扩展版本`、`宿主版本`、`兼容性`、备份数。每次都会顺带检查兼容性。 |
| `zh install [tern\|omp\|all] [--force]` | 从 CLI 内置的 payload 安装。已有目录/文件先移到 `.backup-<YYYYMMDD-HHmmss>`；失败时自动回滚。宿主不兼容时拒绝安装（`--force` 可强制）。 |
| `zh uninstall [tern\|omp\|all]` | 把已安装插件目录或扩展文件移到同目录备份，不递归删除。 |
| `zh update [tern\|omp\|all] [--offline]` | 重新同步 payload。默认先查 npm registry：有更新则校验下载后缓存并安装；查询/下载失败或上游不兼容时保留现有安装，首次安装才尝试内置版本。`--offline` 显式重装内置版本。 |
| `zh watch [--interval 30m] [--no-auto-update] [--once]` | 周期检查宿主兼容性并轮询 GitHub releases / npm registry。新版本自动触发 `update`，可用 `--no-auto-update` 关闭。 |
| `zh autostart on\|off\|status` | 通过 `schtasks` 注册/删除 ONLOGON 任务 `tern-omp-zh-watch`。失败只提示，不改系统。 |

通用选项：`--dry-run`、`--tern <path>`、`--omp-bin <path>`、`--omp-payload <dir>`、`--tern-payload <dir>`、`--json`、`--quiet`、`--offline`。

`--dry-run` 会演练安装、停用、更新和自启注册，只打印计划，不写文件、不运行 `tern`/`omp`/`npm` 命令。

## 兼容与自动停用

| 组件 | 当前支持 | 失效后的动作 |
| --- | --- | --- |
| Tern | `compat.json` 中的构建白名单 | 优先执行 `tern plugin remove tern-zh-plus`；找不到 CLI 或命令失败时，把插件目录移到 `tern-zh-plus.backup-<时间戳>` |
| omp | `>=19.0.0 <20.0.0` | 把 `omp-di18n.ts`、`omp-di18n.zh-CN.json` 改名为 `*.disabled` |

- 自动停用发生在每次 `status` 和每个 `watch` 周期。
- 日志会写明 `version mismatch: host=<宿主版本>, supported=<支持范围>`。
- 宿主版本检测失败时只显示“未知”，不会误停用。
- 停用只移动或改名，绝不递归删除。条件满足后运行 `zh install all` 或 `zh update all` 即可恢复。

状态与日志：

```
~/.tern-omp-zh/state.json     # 已装版本、停用原因、备份、上游检查结果
~/.tern-omp-zh/zh.log         # 所有操作与网络失败都记录在这里
```

安装位置：

```
%APPDATA%\Tern\plugins\tern-zh-plus
%USERPROFILE%\.omp\agent\extensions\omp-di18n.ts
%USERPROFILE%\.omp\agent\extensions\omp-di18n.zh-CN.json
```

## 上游监测

`watch` 每轮以 5 秒超时访问：

- GitHub releases：`losewayy/tern-zh-cn`、`losewayy/omp-di18n`
- npm registry：`tern-zh-plus`、`omp-di18n`

超时、离线、404 只写日志，不会让 `watch` 退出。发现比当前安装/内置版本新的 npm 版本时，仅更新对应组件；下载失败或上游不兼容则保留现有安装，在线更新不会降级。下载先写独立临时目录，校验包名、版本与必要文件后才加入缓存，失败不会留下可复用的半套下载。

npm 下载使用 `--ignore-scripts`，不会在兼容性检查前或之后执行 payload/依赖的 npm 生命周期脚本。payload 是预构建插件/扩展，仍须信任发布者：其代码会在 Tern/omp 加载时运行。

成功安装会将该 payload 的包名、版本及兼容规则一并写入状态；后续 `status/watch` 不再用旧内置版本的规则判断已安装的上游版本。规则快照需与安装记录版本匹配，且实际安装文件仍存在；仅有下载缓存不算安装。旧状态缺快照时核对已记录来源的包名与版本，无法确认则显示兼容未知、保留现状。

## 开发

```bash
npm install                 # 建立 workspace link
node scripts/sync-payload.mjs       # 从本机安装目录同步 payload
node scripts/sync-payload.mjs --check
npm test
node packages/cli/bin/zh.js status
npm run pack                # npm pack 三个包
```

`scripts/sync-payload.mjs` 只读取这两个安装目录，不修改源：

- `%APPDATA%\Tern\plugins\tern-zh-plus`
- `%USERPROFILE%\.omp\agent\extensions`

同步时排除 `*.exe`、`*.pdb`、`*.log`、`*.bak`、`*.tmp`、`node_modules`、`__pycache__`、`.cache` 等；omp 只同步两个 payload 文件。

## 发布记录

2026-11-20 发布（适配 Tern `0.9.29 (379ecc4)`，CLI 更名为 `tern-omp-zh`）：

| 包 | 版本 |
| --- | --- |
| `tern-zh-plus` | `0.1.1` |
| `tern-omp-zh` | `0.1.2` |

2026-11-19 首次发布：

| 包 | 版本 |
| --- | --- |
| `omp-di18n` | `0.1.0` |
| `tern-zh-plus` | `0.1.0` |
| `tern-omp-l10n` | `0.1.1` |

`tern-omp-l10n@0.1.0` 的首次发布被 npm 暂存锁住，实际可用版本为 `0.1.1`。

CLI 已从 `tern-omp-l10n` 改名为 `tern-omp-zh`，命令从 `l10n` 改为 `zh`；旧包保留在 registry 并标记 deprecated，状态目录改为 `~/.tern-omp-zh`。

再次发布：

1. `npm login && npm whoami`（需要 2FA；CI 可用 Read and write 的 granular token）。
2. `node scripts/sync-payload.mjs --check && npm test`。
3. 两个 payload 包升版本后，同步 CLI `dependencies` 中的固定版本。
4. 按依赖顺序发布：

   ```bash
   npm publish -w omp-di18n
   npm publish -w tern-zh-plus
  npm publish -w tern-omp-zh
   ```

5. npm 偶尔把首次发布转为 staged：等几分钟，或在 npm 的 **Staged Packages** 页面确认；若版本被卡住，直接升 patch 版本重发。

## 许可证

MIT。payload 来自对应的 Tern/omp 汉化项目；`tern-zh-plus` 的插件目录保留原 `LICENSE`、`README.md` 与 `CHANGELOG.md`。
