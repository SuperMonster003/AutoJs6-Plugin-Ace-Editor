(function(global) {
    "use strict";

    var extractors = Object.create(null);
    var MODE_LANGUAGES = {
        "ace/mode/javascript": "javascript",
        "ace/mode/jsx": "javascript",
        "ace/mode/typescript": "typescript",
        "ace/mode/tsx": "typescript",
        "ace/mode/python": "python",
        "ace/mode/lua": "lua",
        "ace/mode/java": "java",
        "ace/mode/kotlin": "kotlin",
        "ace/mode/json": "json",
        "ace/mode/text": "text"
    };

    function languageIdForSession(session) {
        var routing = global.AutoJsAceLanguageRouting;
        if (routing && typeof routing.languageIdForSession === "function") {
            return routing.languageIdForSession(session);
        }
        if (!session || typeof session.getMode !== "function") {
            return "text";
        }
        try {
            var mode = session.getMode();
            return MODE_LANGUAGES[String(mode && mode.$id || "")] || "text";
        } catch (ignore) {
            return "text";
        }
    }

    function normalizeLanguage(language) {
        language = String(language || "").toLowerCase();
        return language === "js" || language === "jsx" ? "javascript" :
            language === "ts" || language === "tsx" ? "typescript" : language;
    }

    function symbol(name, type, signature, doc) {
        name = String(name || "").trim();
        if (!name) {
            return null;
        }
        return {
            name: name,
            type: type || "variable",
            signature: signature || "",
            doc: doc || "Local symbol in the current document.",
            meta: "local symbol"
        };
    }

    function createResult() {
        return {
            globals: [],
            aliases: Object.create(null),
            seen: Object.create(null)
        };
    }

    function addSymbol(result, item) {
        if (!item || !item.name) {
            return;
        }
        var name = String(item.name);
        var existingIndex = result.seen[name];
        if (typeof existingIndex === "number") {
            var existing = result.globals[existingIndex];
            if (existing && existing.type === "variable" && item.type !== "variable") {
                result.globals[existingIndex] = item;
            }
            return;
        }
        result.seen[name] = result.globals.length;
        result.globals.push(item);
    }

    function addAlias(result, alias, target) {
        alias = String(alias || "").trim();
        target = String(target || "").trim();
        if (alias && target) {
            result.aliases[alias] = target;
        }
    }

    var KOTLIN_TYPE_TARGETS = {
        "String": "kotlin.String",
        "CharSequence": "kotlin.String",
        "Array": "kotlin.Array",
        "BooleanArray": "kotlin.Array",
        "ByteArray": "kotlin.Array",
        "CharArray": "kotlin.Array",
        "DoubleArray": "kotlin.Array",
        "FloatArray": "kotlin.Array",
        "IntArray": "kotlin.Array",
        "LongArray": "kotlin.Array",
        "ShortArray": "kotlin.Array",
        "List": "kotlin.collections.List",
        "MutableList": "kotlin.collections.MutableList",
        "Map": "kotlin.collections.Map",
        "MutableMap": "kotlin.collections.MutableMap",
        "Set": "kotlin.collections.Set",
        "MutableSet": "kotlin.collections.MutableSet",
        "Sequence": "kotlin.sequences.Sequence",
        "IntRange": "kotlin.ranges.IntRange",
        "IntProgression": "kotlin.ranges.IntRange",
        "Int": "kotlin.Int",
        "Long": "kotlin.Long",
        "Double": "kotlin.Double",
        "Float": "kotlin.Double",
        "Boolean": "kotlin.Boolean",
        "StringBuilder": "kotlin.text.StringBuilder",
        "Regex": "kotlin.text.Regex#instance",
        "Uri": "android.net.Uri#instance"
    };

    function kotlinTypeTarget(typeText) {
        typeText = String(typeText || "")
            .replace(/^\s*(?:in|out)\s+/, "")
            .replace(/\s*\?\s*$/, "")
            .trim();
        if (!typeText || /\([^)]*\)\s*->/.test(typeText)) {
            return "";
        }
        var genericAt = typeText.indexOf("<");
        if (genericAt >= 0) {
            typeText = typeText.substring(0, genericAt).trim();
        }
        typeText = typeText.replace(/\s+/g, "");
        var simpleName = typeText.split(".").pop();
        return KOTLIN_TYPE_TARGETS[typeText] || KOTLIN_TYPE_TARGETS[simpleName] || typeText;
    }

    function kotlinParameterType(parameter) {
        parameter = String(parameter || "")
            .replace(/=[\s\S]*$/, "")
            .replace(/^\s*(?:(?:vararg|crossinline|noinline|out|in|val|var)\s+)+/, "")
            .trim();
        var match = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([\s\S]+)$/.exec(parameter);
        return match ? {
            name: match[1],
            target: kotlinTypeTarget(match[2])
        } : null;
    }

    function kotlinInitializerTarget(expression, rawLine, name) {
        expression = String(expression || "").trim();
        var castMatch = /\bas\??\s+([A-Za-z_][A-Za-z0-9_.]*(?:\s*<[^>]+>)?\??)/.exec(expression);
        if (castMatch) {
            return kotlinTypeTarget(castMatch[1]);
        }
        var callMatch = /^(?:[A-Za-z_][A-Za-z0-9_]*\.)*([A-Za-z_][A-Za-z0-9_]*)\s*(?:<[^>]*>)?\s*\(/.exec(expression);
        var calls = {
            "arrayOf": "kotlin.Array", "emptyArray": "kotlin.Array", "booleanArrayOf": "kotlin.Array",
            "byteArrayOf": "kotlin.Array", "charArrayOf": "kotlin.Array", "doubleArrayOf": "kotlin.Array",
            "floatArrayOf": "kotlin.Array", "intArrayOf": "kotlin.Array", "longArrayOf": "kotlin.Array", "shortArrayOf": "kotlin.Array",
            "listOf": "kotlin.collections.List", "emptyList": "kotlin.collections.List", "buildList": "kotlin.collections.List",
            "mutableListOf": "kotlin.collections.MutableList", "arrayListOf": "kotlin.collections.MutableList",
            "mapOf": "kotlin.collections.Map", "emptyMap": "kotlin.collections.Map", "buildMap": "kotlin.collections.Map",
            "mutableMapOf": "kotlin.collections.MutableMap", "hashMapOf": "kotlin.collections.MutableMap",
            "setOf": "kotlin.collections.Set", "emptySet": "kotlin.collections.Set", "buildSet": "kotlin.collections.Set",
            "mutableSetOf": "kotlin.collections.MutableSet", "hashSetOf": "kotlin.collections.MutableSet",
            "sequenceOf": "kotlin.sequences.Sequence", "emptySequence": "kotlin.sequences.Sequence",
            "generateSequence": "kotlin.sequences.Sequence", "sequence": "kotlin.sequences.Sequence",
            "Regex": "kotlin.text.Regex#instance", "StringBuilder": "kotlin.text.StringBuilder"
        };
        if (callMatch && calls[callMatch[1]]) {
            return calls[callMatch[1]];
        }
        if (/^(?:android\.net\.)?Uri\.parse\s*\(/.test(expression)) {
            return "android.net.Uri#instance";
        }
        if (callMatch && /^[A-Z]/.test(callMatch[1])) {
            return kotlinTypeTarget(callMatch[1]);
        }
        if (/^[+-]?\d+\s*\.\.\s*[+-]?\d+/.test(expression)) {
            return "kotlin.ranges.IntRange";
        }
        if (/^[+-]?(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?[fF]?\b/.test(expression)) {
            return "kotlin.Double";
        }
        if (/^[+-]?\d+[lL]?\b/.test(expression)) {
            return /[lL]\b/.test(expression) ? "kotlin.Long" : "kotlin.Int";
        }
        if (/^(?:true|false)\b/.test(expression)) {
            return "kotlin.Boolean";
        }
        var rawPattern = RegExp("\\b(?:val|var)\\s+" + name + "(?:\\s*:[^=]+)?\\s*=\\s*([\\s\\S]+)$");
        var rawMatch = rawPattern.exec(String(rawLine || ""));
        var rawExpression = rawMatch ? rawMatch[1].trim() : "";
        if (/^(?:\"\"\"|\")/.test(rawExpression)) {
            return "kotlin.String";
        }
        return "";
    }

    function splitTopLevel(value, separator) {
        value = String(value || "");
        separator = separator || ",";
        var items = [];
        var start = 0;
        var depth = 0;
        var quote = "";
        var escaped = false;
        for (var i = 0; i < value.length; i++) {
            var ch = value.charAt(i);
            if (quote) {
                if (escaped) {
                    escaped = false;
                } else if (ch === "\\") {
                    escaped = true;
                } else if (ch === quote) {
                    quote = "";
                }
                continue;
            }
            if (ch === "\"" || ch === "'" || ch === "`") {
                quote = ch;
                continue;
            }
            if (ch === "(" || ch === "[" || ch === "{" || ch === "<") {
                depth++;
                continue;
            }
            if (ch === ")" || ch === "]" || ch === "}" || ch === ">") {
                depth = Math.max(0, depth - 1);
                continue;
            }
            if (ch === separator && depth === 0) {
                items.push(value.substring(start, i).trim());
                start = i + 1;
            }
        }
        items.push(value.substring(start).trim());
        return items.filter(function(item) { return !!item; });
    }

    function identifierFromParameter(parameter, language) {
        parameter = String(parameter || "")
            .replace(/=[\s\S]*$/, "")
            .replace(/^\s*(?:final|vararg|crossinline|noinline|out|in|val|var)\s+/, "")
            .trim();
        if (!parameter || parameter === "*" || parameter === "/") {
            return "";
        }
        if (language === "python") {
            parameter = parameter.replace(/^\*{0,2}/, "").replace(/\s*:\s*[\s\S]*$/, "");
            var pythonMatch = /^([A-Za-z_][A-Za-z0-9_]*)$/.exec(parameter.trim());
            return pythonMatch ? pythonMatch[1] : "";
        }
        if (language === "lua") {
            var luaMatch = /^([A-Za-z_][A-Za-z0-9_]*)$/.exec(parameter.trim());
            return luaMatch ? luaMatch[1] : "";
        }
        if (language === "kotlin") {
            var kotlinMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?::|$)/.exec(parameter.trim());
            return kotlinMatch ? kotlinMatch[1] : "";
        }
        var javaMatch = /([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:\[\s*\])?$/.exec(parameter.trim());
        return javaMatch ? javaMatch[1] : "";
    }

    function addParameters(result, parameters, language) {
        splitTopLevel(parameters).forEach(function(parameter) {
            var name = identifierFromParameter(parameter, language);
            if (name && name !== "this" && name !== "super") {
                addSymbol(result, symbol(name, "parameter", "", "Parameter in the current document."));
                if (language === "kotlin") {
                    var typedParameter = kotlinParameterType(parameter);
                    if (typedParameter && typedParameter.name === name && typedParameter.target) {
                        addAlias(result, name, typedParameter.target);
                    }
                }
            }
        });
    }

    function maskNonCode(text, language) {
        text = String(text || "");
        var output = [];
        var quote = "";
        var triple = "";
        var escaped = false;
        var lineComment = false;
        var blockComment = "";
        var supportsSlashComments = language === "java" || language === "kotlin";
        for (var i = 0; i < text.length; i++) {
            var ch = text.charAt(i);
            var next = text.charAt(i + 1);
            var nextTwo = text.substr(i, 3);
            if (lineComment) {
                if (ch === "\n" || ch === "\r") {
                    lineComment = false;
                    output.push(ch);
                } else {
                    output.push(" ");
                }
                continue;
            }
            if (blockComment) {
                var blockEnds = blockComment === "*/" ? ch === "*" && next === "/" :
                    blockComment === "]]" ? ch === "]" && next === "]" : false;
                output.push(ch === "\n" || ch === "\r" ? ch : " ");
                if (blockEnds) {
                    output.push(" ");
                    i++;
                    blockComment = "";
                }
                continue;
            }
            if (triple) {
                if (nextTwo === triple) {
                    output.push(" ", " ", " ");
                    i += 2;
                    triple = "";
                } else {
                    output.push(ch === "\n" || ch === "\r" ? ch : " ");
                }
                continue;
            }
            if (quote) {
                output.push(ch === "\n" || ch === "\r" ? ch : " ");
                if (escaped) {
                    escaped = false;
                } else if (ch === "\\") {
                    escaped = true;
                } else if (ch === quote) {
                    quote = "";
                }
                continue;
            }
            if ((language === "python" || language === "kotlin") &&
                (nextTwo === "\"\"\"" || nextTwo === "'''")) {
                triple = nextTwo;
                output.push(" ", " ", " ");
                i += 2;
                continue;
            }
            if (language === "python" && ch === "#") {
                lineComment = true;
                output.push(" ");
                continue;
            }
            if (language === "lua" && ch === "-" && next === "-") {
                if (text.substr(i, 4) === "--[[") {
                    blockComment = "]]";
                    output.push(" ", " ", " ", " ");
                    i += 3;
                } else {
                    lineComment = true;
                    output.push(" ", " ");
                    i++;
                }
                continue;
            }
            if (supportsSlashComments && ch === "/" && next === "/") {
                lineComment = true;
                output.push(" ", " ");
                i++;
                continue;
            }
            if (supportsSlashComments && ch === "/" && next === "*") {
                blockComment = "*/";
                output.push(" ", " ");
                i++;
                continue;
            }
            if (ch === "\"" || ch === "'" || (language === "kotlin" && ch === "`")) {
                quote = ch;
                output.push(" ");
                continue;
            }
            output.push(ch);
        }
        return output.join("");
    }

    function parsePythonImports(result, text) {
        String(text || "").split(/\r?\n/).forEach(function(line) {
            var match = /^\s*import\s+(.+?)\s*(?:#.*)?$/.exec(line);
            if (match) {
                splitTopLevel(match[1]).forEach(function(part) {
                    var imported = /^([A-Za-z_][A-Za-z0-9_.]*)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/.exec(part);
                    if (!imported) {
                        return;
                    }
                    var alias = imported[2] || imported[1].split(".")[0];
                    addSymbol(result, symbol(alias, "module", "", "Imported Python module."));
                    addAlias(result, alias, imported[1]);
                });
                return;
            }
            match = /^\s*from\s+([A-Za-z_][A-Za-z0-9_.]*)\s+import\s+(.+?)\s*(?:#.*)?$/.exec(line);
            if (!match) {
                return;
            }
            var moduleName = match[1];
            splitTopLevel(match[2].replace(/^\(|\)$/g, "")).forEach(function(part) {
                var imported = /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/.exec(part);
                if (!imported || imported[1] === "*") {
                    return;
                }
                var alias = imported[2] || imported[1];
                addSymbol(result, symbol(alias, "import", "", "Imported Python symbol."));
                addAlias(result, alias, moduleName + "." + imported[1]);
            });
        });
    }

    function extractPython(text) {
        var result = createResult();
        parsePythonImports(result, text);
        var code = maskNonCode(text, "python");
        code.split(/\r?\n/).forEach(function(line) {
            var match = /^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/.exec(line);
            if (match) {
                addSymbol(result, symbol(match[1], "function", match[1] + "(" + match[2].trim() + ")", "Function defined in the current Python document."));
                addParameters(result, match[2], "python");
            }
            match = /^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line);
            if (match) {
                addSymbol(result, symbol(match[1], "class", "class " + match[1], "Class defined in the current Python document."));
            }
            match = /^\s*(?:async\s+)?for\s+(.+?)\s+in\s+/.exec(line);
            if (match) {
                match[1].split(",").forEach(function(name) {
                    name = name.trim();
                    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                        addSymbol(result, symbol(name, "variable"));
                    }
                });
            }
            match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]+)?\s*(?:=|:=)/.exec(line);
            if (match) {
                addSymbol(result, symbol(match[1], "variable"));
            }
            var asPattern = /\bas\s+([A-Za-z_][A-Za-z0-9_]*)/g;
            while ((match = asPattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "variable"));
            }
        });
        return result;
    }

    function parseLuaRequires(result, text) {
        String(text || "").split(/\r?\n/).forEach(function(line) {
            var match = /^\s*local\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/.exec(line);
            if (!match) {
                match = /^\s*local\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*require\s+["']([^"']+)["']/.exec(line);
            }
            if (match) {
                addSymbol(result, symbol(match[1], "module", "", "Required Lua module."));
                addAlias(result, match[1], match[2]);
            }
        });
    }

    function extractLua(text) {
        var result = createResult();
        parseLuaRequires(result, text);
        var code = maskNonCode(text, "lua");
        code.split(/\r?\n/).forEach(function(line) {
            var match = /^\s*(?:local\s+)?function\s+([A-Za-z_][A-Za-z0-9_.:]*)\s*\(([^)]*)\)/.exec(line);
            if (match) {
                var parts = match[1].split(/[.:]/);
                var name = parts[parts.length - 1];
                addSymbol(result, symbol(name, "function", name + "(" + match[2].trim() + ")", "Function defined in the current Lua document."));
                addParameters(result, match[2], "lua");
            }
            match = /^\s*local\s+(.+?)(?:\s*=|\s*$)/.exec(line);
            if (match && !/^function\b/.test(match[1])) {
                match[1].split(",").forEach(function(name) {
                    name = name.trim();
                    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                        addSymbol(result, symbol(name, "variable"));
                    }
                });
            }
            match = /^\s*for\s+(.+?)\s+(?:in|=)\s+/.exec(line);
            if (match) {
                match[1].split(",").forEach(function(name) {
                    name = name.trim();
                    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                        addSymbol(result, symbol(name, "variable"));
                    }
                });
            }
        });
        return result;
    }

    function parseDottedImports(result, text, language) {
        String(text || "").split(/\r?\n/).forEach(function(line) {
            var match = /^\s*import\s+(?:static\s+)?([A-Za-z_$][A-Za-z0-9_$.]*)(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?\s*;?/.exec(line);
            if (!match || /\.\*$/.test(match[1])) {
                return;
            }
            var alias = match[2] || match[1].split(".").pop();
            addSymbol(result, symbol(alias, "import", "", "Imported " + language + " symbol."));
            addAlias(result, alias, match[1]);
        });
    }

    var JAVA_CONTROL_WORDS = {
        "if": true,
        "for": true,
        "while": true,
        "switch": true,
        "catch": true,
        "try": true,
        "new": true,
        "return": true,
        "throw": true,
        "super": true,
        "this": true,
        "synchronized": true
    };

    function extractJava(text) {
        var result = createResult();
        parseDottedImports(result, text, "Java");
        var code = maskNonCode(text, "java");
        var classNames = Object.create(null);
        code.split(/\r?\n/).forEach(function(line) {
            var classPattern = /\b(?:class|interface|enum|record)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
            var match;
            while ((match = classPattern.exec(line)) !== null) {
                classNames[match[1]] = true;
                addSymbol(result, symbol(match[1], "class", "class " + match[1], "Type defined in the current Java document."));
            }
        });
        code.split(/\r?\n/).forEach(function(line) {
            var match = /^\s*(?:(?:public|protected|private|static|final|abstract|synchronized|native|default|strictfp)\s+)*(?:<[^>]+>\s*)?([A-Za-z_$][A-Za-z0-9_$.]*(?:\s*<[^;=(){}]+>)?(?:\s*\[\s*\])?)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^()]*)\)\s*(?:throws\s+[^\{;]+)?[\{;]/.exec(line);
            if (match && !JAVA_CONTROL_WORDS[match[2]]) {
                addSymbol(result, symbol(match[2], "function", match[2] + "(" + match[3].trim() + ")", "Method defined in the current Java document."));
                addParameters(result, match[3], "java");
            } else {
                match = /^\s*(?:(?:public|protected|private)\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^()]*)\)\s*(?:throws\s+[^\{;]+)?\{/.exec(line);
                if (match && classNames[match[1]]) {
                    addSymbol(result, symbol(match[1], "constructor", match[1] + "(" + match[2].trim() + ")", "Constructor defined in the current Java document."));
                    addParameters(result, match[2], "java");
                }
            }
            var variablePattern = /(?:^|[;{}])\s*(?:(?:public|protected|private|static|final|transient|volatile)\s+)*[A-Za-z_$][A-Za-z0-9_$.]*(?:\s*<[^;=(){}]+>)?(?:\s*\[\s*\])?\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?==|;|,|:)/g;
            while ((match = variablePattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "variable"));
            }
            var loopPattern = /\b(?:for|catch)\s*\(\s*(?:final\s+)?[A-Za-z_$][A-Za-z0-9_$.<>?,\s\[\]]*\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?=[:;)])/g;
            while ((match = loopPattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "variable"));
            }
        });
        return result;
    }

    function extractKotlin(text) {
        var result = createResult();
        parseDottedImports(result, text, "Kotlin");
        var code = maskNonCode(text, "kotlin");
        var rawLines = String(text || "").split(/\r?\n/);
        code.split(/\r?\n/).forEach(function(line, lineIndex) {
            var rawLine = rawLines[lineIndex] || "";
            var match;
            var typePattern = /\b(?:class|interface|object|enum\s+class|data\s+class|sealed\s+class|typealias)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
            while ((match = typePattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "class", "class " + match[1], "Type defined in the current Kotlin document."));
            }
            var primaryConstructorPattern = /\b(?:class|enum\s+class|data\s+class|sealed\s+class)\s+[A-Za-z_][A-Za-z0-9_]*(?:\s*<[^>]+>)?\s*\(([^)]*)\)/g;
            while ((match = primaryConstructorPattern.exec(line)) !== null) {
                addParameters(result, match[1], "kotlin");
            }
            var functionPattern = /\bfun\s+(?:<[^>]+>\s*)?(?:[A-Za-z_][A-Za-z0-9_?.<>]*\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/g;
            while ((match = functionPattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "function", match[1] + "(" + match[2].trim() + ")", "Function defined in the current Kotlin document."));
                addParameters(result, match[2], "kotlin");
            }
            var variablePattern = /\b(?:val|var)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
            while ((match = variablePattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "variable"));
            }
            var typedVariablePattern = /\b(?:val|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^=;]+)/g;
            while ((match = typedVariablePattern.exec(line)) !== null) {
                var explicitTarget = kotlinTypeTarget(match[2]);
                if (explicitTarget) {
                    addAlias(result, match[1], explicitTarget);
                }
            }
            var initializedVariablePattern = /\b(?:val|var)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*[^=;]+)?\s*=\s*([^;]+)/g;
            while ((match = initializedVariablePattern.exec(line)) !== null) {
                if (!Object.prototype.hasOwnProperty.call(result.aliases, match[1])) {
                    var inferredTarget = kotlinInitializerTarget(match[2], rawLine, match[1]);
                    if (inferredTarget) {
                        addAlias(result, match[1], inferredTarget);
                    }
                }
            }
            var loopPattern = /\bfor\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\b/g;
            while ((match = loopPattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "variable"));
            }
            var catchPattern = /\bcatch\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_.?]*)/g;
            while ((match = catchPattern.exec(line)) !== null) {
                addSymbol(result, symbol(match[1], "parameter"));
                addAlias(result, match[1], kotlinTypeTarget(match[2]));
            }
        });
        return result;
    }

    function register(language, extractor) {
        language = normalizeLanguage(language);
        if (!language || typeof extractor !== "function") {
            throw new Error("A language id and extractor function are required");
        }
        extractors[language] = extractor;
    }

    function extract(language, text) {
        language = normalizeLanguage(language);
        var extractor = extractors[language];
        if (!extractor) {
            return createResult();
        }
        var result = extractor(String(text || "")) || createResult();
        delete result.seen;
        return result;
    }

    register("python", extractPython);
    register("lua", extractLua);
    register("java", extractJava);
    register("kotlin", extractKotlin);

    // Recognize only explicit, unshadowed top-level activation statements. This scanner
    // runs without TypeScript so the static fallback follows the same opt-in contract.
    var activationText = null, activationHasParser = false, activationModules = [];
    function detectJsoxModules(text) {
        text = String(text || "");
        var ts = global.ts;
        var hasParser = !!(ts && typeof ts.createSourceFile === "function");
        if (activationText === text && activationHasParser === hasParser) return activationModules.slice(0);
        function remember(modules) {
            activationText = text;
            activationHasParser = hasParser;
            activationModules = modules;
            return modules.slice(0);
        }
        if (hasParser) {
            var file = ts.createSourceFile("activation.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            var available = { jsox: true, $jsox: true }, active = {};
            function shadow(name) {
                if (!name) return;
                if (ts.isIdentifier(name)) { if (Object.prototype.hasOwnProperty.call(available, name.text)) available[name.text] = false; }
                else if (name.elements) name.elements.forEach(function(element) { shadow(element.name); });
            }
            file.statements.forEach(function(statement) {
                if (ts.isVariableStatement(statement)) statement.declarationList.declarations.forEach(function(declaration) { shadow(declaration.name); });
                if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) shadow(statement.name);
                if (ts.isImportDeclaration(statement) && statement.importClause) {
                    shadow(statement.importClause.name);
                    var bindings = statement.importClause.namedBindings;
                    if (bindings && bindings.elements) bindings.elements.forEach(function(binding) { shadow(binding.name); });
                    else if (bindings) shadow(bindings.name);
                }
                if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression) &&
                    statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) shadow(statement.expression.left);
            });
            file.statements.forEach(function(statement) {
                if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return;
                var call = statement.expression, callee = call.expression, method = "";
                if (ts.isPropertyAccessExpression(callee)) { method = callee.name.text; callee = callee.expression; }
                if (!ts.isIdentifier(callee) || !available[callee.text] ||
                    (method && method !== "extend" && method !== "extendAll")) return;
                var selected = [], valid = true;
                function collect(argument) {
                    if (ts.isArrayLiteralExpression(argument)) { argument.elements.forEach(collect); return; }
                    if (!ts.isStringLiteral(argument)) { valid = false; return; }
                    var name = argument.text.toLowerCase().replace(/x$/, "");
                    if (name === "array" || name === "number" || name === "math") selected.push(name);
                    else valid = false;
                }
                call.arguments.forEach(collect);
                if (!valid) return;
                if (!call.arguments.length || method === "extendAll") selected = ["array", "math", "number"];
                selected.forEach(function(name) { active[name] = true; });
            });
            return remember(Object.keys(active).sort());
        }
        var tokens = [], i = 0, depth = 0, previous = "";
        while (i < text.length) {
            var ch = text.charAt(i), next = text.charAt(i + 1), start = i;
            if (/\s/.test(ch)) { i++; continue; }
            if (ch === "/" && next === "/") {
                while (i < text.length && text.charAt(i) !== "\n") i++;
                continue;
            }
            if (ch === "/" && next === "*") {
                i = text.indexOf("*/", i + 2); i = i < 0 ? text.length : i + 2;
                continue;
            }
            if (ch === "'" || ch === "\"" || ch === "`") {
                var quote = ch, escaped = false;
                i++;
                while (i < text.length && text.charAt(i) !== quote) {
                    if (text.charAt(i) === "\\") { escaped = true; i++; }
                    i++;
                }
                var value = text.substring(start + 1, i);
                i++;
                tokens.push({ value: value, string: quote !== "`" && !escaped, depth: depth, start: start, end: i });
                previous = "literal";
                continue;
            }
            if (ch === "/" && (!previous || /^[=(:,;!?{[]$/.test(previous) || previous === "return")) {
                i++;
                var characterClass = false;
                while (i < text.length) {
                    var rc = text.charAt(i++);
                    if (rc === "\\") { i++; continue; }
                    if (rc === "[") characterClass = true;
                    if (rc === "]") characterClass = false;
                    if (rc === "/" && !characterClass) break;
                }
                while (/[a-z]/i.test(text.charAt(i)) && i < text.length) i++;
                previous = "literal";
                tokens.push({ value: "literal", depth: depth, start: start, end: i });
                continue;
            }
            if (/[A-Za-z_$]/.test(ch)) {
                while (i < text.length && /[\w$]/.test(text.charAt(i))) i++;
            } else { i++; }
            var token = text.substring(start, i);
            if (token === "}") depth--;
            tokens.push({ value: token, depth: depth, start: start, end: i });
            if (token === "{") depth++;
            previous = token;
        }
        var names = { jsox: true, $jsox: true }, enabled = {};
        // A local binding or replacement invalidates assumptions about that global.
        tokens.forEach(function(token, index) {
            if (token.depth === 0 && /^(var|let|const|import)$/.test(token.value)) {
                for (var binding = index + 1; binding < tokens.length; binding++) {
                    var part = tokens[binding];
                    if (part.depth === 0 && (part.value === "=" || part.value === ";" || part.value === "from")) break;
                    if (!part.string && Object.prototype.hasOwnProperty.call(names, part.value)) names[part.value] = false;
                }
            }
            if (token.depth !== 0 || !names[token.value]) return;
            var prev = tokens[index - 1] && tokens[index - 1].value;
            var following = tokens[index + 1] && tokens[index + 1].value;
            if (/^(var|let|const|function|class|import)$/.test(prev || "") || following === "=") {
                names[token.value] = false;
            }
        });
        for (var n = 0; n < tokens.length; n++) {
            var current = tokens[n];
            var before = tokens[n - 1];
            if (current.depth !== 0 || !names[current.value] || current.string ||
                (n > 0 && before.value !== ";" && before.value !== "}")) continue;
            var cursor = n + 1, method = "";
            if (tokens[cursor] && tokens[cursor].value === ".") {
                method = tokens[cursor + 1] && tokens[cursor + 1].value;
                if (method !== "extend" && method !== "extendAll") continue;
                cursor += 2;
            }
            if (!tokens[cursor] || tokens[cursor].value !== "(") continue;
            cursor++;
            var selected = [], valid = true, argumentCount = 0;
            while (cursor < tokens.length && tokens[cursor].value !== ")") {
                var argument = tokens[cursor++];
                if (argument.string) {
                    argumentCount++;
                    var module = argument.value.toLowerCase().replace(/x$/, "");
                    if (module === "array" || module === "number" || module === "math") selected.push(module);
                    else valid = false;
                } else if (argument.value !== "," && argument.value !== "[" && argument.value !== "]") valid = false;
            }
            if (!valid || cursor >= tokens.length) continue;
            if (!argumentCount || method === "extendAll") selected = ["array", "number", "math"];
            selected.forEach(function(module) { enabled[module] = true; });
        }
        return remember(Object.keys(enabled).sort());
    }

    global.AutoJsAceLocalSymbols = {
        detectJsoxModules: detectJsoxModules,
        register: register,
        extract: extract,
        languageIdForSession: languageIdForSession,
        supportedLanguages: function() {
            return Object.keys(extractors);
        }
    };
})(window);
