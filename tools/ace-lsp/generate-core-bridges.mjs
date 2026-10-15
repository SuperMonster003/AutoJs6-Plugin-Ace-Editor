// These native types form the common script-facing return chains. Generate mergeable
// interfaces from the published native declarations instead of maintaining a second API list.
// Java/Android interop outside these roots still belongs to the optional declaration groups.
const ROOTS = [
    "org.autojs.autojs.core.accessibility.UiSelector",
    "org.autojs.autojs.core.accessibility.UiSelectorBuilders",
    "org.autojs.autojs.core.automator.UiObject",
    "org.autojs.autojs.core.automator.UiObjectCollection",
    "org.autojs.autojs.core.automator.UiObjectIterator",
    "org.autojs.autojs.runtime.api.Floaty.JsRawWindow",
    "org.autojs.autojs.runtime.api.Floaty.JsResizableWindow",
    "org.autojs.autojs.runtime.api.Media",
    "org.autojs.autojs.runtime.api.Files",
];

export function buildCoreRuntimeBridges(ts, sourceText) {
    const file = ts.createSourceFile("aj6-main-app.d.ts", sourceText, ts.ScriptTarget.Latest, true);
    const declarations = new Map();
    function visit(node, scope) {
        if (ts.isModuleDeclaration(node)) {
            const next = scope.concat(node.name.text);
            if (node.body) visit(node.body, next);
            return;
        }
        if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
            const name = scope.concat(node.name.text).join(".");
            if (ROOTS.includes(name)) {
                const entries = declarations.get(name) || [];
                entries.push(node);
                declarations.set(name, entries);
            }
        }
        ts.forEachChild(node, child => visit(child, scope));
    }
    visit(file, []);
    const normalize = text => text.replace(/\b__javaRoots\.([A-Za-z_$][\w$]*)Root\./g, "$1.");
    const sections = ["// Native script return types, generated from aj6-main-app.d.ts."];
    for (const name of ROOTS) {
        const nodes = declarations.get(name);
        if (!nodes?.length) throw new Error(`Core bridge source type missing: ${name}`);
        const parent = name.slice(0, name.lastIndexOf("."));
        const shortName = name.slice(name.lastIndexOf(".") + 1);
        const members = new Set();
        const parents = new Set();
        for (const node of nodes) {
            for (const clause of node.heritageClauses || []) {
                for (const base of clause.types) {
                    const baseName = normalize(base.getText(file));
                    if (ROOTS.includes(baseName)) parents.add(baseName);
                }
            }
            for (const member of node.members) {
                if (ts.isConstructorDeclaration(member) || member.name?.getText(file).includes("$")) continue;
                if (member.modifiers?.some(modifier => [ts.SyntaxKind.PrivateKeyword,
                    ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.StaticKeyword].includes(modifier.kind))) continue;
                const signature = normalize(member.getText(file)).replace(/\b(?:public|abstract|override)\s+/g, "");
                members.add(signature);
            }
        }
        sections.push(`declare namespace ${parent} {`,
            `    interface ${shortName}${parents.size ? ` extends ${[...parents].join(", ")}` : ""} {`,
            ...[...members].map(member => `        ${member}`), "    }", "}");
    }
    // The public aliases are ambient classes whose native constructor values are optional.
    // Merge the instance side explicitly so their members remain known without those values.
    for (const name of ["UiSelector", "UiObject", "UiObjectCollection", "UiObjectIterator"]) {
        const qualified = ROOTS.find(root => root.endsWith(`.${name}`));
        sections.push(`interface ${name} extends ${qualified} {}`);
    }
    sections.push("declare namespace Internal { interface Media extends org.autojs.autojs.runtime.api.Media {} }");
    sections.push("declare namespace Internal { interface Selector extends org.autojs.autojs.core.accessibility.UiSelector {} }");
    return sections.join("\n") + "\n";
}
