#!/usr/bin/env node

// Manual test documents for Ace 1.44.0 (docs/development/ace-1.44.0-manual-tests.md, roadmap appendix B / C).
//
//   node tools/ace-mobile/manual/generate-fixtures.mjs [output directory]
//
// Writes the documents and the option switch script (00-toggles.js) to build/ace-mobile/manual by default.
// Push them to a device with:
//   adb -s <serial> shell mkdir -p /sdcard/Scripts/ace-1.44.0-manual
//   adb -s <serial> push build/ace-mobile/manual/. /sdcard/Scripts/ace-1.44.0-manual/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..");
const OUT = path.resolve(process.argv[2] || path.join(REPOSITORY_ROOT, "build", "ace-mobile", "manual"));

const WORDS = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron";

function write(name, text, newline = "\n") {
    const data = Buffer.from(text.replace(/\n/g, newline), "utf8");
    fs.writeFileSync(path.join(OUT, name), data);
    console.log(`${name} ${data.length} bytes`);
}

// One string literal per line; the number after "line" equals the file line number.
function touchLines(firstLine, count) {
    return Array.from({ length: count }, (_, i) => `    "line${firstLine + i} ${WORDS}",`);
}

function filler(lines, untilLength) {
    while (lines.length < untilLength) {
        const n = lines.length + 1;
        lines.push(`const filler${n} = formatItem("filler ${n}", ${n}) + counter;`);
    }
}

fs.mkdirSync(OUT, { recursive: true });

// 01: touch baseline, valid JavaScript (no gutter diagnostics), 223 lines.
{
    const head = [
        "// Ace 1.44.0 manual test: touch baseline (appendix B items 1-10, 12-17, 19, 20).",
        "// Every line is valid JavaScript, so the gutter has no diagnostics and a gutter tap only toggles a breakpoint.",
        "// The number after \"line\" is the file line number.",
        "\"use strict\";",
        "",
        "const lines = [",
    ];
    const tail = [
        "];",
        "",
        "function countWords(text) {",
        "    return text.split(\" \").length;",
        "}",
        "",
        "console.log(lines.map(countWords).join(\",\"));",
    ];
    write("01-touch.js", [...head, ...touchLines(head.length + 1, 210), ...tail].join("\n") + "\n");
}

// 02: visual features (A5-1 to A5-4, A5-8, A3-8), 249 lines with errors on lines 20, 130 and 245.
{
    const v = [
        "// Ace 1.44.0 manual test: visual features.",
        "// A5-1 gutter icons and breakpoints, A5-2 indent guides, A5-3 scrollbar markers,",
        "// A5-4 whitespace in selection, A5-8 symbol highlights, A3-8 tooltips.",
        "// Intentional errors are on lines 20, 130 and 245 (see the guide).",
        "\"use strict\";",
        "",
        "let counter = 0;",
        "const items = [\"one\", \"two\", \"three\"];",
        "",
        "function formatItem(item, index) {",
        "    counter += 1;",
        "    return index + \": \" + item + \" (\" + counter + \")\";",
        "}",
        "",
        "function render(list) {",
        "    return list.map(formatItem).join(\"\\n\");",
        "}",
        "",
        "// The next line is a syntax error (A5-1, A5-3).",
        "let = ;",
        "",
        "function nested(depth) {",
        "    if (depth > 0) {",
        "        for (let i = 0; i < depth; i++) {",
        "            while (counter < 10) {",
        "                if (i % 2 === 0) {",
        "                    counter += formatItem(\"nested\", i).length;",
        "                } else {",
        "                    counter -= 1;",
        "                }",
        "            }",
        "        }",
        "    }",
        "    return counter;",
        "}",
        "",
        "// Lines 38-41: tabs and runs of spaces (A5-4). Select them to see the whitespace marks.",
        "function whitespace() {",
        "\tconst tabbed = \"one\ttab\";",
        "\t\tconst twoTabs = \"two  spaces   three    four\";",
        "    return tabbed + twoTabs;    ",
        "}",
        "",
        "// Line 47 is a long line inside a nested block, for indent guides under word wrap (A5-2).",
        "function wrapped(value) {",
        "    if (value) {",
        "        return \"" + Array(60).fill("wrap").join(" ") + "\" + value + counter + formatItem(value, 0);",
        "    }",
        "    return render(items);",
        "}",
        "",
    ];
    filler(v, 129);
    v.push("const broken = (;");
    filler(v, 244);
    v.push(
        "if (counter > 0 {",
        "    console.log(render(items));",
        "}",
        "",
        "console.log(nested(3), whitespace(), wrapped(\"x\"), counter);",
    );
    write("02-visual.js", v.join("\n") + "\n");
}

// 03: symbol highlights and completion states in Python and Lua.
write("03-symbols.py", `# Ace 1.44.0 manual test: Python (A5-5 loading state, A5-8 symbol highlights).
import os


class Greeter:
    def __init__(self, name):
        self.name = name
        self.count = 0

    def greet(self, punctuation="!"):
        self.count += 1
        return "Hello, " + self.name + punctuation


def make_greeters(names) -> list[Greeter]:
    greeters: list[Greeter] = []
    for name in names:
        greeters.append(Greeter(name))
    greeters += [Greeter("Guest")]
    return greeters


greeters = make_greeters(["Ann", "Bob"])
for greeter in greeters:
    print(greeter.greet(), greeter.count, os.sep)

# Type below this line (see the guide, A5-5).

`);

write("03-symbols.lua", `-- Ace 1.44.0 manual test: Lua (A5-8 symbol highlights).
local counter = 0

local function increment(step)
    counter = counter + step
    return counter
end

local values = { 1, 2, 3 }
for _, value in ipairs(values) do
    increment(value)
end

print(counter, increment(1))
`);

// 04: long line safe mode (B18): line 6 has 120,000 characters, followed by the touch baseline.
{
    const longValue = (WORDS + " ").repeat(Math.floor(120000 / (WORDS.length + 1)) + 1).slice(0, 120000);
    const lines = [
        "// Ace 1.44.0 manual test: long line safe mode (appendix B item 18).",
        "// Line 6 has 120,000 characters, more than the 64 K safe mode threshold.",
        "// Lines 8 and below repeat the touch baseline.",
        "\"use strict\";",
        "",
        `const big = "${longValue}";`,
        "",
        "const lines = [",
    ];
    lines.push(...touchLines(lines.length + 1, 200), "];", "console.log(big.length, lines.length);");
    write("04-long-line.js", lines.join("\n") + "\n");
}

// 05: CRLF document (appendix C item 6).
write("05-crlf.js", `// Ace 1.44.0 manual test: CRLF line endings (appendix C item 6).
// This file uses CRLF. Paste multi-line text copied from 06-ime.js below, then save.
const first = 1;
const second = 2;

// Paste here:

`, "\r\n");

// 06: input methods (appendix C).
write("06-ime.js", `// Ace 1.44.0 manual test: input methods (appendix C).
// Type on the empty lines below. Lines 9-12 are for deleting across lines (C3).
// Lines 14-16 are the multi-line text to copy for C6.

// Type here (C1, C2, C7-C10):


// Delete from the end of line 12 back to the start of line 9 (C3):
const a = 1;
const b = 2;
const c = 3;
const d = a + b + c;

// first line to copy
// second line to copy
// third line to copy

// Member completion (C12): type "console." and continue with "lo"
`);

fs.copyFileSync(path.join(SCRIPT_DIR, "00-toggles.js"), path.join(OUT, "00-toggles.js"));
console.log("00-toggles.js copied");
