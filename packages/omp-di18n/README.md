# omp-di18n

omp TUI 的运行时简体中文本地化 payload，支持 **omp 19.x**（`>=19.0.0 <20.0.0`）。

## 内容

| 文件 | 用途 |
| --- | --- |
| `omp-di18n.ts` | omp 扩展：挂钩 `@oh-my-pi/pi-tui` 的菜单、自动补全、Chrome、TabBar 等组件 |
| `omp-di18n.zh-CN.json` | 中英词典（当前 2450+ 条），扩展启动时读取 |
| `compat.json` | 宿主支持范围与已测试版本 |

扩展把缺失词条写入安装目录旁的 `omp-di18n.misses.txt`；可用 `/di18n reload` 在不重启 omp 的情况下重新加载词典。

## 安装

推荐用 CLI：

```bash
npx -p tern-omp-zh zh install omp
```

CLI 会先把已有文件备份为 `*.backup-<时间戳>`，再复制两个 payload 文件到：

```
%USERPROFILE%\.omp\agent\extensions\
```

手动安装时，把 `omp-di18n.ts` 和 `omp-di18n.zh-CN.json` 复制到该目录即可。若存在同名 `.disabled` 文件，请先移走，否则会被视为已停用。

## 兼容性

`compat.json`：

```json
{
  "host": {
    "omp": {
      "range": ">=19.0.0 <20.0.0",
      "tested": ["19.0.0", "19.0.1"]
    }
  }
}
```

omp 20.x 尚未验证。CLI 的 `status`/`watch` 检测到 20.x 时会把两个文件改名为 `.disabled`，不会删除；确认新版可用后发布新的 payload 并调宽范围，再运行 `zh update omp`。

## 卸载

```bash
npx -p tern-omp-zh zh uninstall omp
```

CLI 会把两个文件移到同目录备份。手动卸载可删除或改名这两个文件，然后重启 omp。

## 未发布更新

- 补充内置提交说明生成、工作树及分支差异总结两条命令提示。
- 仍使用 omp 19.x 的原有兼容范围；词典更新后运行 `/di18n reload` 即可加载，无需重启会话。
- 已在 omp 19.0.1 的实际原生菜单中确认扩展加载，命令名保持原文、说明显示中文。

## 许可证

MIT。
