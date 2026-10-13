(function(global) {
    "use strict";

    // Runtime adjustments for the official Ace modes. The mode files stay byte-identical to the pinned
    // ace-builds release (Roadmap-Ace-1.44.0.md X-2), so behavior AutoJs6 relies on is restored on the loaded
    // mode instances instead.

    var PATCH_FLAG = "$autojs6ModePatched";
    var IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
    // "(?:non\-)?sealed" -> "non-sealed" and "sealed"
    var OPTIONAL_HYPHEN_PREFIX = /^\(\?:([A-Za-z_]+)\\-\)\?([A-Za-z_]+)$/;

    function splitTopLevelAlternatives(source) {
        var parts = [];
        var depth = 0;
        var start = 0;
        for (var index = 0; index < source.length; index++) {
            var ch = source.charAt(index);
            if (ch === "\\") {
                index++;
            } else if (ch === "(") {
                depth++;
            } else if (ch === ")") {
                depth--;
            } else if (ch === "|" && depth === 0) {
                parts.push(source.slice(start, index));
                start = index + 1;
            }
        }
        parts.push(source.slice(start));
        return parts;
    }

    // Collects the words of every `{ token: "keyword", regex: "(?:a|b|c)\\b" }` rule.
    function collectRuleKeywords(rules) {
        var words = [];
        var seen = Object.create(null);
        function add(word) {
            if (!seen[word]) {
                seen[word] = true;
                words.push(word);
            }
        }
        Object.keys(rules || {}).forEach(function(state) {
            var stateRules = rules[state];
            if (!Array.isArray(stateRules)) {
                return;
            }
            stateRules.forEach(function(rule) {
                if (!rule || rule.token !== "keyword" || typeof rule.regex !== "string") {
                    return;
                }
                var match = /^\(\?:(.+)\)\\b$/.exec(rule.regex);
                if (!match) {
                    return;
                }
                splitTopLevelAlternatives(match[1]).forEach(function(alternative) {
                    if (IDENTIFIER.test(alternative)) {
                        add(alternative);
                        return;
                    }
                    var optional = OPTIONAL_HYPHEN_PREFIX.exec(alternative);
                    if (optional) {
                        add(optional[1] + "-" + optional[2]);
                        add(optional[2]);
                    }
                });
            });
        });
        return words;
    }

    function highlightRulesOf(mode) {
        if (!mode.$highlightRules && typeof mode.getTokenizer === "function") {
            mode.getTokenizer();
        }
        var highlightRules = mode.$highlightRules;
        if (!highlightRules) {
            return null;
        }
        return typeof highlightRules.getRules === "function" ? highlightRules.getRules() : highlightRules.$rules;
    }

    function mergeKeywords(mode, words) {
        if (!words.length) {
            return 0;
        }
        var current = mode.$keywordList ||
            (typeof mode.$createKeywordList === "function" ? mode.$createKeywordList() : []) ||
            [];
        var merged = current.slice();
        var known = Object.create(null);
        merged.forEach(function(word) {
            known[word] = true;
        });
        var added = 0;
        words.forEach(function(word) {
            if (!known[word]) {
                known[word] = true;
                merged.push(word);
                added++;
            }
        });
        // A new array: the original list is shared with the highlight rules instance.
        mode.$keywordList = merged;
        return added;
    }

    var MODE_PATCHES = {
        // Ace 1.44.0 moved the Java keywords from createKeywordMapper to a dedicated regular expression rule,
        // so Mode.getCompletions (the keyword completer) no longer offered them.
        "ace/mode/java": function(mode) {
            return { addedKeywords: mergeKeywords(mode, collectRuleKeywords(highlightRulesOf(mode))) };
        }
    };

    function patchMode(mode) {
        if (!mode || mode[PATCH_FLAG] || !Object.prototype.hasOwnProperty.call(MODE_PATCHES, mode.$id)) {
            return null;
        }
        mode[PATCH_FLAG] = true;
        return MODE_PATCHES[mode.$id](mode);
    }

    function install(editor) {
        var session = editor && editor.getSession && editor.getSession();
        if (!session) {
            return false;
        }
        var apply = function() {
            patchMode(session.getMode());
        };
        session.on("changeMode", apply);
        apply();
        return true;
    }

    global.AutoJsAceModePatches = {
        install: install,
        patchMode: patchMode,
        collectRuleKeywords: collectRuleKeywords
    };
})(window);
