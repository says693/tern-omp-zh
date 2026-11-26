# omp-di18n

omp TUI 的运行时简体中文本地化 payload，支持 **omp 19.0–19.2**（`>=19.0.0 <20.0.0`）。

## 内容

| 文件 | 用途 |
| --- | --- |
| `omp-di18n.ts` | omp 扩展：19.0–19.1 patch `@oh-my-pi/pi-tui` 组件；19.2+ 改为翻译终端输出流 |
| `omp-di18n.zh-CN.json` | 中英词典（当前 2450+ 条），扩展启动时读取 |
| `compat.json` | 宿主支持范围与已测试版本 |

扩展把缺失词条写入安装目录旁的 `omp-di18n.misses.txt`；可用 `/di18n reload` 在不重启 omp 的情况下重新加载词典。

omp 19.2 起组件类被响应式渲染器取代，扩展无法 patch 模块命名空间，因此自动切换到**输出层模式**：包装 `process.stdout.write`，按词典替换整段文本，并用空格补齐保持原显示宽度，布局不错位。受限点：比原文更宽的长句不翻译（保留英文），已经绘制且不再重绘的内容要保持原样，ANSI 颜色跨词时该词不替换。

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
      "tested": ["19.0.0", "19.0.1", "19.1.1", "19.2.1"]
    }
  }
}
```

omp 19.2 把 `@oh-my-pi/pi-tui` 从组件类改成了响应式渲染器，模块命名空间不可写，旧的组件 patch 全部失效；payload 自动改用输出层模式，仍在 19.2.1 上验证了命令菜单、composer 提示等中文显示。omp 20.x 尚未验证；CLI 的 `status`/`watch` 检测到范围外版本时会把两个文件改名为 `.disabled`，不会删除。

## 卸载

```bash
npx -p tern-omp-zh zh uninstall omp
```

CLI 会把两个文件移到同目录备份。手动卸载可删除或改名这两个文件，然后重启 omp。

## 未发布更新

- 0.2.0：新增输出层模式，omp 19.2 上通过 `process.stdout.write` 按词典替换并补齐宽度；命令菜单、composer 提示恢复中文。兼容范围恢复为 `>=19.0.0 <20.0.0`，tested 加入 19.2.1。
- 0.1.2：移除 19.2 已删除的 `@earendil-works/pi-tui` 回退（静态 import 检查会拒绝加载扩展）；兼容范围收窄到 19.0–19.1，19.2 改为明确提示。
- 19.1.1 的 patch 模式与 19.2.1 的输出层模式均已实际启动验证。

- 补充内置提交说明生成、工作树及分支差异总结两条命令提示。
- 仍使用 omp 19.x 的原有兼容范围；词典更新后运行 `/di18n reload` 即可加载，无需重启会话。
- 已在 omp 19.0.1 的实际原生菜单中确认扩展加载，命令名保持原文、说明显示中文。

## 许可证

MIT。
