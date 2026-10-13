// Ace 1.44.0 manual test: switch the editor options that the host settings page does not show yet
// (the host settings are added at merge time, roadmap A7-2).
// Run this script, tick the options to enable, then close the file in the editor and open it again.
// The values are stored in the host preferences, the same place the future settings page will use.

var KEYS = [
    ["key_$_ace_touch_magnifier_enabled", "拖拽放大镜 (默认关)", false],
    ["key_$_ace_inline_completion_preview_enabled", "补全 ghost text 预览 (默认关)", false],
    ["key_$_ace_symbol_highlight_enabled", "同名符号高亮 (默认开)", true],
    ["key_$_ace_custom_scrollbar_enabled", "自定义滚动条 (默认开)", true],
    ["key_$_ace_svg_gutter_icons_enabled", "SVG 行号栏图标 (默认开)", true],
    ["key_$_ace_highlight_indent_guides_enabled", "缩进参考线高亮 (默认开)", true],
    ["key_$_ace_whitespaces_in_selection_enabled", "选区内显示空白符 (默认开)", true],
];

var prefs = context.getSharedPreferences(
    context.getPackageName() + "_preferences",
    android.content.Context.MODE_PRIVATE
);

function currentValues() {
    return KEYS.map(function (k) {
        return prefs.getBoolean(k[0], k[2]);
    });
}

function describe(values) {
    return KEYS.map(function (k, i) {
        return (values[i] ? "[开] " : "[关] ") + k[1];
    }).join("\n");
}

function contains(picked, index) {
    for (var j = 0; j < picked.length; j++) {
        if (Number(picked[j]) === index) {
            return true;
        }
    }
    return false;
}

var action = dialogs.select("Ace 1.44.0 手测开关\n\n" + describe(currentValues()), [
    "勾选要开启的项",
    "全部恢复默认值",
    "不修改, 退出",
]);

if (action === 0) {
    var initial = [];
    currentValues().forEach(function (on, i) {
        if (on) {
            initial.push(i);
        }
    });
    var picked = dialogs.multiChoice("勾选要开启的项 (未勾选即关闭)", KEYS.map(function (k) {
        return k[1];
    }), initial);
    if (picked != null) {
        var next = KEYS.map(function (k, i) {
            return contains(picked, i);
        });
        if (dialogs.confirm("保存以下设置?", describe(next))) {
            var editor = prefs.edit();
            KEYS.forEach(function (k, i) {
                editor.putBoolean(k[0], next[i]);
            });
            editor.commit();
            dialogs.alert("已保存", describe(currentValues()) + "\n\n请关闭编辑器中的文件后重新打开, 新设置才会生效.");
        }
    }
} else if (action === 1) {
    if (dialogs.confirm("恢复默认值?", "放大镜与 ghost text 关闭, 其余开启.")) {
        var reset = prefs.edit();
        KEYS.forEach(function (k) {
            reset.remove(k[0]);
        });
        reset.commit();
        dialogs.alert("已恢复默认值", describe(currentValues()) + "\n\n请关闭编辑器中的文件后重新打开, 新设置才会生效.");
    }
}
