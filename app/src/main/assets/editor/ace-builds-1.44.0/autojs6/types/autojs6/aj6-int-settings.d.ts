// Type definitions for AutoJs6 internal module settings
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Oct 22, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/augment/settings/Settings.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/augment/settings/SettingsScriptExport.kt
 */

declare namespace Internal {

    interface Settings {

        isEnabled(key: Settings.Key | string): boolean;

        setEnabled(key: Settings.Key | string, enabled: boolean): void;

        /**
         * Exports AutoJs6 settings to a settings archive (a zip file), the same file as the
         * "Export settings" wizard of "Manage AutoJs6 settings" writes, which that page imports.
         * Without `path` the archive goes to `backups/settings/` in the working directory of AutoJs6,
         * named `autojs6-settings-<yyyyMMdd-HHmmss>.zip` (`-1`, `-2` and so on are appended when the
         * name is taken); so does a `path` that ends with `/` or names an existing directory. Any
         * other `path` is the archive itself, replaced when it exists. Relative paths are resolved
         * as by `files.path`. Without `categories` the categories selected by default (see
         * `defaultSelected` of {@link categories}) are exported. Credentials are never exported:
         * requested with other categories, they are reported in `skipped` (`'sensitive'`), and so is
         * a data category without entries (`'empty'`). Since 6.8.1 a category `plugin:<package name>`
         * exports the settings of that official plugin, written after the settings and data categories;
         * plugins are only exported when requested. A plugin that declares sensitive settings is
         * reported in `skipped` (`'sensitive'`), and so is one that is not installed, not enabled, not
         * official, without settings transfer or failing to export, for example not answering within
         * 10 seconds (`'unavailable'`); the archive is written even when every requested plugin is left
         * out. Throws, writing nothing, on a bad `path`, an empty array or unknown id in `categories`
         * (a plugin category is `plugin:` followed by a package name), `categories` that only names
         * `'credentials'`, or a call on the UI thread; also throws when the archive exceeds 16 MB or
         * cannot be written.
         * @since 6.8.0
         * @example
         * let result = settings.export('./exports/', [ 'appearance', 'general', 'credentials' ]);
         * console.log(result.path);
         * result.skipped.forEach(s => console.log(`${s.id}: ${s.reason}`)); // "credentials: sensitive"
         * @example
         * // Appearance and every available plugin without sensitive settings (6.8.1).
         * let plugins = settings.categories().filter(c => c.kind === 'plugin' && c.available && !c.sensitive);
         * settings.export(null, [ 'appearance' ].concat(plugins.map(c => c.id)));
         */
        export(path?: string | null, categories?: Settings.CategoryId | Settings.PluginCategoryId | string | (Settings.CategoryId | Settings.PluginCategoryId | string)[] | null): Settings.ExportResult;

        /**
         * Every settings category in the order of the settings page, as the export wizard lists
         * them, with the number of entries that can be exported now. Since 6.8.1 one item per
         * discovered official plugin (installed, enabled and supporting settings transfer) follows,
         * sorted by package name; counting its entries calls the plugin, which may take up to 10
         * seconds each. Throws on the UI thread.
         * @since 6.8.0
         */
        categories(): Settings.Category[];

    }

    namespace Settings {

        type Key = 'stable_mode'
            | 'key_stable_mode'
            | 'enable_accessibility_service_by_root'
            | 'key_enable_accessibility_service_by_root'
            | 'key_enable_a11y_service_with_root_access'
            | 'stop_all_on_volume_up'
            | 'key_use_volume_control_running'
            | 'not_show_console'
            | 'key_dont_show_main_activity'
            | 'key_not_showing_main_activity'
            | 'foreground_service'
            | 'key_foreground_service';

        type CategoryId = 'appearance'
            | 'general'
            | 'explorer'
            | 'history'
            | 'editor_general'
            | 'editor_appearance'
            | 'editor_log'
            | 'editor_assistance'
            | 'editor_smart_hint'
            | 'editor_gestures'
            | 'editor_gutter'
            | 'editor_performance'
            | 'editor_keyboard'
            | 'timed_task'
            | 'a11y'
            | 'running'
            | 'record'
            | 'extensibility'
            | 'updates'
            | 'console'
            | 'connection'
            | 'layout_inspector'
            | 'floating'
            | 'developer'
            | 'plugin_center'
            | 'plugin_enable_state'
            | 'apk_build'
            | 'wizards'
            | 'data_shortcuts'
            | 'data_color_library'
            | 'credentials'
            | 'other';

        /**
         * The category of an official plugin, `plugin:` followed by its package name.
         * @since 6.8.1
         */
        type PluginCategoryId = `plugin:${string}`;

        /**
         * `'data'` for the shortcuts and the color libraries, `'plugin'` for official plugins (since
         * 6.8.1), `'settings'` for the others.
         */
        type CategoryKind = 'settings' | 'data' | 'plugin';

        /**
         * `'sensitive'`: credentials or a plugin that declares sensitive settings, never exported by
         * scripts; `'empty'`: a data category without entries; `'unavailable'`: a plugin that cannot
         * export its settings now (since 6.8.1).
         */
        type SkipReason = 'sensitive' | 'empty' | 'unavailable';

        /**
         * Why a plugin cannot export its settings: `'timeout'`, no answer within 10 seconds;
         * `'denied'`, the plugin refuses the call; `'busy'`, the plugin is busy, for example migrating
         * its own data; `'failed'`, any other failure.
         * @since 6.8.1
         */
        type PluginUnavailableReason = 'timeout' | 'denied' | 'busy' | 'failed';

        interface Category {
            /** The id that {@link Settings.export} takes; `plugin:<package name>` for a plugin. */
            id: CategoryId | PluginCategoryId;
            /** The name of the category, in the language of the app; the name of the plugin for a plugin. */
            title: string;
            kind: CategoryKind;
            /**
             * The name of the plugin, only for a plugin.
             * @since 6.8.1
             */
            label?: string;
            /** The number of entries that can be exported now (`0` for a plugin that is not available). */
            entries: number;
            /** Whether {@link Settings.export} exports the category when `categories` is omitted (never for a plugin). */
            defaultSelected: boolean;
            /** Whether the category is sensitive (credentials, or a plugin that declares sensitive settings); scripts cannot export it. */
            sensitive: boolean;
            /**
             * Whether the plugin can export its settings now, only for a plugin.
             * @since 6.8.1
             */
            available?: boolean;
            /**
             * Why the plugin cannot export its settings, only for a plugin that is not available.
             * @since 6.8.1
             */
            reason?: PluginUnavailableReason;
        }

        interface ExportResult {
            /** The absolute path of the archive written. */
            path: string;
            /** The categories written, in the order of the settings page, then the plugins by package name. */
            categories: (CategoryId | PluginCategoryId)[];
            /** The number of entries written. */
            entries: number;
            /** The number of setting values left out because the archive cannot hold them. */
            unexportable: number;
            /** The categories requested but not written, with the reason. */
            skipped: { id: CategoryId | PluginCategoryId; reason: SkipReason }[];
        }

    }

}
