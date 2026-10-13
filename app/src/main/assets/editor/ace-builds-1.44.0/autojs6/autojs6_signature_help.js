(function(global) {
    "use strict";

    var IDENTIFIER_CHAIN_REGEX = /[A-Za-z0-9_$.]/;
    var DEFAULT_DELAY_MS = 80;
    var EDGE_PADDING = 8;

    var BUILTIN_SIGNATURES = [
        {
            name: "Function.prototype.apply",
            aliases: ["Function.prototype.apply", "apply"],
            signature: "apply(thisArg: any, argArray?: any): any",
            parameters: ["thisArg: any", "argArray?: any"],
            returnType: "any",
            summary: "Calls a function with a this value and arguments supplied as an array-like object."
        },
        {
            name: "Function.prototype.call",
            aliases: ["Function.prototype.call", "call"],
            signature: "call(thisArg: any, ...args: any[]): any",
            parameters: ["thisArg: any", "...args: any[]"],
            returnType: "any",
            summary: "Calls a function with a this value and arguments supplied individually."
        },
        {
            name: "Function.prototype.bind",
            aliases: ["Function.prototype.bind", "bind"],
            signature: "bind(thisArg: any, ...args: any[]): Function",
            parameters: ["thisArg: any", "...args: any[]"],
            returnType: "Function",
            summary: "Creates a new function with this and optional leading arguments bound."
        },
        {
            name: "Array.prototype.forEach",
            aliases: ["Array.prototype.forEach", "forEach"],
            signature: "forEach(callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any): void",
            parameters: ["callbackfn", "thisArg?: any"],
            returnType: "void",
            summary: "Runs a callback once for each array element."
        },
        {
            name: "Array.prototype.map",
            aliases: ["Array.prototype.map", "map"],
            signature: "map(callbackfn: (value: any, index: number, array: any[]) => any, thisArg?: any): any[]",
            parameters: ["callbackfn", "thisArg?: any"],
            returnType: "any[]",
            summary: "Creates an array from callback results for each element."
        },
        {
            name: "Array.prototype.filter",
            aliases: ["Array.prototype.filter", "filter"],
            signature: "filter(predicate: (value: any, index: number, array: any[]) => boolean, thisArg?: any): any[]",
            parameters: ["predicate", "thisArg?: any"],
            returnType: "any[]",
            summary: "Creates an array containing elements accepted by the predicate."
        },
        {
            name: "Array.prototype.reduce",
            aliases: ["Array.prototype.reduce", "reduce"],
            signature: "reduce(callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any): any",
            parameters: ["callbackfn", "initialValue?: any"],
            returnType: "any",
            summary: "Reduces an array to one value by repeatedly calling a reducer."
        },
        {
            name: "String.prototype.replace",
            aliases: ["String.prototype.replace", "replace"],
            signature: "replace(searchValue: string | RegExp, replaceValue: string | Function): string",
            parameters: ["searchValue: string | RegExp", "replaceValue: string | Function"],
            returnType: "string",
            summary: "Returns a new string with matched text replaced."
        },
        {
            name: "String.prototype.split",
            aliases: ["String.prototype.split", "split"],
            signature: "split(separator?: string | RegExp, limit?: number): string[]",
            parameters: ["separator?: string | RegExp", "limit?: number"],
            returnType: "string[]",
            summary: "Splits a string into an array of substrings."
        },
        {
            name: "Promise.prototype.then",
            aliases: ["Promise.prototype.then", "then"],
            signature: "then(onFulfilled?: Function, onRejected?: Function): Promise",
            parameters: ["onFulfilled?: Function", "onRejected?: Function"],
            returnType: "Promise",
            summary: "Registers callbacks for promise fulfillment or rejection."
        },
        {
            name: "Promise.prototype.catch",
            aliases: ["Promise.prototype.catch", "catch"],
            signature: "catch(onRejected?: Function): Promise",
            parameters: ["onRejected?: Function"],
            returnType: "Promise",
            summary: "Registers a callback for promise rejection."
        },
        // Overloaded built-ins: `signatures` lists every overload; the first one doubles as the
        // compatibility `signature`. Generic names (slice, parse, keys...) only match with their
        // receiver so user functions with the same name do not pick them up.
        {
            name: "Array.prototype.splice",
            aliases: ["Array.prototype.splice", "splice"],
            signature: "splice(start: number, deleteCount?: number): any[]",
            parameters: ["start: number", "deleteCount?: number"],
            returnType: "any[]",
            summary: "Removes elements from an array and returns the removed elements.",
            signatures: [
                {
                    signature: "splice(start: number, deleteCount?: number): any[]",
                    parameters: ["start: number", "deleteCount?: number"],
                    returnType: "any[]",
                    summary: "Removes elements from an array and returns the removed elements."
                },
                {
                    signature: "splice(start: number, deleteCount: number, ...items: any[]): any[]",
                    parameters: ["start: number", "deleteCount: number", "...items: any[]"],
                    returnType: "any[]",
                    isVariadic: true,
                    summary: "Removes elements from an array, inserts new elements in their place and returns the removed elements."
                }
            ]
        },
        {
            name: "Array.prototype.slice",
            aliases: ["Array.prototype.slice"],
            signature: "slice(start?: number, end?: number): any[]",
            parameters: ["start?: number", "end?: number"],
            returnType: "any[]",
            summary: "Returns a shallow copy of a section of an array."
        },
        {
            name: "Array.prototype.indexOf",
            aliases: ["Array.prototype.indexOf", "indexOf"],
            signature: "indexOf(searchElement: any, fromIndex?: number): number",
            parameters: ["searchElement: any", "fromIndex?: number"],
            returnType: "number",
            summary: "Returns the index of the first occurrence of a value, or -1."
        },
        {
            name: "Array.from",
            aliases: ["Array.from"],
            signature: "from(arrayLike: ArrayLike<any> | Iterable<any>): any[]",
            parameters: ["arrayLike: ArrayLike<any> | Iterable<any>"],
            returnType: "any[]",
            summary: "Creates an array from an array-like or iterable object.",
            signatures: [
                {
                    signature: "from(arrayLike: ArrayLike<any> | Iterable<any>): any[]",
                    parameters: ["arrayLike: ArrayLike<any> | Iterable<any>"],
                    returnType: "any[]",
                    summary: "Creates an array from an array-like or iterable object."
                },
                {
                    signature: "from(arrayLike: ArrayLike<any> | Iterable<any>, mapfn: (v: any, k: number) => any, thisArg?: any): any[]",
                    parameters: ["arrayLike: ArrayLike<any> | Iterable<any>", "mapfn: (v: any, k: number) => any", "thisArg?: any"],
                    returnType: "any[]",
                    summary: "Creates an array from an array-like or iterable object, mapping every element."
                }
            ]
        },
        {
            name: "String.prototype.replace",
            aliases: ["String.prototype.replace", "replace"],
            signature: "replace(searchValue: string | RegExp, replaceValue: string): string",
            parameters: ["searchValue: string | RegExp", "replaceValue: string"],
            returnType: "string",
            summary: "Returns a new string with matched text replaced.",
            signatures: [
                {
                    signature: "replace(searchValue: string | RegExp, replaceValue: string): string",
                    parameters: ["searchValue: string | RegExp", "replaceValue: string"],
                    returnType: "string",
                    summary: "Returns a new string with matched text replaced by a string."
                },
                {
                    signature: "replace(searchValue: string | RegExp, replacer: (substring: string, ...args: any[]) => string): string",
                    parameters: ["searchValue: string | RegExp", "replacer: (substring: string, ...args: any[]) => string"],
                    returnType: "string",
                    summary: "Returns a new string with matched text replaced by the result of a function."
                }
            ]
        },
        {
            name: "JSON.parse",
            aliases: ["JSON.parse"],
            signature: "parse(text: string, reviver?: (key: string, value: any) => any): any",
            parameters: ["text: string", "reviver?: (key: string, value: any) => any"],
            returnType: "any",
            summary: "Converts a JSON string into an object."
        },
        {
            name: "JSON.stringify",
            aliases: ["JSON.stringify"],
            signature: "stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string",
            parameters: ["value: any", "replacer?: (key: string, value: any) => any", "space?: string | number"],
            returnType: "string",
            summary: "Converts a value to a JSON string.",
            signatures: [
                {
                    signature: "stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string",
                    parameters: ["value: any", "replacer?: (key: string, value: any) => any", "space?: string | number"],
                    returnType: "string",
                    summary: "Converts a value to a JSON string, transforming results with a replacer function."
                },
                {
                    signature: "stringify(value: any, replacer?: (number | string)[] | null, space?: string | number): string",
                    parameters: ["value: any", "replacer?: (number | string)[] | null", "space?: string | number"],
                    returnType: "string",
                    summary: "Converts a value to a JSON string, keeping only the listed properties."
                }
            ]
        },
        {
            name: "Object.assign",
            aliases: ["Object.assign"],
            signature: "assign(target: any, ...sources: any[]): any",
            parameters: ["target: any", "...sources: any[]"],
            returnType: "any",
            isVariadic: true,
            summary: "Copies enumerable own properties from source objects to a target object."
        },
        {
            name: "Object.keys",
            aliases: ["Object.keys"],
            signature: "keys(o: object): string[]",
            parameters: ["o: object"],
            returnType: "string[]",
            summary: "Returns the names of the enumerable string properties of an object."
        },
        {
            name: "setTimeout",
            aliases: ["setTimeout"],
            signature: "setTimeout(callback: Function, delay?: number, ...args: any[]): number",
            parameters: ["callback: Function", "delay?: number", "...args: any[]"],
            returnType: "number",
            isVariadic: true,
            summary: "Runs a callback after a delay in milliseconds and returns the timer id."
        },
        {
            name: "setInterval",
            aliases: ["setInterval"],
            signature: "setInterval(callback: Function, delay?: number, ...args: any[]): number",
            parameters: ["callback: Function", "delay?: number", "...args: any[]"],
            returnType: "number",
            isVariadic: true,
            summary: "Runs a callback repeatedly with a fixed delay and returns the timer id."
        },
        {
            name: "Math.max",
            aliases: ["Math.max"],
            signature: "max(...values: number[]): number",
            parameters: ["...values: number[]"],
            returnType: "number",
            isVariadic: true,
            summary: "Returns the largest of the given numbers."
        },
        {
            name: "Math.min",
            aliases: ["Math.min"],
            signature: "min(...values: number[]): number",
            parameters: ["...values: number[]"],
            returnType: "number",
            isVariadic: true,
            summary: "Returns the smallest of the given numbers."
        }
    ];

    function builtinOverloads(builtin) {
        var entries = Array.isArray(builtin.signatures) && builtin.signatures.length ? builtin.signatures : [builtin];
        return entries.map(function(entry) {
            return {
                caption: builtin.name,
                signature: entry.signature,
                parameters: (entry.parameters || []).slice(0),
                returnType: entry.returnType || builtin.returnType || "",
                docText: entry.summary || builtin.summary || "",
                isVariadic: !!(entry.isVariadic || builtin.isVariadic)
            };
        });
    }

    // Pick the first overload that still has a slot for the active argument; otherwise the last.
    function pickOverloadIndex(overloads, activeParameter) {
        for (var i = 0; i < overloads.length; i++) {
            if (overloads[i].isVariadic || overloads[i].parameters.length > activeParameter) {
                return i;
            }
        }
        return Math.max(0, overloads.length - 1);
    }

    function normalizePosition(pos) {
        pos = pos || {};
        return {
            row: Math.max(0, Number(pos.row) || 0),
            column: Math.max(0, Number(pos.column) || 0)
        };
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function(ch) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[ch];
        });
    }

    function positionToIndex(session, pos) {
        if (session && session.doc && typeof session.doc.positionToIndex === "function") {
            return session.doc.positionToIndex(pos, 0);
        }
        var index = 0;
        for (var row = 0; row < pos.row; row++) {
            index += String(session.getLine(row) || "").length + 1;
        }
        return index + pos.column;
    }

    function textFromSession(session) {
        if (!session) {
            return "";
        }
        if (typeof session.getValue === "function") {
            return session.getValue();
        }
        var lines = [];
        var length = typeof session.getLength === "function" ? session.getLength() : 1;
        for (var row = 0; row < length; row++) {
            lines.push(session.getLine(row) || "");
        }
        return lines.join("\n");
    }

    function readCalleeBefore(text, openIndex) {
        var end = openIndex - 1;
        while (end >= 0 && /\s/.test(text.charAt(end))) {
            end--;
        }
        var start = end;
        while (start >= 0 && IDENTIFIER_CHAIN_REGEX.test(text.charAt(start))) {
            start--;
        }
        return text.substring(start + 1, end + 1).replace(/^\.+|\.+$/g, "");
    }

    function findOpenParen(text, offset) {
        var depth = 0;
        var quote = "";
        var escaped = false;
        for (var i = Math.max(0, offset - 1); i >= 0; i--) {
            var ch = text.charAt(i);
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
            if (ch === '"' || ch === "'" || ch === "`") {
                quote = ch;
                continue;
            }
            if (ch === ")") {
                depth++;
                continue;
            }
            if (ch === "(") {
                if (depth === 0) {
                    return i;
                }
                depth--;
            }
        }
        return -1;
    }

    function countActiveParameter(text, start, end) {
        var depth = 0;
        var quote = "";
        var escaped = false;
        var count = 0;
        for (var i = start; i < end; i++) {
            var ch = text.charAt(i);
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
            if (ch === '"' || ch === "'" || ch === "`") {
                quote = ch;
                continue;
            }
            if (ch === "(" || ch === "[" || ch === "{") {
                depth++;
                continue;
            }
            if (ch === ")" || ch === "]" || ch === "}") {
                depth = Math.max(0, depth - 1);
                continue;
            }
            if (ch === "," && depth === 0) {
                count++;
            }
        }
        return count;
    }

    function lastIdentifier(callee) {
        var match = /([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(callee || "");
        return match ? match[1] : "";
    }

    function findBuiltin(callee) {
        var exact = String(callee || "");
        var tail = lastIdentifier(exact);
        for (var i = 0; i < BUILTIN_SIGNATURES.length; i++) {
            var item = BUILTIN_SIGNATURES[i];
            for (var j = 0; j < item.aliases.length; j++) {
                if (item.aliases[j] === exact || item.aliases[j] === tail) {
                    return item;
                }
            }
        }
        return null;
    }

    function findSignatureHelpFromText(text, offset) {
        text = String(text || "");
        offset = Math.max(0, Math.min(Number(offset) || 0, text.length));
        var openIndex = findOpenParen(text, offset);
        if (openIndex < 0) {
            return null;
        }
        var callee = readCalleeBefore(text, openIndex);
        if (!callee) {
            return null;
        }
        var builtin = findBuiltin(callee);
        if (!builtin) {
            return null;
        }
        var activeParameter = Math.max(0, countActiveParameter(text, openIndex + 1, offset));
        var overloads = builtinOverloads(builtin);
        var activeSignature = pickOverloadIndex(overloads, activeParameter);
        var active = overloads[activeSignature];
        return {
            caption: builtin.name,
            callee: callee,
            signature: active.signature,
            parameters: active.parameters.slice(0),
            activeParameter: activeParameter,
            returnType: active.returnType,
            docText: active.docText,
            isVariadic: active.isVariadic,
            signatures: overloads,
            activeSignature: activeSignature
        };
    }

    function findSignatureHelp(session, pos) {
        pos = normalizePosition(pos);
        var text = textFromSession(session);
        var offset = positionToIndex(session, pos);
        return findSignatureHelpFromText(text, offset);
    }

    function isInsideCallArguments(session, pos) {
        if (!session) {
            return false;
        }
        pos = normalizePosition(pos);
        var text = textFromSession(session);
        var offset = Math.max(0, Math.min(positionToIndex(session, pos), text.length));
        return findOpenParen(text, offset) >= 0;
    }

    // Providers may return a single signature (static index, built-ins, Python, Lua) or the
    // TypeScript shape with every overload in `signatures`. Normalize both for the controller.
    function normalizeSignatureHelp(help) {
        if (!help) {
            return null;
        }
        var signatures = Array.isArray(help.signatures) && help.signatures.length ?
            help.signatures.slice(0) :
            [{
                caption: help.caption,
                signature: help.signature,
                parameters: Array.isArray(help.parameters) ? help.parameters.slice(0) : [],
                parameterDocs: Array.isArray(help.parameterDocs) ? help.parameterDocs.slice(0) : [],
                isVariadic: !!help.isVariadic,
                docText: help.docText || ""
            }];
        if (!signatures[0] || !signatures[0].signature) {
            return null;
        }
        var activeSignature = Number(help.activeSignature);
        if (!(activeSignature >= 0 && activeSignature < signatures.length)) {
            activeSignature = 0;
        }
        var spanStart = Number(help.applicableSpanStart);
        return {
            caption: help.caption || signatures[activeSignature].caption || "",
            callee: help.callee || "",
            signatures: signatures,
            activeSignature: activeSignature,
            activeParameter: Math.max(0, Number(help.activeParameter) || 0),
            key: spanStart >= 0 ? "span:" + spanStart : "callee:" + String(help.callee || help.caption || "")
        };
    }

    var AUTO_TRIGGERS = { cursor: true, typing: true, off: true };

    function normalizeAutoTrigger(mode) {
        mode = String(mode || "").toLowerCase();
        return AUTO_TRIGGERS[mode] ? mode : "cursor";
    }

    function createController(config) {
        config = config || {};
        var editor = config.editor || null;
        var session = config.session || (editor && editor.session) || null;
        var delayMs = Math.max(0, Number(config.delayMs) || DEFAULT_DELAY_MS);
        var autoTrigger = normalizeAutoTrigger(config.autoTrigger);
        var touchActive = false;
        var touchScrolled = false;
        var pending = false;
        var element = null;
        var headerElement = null;
        var captionElement = null;
        var navElement = null;
        var navCounterElement = null;
        var signatureElement = null;
        var summaryElement = null;
        var timer = null;
        var attached = false;
        var visible = false;
        var lastSignature = null;
        var lastHelp = null;
        var lastPosition = null;
        var selectedSignature = 0;
        var pinnedKey = null;
        var pinnedIndex = -1;
        var requestSerial = 0;

        function notify(message, error) {
            if (typeof config.notifyError === "function") {
                config.notifyError(String(message || "ACE signature help error"), error);
            }
        }

        function stopNavEvent(event) {
            if (event && typeof event.preventDefault === "function") {
                event.preventDefault();
            }
            if (event && typeof event.stopPropagation === "function") {
                event.stopPropagation();
            }
        }

        function createNavButton(label, delta) {
            var button = global.document.createElement("button");
            button.className = "autojs6_signature_tooltip_nav_button";
            button.textContent = label;
            if (typeof button.setAttribute === "function") {
                button.setAttribute("type", "button");
                button.setAttribute("tabindex", "-1");
            }
            if (typeof button.addEventListener === "function") {
                // Keep focus (and the soft keyboard) on the editor. preventDefault on touchend
                // also suppresses the synthetic click, so a tap cycles exactly once.
                button.addEventListener("mousedown", stopNavEvent);
                button.addEventListener("touchstart", stopNavEvent, { passive: false });
                button.addEventListener("touchend", function(event) {
                    stopNavEvent(event);
                    cycleSignature(delta);
                });
                button.addEventListener("click", function(event) {
                    stopNavEvent(event);
                    cycleSignature(delta);
                });
            }
            return button;
        }

        function createNavElement() {
            var nav = global.document.createElement("div");
            nav.className = "autojs6_signature_tooltip_nav";
            // Up = previous overload, down = next overload; shown only for 2+ signatures.
            nav.appendChild(createNavButton("▴", -1));
            navCounterElement = global.document.createElement("span");
            navCounterElement.className = "autojs6_signature_tooltip_nav_counter";
            nav.appendChild(navCounterElement);
            nav.appendChild(createNavButton("▾", 1));
            return nav;
        }

        function setNavVisible(shown, text) {
            if (!navElement) {
                return;
            }
            navElement.className = "autojs6_signature_tooltip_nav" +
                (shown ? " autojs6_signature_tooltip_nav_visible" : "");
            if (navCounterElement) {
                navCounterElement.textContent = shown ? String(text || "") : "";
            }
        }

        function ensureElement() {
            if (element) {
                return element;
            }
            element = global.document.createElement("div");
            element.className = "autojs6_signature_tooltip";
            element.style.display = "none";

            headerElement = global.document.createElement("div");
            headerElement.className = "autojs6_signature_tooltip_header";
            element.appendChild(headerElement);

            captionElement = global.document.createElement("div");
            captionElement.className = "autojs6_signature_tooltip_caption";
            headerElement.appendChild(captionElement);

            navElement = createNavElement();
            headerElement.appendChild(navElement);

            signatureElement = global.document.createElement("div");
            signatureElement.className = "autojs6_signature_tooltip_signature";
            element.appendChild(signatureElement);

            summaryElement = global.document.createElement("div");
            summaryElement.className = "autojs6_signature_tooltip_summary";
            element.appendChild(summaryElement);

            (global.document.body || editor.container).appendChild(element);
            return element;
        }

        function viewportSize() {
            var doc = global.document && global.document.documentElement || {};
            return {
                width: Math.max(Number(global.innerWidth) || 0, Number(doc.clientWidth) || 0, 320),
                height: Math.max(Number(global.innerHeight) || 0, Number(doc.clientHeight) || 0, 240)
            };
        }

        function pointFor(pos) {
            var renderer = editor && editor.renderer;
            var screen = renderer && renderer.textToScreenCoordinates ?
                renderer.textToScreenCoordinates(pos.row, pos.column) :
                null;
            return {
                x: screen ? (Number(screen.pageX) || 0) - (Number(global.pageXOffset) || 0) : EDGE_PADDING,
                y: screen ? (Number(screen.pageY) || 0) - (Number(global.pageYOffset) || 0) : EDGE_PADDING
            };
        }

        function clamp(value, min, max) {
            return Math.max(min, Math.min(value, max));
        }

        function isRectVisible(rect) {
            return !!(rect &&
                Number(rect.width) > 0 &&
                Number(rect.height) > 0 &&
                Number(rect.right) > Number(rect.left) &&
                Number(rect.bottom) > Number(rect.top));
        }

        function autocompletePopupRect() {
            var popup = editor && editor.completer && editor.completer.popup &&
                editor.completer.popup.container;
            if (!popup && global.document && typeof global.document.querySelector === "function") {
                popup = global.document.querySelector(".ace_autocomplete");
            }
            if (!popup || typeof popup.getBoundingClientRect !== "function") {
                return null;
            }
            var style = global.getComputedStyle ? global.getComputedStyle(popup) : null;
            if (style && (style.display === "none" || style.visibility === "hidden")) {
                return null;
            }
            var rect = popup.getBoundingClientRect();
            return isRectVisible(rect) ? rect : null;
        }

        function rectsOverlap(left, top, width, height, rect, gap) {
            gap = Number(gap) || 0;
            if (!rect) {
                return false;
            }
            return left < rect.right + gap &&
                left + width > rect.left - gap &&
                top < rect.bottom + gap &&
                top + height > rect.top - gap;
        }

        function setCompactFallback(box, enabled, maxHeight) {
            if (box.classList && typeof box.classList.toggle === "function") {
                box.classList.toggle("autojs6_signature_tooltip_compact", !!enabled);
            }
            box.style.maxHeight = enabled && maxHeight > 0 ? Math.round(maxHeight) + "px" : "";
        }

        function positionElement(pos) {
            var box = ensureElement();
            setCompactFallback(box, false, 0);
            var viewport = viewportSize();
            var point = pointFor(pos);
            var lineHeight = editor && editor.renderer && editor.renderer.lineHeight || 20;
            var width = box.offsetWidth || 360;
            var height = box.offsetHeight || 72;
            var left = clamp(point.x, EDGE_PADDING, viewport.width - width - EDGE_PADDING);
            var popup = autocompletePopupRect();
            var gap = 6;
            var candidates = [
                point.y + lineHeight + gap,
                point.y - height - gap
            ];
            if (popup) {
                candidates.push(popup.top - height - gap);
                candidates.push(popup.bottom + gap);
            }
            var top = null;
            for (var i = 0; i < candidates.length; i++) {
                var candidate = candidates[i];
                if (candidate < EDGE_PADDING || candidate + height > viewport.height - EDGE_PADDING) {
                    continue;
                }
                if (!rectsOverlap(left, candidate, width, height, popup, gap)) {
                    top = candidate;
                    break;
                }
            }
            if (top === null) {
                top = clamp(point.y + lineHeight + gap, EDGE_PADDING, viewport.height - height - EDGE_PADDING);
            }
            if (popup && rectsOverlap(left, top, width, height, popup, gap)) {
                var above = Math.max(0, popup.top - EDGE_PADDING - gap);
                var below = Math.max(0, viewport.height - popup.bottom - EDGE_PADDING - gap);
                var useAbove = above >= below;
                var available = Math.max(useAbove ? above : below, Math.min(height, 96));
                setCompactFallback(box, true, available);
                height = Math.min(box.offsetHeight || height, available);
                top = useAbove ? EDGE_PADDING : popup.bottom + gap;
                if (useAbove) {
                    top = Math.max(EDGE_PADDING, popup.top - gap - height);
                }
                top = clamp(top, EDGE_PADDING, viewport.height - height - EDGE_PADDING);
            }
            box.style.left = Math.round(left) + "px";
            box.style.top = Math.round(top) + "px";
            // The bridge moves the box off the cursor row (the fallbacks above can land on it) (manual test C11).
            if (typeof config.keepClear === "function") {
                config.keepClear(box);
            }
        }

        function activeParameterIndex(entry, activeParameter) {
            var count = entry && entry.parameters ? entry.parameters.length : 0;
            if (count === 0) {
                return -1;
            }
            if (activeParameter < count) {
                return activeParameter;
            }
            // Arguments beyond the declared list belong to a trailing rest parameter.
            var last = String(entry.parameters[count - 1] || "");
            return entry.isVariadic || last.indexOf("...") === 0 ? count - 1 : -1;
        }

        function renderSignature(entry, activeParameter) {
            var html = escapeHtml(entry.signature);
            var index = activeParameterIndex(entry, activeParameter);
            var parameter = index >= 0 ? entry.parameters[index] : null;
            if (parameter) {
                html = html.replace(
                    escapeHtml(parameter),
                    '<span class="autojs6_signature_tooltip_active">' + escapeHtml(parameter) + "</span>"
                );
            }
            return html;
        }

        function resolveSignatureHelp(pos, callback) {
            if (typeof config.getSignatureHelp === "function") {
                return config.getSignatureHelp(pos, callback);
            }
            return findSignatureHelp(session, pos);
        }

        function currentSignature() {
            if (!lastHelp) {
                return null;
            }
            return lastHelp.signatures[selectedSignature] || lastHelp.signatures[0] || null;
        }

        function render() {
            var entry = currentSignature();
            if (!entry) {
                hide();
                return false;
            }
            ensureElement();
            var active = lastHelp.activeParameter;
            var index = activeParameterIndex(entry, active);
            var parameterDoc = index >= 0 && entry.parameterDocs ? entry.parameterDocs[index] : "";
            captionElement.textContent = entry.caption || lastHelp.caption || "";
            signatureElement.innerHTML = renderSignature(entry, active);
            summaryElement.textContent = parameterDoc || entry.docText || "";
            var count = lastHelp.signatures.length;
            setNavVisible(count > 1, (selectedSignature + 1) + "/" + count);
            element.style.display = "block";
            visible = true;
            lastSignature = {
                caption: captionElement.textContent,
                signature: entry.signature,
                parameters: entry.parameters,
                activeParameter: active,
                docText: summaryElement.textContent
            };
            positionElement(lastPosition || normalizePosition(editor && editor.getCursorPosition && editor.getCursorPosition()));
            return true;
        }

        function cycleSignature(delta) {
            if (!visible || !lastHelp || lastHelp.signatures.length < 2) {
                return false;
            }
            var count = lastHelp.signatures.length;
            delta = Number(delta) || 1;
            selectedSignature = ((selectedSignature + delta) % count + count) % count;
            // Remember the manual choice for this call; it resets once the call changes.
            pinnedKey = lastHelp.key;
            pinnedIndex = selectedSignature;
            return render();
        }

        // `options.force` is reserved for the auto-policy gate (explicit triggers bypass it).
        function showAtPosition(pos, options) {
            try {
                pos = normalizePosition(pos || (editor && editor.getCursorPosition && editor.getCursorPosition()));
                var activeRequest = ++requestSerial;
                var callbackInvoked = false;
                pending = true;
                function finish(error, help) {
                    callbackInvoked = true;
                    if (arguments.length === 1) {
                        help = error;
                        error = null;
                    }
                    if (activeRequest !== requestSerial || !attached) {
                        return false;
                    }
                    pending = false;
                    var normalized = error ? null : normalizeSignatureHelp(help);
                    if (!normalized) {
                        hide();
                        return false;
                    }
                    if (normalized.key !== pinnedKey) {
                        pinnedKey = null;
                        pinnedIndex = -1;
                    }
                    selectedSignature = pinnedIndex >= 0 && pinnedIndex < normalized.signatures.length ?
                        pinnedIndex :
                        normalized.activeSignature;
                    lastHelp = normalized;
                    lastPosition = pos;
                    return render();
                }
                var returned = resolveSignatureHelp(pos, finish);
                if (returned && typeof returned.then === "function") {
                    returned.then(function(help) {
                        finish(null, help);
                    }, function(error) {
                        finish(error, null);
                    });
                } else if (!callbackInvoked && typeof returned !== "undefined") {
                    finish(null, returned);
                }
                return callbackInvoked && visible;
            } catch (error) {
                notify("ACE signature help failed: " + error, error);
                hide();
                return false;
            }
        }

        function schedule() {
            if (timer !== null) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
                timer = null;
                showAtPosition();
            }, delayMs);
        }

        function commandName(event) {
            return event && event.command && event.command.name || "";
        }

        function commandText(event) {
            var args = event && event.args;
            if (typeof args === "string") {
                return args;
            }
            if (args && typeof args.text === "string") {
                return args.text;
            }
            if (args && typeof args.value === "string") {
                return args.value;
            }
            return "";
        }

        function shouldScheduleAfterExec(event) {
            var name = commandName(event);
            if (name === "insertstring") {
                var text = commandText(event);
                return text === "(" || text === "," || text === ")" || text.indexOf("(") >= 0;
            }
            return name === "insertMatch" ||
                name === "backspace" ||
                name === "del" ||
                name === "remove" ||
                name === "paste";
        }

        function isTriggerCharacterExec(event) {
            if (commandName(event) !== "insertstring") {
                return false;
            }
            var text = commandText(event);
            return text === "(" || text === "," || text.indexOf("(") >= 0;
        }

        // Auto policy: "cursor" shows whenever the caret is inside a call, "typing" only after a
        // trigger character (the box still follows the caret while visible), "off" leaves
        // everything to explicit triggers (showAtPosition with force).
        function scheduleAuto(kind) {
            if (autoTrigger === "off") {
                return false;
            }
            if (autoTrigger === "typing" && kind !== "typing" && !visible) {
                return false;
            }
            schedule();
            return true;
        }

        function onCursorChange() {
            scheduleAuto("cursor");
        }

        function onAfterExec(event) {
            if (shouldScheduleAfterExec(event)) {
                scheduleAuto(isTriggerCharacterExec(event) ? "typing" : "cursor");
            }
        }

        function onScroll() {
            if (touchActive) {
                touchScrolled = true;
            }
            hide();
        }

        function setAutoTrigger(mode) {
            autoTrigger = normalizeAutoTrigger(mode);
            if (autoTrigger === "off") {
                hide();
            }
            return autoTrigger;
        }

        function getAutoTrigger() {
            return autoTrigger;
        }

        function hide() {
            requestSerial++;
            pending = false;
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
            if (element) {
                element.style.display = "none";
            }
            visible = false;
            lastSignature = null;
            lastHelp = null;
        }

        function isInsideTooltipEvent(event) {
            var target = event && event.target;
            return !!(element && target && (
                target === element ||
                (typeof element.contains === "function" && element.contains(target))
            ));
        }

        function hideFromEditorPointer(event) {
            if (isInsideTooltipEvent(event)) {
                return;
            }
            if (event && event.type === "touchstart") {
                touchActive = true;
                touchScrolled = false;
            }
            hide();
        }

        // A tap that did not scroll re-evaluates the caret (tapping the same spot produces no
        // changeCursor event); a scroll or fling leaves the box hidden.
        function onTouchEnd(event) {
            if (isInsideTooltipEvent(event)) {
                return;
            }
            var scrolled = touchScrolled;
            touchActive = false;
            touchScrolled = false;
            if (!scrolled) {
                scheduleAuto("cursor");
            }
        }

        function onTouchCancel() {
            touchActive = false;
            touchScrolled = false;
        }

        function attach() {
            if (attached || !editor || !editor.on) {
                return;
            }
            editor.selection.on("changeCursor", onCursorChange);
            editor.selection.on("changeSelection", onCursorChange);
            if (session && session.on) {
                session.on("change", onCursorChange);
                session.on("changeScrollTop", onScroll);
                session.on("changeScrollLeft", onScroll);
            }
            if (editor.commands && editor.commands.on) {
                editor.commands.on("afterExec", onAfterExec);
            }
            if (editor.container && editor.container.addEventListener) {
                editor.container.addEventListener("mousedown", hideFromEditorPointer);
                editor.container.addEventListener("touchstart", hideFromEditorPointer);
                editor.container.addEventListener("touchend", onTouchEnd);
                editor.container.addEventListener("touchcancel", onTouchCancel);
                editor.container.addEventListener("wheel", hideFromEditorPointer);
            }
            attached = true;
        }

        function detach() {
            hide();
            if (attached && editor && editor.selection) {
                editor.selection.off("changeCursor", onCursorChange);
                editor.selection.off("changeSelection", onCursorChange);
            }
            if (attached && session && session.off) {
                session.off("change", onCursorChange);
                session.off("changeScrollTop", onScroll);
                session.off("changeScrollLeft", onScroll);
            }
            if (attached && editor && editor.commands) {
                if (editor.commands.off) {
                    editor.commands.off("afterExec", onAfterExec);
                } else if (editor.commands.removeListener) {
                    editor.commands.removeListener("afterExec", onAfterExec);
                }
            }
            if (attached && editor && editor.container && editor.container.removeEventListener) {
                editor.container.removeEventListener("mousedown", hideFromEditorPointer);
                editor.container.removeEventListener("touchstart", hideFromEditorPointer);
                editor.container.removeEventListener("touchend", onTouchEnd);
                editor.container.removeEventListener("touchcancel", onTouchCancel);
                editor.container.removeEventListener("wheel", hideFromEditorPointer);
            }
            attached = false;
        }

        function destroy() {
            detach();
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            element = null;
            captionElement = null;
            signatureElement = null;
            summaryElement = null;
        }

        function getState() {
            return {
                attached: attached,
                visible: visible,
                domCreated: !!element,
                signature: lastSignature && lastSignature.signature || "",
                caption: lastSignature && lastSignature.caption || "",
                activeParameter: lastSignature ? lastSignature.activeParameter : -1,
                signatureCount: lastHelp ? lastHelp.signatures.length : 0,
                activeSignature: lastHelp ? selectedSignature : -1,
                pinnedSignature: pinnedIndex >= 0,
                autoTrigger: autoTrigger
            };
        }

        function isVisible() {
            return visible;
        }

        // True while an asynchronous provider (Python / Lua) has not answered yet.
        function isPending() {
            return pending;
        }

        function getSignatureCount() {
            return lastHelp ? lastHelp.signatures.length : 0;
        }

        attach();

        return {
            attach: attach,
            detach: detach,
            destroy: destroy,
            hide: hide,
            showAtPosition: showAtPosition,
            cycleSignature: cycleSignature,
            isVisible: isVisible,
            isPending: isPending,
            getSignatureCount: getSignatureCount,
            setAutoTrigger: setAutoTrigger,
            getAutoTrigger: getAutoTrigger,
            getState: getState
        };
    }

    global.AutoJsAceSignatureHelp = {
        builtins: BUILTIN_SIGNATURES,
        findSignatureHelpFromText: findSignatureHelpFromText,
        findSignatureHelp: findSignatureHelp,
        normalizeSignatureHelp: normalizeSignatureHelp,
        isInsideCallArguments: isInsideCallArguments,
        createController: createController,
        install: createController
    };
})(window);
