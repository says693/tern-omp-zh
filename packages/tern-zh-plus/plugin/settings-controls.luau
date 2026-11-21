-- Keep native controls and accessible names; translate their display labels.
-- 0.9.28–0.9.30 navigation rows lack aria-label, so their layout is scoped by position.
local positions = {
    general = { 1, 1 }, agents = { 1, 2 }, appearance = { 1, 3 }, terminal = { 1, 4 },
    lenses = { 1, 5 }, databases = { 1, 6 }, notebooks = { 1, 7 }, carly = { 1, 8 },
    keyboard = { 1, 9 }, git = { 1, 10 }, plugins = { 1, 11 },
    sessions = { 2, 1 }, hosts = { 2, 2 }, advanced = { 2, 3 },
}

local function is0928(version)
    return version ~= nil and version:match("^tern 0%.9%.28 ") ~= nil
end

local function is0929(version)
    return version ~= nil and version:match("^tern 0%.9%.29 ") ~= nil
end

local function is0930(version)
    return version == "tern 0.9.30 (fe54a4c)"
end

local function ariaScope(page)
    local label = page:sub(1, 1):upper() .. page:sub(2)
    return 'main#panel > .tn-stage > .pf.sheet > .pf-nav:has(> .pf-groups > .pf-group > .pf-items > .nav-row[aria-label="' .. label .. '"][aria-selected="true"]) + .pf-scroll > '
end

local function nthScope(page)
    local position = positions[page]
    if not position then return nil end
    return 'main#panel > .tn-stage > .pf.sheet:has(> .pf-nav > .pf-groups > .nav-group:nth-of-type(' .. position[1] .. ') > .pf-items > .nav-row:nth-of-type(' .. position[2] .. ')[aria-selected="true"]) > .pf-scroll > '
end

local function scope(page, version)
    if is0928(version) or is0929(version) or is0930(version) then return nthScope(page) or ariaScope(page) end
    return ariaScope(page)
end
local function root(page, version) return scope(page, version) .. '.pf-doc > ' end
local labels = {}
local legacyPages = {}
local modernPages = {}
local modernPages929 = {}
local modernPages930 = {}
local cachedKey = nil
local cachedCss = ""

local function fields(line)
    local result = {}
    for field in (line .. "\t"):gmatch("([^\t]*)\t") do table.insert(result, field) end
    return result
end

for line in tern.fs.read(tern.plugin.dir .. "/settings-labels.tsv", 1024 * 1024):gmatch("[^\r\n]+") do
    local row = fields(line)
    if #row == 2 then labels[row[1]] = row[2] end
end

local function loadPages(path, target)
    local ok, source = pcall(tern.fs.read, path, 1024 * 1024)
    if not ok or not source then return end
    for line in source:gmatch("[^\r\n]+") do
        local row = fields(line)
        if #row == 8 then
            target[row[1]] = target[row[1]] or {}
            table.insert(target[row[1]], {
                row = row[2] .. "\t" .. row[3], item = tonumber(row[4]), selector = row[5], icon = row[6], source = row[7], mode = row[8],
            })
        end
    end
end

loadPages(tern.plugin.dir .. "/settings-controls.tsv", legacyPages)
loadPages(tern.plugin.dir .. "/settings-controls-0.9.28.tsv", modernPages)
loadPages(tern.plugin.dir .. "/settings-controls-0.9.29.tsv", modernPages929)
loadPages(tern.plugin.dir .. "/settings-controls-0.9.30.tsv", modernPages930)

local function pagesFor(version)
    if is0930(version) then return modernPages930 end
    if is0929(version) then return modernPages929 end
    if is0928(version) then return modernPages end
    return legacyPages
end

local values = {
    ["sqlite.location"] = {remember = "记住上次位置", always = "始终使用指定文件夹", session = "本次启动期间记住位置"},
    ["sqlite.wrap"] = {never = "不换行", word = "按单词换行", character = "按字符换行", whitespace = "按空白符换行"},
    ["sqlite.quotes"] = {double = "双引号，标准 SQL", grave = "反引号，MySQL 风格", brackets = "方括号，SQL Server 风格", square = "方括号，SQL Server 风格"},
}

local function addLabel(rules, page, definition, text, version)
    if not text then return end
    local selector = root(page, version) .. definition.selector
    local width = 0
    for _, cp in utf8.codes(text) do width += cp < 128 and 7.5 or 14 end
    table.insert(rules, selector .. '{font-size:0!important;position:relative;min-width:' .. math.ceil(width + 24) .. 'px;min-height:28px;}')
    table.insert(rules, selector .. '::after{content:' .. tern.json.encode(text) .. ';font-size:13px;white-space:nowrap;display:inline-block;}')
    if definition.icon ~= "-" then
        table.insert(rules, selector .. ' > .ico{position:absolute;' .. (definition.icon == "right" and 'right:10px;' or 'left:10px;') .. 'top:50%;transform:translateY(-50%);}')
    end
end

local fixedCache = {}
local function fixed(page, version)
    local key = (version or "") .. ":" .. page
    if fixedCache[key] then return fixedCache[key] end
    local rules = {}
    for _, definition in ipairs(pagesFor(version)[page] or {}) do
        if definition.mode == "fixed" then addLabel(rules, page, definition, labels[definition.source], version) end
    end
    local css = table.concat(rules, "\n")
    fixedCache[key] = css
    return css
end

local function live(page, snapshot, version, cx)
    snapshot = snapshot or ""
    local lines = {}
    for line in snapshot:gmatch("[^\r\n]+") do table.insert(lines, line) end
    local rows = {}
    if lines[1] == page then
        for index = 2, #lines do
            local row = fields(lines[index])
            if #row >= 3 then rows[row[1] .. "\t" .. row[2]] = row end
        end
    end
    local settingValues = {}
    for name in pairs(values) do settingValues[name] = cx.settings:get(name) end
    local key = (version or "") .. "\n" .. page .. "\n" .. snapshot .. tern.json.encode(settingValues)
    if cachedKey == key then return cachedCss end
    local rules = {}
    for target, definitions in pairs(pagesFor(version)) do
        for _, definition in ipairs(definitions) do
            if values[definition.mode] then
                addLabel(rules, target, definition, values[definition.mode][settingValues[definition.mode]], version)
            elseif definition.mode == "live" and target == page then
                local row = rows[definition.row]
                local source = row and row[definition.item + 2]
                addLabel(rules, target, definition, source and labels[source], version)
            end
        end
    end
    local hints = {
        ["agent-4"] = "section:nth-of-type(4) > .pf-rows > .pf-row:first-child .h",
        ["agent-5"] = "section:nth-of-type(5) > .pf-rows > .pf-row:first-child .h",
        ["agent-6"] = "section:nth-of-type(6) > .pf-rows > .pf-row:first-child .h",
        ["git-try"] = "section:nth-of-type(9) > .pf-rows > .pf-row:nth-of-type(2) .h",
        ["git-empty"] = "section:nth-of-type(13) > .pf-rows > .pf-status > span",
        ["update-status"] = "section:nth-of-type(8) .tn-up-say",
        ["omp-status"] = "section:nth-of-type(9) .tn-up-say",
        ["ovnfs-status"] = "section:nth-of-type(10) .tn-up-say",
        ["abkit-status"] = "section:nth-of-type(11) .tn-up-say",
    }
    for name, relative in pairs(hints) do
        local hint = rows["@hint\t" .. name]
        if hint and (not is0930(version) or not name:match("^agent%-")) then
            local selector = root(page, version) .. relative
            local wrapping = name:match("%-status$") and 'nowrap' or 'normal'
            table.insert(rules, selector .. '{font-size:0!important;white-space:' .. wrapping .. ';}')
            table.insert(rules, selector .. '::before{content:' .. tern.json.encode(hint[3]) .. ';font-size:12px;white-space:' .. wrapping .. ';display:inline-block;}')
        end
    end
    cachedKey = key
    cachedCss = table.concat(rules, "\n")
    return cachedCss
end

return { scope = scope, fixed = fixed, live = live }
