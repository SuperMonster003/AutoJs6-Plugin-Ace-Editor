// Type definitions for AutoJs6 internal module audio
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 7, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/AudioModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/Audio.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/MediaRecordings.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/MediaStudioCalls.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/mediastudio/MediaStudioRecordingOptions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/record/RecordingOptions.kt
 * @Source %AutoJs6%/docs/dev/media-studio-plugin-protocol.md
 * @Source %AutoJs6-Plugin-Three-Slate-Studio%/docs/development/media-studio-options.d.ts
 */

declare namespace Internal {

    /**
     * The global `audio` object (also `$audio`), available since AutoJs6 6.8.1 (build 6641). `record` is AutoJs6's own
     * sound recording (no plugin needed); every other method hands the work to the external 3-Slate Studio plugin. The
     * conventions are those of `video`: blocking methods refuse the UI thread and have `Async` forms, the output path and
     * the options follow the required arguments in either order, `options.onProgress` reports the task, `video` and
     * `audio` share one task table and `MediaStudioError`. Without an output path and `format` the result is M4A (AAC) in
     * `/sdcard/Music/3-Slate Studio/`.
     *
     * Capabilities (project.json): processing, `tasks` and `cancelAll` need `media`; `record` needs `media` and
     * `media.recording` (Android RECORD_AUDIO); `isAvailable`, `version` and the recording handle need none.
     */
    interface Audio {

        /** The error class shared by `video` and `audio` (`video.MediaStudioError === audio.MediaStudioError`). @since 6.8.1 */
        readonly MediaStudioError: MediaStudio.ErrorConstructor;

        /** Whether the 3-Slate Studio plugin is installed, enabled and compatible; never throws, any thread. @since 6.8.1 */
        isAvailable(): boolean;

        /** The plugin's package, version, contract version and the operations it runs. Not on the UI thread. @since 6.8.1 */
        version(): MediaStudio.VersionInfo;

        /** The plugin tasks of this script (`video` and `audio` share one table). Not on the UI thread. @since 6.8.1 */
        tasks(): MediaStudio.TaskInfo[];

        /** Cancels the unfinished tasks of this script and returns how many. @since 6.8.1 */
        cancelAll(): number;

        /**
         * Starts a sound recording (AutoJs6's own recorder, no plugin needed) and returns its handle once it runs:
         * `microphone` (default), `playback` (sound of other apps, Android 10+) or `mixed`; the last two need the screen
         * capture session of `images.requestScreenCapture` (else `PERMISSION_DENIED`). Without a path the file goes to
         * `/sdcard/Music/AutoJs6/audio-<yyyyMMdd-HHmmss>.<m4a|wav>`; an explicit path must be absolute, end with `.m4a` or
         * `.wav` and not exist (unless `overwrite`). The file is written under a temporary name and moved in when saved, so
         * a cancelled or failed recording leaves no file. The end of the script stops and saves a running recording.
         * Not on the UI thread.
         * @since 6.8.1
         */
        record(path?: string | null, options?: Audio.RecordOptions | null): Audio.AudioRecording;
        record(options: Audio.RecordOptions | null, path?: string | null): Audio.AudioRecording;

        /** Media information of a file with an audio track (else `UNSUPPORTED_FORMAT`). @since 6.8.1 */
        probe(src: string): MediaStudio.MediaInfo;
        /** {@link probe} settled on the script thread. @since 6.8.1 */
        probeAsync(src: string): Promise<MediaStudio.MediaInfo>;

        /** Cuts `[start, end)` (or `duration` from `start`) out of an audio or video file into an audio file; give at least one of the three. @since 6.8.1 */
        trim(src: string, options: Audio.TrimOptions, output?: MediaStudio.Output): MediaStudio.Result;
        trim(src: string, output: MediaStudio.Output, options: Audio.TrimOptions): MediaStudio.Result;
        /** {@link trim} settled on the script thread. @since 6.8.1 */
        trimAsync(src: string, options: Audio.TrimOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        trimAsync(src: string, output: MediaStudio.Output, options: Audio.TrimOptions): Promise<MediaStudio.Result>;

        /** Joins audio (or the audio of videos) in order. @since 6.8.1 */
        concat(sources: string[], output?: MediaStudio.Output, options?: Audio.ConcatOptions | null): MediaStudio.Result;
        concat(sources: string[], options: Audio.ConcatOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        /** {@link concat} settled on the script thread. @since 6.8.1 */
        concatAsync(sources: string[], output?: MediaStudio.Output, options?: Audio.ConcatOptions | null): Promise<MediaStudio.Result>;
        concatAsync(sources: string[], options: Audio.ConcatOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;

        /**
         * Mixes 2 - 16 inputs (paths or `{src, volume, at}`). Two passes: when the sum would clip, the whole mix is scaled
         * down to -1 dBFS and `warnings` report the peak and the scaling; otherwise the level stays as it is (never louder).
         * @since 6.8.1
         */
        mix(inputs: (string | Audio.MixInput)[], output?: MediaStudio.Output, options?: Audio.MixOptions | null): MediaStudio.Result;
        mix(inputs: (string | Audio.MixInput)[], options: Audio.MixOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        /** {@link mix} settled on the script thread. @since 6.8.1 */
        mixAsync(inputs: (string | Audio.MixInput)[], output?: MediaStudio.Output, options?: Audio.MixOptions | null): Promise<MediaStudio.Result>;
        mixAsync(inputs: (string | Audio.MixInput)[], options: Audio.MixOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;

        /** Changes the volume (`gain` or `normalize`) and fades in / out; give at least one of the four. @since 6.8.1 */
        volume(src: string, options: Audio.VolumeOptions, output?: MediaStudio.Output): MediaStudio.Result;
        volume(src: string, output: MediaStudio.Output, options: Audio.VolumeOptions): MediaStudio.Result;
        /** {@link volume} settled on the script thread. @since 6.8.1 */
        volumeAsync(src: string, options: Audio.VolumeOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        volumeAsync(src: string, output: MediaStudio.Output, options: Audio.VolumeOptions): Promise<MediaStudio.Result>;

        /**
         * Converts to m4a, wav, flac or ogg (MP3 comes with the FFmpeg library of plugin 1.1.0); `format` may be left out
         * when the output path ends with one of these extensions.
         * @since 6.8.1
         */
        convert(src: string, options: Audio.ConvertOptions, output?: MediaStudio.Output): MediaStudio.Result;
        convert(src: string, output: string, options?: Partial<Audio.ConvertOptions> | null): MediaStudio.Result;
        /** {@link convert} settled on the script thread. @since 6.8.1 */
        convertAsync(src: string, options: Audio.ConvertOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        convertAsync(src: string, output: string, options?: Partial<Audio.ConvertOptions> | null): Promise<MediaStudio.Result>;

        /** Changes the speed (`factor` 0.25 - 8), keeping the pitch by default. @since 6.8.1 */
        speed(src: string, options: Audio.SpeedOptions, output?: MediaStudio.Output): MediaStudio.Result;
        speed(src: string, output: MediaStudio.Output, options: Audio.SpeedOptions): MediaStudio.Result;
        /** {@link speed} settled on the script thread. @since 6.8.1 */
        speedAsync(src: string, options: Audio.SpeedOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        speedAsync(src: string, output: MediaStudio.Output, options: Audio.SpeedOptions): Promise<MediaStudio.Result>;
    }

    namespace Audio {

        // ---------------------------------------------------------------- recording

        interface RecordOptions {
            /** Default microphone. */
            source?: MediaStudio.RecordSource;
            /** Default: the extension of the path, else m4a. */
            format?: 'm4a' | 'wav';
            /** Integer 8000 - 192000 Hz. Default 48000. */
            sampleRate?: number;
            /** Default 1 for the microphone, 2 for playback / mixed. */
            channels?: 1 | 2;
            /** Integer 16000 - 320000 bps (m4a). Default 128000 for the microphone, 192000 for playback / mixed. */
            bitRate?: number;
            /** Integer 0 - 86400000 ms; 0 (default) for no limit. */
            maxDuration?: number;
            /** Replace an existing file at the path. Default false. */
            overwrite?: boolean;
            /**
             * Runs once on the script thread when the recording ends, whichever way; the script stays alive until then.
             */
            onStop?: (this: void, info: MediaStudio.RecordStopInfo<AudioRecordingResult>) => void;
        }

        interface AudioRecording extends MediaStudio.Recording<AudioRecordingResult, AudioRecordingStatus> {
            // stop, cancel and status.
        }

        interface AudioRecordingStatus extends MediaStudio.RecordingStatusBase {
            readonly format: 'm4a' | 'wav';
            /** The time recorded so far, ms. */
            readonly recordedMillis: number;
        }

        interface AudioRecordingResult extends MediaStudio.RecordingResultBase {
            readonly format: 'm4a' | 'wav';
            /** `audio/mp4` or `audio/wav`. */
            readonly mime: string;
            /** The wall time from start to stop, ms. */
            readonly elapsedMillis: number;
        }

        // ---------------------------------------------------------------- processing options

        interface TrimOptions extends MediaStudio.AudioOutputOptions {
            /** Integer 0 - 9007199254740992 ms. Default 0. */
            start?: number;
            /** Integer 1 - 9007199254740992 ms, after `start`. Excludes `duration`. Default: the end of the source. */
            end?: number;
            /** Integer 1 - 9007199254740992 ms. Excludes `end`. */
            duration?: number;
        }

        interface ConcatOptions extends MediaStudio.AudioOutputOptions {
            // Only the audio output keys.
        }

        interface MixInput {
            /** Path of an audio or video file. */
            src: string;
            /** Linear 0 - 16. Default 1. */
            volume?: number;
            /** Where the input starts in the mix, integer ms. Default 0. */
            at?: number;
        }

        interface MixOptions extends MediaStudio.AudioOutputOptions {
            // Only the audio output keys; the settings of each input go into `inputs`.
        }

        interface VolumeOptions extends MediaStudio.AudioOutputOptions {
            /** Linear 0 - 16 (0.5 is about -6 dB). Excludes `normalize`. */
            gain?: number;
            /** `true` (peak to -1 dBFS) or a target -60 - 0 dBFS. Excludes `gain`. */
            normalize?: boolean | number;
            /** Integer ms. Default 0. */
            fadeIn?: number;
            /** Integer ms. Default 0. */
            fadeOut?: number;
        }

        interface ConvertOptions extends MediaStudio.AudioOutputOptions {
            format: MediaStudio.AudioFormat;
        }

        interface SpeedOptions extends MediaStudio.AudioOutputOptions {
            /** 0.25 - 8 x. */
            factor: number;
            /** Default true. */
            keepPitch?: boolean;
        }
    }
}
