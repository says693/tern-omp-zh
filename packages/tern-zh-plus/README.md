# tern-zh-plus

Tern 终端的中英文界面插件 payload。插件目录保留完整的 `plugin.toml`、Luau 启动脚本、CSS、TSV 词表与按构建拆分的 `compat/` 设置页样式。

## 支持范围

`compat.json` 使用**精确构建白名单**：

| Tern 版本 | 构建 | 设置页样式来源 |
| --- | --- | --- |
| 0.9.30 | `fe54a4c` | `plugin/compat/0.9.30/`（按实际原文重定位） |
| 0.9.29 | `379ecc4` | `plugin/compat/0.9.29/` |
| 0.9.28 | `3e7c863` | `plugin/compat/0.9.28/` |
| 0.9.23 | `35c63ab` | `plugin/compat/0.9.23/` |
| 0.9.12 | `e498b49` | `plugin/prefs-*.css`（共享/旧版样式） |
| 0.9.9 | `9c1c09f` | `plugin/prefs-*.css` + `plugin/compat/0.9.9/` 差异页 |

同版本号但不同构建（例如 `0.9.28 (deadbee)`）会被判为不兼容，因为设置页 DOM 选择器与固定文案按构建生成。

## 安装

推荐用 CLI：

```bash
npx -p tern-omp-zh zh install tern
```

CLI 会先备份已有插件目录为 `tern-zh-plus.backup-<时间戳>`，然后优先调用：

```bash
tern plugin install <payload>/plugin --force
```

找不到 Tern CLI 时直接复制到 `%APPDATA%\Tern\plugins\tern-zh-plus`。手动安装也可以直接用上面的 `tern plugin install` 命令。

安装后打开/重启 Tern 窗口即可生效。`tern plugin list` 应显示 `tern-zh-plus 0.9.2`。本轮源码版本尚未发布到 npm；从仓库根目录运行 `npm ci --ignore-scripts` 后，使用 `node packages/cli/bin/zh.js install tern` 安装。Windows 遇到 `EBUSY` 时，先保存工作并退出 Tern，不要强制删除插件目录。

## 自动停用

CLI 的 `status`/`watch` 检测到宿主构建不在白名单时：

1. 优先执行 `tern plugin remove tern-zh-plus`；
2. 找不到 CLI 或命令失败时，把插件目录移到 `tern-zh-plus.backup-<时间戳>`。

日志包含 `version mismatch: host=…, supported=…`。不会删除用户文件。升级 Tern 后若已支持，运行 `zh install tern` 或 `zh update tern` 恢复。

## 卸载

```bash
npx -p tern-omp-zh zh uninstall tern
```

CLI 会把整个插件目录移到备份。手动卸载可运行 `tern plugin remove tern-zh-plus`；插件自己的缓存位于 `%LOCALAPPDATA%\Tern\plugin-data\tern-zh-plus`，需要时可单独清理。

## 开发

插件源码与兼容性说明见包内 `plugin/README.md`、`plugin/CHANGELOG.md`。根仓库的 `scripts/sync-payload.mjs` 从本机 Tern 安装目录同步整套插件，并排除 exe、日志、缓存等文件。

## 本轮适配

- 采集 Tern 0.9.30 的全部 14 个设置分类，按英文原文生成对应位置的样式，避免旧版行号变化造成错译；样式保留原文注释供后续核对。
- 固定控件沿用逐项核对过的 147 条规则。新版不再应用旧 Agents 安装提示的行号，未核实的动态文字保留原文。
- 已通过 Tern 自身控制端点验证实际原生窗口中的常规、智能体和快捷键页面，无需 computer-use。

## 许可证

MIT；插件目录内保留原 `LICENSE`。
