ace.define("ace/snippets/kotlin", ["require", "exports", "module"], function(require, exports, module) {
    "use strict";

    // Kotlin snippets maintained by the AutoJs6 Ace editor plugin.
    exports.snippetText = [
        "snippet fun",
        "\tfun ${1:name}(${2:args})${3:}: ${4:Unit} {",
        "\t\t${5:// body}",
        "\t}",
        "snippet sfun",
        "\tsuspend fun ${1:name}(${2:args})${3:}: ${4:Unit} {",
        "\t\t${5:// body}",
        "\t}",
        "snippet val",
        "\tval ${1:name}: ${2:Type} = ${3:value}",
        "snippet var",
        "\tvar ${1:name}: ${2:Type} = ${3:value}",
        "snippet class",
        "\tclass ${1:ClassName}(${2:args}) {",
        "\t\t${3:// body}",
        "\t}",
        "snippet data",
        "\tdata class ${1:ClassName}(",
        "\t\tval ${2:name}: ${3:Type}",
        "\t)",
        "snippet sealed",
        "\tsealed class ${1:Result} {",
        "\t\t${2:// subclasses}",
        "\t}",
        "snippet enum",
        "\tenum class ${1:Name} {",
        "\t\t${2:VALUE}",
        "\t}",
        "snippet object",
        "\tobject ${1:Name} {",
        "\t\t${2:// body}",
        "\t}",
        "snippet companion",
        "\tcompanion object {",
        "\t\t${1:// body}",
        "\t}",
        "snippet when",
        "\twhen (${1:value}) {",
        "\t\t${2:condition} -> ${3:result}",
        "\t\telse -> ${4:defaultResult}",
        "\t}",
        "snippet for",
        "\tfor (${1:item} in ${2:items}) {",
        "\t\t${3:// body}",
        "\t}",
        "snippet try",
        "\ttry {",
        "\t\t${1:// body}",
        "\t} catch (${2:error}: ${3:Exception}) {",
        "\t\t${4:// handle error}",
        "\t}",
        "snippet extfun",
        "\tfun ${1:Type}.${2:name}(${3:args})${4:}: ${5:Unit} {",
        "\t\t${6:// body}",
        "\t}",
        "snippet main",
        "\tfun main() {",
        "\t\t${1:// body}",
        "\t}"
    ].join("\n");
    exports.scope = "kotlin";
});

(function() {
    ace.require(["ace/snippets/kotlin"], function(snippetModule) {
        if (typeof module === "object" && typeof exports === "object" && module) {
            module.exports = snippetModule;
        }
    });
})();
