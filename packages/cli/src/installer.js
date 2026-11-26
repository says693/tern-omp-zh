/** Install, uninstall, and automatic disable. All moves are reversible. */
import { copyFileSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { evaluate, formatTernBuild } from "./compat.js";
import { TERN_PLUGIN_ID } from "./paths.js";
import {
  backupFile,
  compactTimestamp,
  copyTree,
  exists,
  isDirectory,
  moveToBackup,
  uniquePath,
} from "./util.js";

export const COMPONENTS = ["tern", "omp"];

export function selectComponents(selector = "all") {
  if (!selector || selector === "all") return [...COMPONENTS];
  if (!COMPONENTS.includes(selector)) throw new Error(`unknown component: ${selector} (expected tern|omp|all)`);
  return [selector];
}

export function installedVersion(ctx, name) {
  const recorded = ctx.state.component[name]?.installedVersion;
  if (recorded) return recorded;

  if (name === "omp" && ctx.payloads?.omp) {
    const matches = ctx.payloads.omp.files.every(({ source, name: fileName }) => {
      const target = join(ctx.paths.ompDir, fileName);
      try {
        return exists(target) && readFileSync(target).equals(readFileSync(source));
      } catch {
        return false;
      }
    });
    if (matches) return ctx.payloads.omp.version;
  }

  if (name === "tern" && isDirectory(ctx.paths.ternTarget)) {
    try {
      const manifest = readFileSync(join(ctx.paths.ternTarget, "plugin.toml"), "utf8");
      const match = manifest.match(/^\s*version\s*=\s*"([^"]+)"/m);
      if (match) return `${match[1]} (plugin.toml)`;
    } catch {
      // fall through to unknown
    }
  }
  return "未知";
}
export function isInstalled(ctx, name) {
  if (name === "tern") return isDirectory(ctx.paths.ternTarget) || exists(ctx.paths.ternLinkFile);
  return ctx.paths.ompFiles.some((file) => exists(file)) || ctx.paths.ompDisabledFiles.some((file) => exists(file));
}

function isEnabled(ctx, name) {
  if (name === "tern") return isDirectory(ctx.paths.ternTarget) || exists(ctx.paths.ternLinkFile);
  return ctx.paths.ompFiles.some((file) => exists(file));
}

function assertCompatibleForInstall(ctx, name, force) {
  const result = evaluate(name, ctx.hosts[name], ctx.payloads[name].compat);
  if (result.compatible === false && !force) {
    if (ctx.dryRun) ctx.logger.warn(`${name} 宿主不兼容：${result.reason}（dry-run 未安装）`);
    else throw new Error(`${name} 宿主不兼容：${result.reason}。如确需安装，请加 --force。`);
  }
  if (result.compatible === null) {
    ctx.logger.warn(`${name} 宿主版本未知，无法校验兼容性：${result.reason}`);
  }
  return result;
}

function restoreBackup(backup, target, logger) {
  if (!backup) return;
  try {
    if (exists(target)) {
      const failed = uniquePath(`${target}.failed-${compactTimestamp()}`);
      renameSync(target, failed);
      logger.warn(`安装失败产物已移到 ${failed}`);
    }
    renameSync(backup, target);
    logger.warn(`已从备份恢复 ${target}`);
  } catch (error) {
    logger.error(`恢复备份失败，备份仍在 ${backup}: ${error.message}`);
  }
}

function installTern(ctx) {
  const payload = ctx.payloads.tern;
  if (!isDirectory(payload.pluginDir)) throw new Error(`Tern payload missing: ${payload.pluginDir}`);

  if (ctx.dryRun) {
    const backup = exists(ctx.paths.ternTarget) ? "[dry-run] 备份 " + ctx.paths.ternTarget : "[dry-run] 无需备份";
    ctx.logger.info(`${backup}`);
    ctx.logger.info(`[dry-run] 安装 Tern 插件 ${payload.pluginDir} -> ${ctx.paths.ternTarget}`);
    return;
  }

  mkdirSync(ctx.paths.ternPluginsDir, { recursive: true });
  const backup = exists(ctx.paths.ternTarget) ? moveToBackup(ctx.paths.ternTarget) : null;
  if (backup) ctx.logger.info(`已备份 ${ctx.paths.ternTarget} -> ${backup}`);

  try {
    if (ctx.hosts.tern.binary) {
      ctx.logger.info(`运行 ${ctx.hosts.tern.binary} plugin install ${payload.pluginDir} --force`);
      ctx.run(ctx.hosts.tern.binary, ["plugin", "install", payload.pluginDir, "--force"]);
      if (!isDirectory(ctx.paths.ternTarget)) throw new Error("tern plugin install 完成但目标目录不存在");
    } else {
      copyTree(payload.pluginDir, ctx.paths.ternTarget);
      ctx.logger.info(`Tern CLI 不可用，已直接复制插件到 ${ctx.paths.ternTarget}`);
    }
  } catch (error) {
    restoreBackup(backup, ctx.paths.ternTarget, ctx.logger);
    throw new Error(`Tern 安装失败：${error.message}`);
  }

  ctx.state.component.tern = {
    ...ctx.state.component.tern,
    installed: true,
    installedVersion: payload.version,
    installedPayload: { packageName: payload.packageName, version: payload.version, compat: payload.compat },
    disabled: false,
    disabledAt: null,
    disabledReason: null,
    hostVersion: formatTernBuild(ctx.hosts.tern),
    installedAt: new Date().toISOString(),
    source: payload.dir,
    backup,
  };
  ctx.state.record({ action: "install", component: "tern", version: payload.version });
  ctx.logger.info(`已安装 Tern 汉化 ${payload.version}${backup ? `（备份：${backup}）` : ""}`);
}

function supportedSummary(name, compat) {
  if (name === "tern") {
    const rule = compat?.host?.tern;
    return rule?.builds?.join(" | ") || rule?.versions?.join(" | ") || "未知";
  }
  return compat?.host?.omp?.range || "未知";
}

function logMismatch(ctx, name) {
  const host = name === "tern" ? formatTernBuild(ctx.hosts.tern) : ctx.hosts.omp?.version;
  ctx.logger.warn(
    `version mismatch: host=${host || "unknown"}, supported=${supportedSummary(name, ctx.compat[name])}`,
  );
}

function installOmp(ctx) {
  const payload = ctx.payloads.omp;
  for (const file of payload.files) {
    if (!exists(file.source)) throw new Error(`omp payload missing: ${file.source}`);
  }

  if (ctx.dryRun) {
    for (const file of payload.files) {
      const target = join(ctx.paths.ompDir, file.name);
      if (exists(target)) ctx.logger.info(`[dry-run] 备份 ${target}`);
      const disabled = `${target}.disabled`;
      if (exists(disabled)) ctx.logger.info(`[dry-run] 备份旧停用文件 ${disabled}`);
      ctx.logger.info(`[dry-run] 安装 ${file.source} -> ${target}`);
    }
    return;
  }

  mkdirSync(ctx.paths.ompDir, { recursive: true });
  const moves = [];
  const created = [];
  const timestamp = compactTimestamp();

  try {
    for (const file of payload.files) {
      const target = join(ctx.paths.ompDir, file.name);
      const disabled = `${target}.disabled`;
      for (const existing of [target, disabled]) {
        if (!exists(existing)) continue;
        const backup = backupFile(existing, timestamp);
        moves.push({ backup, original: existing });
        ctx.logger.info(`已备份 ${existing} -> ${backup}`);
      }
      const temp = `${target}.tmp-${process.pid}`;
      copyFileSync(file.source, temp);
      renameSync(temp, target);
      created.push(target);
    }
  } catch (error) {
    for (const target of created) {
      if (!exists(target)) continue;
      try {
        renameSync(target, uniquePath(`${target}.failed-${compactTimestamp()}`));
      } catch {
        // best effort; the backup restore below still runs
      }
    }
    for (const { backup, original } of moves.reverse()) {
      if (!exists(backup)) continue;
      try {
        renameSync(backup, original);
      } catch {
        ctx.logger.error(`恢复 ${original} 失败，备份仍在 ${backup}`);
      }
    }
    throw new Error(`omp 安装失败：${error.message}`);
  }

  ctx.state.component.omp = {
    ...ctx.state.component.omp,
    installed: true,
    installedVersion: payload.version,
    installedPayload: { packageName: payload.packageName, version: payload.version, compat: payload.compat },
    disabled: false,
    disabledAt: null,
    disabledReason: null,
    hostVersion: ctx.hosts.omp?.version ?? null,
    installedAt: new Date().toISOString(),
    source: payload.dir,
    backups: moves.map((move) => move.backup),
  };
  ctx.state.record({ action: "install", component: "omp", version: payload.version });
  ctx.logger.info(`已安装 omp 汉化 ${payload.version}${moves.length ? `（备份 ${moves.length} 个文件）` : ""}`);
}

export function install(ctx, selector = "all", { force = false } = {}) {
  const names = selectComponents(selector);
  const installed = [];
  for (const name of names) {
    assertCompatibleForInstall(ctx, name, force);
    if (name === "tern") installTern(ctx);
    else installOmp(ctx);
    if (!ctx.dryRun) ctx.compat[name] = ctx.payloads[name].compat;
    installed.push(name);
  }
  ctx.state.save();
  return installed;
}

function uninstallTern(ctx) {
  if (!isInstalled(ctx, "tern")) {
    ctx.logger.info("Tern 汉化未安装，跳过");
    return false;
  }
  if (ctx.dryRun) {
    ctx.logger.info(`[dry-run] 将 ${ctx.paths.ternTarget} 移到 .backup-<时间戳>`);
    return true;
  }
  if (exists(ctx.paths.ternTarget)) {
    const backup = moveToBackup(ctx.paths.ternTarget);
    ctx.logger.info(`已卸载 Tern 汉化，插件移到 ${backup}`);
    if (ctx.hosts.tern.binary) {
      try {
        ctx.run(ctx.hosts.tern.binary, ["plugin", "reload"]);
      } catch (error) {
        ctx.logger.warn(`tern plugin reload 失败（插件已移走）: ${error.message}`);
      }
    }
  }
  if (exists(ctx.paths.ternLinkFile)) {
    const backup = moveToBackup(ctx.paths.ternLinkFile);
    ctx.logger.info(`已移除 Tern 插件链接文件 -> ${backup}`);
  }
  ctx.state.component.tern = {
    ...ctx.state.component.tern,
    installed: false,
    installedVersion: null,
    disabled: false,
    disabledAt: null,
    disabledReason: "uninstalled",
  };
  ctx.state.record({ action: "uninstall", component: "tern" });
  return true;
}

function uninstallOmp(ctx) {
  if (!isInstalled(ctx, "omp")) {
    ctx.logger.info("omp 汉化未安装，跳过");
    return false;
  }
  if (ctx.dryRun) {
    for (const file of [...ctx.paths.ompFiles, ...ctx.paths.ompDisabledFiles]) {
      if (exists(file)) ctx.logger.info(`[dry-run] 将 ${file} 移到 .backup-<时间戳>`);
    }
    return true;
  }
  const timestamp = compactTimestamp();
  const backups = [];
  for (const file of [...ctx.paths.ompFiles, ...ctx.paths.ompDisabledFiles]) {
    if (!exists(file)) continue;
    const backup = backupFile(file, timestamp);
    backups.push(backup);
    ctx.logger.info(`已卸载 ${file} -> ${backup}`);
  }
  ctx.state.component.omp = {
    ...ctx.state.component.omp,
    installed: false,
    installedVersion: null,
    disabled: false,
    disabledAt: null,
    disabledReason: "uninstalled",
    backups,
  };
  ctx.state.record({ action: "uninstall", component: "omp" });
  return true;
}

export function uninstall(ctx, selector = "all") {
  const names = selectComponents(selector);
  const changed = [];
  for (const name of names) {
    const did = name === "tern" ? uninstallTern(ctx) : uninstallOmp(ctx);
    if (did) changed.push(name);
  }
  ctx.state.save();
  return changed;
}

function disableTern(ctx, reason) {
  const target = ctx.paths.ternTarget;
  let method = null;
  logMismatch(ctx, "tern");
  if (ctx.dryRun) {
    ctx.logger.info(`[dry-run] Tern 汉化失效：${reason}；将执行 tern plugin remove ${TERN_PLUGIN_ID} 或把插件目录移到备份`);
    return { method: "dry-run" };
  }

  if (ctx.hosts.tern.binary) {
    try {
      ctx.run(ctx.hosts.tern.binary, ["plugin", "remove", TERN_PLUGIN_ID]);
      method = `tern plugin remove (${ctx.hosts.tern.binary})`;
      ctx.logger.warn(`Tern 汉化已停用：${method}`);
    } catch (error) {
      ctx.logger.warn(`tern plugin remove 失败，改用移动目录：${error.message}`);
    }
  }

  if (isDirectory(target)) {
    const backup = moveToBackup(target);
    method = method ? `${method} + 备份 ${backup}` : `移动到备份 ${backup}`;
    ctx.logger.warn(`Tern 插件目录已移到 ${backup}`);
  }

  if (exists(ctx.paths.ternLinkFile)) {
    const backup = moveToBackup(ctx.paths.ternLinkFile);
    method = `移除链接文件 ${backup}`;
    ctx.logger.warn(`Tern 插件链接文件已移到 ${backup}`);
  }
  if (!method) {
    method = "插件目录不存在";
    ctx.logger.warn("Tern 插件目录不存在，仅记录停用状态");
  }

  const now = new Date().toISOString();
  ctx.state.component.tern = {
    ...ctx.state.component.tern,
    installed: false,
    installedVersion: null,
    disabled: true,
    disabledAt: now,
    disabledReason: reason,
    disabledHostVersion: formatTernBuild(ctx.hosts.tern),
    disableMethod: method,
  };
  ctx.state.record({ action: "auto-disable", component: "tern", reason, method });
  return { method };
}

function disableOmp(ctx, reason) {
  const moved = [];
  logMismatch(ctx, "omp");
  for (const file of ctx.paths.ompFiles) {
    if (!exists(file)) continue;
    if (ctx.dryRun) {
      ctx.logger.info(`[dry-run] omp 汉化失效：${reason}；将把 ${file} 改名为 ${file}.disabled`);
      continue;
    }
    const disabled = `${file}.disabled`;
    if (exists(disabled)) {
      const backup = backupFile(disabled);
      ctx.logger.warn(`旧停用文件已备份到 ${backup}`);
    }
    renameSync(file, disabled);
    moved.push(disabled);
    ctx.logger.warn(`已停用 omp 汉化：${file} -> ${disabled}`);
  }
  if (ctx.dryRun) return { moved };

  const now = new Date().toISOString();
  ctx.state.component.omp = {
    ...ctx.state.component.omp,
    installed: moved.length ? true : ctx.state.component.omp.installed,
    disabled: true,
    disabledAt: now,
    disabledReason: reason,
    disabledHostVersion: ctx.hosts.omp?.version ?? null,
    disabledFiles: moved,
  };
  ctx.state.record({ action: "auto-disable", component: "omp", reason, files: moved });
  if (!moved.length) ctx.logger.warn("omp 汉化文件不存在，仅记录停用状态");
  return { moved };
}

/**
 * Called by status and every watch tick. Only acts when a host version was
 * detected and the installed payload does not support it.
 */
export function enforceCompatibility(ctx) {
  const actions = [];
  for (const name of COMPONENTS) {
    const evaluation = evaluate(name, ctx.hosts[name], ctx.compat[name]);
    if (evaluation.compatible !== false) continue;
    if (!isEnabled(ctx, name)) {
      if (ctx.state.component[name].disabled) continue;
      if (!isInstalled(ctx, name)) continue;
    }
    ctx.logger.warn(`${name} 宿主不兼容：${evaluation.reason}`);
    const action = name === "tern" ? disableTern(ctx, evaluation.reason) : disableOmp(ctx, evaluation.reason);
    actions.push({ component: name, ...action });
  }
  if (actions.length) ctx.state.save();
  return actions;
}
