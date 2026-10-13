ace.define("ace/snippets/python", ["require", "exports", "module"], function(require, exports, module) {
    "use strict";

    // Python 3-oriented snippets maintained by the AutoJs6 Ace editor plugin.
    exports.snippetText = [
        "snippet imp",
        "\timport ${1:module}",
        "snippet from",
        "\tfrom ${1:package} import ${2:name}",
        "snippet def",
        "\tdef ${1:function_name}(${2:args}):",
        "\t\t${3:pass}",
        "snippet asyncdef",
        "\tasync def ${1:function_name}(${2:args}):",
        "\t\t${3:pass}",
        "snippet class",
        "\tclass ${1:ClassName}${2:}:",
        "\t\tdef __init__(self, ${3:args}):",
        "\t\t\t${4:pass}",
        "snippet dataclass",
        "\t@dataclass",
        "\tclass ${1:ClassName}:",
        "\t\t${2:field}: ${3:str}",
        "snippet for",
        "\tfor ${1:item} in ${2:items}:",
        "\t\t${3:pass}",
        "snippet while",
        "\twhile ${1:condition}:",
        "\t\t${2:pass}",
        "snippet if",
        "\tif ${1:condition}:",
        "\t\t${2:pass}",
        "snippet elif",
        "\telif ${1:condition}:",
        "\t\t${2:pass}",
        "snippet with",
        "\twith ${1:expression} as ${2:value}:",
        "\t\t${3:pass}",
        "snippet try",
        "\ttry:",
        "\t\t${1:pass}",
        "\texcept ${2:Exception} as ${3:error}:",
        "\t\t${4:raise}",
        "snippet tryf",
        "\ttry:",
        "\t\t${1:pass}",
        "\tfinally:",
        "\t\t${2:pass}",
        "snippet property",
        "\t@property",
        "\tdef ${1:name}(self) -> ${2:object}:",
        "\t\treturn ${3:self._value}",
        "snippet listcomp",
        "\t[${1:expression} for ${2:item} in ${3:items}]",
        "snippet match",
        "\tmatch ${1:value}:",
        "\t\tcase ${2:pattern}:",
        "\t\t\t${3:pass}",
        "snippet main",
        "\tif __name__ == \"__main__\":",
        "\t\t${1:main()}",
        "snippet test",
        "\tdef test_${1:behavior}():",
        "\t\t${2:assert True}"
    ].join("\n");
    exports.scope = "python";
});

(function() {
    ace.require(["ace/snippets/python"], function(snippetModule) {
        if (typeof module === "object" && typeof exports === "object" && module) {
            module.exports = snippetModule;
        }
    });
})();
