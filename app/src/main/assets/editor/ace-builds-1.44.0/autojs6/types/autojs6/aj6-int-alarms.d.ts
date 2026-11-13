// Type definitions for AutoJs6 internal module alarms
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 13, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/Alarms.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsTimersModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsTimers.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsStopwatchModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsStopwatch.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsHolidaysModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsHolidays.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmDecisions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/alarm/AlarmBeforeRing.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsRingtonesModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsSystemModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsSystem.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmScriptOptions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmScriptValues.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmRepeatRules.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmSystemIntents.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/alarms/AlarmsJsErrors.kt
 * @Source %AutoJs6%/docs/dev/alarm-plugin-protocol-v1.md
 */

declare namespace Internal {

    /**
     * The global `alarms` object (also `$alarms`), available since AutoJs6 6.8.1 (build 6641) through the external
     * 3-Chime Alarm plugin (1.0.0 or later), Rhino scripts only. The plugin stores, schedules and rings the alarms, so
     * they ring while AutoJs6 is not running; scripts read and change every alarm, the ones the user created in the
     * plugin's screens included (the plugin shows who created and last changed each alarm). While the plugin is missing,
     * disabled or too old the calls throw an `AlarmError` whose `code` is `PLUGIN_UNAVAILABLE`, `PLUGIN_DISABLED` or
     * `PLUGIN_INCOMPATIBLE`; {@link isAvailable} probes without throwing. {@link system} needs no plugin; {@link timers}
     * and {@link stopwatch} need plugin 1.1.0 or later (`PLUGIN_INCOMPATIBLE` on 1.0.x); {@link holidays}, the
     * `holidays` alarm option and the `beforeRing` event need plugin 1.2.0 or later (`PLUGIN_INCOMPATIBLE` asking to
     * update to 1.2.0 on older plugins).
     *
     * Every call but `holidays.refreshAsync` is synchronous (15 seconds at most, 60 for a ringtone file import, 120 for a
     * holiday data refresh). Unknown option keys are refused by
     * name with `INVALID_OPTIONS`; weekday numbers are 0 (Sunday) to 6 (Saturday); relative paths resolve against the
     * script's working directory; times are epoch milliseconds, and a `Date` is accepted wherever a time is.
     */
    interface Alarms {

        /** The error class of the module; `e instanceof alarms.AlarmError`. @since 6.8.1 */
        readonly AlarmError: Alarms.ErrorConstructor;

        /** The system alarm ringtones and the ones imported into the plugin. @since 6.8.1 */
        readonly ringtones: Alarms.Ringtones;

        /** The system clock app through `AlarmClock` Intents; needs no plugin. @since 6.8.1 */
        readonly system: Alarms.System;

        /** The plugin's timers (plugin 1.1.0 or later). @since 6.8.1 */
        readonly timers: Alarms.Timers;

        /** The plugin's single stopwatch (plugin 1.1.0 or later). @since 6.8.1 */
        readonly stopwatch: Alarms.Stopwatch;

        /** The plugin's holiday data (plugin 1.2.0 or later). @since 6.8.1 */
        readonly holidays: Alarms.Holidays;

        /** Whether a compatible, enabled and authorized 3-Chime Alarm plugin answers; never throws. @since 6.8.1 */
        isAvailable(): boolean;

        /** Plugin and contract versions, features, the permissions the plugin holds and the contract limits. @since 6.8.1 */
        capabilities(): Alarms.Capabilities;

        /**
         * Opens a screen of the plugin (default the alarm list). Plugin 1.0.x has no timer or stopwatch screen and opens
         * the alarm list for `'timers'` and `'stopwatch'`; `UNSUPPORTED` when the plugin has no screen to open.
         * @since 6.8.1
         */
        openPlugin(page?: Alarms.PluginPage): void;

        /**
         * Creates an alarm (source `'script'`, a `change` event with action `'add'`). One of `time` and `at` is required.
         * Without `date`, the plugin fills it: today for a repeating alarm, the next day the time is reached for a
         * one-shot alarm. A local ringtone file in `sound.source` is imported into the plugin first.
         * `PERMISSION_REQUIRED` when the alarm would be enabled and the plugin has no exact alarm permission
         * (Android 12 - 12L); `LIMIT_EXCEEDED` beyond 300 alarms or 200 enabled ones.
         * @since 6.8.1
         */
        add(options: Alarms.AlarmOptions): Alarms.Alarm;

        /** The alarm, or `null` when the id is unknown. @since 6.8.1 */
        get(id: string): Alarms.Alarm | null;

        /** The alarms in creation order, optionally filtered. @since 6.8.1 */
        list(filter?: Alarms.AlarmFilter): Alarms.Alarm[];

        /**
         * Changes an alarm (`updatedBy` `'script'`): an absent key keeps its value, `null` clears an option back to the
         * plugin default, a partial group (`sound`, `speak`, `snooze`, `dismiss`, `holidays`) is merged with the stored
         * one. `time` drops a stored `at`; `at` drops `time` and `date` and needs `repeat: null` on a repeating alarm.
         * `NOT_FOUND` for an unknown id.
         * @since 6.8.1
         */
        update(id: string, patch: Alarms.AlarmPatch): Alarms.Alarm;

        /**
         * Removes an alarm (a `change` event with action `'remove'`); `false` when the id is unknown. Scripts bound to
         * its `change` event start once with that event, then its bindings are deleted.
         * @since 6.8.1
         */
        remove(id: string): boolean;

        /**
         * Enables or disables an alarm; unchanged state answers the snapshot without a `change`. Disabling ends a ringing,
         * waiting or snoozed round (`dismiss`, by `'script'`) and cancels a pending skip.
         * @since 6.8.1
         */
        setEnabled(id: string, enabled: boolean): Alarms.Alarm;

        /**
         * Skips the next ring of a repeating alarm (a `skip` event with reason `'skipNext'` at that time); disables a
         * one-shot alarm.
         * @since 6.8.1
         */
        skipNext(id: string): Alarms.Alarm;

        /** Undoes {@link skipNext} before the skipped time comes. @since 6.8.1 */
        cancelSkip(id: string): Alarms.Alarm;

        /**
         * The next `count` rings (1 - 100, default 1) of the enabled alarms in time order; skipped instances are left
         * out and a snoozed alarm is listed at the end of its snooze.
         * @since 6.8.1
         */
        upcoming(count?: number, filter?: Alarms.AlarmFilter): Alarms.Occurrence[];

        /**
         * The next `count` ring times (1 - 366, default 10) of `options` without storing an alarm, to check a rule.
         * @since 6.8.1
         */
        preview(options: Alarms.AlarmOptions, count?: number): number[];

        /** The sounding, then the waiting, then the snoozed alarms and timers (`kind`). @since 6.8.1 */
        ringing(): Alarms.Ringing[];

        /**
         * Dismisses the round of the alarm or timer `id`, or without `id` every sounding and waiting alarm or timer and
         * every snooze; whether anything was dismissed. A dismissed timer is deleted.
         * @since 6.8.1
         */
        dismiss(id?: string | null): boolean;

        /**
         * Snoozes the alarm or timer `id`, or without `id` (pass `null` to give `minutes`) every sounding and waiting one,
         * for `minutes` (1 - 60, default the alarm's `snooze.minutes`, for a timer the plugin's settings); `false` when
         * snoozing is off, `max` is reached, it already snoozes or the plugin cannot schedule exact alarms.
         * @since 6.8.1
         */
        snooze(id?: string | null, minutes?: number): boolean;

        /**
         * Listens to an event of any alarm or timer (`kind`). The first listener is registered with the plugin before the
         * call returns, so a missing plugin throws here. The listener runs on the script thread; the script keeps running
         * until the listener is removed or the script ends. Plugin 1.1.0 and earlier have no `beforeRing`
         * (`PLUGIN_INCOMPATIBLE`, update to 1.2.0); a `beforeRing` event has the `skip` / `ring` methods.
         * @since 6.8.1
         */
        on<E extends Alarms.EventName>(event: E, listener: (event: Alarms.EventOf<E>) => void): Alarms.Subscription;

        /** Like {@link on}, removed after the first call. @since 6.8.1 */
        once<E extends Alarms.EventName>(event: E, listener: (event: Alarms.EventOf<E>) => void): Alarms.Subscription;

        /** Removes every alarm listener of this script. @since 6.8.1 */
        off(): void;
        /** Removes the listeners of `event`. @since 6.8.1 */
        off(event: Alarms.EventName): void;
        /** Removes the listeners calling `listener`, whatever their event. @since 6.8.1 */
        off(listener: (event: any) => void): void;
        /** Removes the listeners of `event` calling `listener`. @since 6.8.1 */
        off(event: Alarms.EventName, listener: (event: any) => void): void;

        /**
         * The event a binding started this script with, or `null`; the same content as `engines.myEngine().execArgv.alarm`
         * (a plain object without methods). A `beforeRing` event also has the non-enumerable `skip` / `ring` methods.
         * Needs no plugin.
         * @since 6.8.1
         */
        currentEvent(): Alarms.AlarmEvent | null;

        /**
         * Binds a script to events of the alarm (default `['ring']`): AutoJs6 starts it when the event happens, even when
         * the script or AutoJs6 is not running. At most 5 scripts per alarm; binding a script again replaces its row;
         * `NOT_FOUND` when the plugin does not know the alarm. The file is not checked here (a missing file is skipped
         * when the event comes). Each (occurrence, event, script) starts once; nothing starts before the first unlock
         * after boot or while AutoJs6 is force-stopped. A timer id (`t_`, plugin 1.1.0 or later) takes only `ring`,
         * `snooze`, `dismiss` and `silence` and no `leadSeconds`; its bindings go when the timer is dismissed, silenced
         * or cancelled. `beforeRing` needs plugin 1.2.0 or later (`PLUGIN_INCOMPATIBLE`); the started script decides
         * through `alarms.currentEvent().skip()` / `.ring()`.
         * @since 6.8.1
         */
        bind(id: string, script: string, options?: Alarms.BindOptions): Alarms.Binding;

        /** Removes the binding of `script`, or every binding of the alarm; the count removed. Needs no plugin. @since 6.8.1 */
        unbind(id: string, script?: string): number;

        /** The bindings of the alarm, or all of them. Needs no plugin. @since 6.8.1 */
        bindings(id?: string): Alarms.Binding[];
    }

    namespace Alarms {

        type ErrorCode =
            | 'PLUGIN_UNAVAILABLE'
            | 'PLUGIN_DISABLED'
            | 'PLUGIN_INCOMPATIBLE'
            | 'PERMISSION_REQUIRED'
            | 'INVALID_OPTIONS'
            | 'INVALID_RULE'
            | 'NOT_FOUND'
            | 'LIMIT_EXCEEDED'
            | 'NO_HANDLER'
            | 'UNSUPPORTED'
            | 'IO_FAILED'
            | 'HOLIDAY_DATA_MISSING'
            | 'TIMEOUT'
            | 'SESSION_CLOSED'
            | 'INTERNAL';

        /**
         * `name` is `'AlarmError'`; `toString()` yields `AlarmError [CODE]: message`. `hint` says where a person fixes
         * it: the install wizard (`PLUGIN_UNAVAILABLE`, `PLUGIN_INCOMPATIBLE`), the Plugin Center (`PLUGIN_DISABLED`),
         * `alarms.openPlugin('permissions')` (`PERMISSION_REQUIRED`), `alarms.system.handlers()` (`NO_HANDLER`), else
         * `null`.
         */
        interface AlarmError extends Error {
            readonly name: 'AlarmError';
            readonly code: ErrorCode | string;
            readonly hint: string | null;
        }

        interface ErrorConstructor {
            (message?: string, code?: ErrorCode | string, hint?: string | null): AlarmError;
            new(message?: string, code?: ErrorCode | string, hint?: string | null): AlarmError;
            readonly prototype: AlarmError;
        }

        type PluginPage = 'alarms' | 'timers' | 'stopwatch' | 'permissions' | 'settings';

        /** Who created or changed an alarm: the plugin's screens, a script, a plugin tool, a system clock Intent. */
        type Source = 'user' | 'script' | 'tool' | 'intent';

        /** 0 Sunday ... 6 Saturday. */
        type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

        /** `'07:30'`, `'07:30:15'` or `{ hour, minute, second? }`. */
        type TimeOfDay = string | { hour: number; minute: number; second?: number };

        /** `'YYYY-MM-DD'`, a `Date` or epoch milliseconds (the day in the alarm's zone). */
        type DateLike = string | Date | number;

        /**
         * A repeat rule: an RRULE string (`'FREQ=MONTHLY;BYDAY=-1FR'`, an `RRULE:` prefix is allowed), weekday numbers
         * (`[1, 2, 3, 4, 5]`, i.e. `FREQ=WEEKLY;BYDAY=...`) or a structured rule. Read back as the canonical RRULE.
         * Not supported: `SECONDLY` / `MINUTELY` / `HOURLY`, `BYHOUR` / `BYMINUTE` / `BYSECOND`, and `DTSTART` /
         * `EXDATE` / `RDATE` / `EXRULE` inside the rule (`INVALID_RULE`); use `date` and `exclude` instead.
         */
        type Repeat = string | RepeatRule | Weekday[] | number[];

        interface RepeatRule {
            freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
            /** Every N periods, default 1. */
            interval?: number;
            /** The total count, exclusive with `until`. */
            count?: number;
            /** `'YYYY-MM-DD'` (a date), or a `Date` / epoch milliseconds (a UTC time). */
            until?: DateLike;
            /** 1 - 12. */
            byMonth?: number[];
            /** Only with `'yearly'`. */
            byWeekNo?: number[];
            /** Only with `'yearly'`. */
            byYearDay?: number[];
            /** 1 - 31, negative from the end of the month (-1 the last day). */
            byMonthDay?: number[];
            /** Weekday numbers 0 - 6, or RRULE days such as `'MO'`, `'2TU'` (second Tuesday), `'-1FR'` (last Friday). */
            byDay?: (number | string)[];
            bySetPos?: number[];
            /** 0 Sunday, 1 Monday (default). */
            weekStart?: 0 | 1;
        }

        interface SoundOptions {
            /**
             * `'default'` (the system default alarm ringtone), `'silent'`, a ringtone uri (see `ringtones.list()`), or a
             * local audio file path or `file://` uri that AutoJs6 imports into the plugin (at most 20 MiB, an audio track
             * is required). Left out: the default ringtone of the plugin's settings.
             */
            source?: string;
            /** Independent volume 0 - 1, restored afterwards; left out: the current alarm volume. */
            volume?: number;
            /** Fade-in seconds 0 - 300, default 0. */
            rampSeconds?: number;
        }

        /**
         * `'after'` (default): the ringtone plays 5 seconds, then speech with the ringtone lowered; `'before'`: speech
         * first, then the ringtone; `'interleave'`: ringtone and speech take turns; `'only'`: speech without ringtone.
         */
        type SpeakMode = 'before' | 'after' | 'interleave' | 'only';

        interface SpeakOptions {
            /** 1 - 500 characters, not blank. */
            text: string;
            /** A TTS engine package, such as 3-Macaw Speech's; left out: the system default engine. */
            engine?: string;
            /** A BCP 47 tag. */
            language?: string;
            rate?: number;
            pitch?: number;
            mode?: SpeakMode;
            /** Seconds between repetitions, 0 - 3600; 0 speaks once. */
            repeatInterval?: number;
        }

        interface SnoozeOptions {
            /** 1 - 60. */
            minutes?: number;
            /** Snoozes per round, 1 - 10. */
            max?: number;
        }

        /**
         * Needs the plugin feature `holidays` (plugin 1.2.0 or later, `PLUGIN_INCOMPATIBLE` before). A ring the filter
         * removes from the days it would ring on (a holiday among the days of the rule for `'skip'`, a holiday off the
         * weekend for `'workdays'`) sends a `skip` event with reason `'holiday'` and no `beforeRing`; days that would not
         * ring anyway (a non-holiday for `'only'`, a weekend for `'workdays'`) send no `skip`. `upcoming` and `preview`
         * count the filter. A year without any data rings by the weekday rules alone. Makeup workdays are only as accurate
         * as the upstream data.
         */
        interface HolidayFilter {
            /**
             * ISO 3166-1 alpha-2 with an optional subdivision of the data (`'CN'`, `'US-CA'`); default the plugin's
             * default region.
             */
            region?: string;
            /**
             * `'skip'` drops the holidays from the days of the rule, `'only'` keeps only them, `'workdays'` rings on every
             * workday (makeup workdays included) whatever the weekdays, with `repeat` omitted or a `daily` rule of
             * interval 1.
             */
            mode: 'skip' | 'only' | 'workdays';
        }

        /** Needs the plugin feature `challenges` (not in plugin 1.1.0 and earlier, `PLUGIN_INCOMPATIBLE`). */
        interface DismissOptions {
            challenge?: 'none' | 'math' | 'shake' | 'type' | 'script';
            math?: { difficulty?: number; count?: number };
            shake?: { count?: number };
            type?: { text?: string };
            script?: { fallback?: 'none' | 'math' | 'shake' | 'type' };
            allowSnooze?: boolean;
        }

        /**
         * The options of `add` and `preview`. `sound.source`, `vibrate`, `snooze` and `autoSilenceMinutes` left out take
         * the defaults of the plugin's settings when the alarm rings (factory: default ringtone, vibration, 10 minute
         * snoozes at most 3 times, silence after 10 minutes).
         */
        interface AlarmOptions {
            /** Exclusive with `at`. */
            time?: TimeOfDay;
            /** The day of a one-shot alarm or the first day of a rule. */
            date?: DateLike;
            /** The moment of a one-shot alarm; not with `time`, `date` or `repeat`. */
            at?: Date | number;
            repeat?: Repeat;
            /** Days without a ring, at most 366. */
            exclude?: DateLike[];
            /** An IANA zone id; `null` or left out follows the device. */
            timeZone?: string | null;
            holidays?: HolidayFilter | null;
            /** At most 100 characters. */
            label?: string;
            /** Default true. */
            enabled?: boolean;
            /** Free grouping text for scripts, at most 100 characters. */
            tag?: string;
            sound?: SoundOptions;
            /** `true`: the default pattern; an array: wait, vibrate, wait, ... milliseconds (1 - 64 entries); `false`: none. */
            vibrate?: boolean | number[];
            speak?: SpeakOptions;
            /** `false` forbids snoozing. */
            snooze?: boolean | SnoozeOptions;
            /** Minutes before an unanswered alarm stops (1 - 60), with a `silence` event. */
            autoSilenceMinutes?: number;
            dismiss?: DismissOptions | null;
        }

        /** A patch of `update`: an absent key keeps its value, `null` clears the option. */
        interface AlarmPatch {
            time?: TimeOfDay;
            date?: DateLike;
            at?: Date | number;
            repeat?: Repeat | null;
            exclude?: DateLike[] | null;
            timeZone?: string | null;
            holidays?: Partial<HolidayFilter> | null;
            label?: string | null;
            enabled?: boolean;
            tag?: string | null;
            sound?: { source?: string | null; volume?: number | null; rampSeconds?: number | null } | null;
            vibrate?: boolean | number[];
            speak?: Partial<SpeakOptions> | null;
            snooze?: boolean | SnoozeOptions | null;
            autoSilenceMinutes?: number | null;
            dismiss?: DismissOptions | null;
        }

        interface AlarmFilter {
            /** The creating source (not `updatedBy`); an array matches any of them. */
            source?: Source | Source[];
            tag?: string;
            enabled?: boolean;
            /** A string matches exactly, a RegExp is searched in the label. */
            label?: string | RegExp;
        }

        /**
         * A snapshot of an alarm at the time of the call. Every option key is present (`null` when not set); the methods
         * call the module function of the same name with the snapshot's `id` and answer a new snapshot.
         */
        interface Alarm {
            /** Starts with `a_`; kept across backup and restore. */
            readonly id: string;
            readonly label: string | null;
            /** `'HH:mm'`, or `'HH:mm:ss'` when the second is not 0; `null` for an `at` alarm. */
            readonly time: string | null;
            /** `'YYYY-MM-DD'`, also when the plugin filled it. */
            readonly date: string | null;
            readonly at: number | null;
            /** The canonical RRULE, `null` for a one-shot alarm. */
            readonly repeat: string | null;
            /** The rule in words, in the plugin's language. */
            readonly repeatText: string | null;
            readonly exclude: string[] | null;
            readonly timeZone: string | null;
            readonly holidays: HolidayFilter | null;
            readonly enabled: boolean;
            readonly tag: string | null;
            readonly sound: SoundOptions | null;
            /** The pattern array when there is one. */
            readonly vibrate: boolean | number[] | null;
            readonly speak: SpeakOptions | null;
            /** `false` when snoozing is forbidden. */
            readonly snooze: false | SnoozeOptions | null;
            readonly autoSilenceMinutes: number | null;
            readonly dismiss: DismissOptions | null;
            readonly source: Source;
            readonly updatedBy: Source;
            readonly createdAt: number;
            readonly updatedAt: number;
            /** The next ring (the end of a running snooze), skips and exclusions applied; `null` when disabled or done. */
            readonly nextTrigger: number | null;
            /** Whether the next ring is skipped. */
            readonly skipping: boolean;
            /** Whether a script of this AutoJs6 is bound to the alarm. */
            readonly hasBindings: boolean;

            update(patch: AlarmPatch): Alarm;
            remove(): boolean;
            enable(): Alarm;
            disable(): Alarm;
            skipNext(): Alarm;
            cancelSkip(): Alarm;
            bind(script: string, options?: BindOptions): Binding;
            unbind(script?: string): number;
        }

        interface Occurrence {
            readonly alarmId: string;
            readonly label: string | null;
            readonly at: number;
        }

        interface Ringing {
            readonly id: string;
            /** `'timer'` for a timer (plugin 1.1.0 or later). */
            readonly kind: 'alarm' | 'timer';
            readonly label: string | null;
            /** When the round started. */
            readonly since: number;
            readonly snoozed: boolean;
            readonly snoozeCount: number;
            readonly challenge: string | null;
        }

        interface Ringtone {
            /** Usable as `sound.source`. */
            readonly uri: string;
            readonly title: string;
            readonly source: 'system' | 'imported';
            /** Whether it is the system default alarm ringtone. */
            readonly default: boolean;
        }

        interface Ringtones {
            /** The system alarm ringtones, then the imported ones (at most 500). @since 6.8.1 */
            list(): Ringtone[];
            /** The system default alarm ringtone, or `null`. @since 6.8.1 */
            getDefault(): Ringtone | null;
        }

        /**
         * A duration: integer milliseconds (`90000`), or a string of whole hours, minutes and seconds such as `'25m'`,
         * `'1h30m'`, `'90s'` or `'1h 30m 15s'` (each unit at most once and in this order, any case, spaces allowed).
         * Decimals (`'1.5h'`), bare digits (`'90'`) and other units (`'1d'`) are `INVALID_OPTIONS`.
         */
        type Duration = number | string;

        /** `'ringing'` includes a snoozed timer. */
        type TimerState = 'running' | 'paused' | 'ringing';

        /**
         * `alarms.timers`: the plugin's timers, the ones its timer screen shows (plugin 1.1.0 or later, feature `timers`;
         * `PLUGIN_INCOMPATIBLE` on 1.0.x). At most 20 timers; a duration and the remaining time stay within 1 second -
         * 100 hours. A due timer rings like an alarm (`kind` `'timer'` ring / snooze / dismiss / silence events) and is
         * deleted once dismissed or silenced. A ringing or snoozed timer only takes dismiss, snooze and cancel: pause,
         * resume, addTime and reset throw `INVALID_OPTIONS`. Unknown ids: `get` answers `null`, `cancel` `false`, the
         * others throw `NOT_FOUND`.
         *
         * Timers count on the elapsed-time clock within one boot. After a reboot a running timer is restored from the
         * wall-clock end it recorded (the time switched off counts; the clock at boot may differ from the one before by a
         * few seconds, and network time does not correct it). Up to 5 minutes overdue it rings late with `scheduledAt` the
         * original end; more than 5 minutes overdue it leaves a missed timer notification and is deleted without an event.
         */
        interface Timers {
            /**
             * Starts a new timer at once. `LIMIT_EXCEEDED` with 20 timers; `PERMISSION_REQUIRED` without the exact alarm
             * permission (Android 12 - 12L). A local ringtone file is imported after the plugin is checked for timers.
             * @since 6.8.1
             */
            start(duration: Duration, options?: TimerOptions): Timer;
            /** The timer, or `null` when the id is unknown. @since 6.8.1 */
            get(id: string): Timer | null;
            /** Every timer in start order. @since 6.8.1 */
            list(): Timer[];
            /** Pauses a running timer, keeping the remaining time; a paused one is answered unchanged. @since 6.8.1 */
            pause(id: string): Timer;
            /**
             * Continues from the remaining time; a running one is answered unchanged. `PERMISSION_REQUIRED` without the
             * exact alarm permission (Android 12 - 12L).
             * @since 6.8.1
             */
            resume(id: string): Timer;
            /**
             * Adds `millis` (negative removes time, `'-1m'` works too) to the remaining time of a running or paused timer;
             * `durationMillis` stays. `INVALID_OPTIONS`, the timer unchanged, when the result leaves 1 second - 100 hours.
             * @since 6.8.1
             */
            addTime(id: string, millis: Duration): Timer;
            /** Sets the remaining time back to `durationMillis` and pauses; call `resume` to start again. @since 6.8.1 */
            reset(id: string): Timer;
            /**
             * Deletes the timer, ending a ringing or snoozed one first with a `dismiss` event (`by` `'script'`); its bindings
             * go afterwards. `false` when the id is unknown.
             * @since 6.8.1
             */
            cancel(id: string): boolean;
        }

        /**
         * The options of `timers.start`, written as in {@link AlarmOptions}; other keys are `INVALID_OPTIONS`. No snooze
         * option: snoozing uses the plugin's settings. `sound.source`, `vibrate` and `autoSilenceMinutes` left out take
         * the plugin's defaults when the timer rings.
         */
        interface TimerOptions {
            /** At most 100 characters. */
            label?: string;
            /** A local audio file is imported into the plugin. */
            sound?: SoundOptions;
            /** Not `null`. */
            vibrate?: boolean | number[];
            /** Needs `text`. */
            speak?: SpeakOptions;
            /** 1 - 60. */
            autoSilenceMinutes?: number;
        }

        /**
         * A snapshot of a timer at the time of the call. Every key is present (`null` when not set); the methods call the
         * module function of the same name with the snapshot's `id`.
         */
        interface Timer {
            /** Starts with `t_`. */
            readonly id: string;
            readonly label: string | null;
            /** The starting duration; `addTime` leaves it. */
            readonly durationMillis: number;
            /** At the time of the call; 0 while ringing. */
            readonly remainingMillis: number;
            readonly state: TimerState;
            /** When it is due; only while running. */
            readonly endsAt: number | null;
            readonly sound: SoundOptions | null;
            readonly vibrate: boolean | number[] | null;
            readonly speak: SpeakOptions | null;
            readonly autoSilenceMinutes: number | null;

            pause(): Timer;
            resume(): Timer;
            addTime(millis: Duration): Timer;
            reset(): Timer;
            cancel(): boolean;
            /** `alarms.bind(id, script, options)`; only `ring`, `snooze`, `dismiss` and `silence`. */
            bind(script: string, options?: BindOptions): Binding;
        }

        /**
         * `alarms.stopwatch`: the plugin's single stopwatch, the one its stopwatch screen shows (plugin 1.1.0 or later,
         * feature `stopwatch`; `PLUGIN_INCOMPATIBLE` on 1.0.x). It counts on the elapsed-time clock; after a reboot a
         * running stopwatch is paused with the time counted up to that boot (the plugin cannot know when the phone went
         * off, so it usually counts less than a minute too much).
         */
        interface Stopwatch {
            /** @since 6.8.1 */
            state(): StopwatchState;
            /** From 0 when idle, from the pause when paused; a running one is answered unchanged. @since 6.8.1 */
            start(): StopwatchState;
            /** A stopwatch that is not running is answered unchanged. @since 6.8.1 */
            pause(): StopwatchState;
            /** The same as `start`. @since 6.8.1 */
            resume(): StopwatchState;
            /**
             * Records a lap of the running stopwatch; `INVALID_OPTIONS` when not running, `LIMIT_EXCEEDED` after 100 laps.
             * @since 6.8.1
             */
            lap(): Lap;
            /** Stops, clears the time and the laps; back to `'idle'`. @since 6.8.1 */
            reset(): StopwatchState;
        }

        /** A plain object of the state at the time of the call. */
        interface StopwatchState {
            readonly state: 'idle' | 'running' | 'paused';
            readonly elapsedMillis: number;
            /** In recording order. */
            readonly laps: Lap[];
        }

        interface Lap {
            /** From 1. */
            readonly index: number;
            /** The time since the previous lap. */
            readonly lapMillis: number;
            /** The elapsed time when recorded. */
            readonly totalMillis: number;
        }

        /**
         * `alarms.holidays`: the holiday data of the plugin (plugin 1.2.0 or later, feature `holidays`;
         * `PLUGIN_INCOMPATIBLE` asking to update to 1.2.0 before), the data the `holidays` alarm option uses. A region is
         * an ISO 3166-1 alpha-2 code, case-insensitive, with an optional `-` and a subdivision code of the data kept as
         * written (`'CN'`, `'US-CA'`, `'AU-NSW Western'`); omitted or `null` means the plugin's default region. A date is
         * `'YYYY-MM-DD'`, a `Date` or a timestamp (its date in the device zone); omitted or `null` means today.
         * `INVALID_OPTIONS` for a malformed region or date, `HOLIDAY_DATA_MISSING` for a region or year without data.
         * Holidays and makeup workdays are only as accurate as the upstream data; for regions with makeup workdays the
         * years not announced yet are estimated from the rules (see `HolidayRegion.estimatedFrom`).
         */
        interface Holidays {
            /** The regions with holiday data. @since 6.8.1 */
            regions(): HolidayRegion[];
            /** Whether the date is a holiday of the region (a plain weekend or a makeup workday is not). @since 6.8.1 */
            isHoliday(date?: string | Date | number | null, region?: string | null): boolean;
            /**
             * Whether the date is a workday of the region: not on its weekend (from the data, it may differ by year or
             * subdivision) and not a holiday, or a makeup workday; the rule of the `'workdays'` holiday mode.
             * @since 6.8.1
             */
            isWorkday(date?: string | Date | number | null, region?: string | null): boolean;
            /** The holidays and makeup workdays of the year (1 - 9999); pass `null` for the default region. @since 6.8.1 */
            list(region: string | null, year: number): HolidayEntry[];
            /** The data the plugin uses, or `null` when it has none; no network access. @since 6.8.1 */
            info(): HolidayInfo | null;
            /**
             * Checks for and downloads a data update now, blocking for 120 seconds at most (`TIMEOUT`); `SESSION_CLOSED`
             * when the plugin process ends meanwhile.
             * @since 6.8.1
             */
            refresh(): HolidayInfo | null;
            /**
             * The Promise form of {@link refresh}; failures and argument errors reject with an `AlarmError`, the end of
             * the script cancels it.
             * @since 6.8.1
             */
            refreshAsync(): Promise<HolidayInfo | null>;
        }

        /** Other keys of the plugin pass through. */
        interface HolidayRegion {
            /** ISO 3166-1 alpha-2. */
            readonly code: string;
            readonly name: string;
            /** `[first, last]`, estimated years included. */
            readonly years: [number, number];
            readonly hasMakeupWorkdays: boolean;
            /** The data is estimated from this year on (only regions with makeup workdays). */
            readonly estimatedFrom?: number;
            /** Subdivisions with data of their own; `region` is the country code, `-` and `code` (`'US-CA'`). */
            readonly subdivisions?: { readonly code: string; readonly name: string }[];
            readonly [key: string]: unknown;
        }

        interface HolidayEntry {
            /** `'YYYY-MM-DD'`. */
            readonly date: string;
            /** In the device language when the data has it; may end with "(estimated)"; empty for a makeup workday. */
            readonly name: string;
            /** `'workday'` is a makeup workday. */
            readonly type: 'holiday' | 'workday';
        }

        /** Other keys of the plugin pass through. */
        interface HolidayInfo {
            readonly version: string;
            readonly source: string;
            /** When the data was generated. */
            readonly updatedAt: number;
            /** The regions with estimated years and those years `[first, last]`. */
            readonly estimated?: { readonly region: string; readonly years: [number, number] }[];
            readonly [key: string]: unknown;
        }

        type EventName = 'beforeRing' | 'ring' | 'snooze' | 'dismiss' | 'silence' | 'miss' | 'skip' | 'change';

        interface BindOptions {
            /** Default `['ring']`; not empty. A timer takes only `ring`, `snooze`, `dismiss` and `silence`. */
            events?: EventName | EventName[];
            /**
             * How long before the due time the plugin sends `beforeRing`, in seconds (15 - 300, default 60); only together
             * with `beforeRing` (plugin 1.2.0 or later). Several `beforeRing` bindings of one alarm take the smallest value
             * (an omitted one counts as 60) and get one `beforeRing` per ring; with live listeners only it is 60 seconds.
             */
            leadSeconds?: number;
        }

        interface Binding {
            readonly alarmId: string;
            /** The absolute script path. */
            readonly script: string;
            readonly events: EventName[];
            /** Only when `events` has `beforeRing`. */
            readonly leadSeconds?: number;
        }

        interface EventBase {
            readonly type: EventName;
            /** `'timer'` for a timer (plugin 1.1.0 or later): only ring, snooze, dismiss and silence, `alarmId` is the timer id. */
            readonly kind: 'alarm' | 'timer';
            readonly alarmId: string;
            readonly label: string | null;
            /** When this round was due (the end of the snooze after a snooze). */
            readonly scheduledAt: number;
            readonly firedAt: number;
            /** Names one ringing round (at most 128 characters); a ring after a snooze has a new one. */
            readonly occurrence: string;
        }

        /**
         * Needs the plugin feature `beforeRing` (plugin 1.2.0 or later). Sent before the due time (`BindOptions.leadSeconds`,
         * default 60 seconds) so that a script decides this ring before `deadline`. The listener argument and
         * `alarms.currentEvent()` have the non-enumerable `skip` / `ring` methods; `execArgv.alarm` has none. Arguments are
         * checked first; only the first decision of a script for an occurrence is sent (`true`), later ones and calls at or
         * after the deadline answer `false` and send nothing, as does a call that runs into the deadline; other failures
         * throw an `AlarmError` and may be retried. `true` only means the plugin received it: any `skip` wins, the `ring`
         * overrides are merged in arrival order. Without a decision in time (no script, a script error, AutoJs6 stopped)
         * the alarm rings as configured; AutoJs6 does not stop the script at the deadline.
         */
        interface BeforeRingEvent extends EventBase {
            readonly type: 'beforeRing';
            /** The cut-off for a decision; when the plugin gives none, the host takes `scheduledAt` minus 5 seconds. */
            readonly deadline: number;
            /**
             * Skips this ring (a `skip` event with reason `'script'` and this reason as `detail`); `reason` is trimmed, at
             * most 100 characters (`LIMIT_EXCEEDED`), none when empty.
             */
            skip(reason?: string): boolean;
            /**
             * Rings this time, with `label`, `sound`, `speak` and `vibrate` changed for this ring only (as the timer
             * options; a local sound file is imported first, within the deadline).
             */
            ring(overrides?: RingOverrides): boolean;
        }

        /** The overrides of `BeforeRingEvent.ring`; other keys are `INVALID_OPTIONS`. */
        type RingOverrides = Pick<TimerOptions, 'label' | 'sound' | 'speak' | 'vibrate'>;

        interface RingEvent extends EventBase {
            readonly type: 'ring';
            readonly snoozeCount: number;
        }

        interface SnoozeEvent extends EventBase {
            readonly type: 'snooze';
            readonly by: 'user' | 'script' | 'tool' | 'challenge';
            readonly minutes: number;
            readonly snoozeCount: number;
        }

        /** Also ends the round of an alarm removed or disabled while ringing, waiting or snoozed. */
        interface DismissEvent extends EventBase {
            readonly type: 'dismiss';
            /** A system clock Intent counts as `'user'`. */
            readonly by: 'user' | 'script' | 'tool' | 'challenge';
            readonly challenge: string | null;
        }

        interface SilenceEvent extends EventBase {
            readonly type: 'silence';
            readonly ringMillis: number;
        }

        /** The time passed beyond the 5 minute catch-up window: `'off'` after a reboot, `'late'` otherwise. */
        interface MissEvent extends EventBase {
            readonly type: 'miss';
            readonly reason: 'off' | 'late';
        }

        interface SkipEvent extends EventBase {
            readonly type: 'skip';
            /** Only `'skipNext'` in plugin 1.1.0 and earlier; `'holiday'` (the holiday filter) and `'script'` from 1.2.0. */
            readonly reason: 'skipNext' | 'holiday' | 'script';
            /** The reason a script gave to `skip` (reason `'script'`), absent when it gave none. */
            readonly detail?: string;
        }

        /** Any source; a call that changes nothing sends none. A `remove` carries the label the alarm had. */
        interface ChangeEvent extends Omit<EventBase, 'scheduledAt'> {
            readonly type: 'change';
            readonly action: 'add' | 'update' | 'remove';
            readonly source: Source;
        }

        /**
         * An alarm event: the argument of `alarms.on` listeners, `alarms.currentEvent()`, and the plain object a bound
         * script finds in `engines.myEngine().execArgv.alarm`.
         *
         * @example
         * let e = alarms.currentEvent(); // the same as engines.myEngine().execArgv.alarm
         * if (e !== null && e.type === 'dismiss') {
         *     toastLog(`${e.label} dismissed by ${e.by}`);
         * }
         */
        type AlarmEvent = BeforeRingEvent | RingEvent | SnoozeEvent | DismissEvent | SilenceEvent | MissEvent | SkipEvent | ChangeEvent;

        /** The event type of `name`. */
        type EventOf<E extends EventName> = Extract<AlarmEvent, { readonly type: E }>;

        interface Subscription {
            readonly event: EventName;
            /** Removes this listener; repeated calls do nothing. */
            off(): void;
        }

        interface Limits {
            readonly maxAlarms: number;
            readonly maxEnabledAlarms: number;
            readonly maxTimers: number;
            readonly minTimerMillis: number;
            readonly maxTimerMillis: number;
            readonly maxStopwatchLaps: number;
            readonly maxBindingsPerAlarm: number;
            readonly maxLabelChars: number;
            readonly maxTagChars: number;
            readonly maxSpeakTextChars: number;
            readonly maxRingtoneBytes: number;
            readonly maxPreviewCount: number;
            readonly maxUpcomingCount: number;
            readonly maxExcludeDates: number;
            readonly maxVibratePattern: number;
            readonly minAutoSilenceMinutes: number;
            readonly maxAutoSilenceMinutes: number;
            readonly minSnoozeMinutes: number;
            readonly maxSnoozeMinutes: number;
            readonly maxSnoozeCount: number;
            readonly maxRampSeconds: number;
            readonly minLeadSeconds: number;
            readonly maxLeadSeconds: number;
        }

        interface Capabilities {
            readonly pluginVersionName: string | null;
            readonly pluginVersionCode: number;
            readonly packageName: string;
            /** 1. */
            readonly contractVersion: number;
            /** `['alarms']` in plugin 1.0.x, `'timers'` and `'stopwatch'` added in 1.1.0, `'holidays'` and `'beforeRing'` in 1.2.0; later `challenges`. */
            readonly features: string[];
            /** What the plugin holds right now; only a missing exact alarm permission makes calls fail. */
            readonly permissions: { readonly exactAlarm: boolean; readonly notifications: boolean; readonly fullScreen: boolean };
            /** The same as the `version` of `alarms.holidays.info()`; `null` without the feature `holidays`. */
            readonly holidayDataVersion: string | null;
            /**
             * English sentences, empty when there is nothing to note. The default region and the holiday regions of the
             * enabled alarms are checked (a sentence appears once): a region that cannot be resolved (an unknown code, or
             * no data for the default region), whose alarms ring by the weekday rules only; a region whose data lacks the
             * current year (the covered years are named), whose alarms ring by the weekday rules only that year; a region
             * whose current or next year is estimated (the first estimated year is named), makeup workdays and adjusted
             * days off not announced yet.
             */
            readonly warnings: string[];
            readonly limits: Limits;
        }

        /**
         * `alarms.system`: the system clock app through `AlarmClock` Intents, without the plugin. `true` only means an app
         * took the Intent. Without `package` the system resolves the target (the default clock app or a chooser); with
         * it, that app's activity (`NO_HANDLER` when it has none). `UNSUPPORTED` below the API level of the action.
         * Clock apps differ (some ignore `skipUi`, `days` or `ringtone`, some only open their list on `dismissAlarm`).
         */
        interface System {
            /** `ACTION_SET_ALARM`; `skipUi` defaults to true. @since 6.8.1 */
            setAlarm(options: System.SetAlarmOptions): boolean;
            /** `ACTION_SET_TIMER`; `seconds` 1 - 86400, `skipUi` defaults to true. @since 6.8.1 */
            setTimer(options: System.SetTimerOptions): boolean;
            /** `ACTION_SHOW_ALARMS`. @since 6.8.1 */
            showAlarms(options?: System.PackageOptions): boolean;
            /** `ACTION_SHOW_TIMERS`, API 26+. @since 6.8.1 */
            showTimers(options?: System.PackageOptions): boolean;
            /** `ACTION_DISMISS_ALARM`, API 23+; `mode` defaults to `'next'`. @since 6.8.1 */
            dismissAlarm(options?: System.DismissAlarmOptions): boolean;
            /** `ACTION_SNOOZE_ALARM`, API 23+. @since 6.8.1 */
            snoozeAlarm(options?: System.SnoozeAlarmOptions): boolean;
            /** `ACTION_DISMISS_TIMER`, API 28+. @since 6.8.1 */
            dismissTimer(options?: System.PackageOptions): boolean;
            /**
             * `AlarmManager.getNextAlarmClock()`: the next alarm of any app, or `null`. Some devices report a stale entry
             * of another app that lies in the past.
             * @since 6.8.1
             */
            next(): System.NextAlarm | null;
            /** The packages that can take the Intent of `action` (default `'setAlarm'`). @since 6.8.1 */
            handlers(action?: System.Action): string[];
        }

        namespace System {

            type Action = 'setAlarm' | 'setTimer' | 'showAlarms' | 'showTimers' | 'dismissAlarm' | 'snoozeAlarm' | 'dismissTimer';

            interface PackageOptions {
                /** The clock app, such as `'com.google.android.deskclock'`. */
                package?: string;
            }

            interface SetAlarmOptions extends PackageOptions {
                /** 0 - 23. */
                hour: number;
                /** 0 - 59. */
                minute: number;
                label?: string;
                /** Repeat weekdays 0 (Sunday) - 6 (Saturday), not empty; left out: a one-time alarm. */
                days?: number[];
                vibrate?: boolean;
                /** `'silent'` or a ringtone uri. */
                ringtone?: string;
                /** Default true (Android defaults to false). */
                skipUi?: boolean;
            }

            interface SetTimerOptions extends PackageOptions {
                /** 1 - 86400. */
                seconds: number;
                label?: string;
                skipUi?: boolean;
            }

            interface DismissAlarmOptions extends PackageOptions {
                /** `'time'` needs `hour` and `minute`, `'label'` needs `label`. */
                mode?: 'next' | 'all' | 'time' | 'label';
                hour?: number;
                minute?: number;
                label?: string;
            }

            interface SnoozeAlarmOptions extends PackageOptions {
                /** 1 - 60. */
                minutes?: number;
            }

            interface NextAlarm {
                readonly triggerTime: number;
                readonly packageName: string | null;
            }
        }
    }
}
