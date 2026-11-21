# Tern 简体中文 0.9.2（Windows，适配 Tern 0.9.30）

适用于 Windows 的非官方 Tern 汉化插件，安装后随 Tern 自动加载，无需单独打开启动脚本。本项目不包含 Tern 主程序，也不是 Tern 官方发行版。

[查看发行版本](https://github.com/losewayy/tern-zh-cn/releases/latest) · [查看更新记录](CHANGELOG.md) · [隐私说明](PRIVACY.md)

## 第一次使用

本轮源码版请先取得本仓库，在仓库根目录安装；npm 上的已发布版本不包含 0.9.30 适配。

准备：使用 Windows 和 Node.js **>=20.11**，在本仓库根目录操作。当前推荐 Tern **0.9.30 (fe54a4c)**，也兼容 **0.9.29 (379ecc4)**、**0.9.28 (3e7c863)**、**0.9.23 (35c63ab)**、**0.9.12 (e498b49)** 和 **0.9.9 (9c1c09f)**。版本号相同但构建编号不同，也可能无法启用设置页汉化。本轮适配尚未发布到 npm，原上游的在线安装命令不包含这些新增资源。

1. 保存工作并退出 Tern，在仓库根目录打开独立的 PowerShell 或 Windows 终端。不要在设置搜索框里输入命令。
2. 点击下面代码块右上角的复制按钮，粘贴到终端，按 **Enter（回车）**，等待安装命令结束。

   ```text
   npm ci --ignore-scripts
   node packages/cli/bin/zh.js install tern
   ```

3. 确认安装成功后，保存正在进行的工作，关闭所有 Tern 窗口，再重新打开 Tern。打开设置，检查左侧是否显示“常规、智能体、外观、终端”等中文分类。

![首次安装操作示意：打开 Tern 终端，粘贴安装命令并回车，安装成功后重新打开 Tern](assets/screenshots/install-guide.png)

图中是操作示意，不是安装成功的实际输出。安装过程中需要联网。安装完成后，日常汉化在本机运行，无需在线翻译。

也可以从本仓库根目录手动安装：`tern plugin install ./packages/tern-zh-plus/plugin --force`。仍应先保存工作并退出其他 Tern 窗口，避免 Windows 文件占用导致安装失败。

## 更新已安装的插件

先更新本仓库源码，保存工作并关闭所有 Tern 窗口，然后在仓库根目录打开 **PowerShell** 或 **Windows 终端**，粘贴下面的命令并按回车：

```text
node packages/cli/bin/zh.js install tern
```

命令成功结束后，重新打开 Tern。Windows 可能在 Tern 窗口打开时占用插件目录，因此请先关掉窗口再更新。

上述命令使用本地仓库中的 payload；请先更新源码。插件版本、适配范围和已知限制见包内更新记录，npm 已发布版本见仓库根目录说明。

## 安装遇到问题

- **提示找不到 `tern`，或“无法将 tern 识别为命令”：** 先确认 Tern 主程序已安装，关闭并重新打开终端后重试。仍然找不到时，使用 Tern 安装目录中的 `tern.com` 的完整路径执行命令；PowerShell 中的写法是 `& "<Tern 安装目录>/tern.com" plugin install github.com/losewayy/tern-zh-cn`，请将占位内容换成实际目录。
- **提示找不到 Git：** 安装上面链接中的 Git，重新打开 Tern 后重试。
- **提示插件已经安装：** 按上面的“更新已安装的插件”操作，使用带 `--force` 的命令。
- **下载失败或连接超时：** 确认电脑能连接 GitHub，然后重新运行安装命令。下载失败不代表已经装好。
- **装好后设置仍是英文：** 先重新打开 Tern，再检查设置页的版本号及构建编号是否在支持范围内。未知构建会保留设置英文，避免把翻译套在错误位置。搜索结果和部分动态文字目前也会保留英文。

## 使用说明

安装并启用后，直接使用 Tern 即可。从桌面、开始菜单、文件夹右键或其他入口打开，插件都会自动启动对应窗口的汉化小程序；关闭该窗口后，小程序会自动退出，不会随 Windows 开机启动。旧版中文快捷方式仍可使用，但不是必需的。

首次运行会在本机准备小程序，之后会复用已准备的文件以加快启动；文件留在本机时不会自行运行。

目前针对 Windows 上的 Tern 0.9.30 (fe54a4c)、0.9.29 (379ecc4)、0.9.28 (3e7c863)、0.9.23 (35c63ab)、0.9.12 (e498b49) 和 0.9.9 (9c1c09f) 提供设置页汉化。0.9.30、0.9.29、0.9.28 和 0.9.23 使用新版弹窗和左侧分类列表，固定文字和常见选项随选中的分类直接切换；0.9.30 的文字按实际原文重新匹配位置。其他构建仍会加载基础界面和中文命令，设置页保留英文并提示兼容性。OMP 设置页需要另装本仓库中的 omp-di18n 扩展。

## 截图

以下设置截图展示新版弹窗布局（0.9.29、0.9.28 与 0.9.23 的布局一致）。OMP 截图展示独立的 omp-di18n 扩展。

| 常规设置 | 外观设置 |
| :---: | :---: |
| ![常规设置](assets/screenshots/settings-general-zh.png) | ![外观设置](assets/screenshots/settings-appearance-zh.png) |
| 原生视图 | 快捷键 |
| ![原生视图](assets/screenshots/settings-lenses-zh.png) | ![快捷键](assets/screenshots/settings-keyboard-zh.png) |
| 智能体 | 终端 |
| ![智能体](assets/screenshots/settings-agents-zh.png) | ![终端](assets/screenshots/settings-terminal-zh.png) |

命令面板：

![命令面板中文显示](assets/screenshots/command-palette-zh.png)

OMP 原生设置页（需安装 [omp-di18n 汉化扩展](https://github.com/losewayy/omp-di18n)，部分说明仍为英文）：

| 模型设置 | 文件设置 |
| :---: | :---: |
| ![OMP 模型设置](assets/screenshots/omp-settings-model-zh.png) | ![OMP 文件设置](assets/screenshots/omp-settings-files-zh.png) |

## 汉化范围

覆盖 Tern 基础界面、命令面板、14 个设置分类的标题和说明、常见选项与操作按钮，以及终端区块常见右键菜单。新版智能体设置、终端提示符组件说明、快捷终端、底部组件、ovnfs 和 ABKit 设置也已补充。数据库的默认位置、换行方式和标识符引号会跟随实际设置值显示中文；默认位置的下拉菜单也支持中文。程序名、主题名、命令、配置键和版本号保留原文。搜索框占位文字、部分动态状态、任务操作及尚未适配的菜单仍为英文。

新版设置页按界面当前选中的分类限定样式，不等待后台判断页名；后台暂未更新或停止时，固定文字仍能正确切换。页内标签仍按该版本的布局定位。搜索时没有选中分类，页面翻译会自动停用，结果暂时显示原文。旧版设置页继续使用后台识别。选项按钮用透明 SVG 显示中文，继续使用原按钮的点击、键盘、焦点和选中状态，不更改配置值。翻译属于界面显示层，不修改 Tern 程序或命令功能。

新版分类、固定设置文字和常见选项直接由界面样式翻译。动态安装状态、命令面板和菜单仍使用随窗口运行的本地小程序。Tern 0.9.28 尚未提供完整的内置界面语言接口。

## 卸载

关闭所有 Tern 窗口后，在其他终端运行 `tern plugin remove tern-zh-plus`。小程序会随对应窗口退出。如需一并清除本地缓存，可删除 `%LOCALAPPDATA%/Tern/plugin-data/tern-zh-plus` 文件夹。

## 开发与兼容性

`window.luau` 和 `auto-bridge.luau` 负责窗口内的样式；`auto-bridge.cs` 是随窗口运行的辅助程序；`settings-navigation.css` 翻译新版左侧分类；根目录的 `prefs-*.css` 保存旧版设置页翻译，`compat/` 按构建保存新版资源；`ui-labels.tsv` 保存命令名称翻译；`settings-controls.luau`、`settings-controls*.tsv` 和 `settings-labels.tsv` 负责按钮、选项值及按当前分类限定的样式。0.9.30 的 CSS 保留实际原文注释，便于在后续版本中核对行号变化。

本轮通过 Tern 自身的 `serve`/`ctl tree`/`ctl dump` 采集 0.9.30 的 14 个设置分类，逐项核对固定控件，再在独立原生窗口验证常规、智能体和快捷键页面。未核实的动态状态保留原文，不把旧版索引直接视为兼容依据。隐私说明见 [PRIVACY.md](PRIVACY.md)，本项目采用 [MIT 许可证](LICENSE)。
