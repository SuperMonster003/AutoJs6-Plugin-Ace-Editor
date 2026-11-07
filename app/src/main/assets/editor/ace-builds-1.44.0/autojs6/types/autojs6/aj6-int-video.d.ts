// Type definitions for AutoJs6 internal module video
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 7, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/VideoModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/Video.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/VideoSubtitles.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/MediaRecordings.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/MediaStudioCalls.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/mediastudio/MediaStudioJsErrors.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/plugin/mediastudio/MediaStudioRecordingOptions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/record/RecordingOptions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/core/record/RecordingVideoSizes.kt
 * @Source %AutoJs6%/plugin-api/media-studio-api/src/main/java/org/autojs/plugin/mediastudio/api/MediaStudioErrorCodes.kt
 * @Source %AutoJs6%/plugin-api/media-studio-api/src/main/java/org/autojs/plugin/mediastudio/api/MediaStudioLimits.kt
 * @Source %AutoJs6%/docs/dev/media-studio-plugin-protocol.md
 * @Source %AutoJs6-Plugin-Three-Slate-Studio%/docs/development/media-studio-options.d.ts
 * @Source %AutoJs6-Plugin-Three-Slate-Studio%/app/src/main/java/io/github/supermonster003/autojs6/plugin/three/slate/studio/core/Timeline.kt
 */

declare namespace Internal {

    /**
     * The global `video` object (also `$video`), available since AutoJs6 6.8.1 (build 6641). `record` is AutoJs6's own
     * screen recording (H.264 MP4, no plugin needed); every other method hands the work to the external 3-Slate Studio
     * plugin (Media3 Transformer and the platform codecs). While the plugin is missing, disabled or too old those calls
     * throw a `MediaStudioError` whose `code` is `PLUGIN_UNAVAILABLE`, `PLUGIN_DISABLED` or `PLUGIN_INCOMPATIBLE`;
     * {@link isAvailable} probes without throwing. Rhino scripts only; Node.js and Bun reach the same calls through their
     * `video` / `host.video` facades.
     *
     * Processing methods block the calling thread until the plugin task ends and refuse the UI thread; each has an `Async`
     * form returning a Promise settled on the script thread, usable on the UI thread. After the required arguments a
     * string is the output path, `null` (or a left-out argument) the default output and an object the options, in either
     * order; a second string or a second object is `INVALID_OPTIONS`. `options.onProgress(progress)` reports the task.
     * Relative paths resolve against the working directory of the script. Stopping the script cancels its tasks.
     *
     * Default outputs (roadmap D14 / Q14): videos `/sdcard/Movies/3-Slate Studio/<source>-<operation>-<time>.mp4`, audio
     * `/sdcard/Music/3-Slate Studio/`, images and GIF `/sdcard/Pictures/3-Slate Studio/` (`frames` writes a folder of the
     * same name); the plugin registers the result in the media store. The plugin reads and writes paths directly, so it
     * needs the "All files access" permission (`STORAGE_PERMISSION_DENIED` otherwise; `frame` needs it too).
     *
     * Capabilities (project.json): processing, `tasks` and `cancelAll` need `media`; `record` needs `screen_capture`,
     * recording sound also `media` and `media.recording`; `isAvailable`, `version` and the recording handle need none.
     */
    interface Video {

        /** The error class shared by `video` and `audio`; `e instanceof video.MediaStudioError`. @since 6.8.1 */
        readonly MediaStudioError: MediaStudio.ErrorConstructor;

        /** Reading and writing SRT / ASS subtitle files. @since 6.8.1 */
        readonly subtitles: Video.Subtitles;

        /** Whether the 3-Slate Studio plugin is installed, enabled and compatible; never throws, any thread. @since 6.8.1 */
        isAvailable(): boolean;

        /** The plugin's package, version, contract version and the operations it runs. Not on the UI thread. @since 6.8.1 */
        version(): MediaStudio.VersionInfo;

        /** The plugin tasks of this script (`video` and `audio` share one table). Not on the UI thread. @since 6.8.1 */
        tasks(): MediaStudio.TaskInfo[];

        /** Cancels the unfinished tasks of this script and returns how many. @since 6.8.1 */
        cancelAll(): number;

        /**
         * Starts a screen recording (AutoJs6's own recorder, no plugin needed) and returns its handle once it runs. It needs
         * the screen capture session of `images.requestScreenCapture` (else `PERMISSION_DENIED`); while it runs,
         * `images.captureScreen` returns the current recorded frame. One screen recording per script (`LIMIT_EXCEEDED`).
         * Without a path the file goes to `/sdcard/Movies/AutoJs6/screen-<yyyyMMdd-HHmmss>.mp4`; an explicit path must be
         * absolute, end with `.mp4` and not exist. The file is written under a temporary name and moved in when saved, so a
         * cancelled or failed recording leaves no file. The end of the script stops and saves a running recording.
         * Not on the UI thread.
         * @since 6.8.1
         */
        record(path?: string | null, options?: Video.RecordOptions | null): Video.ScreenRecording;
        record(options: Video.RecordOptions | null, path?: string | null): Video.ScreenRecording;

        /** Media information of a file. @since 6.8.1 */
        probe(src: string): MediaStudio.MediaInfo;
        /** {@link probe} settled on the script thread. @since 6.8.1 */
        probeAsync(src: string): Promise<MediaStudio.MediaInfo>;

        /**
         * Cuts `[start, end)` (or `duration` from `start`) out of a video, re-encoding only where the cut needs it; give at
         * least one of `start`, `end` or `duration`.
         * @since 6.8.1
         */
        trim(src: string, options: Video.TrimOptions, output?: MediaStudio.Output): MediaStudio.Result;
        trim(src: string, output: MediaStudio.Output, options: Video.TrimOptions): MediaStudio.Result;
        /** {@link trim} settled on the script thread. @since 6.8.1 */
        trimAsync(src: string, options: Video.TrimOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        trimAsync(src: string, output: MediaStudio.Output, options: Video.TrimOptions): Promise<MediaStudio.Result>;

        /** Joins videos in order; sizes differing from the first (or `width` / `height`) are fitted by `fit`. @since 6.8.1 */
        concat(sources: string[], options?: Video.ConcatOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        concat(sources: string[], output: MediaStudio.Output, options?: Video.ConcatOptions | null): MediaStudio.Result;
        /** {@link concat} settled on the script thread. @since 6.8.1 */
        concatAsync(sources: string[], options?: Video.ConcatOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        concatAsync(sources: string[], output: MediaStudio.Output, options?: Video.ConcatOptions | null): Promise<MediaStudio.Result>;

        /** Changes the speed (`factor` 0.25 - 8), keeping the pitch by default. @since 6.8.1 */
        speed(src: string, options: Video.SpeedOptions, output?: MediaStudio.Output): MediaStudio.Result;
        speed(src: string, output: MediaStudio.Output, options: Video.SpeedOptions): MediaStudio.Result;
        /** {@link speed} settled on the script thread. @since 6.8.1 */
        speedAsync(src: string, options: Video.SpeedOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        speedAsync(src: string, output: MediaStudio.Output, options: Video.SpeedOptions): Promise<MediaStudio.Result>;

        /** Crops, rotates, flips and scales the picture (in that order); give at least one of size, scale, rotate, crop or flip. @since 6.8.1 */
        transform(src: string, options: Video.TransformOptions, output?: MediaStudio.Output): MediaStudio.Result;
        transform(src: string, output: MediaStudio.Output, options: Video.TransformOptions): MediaStudio.Result;
        /** {@link transform} settled on the script thread. @since 6.8.1 */
        transformAsync(src: string, options: Video.TransformOptions, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        transformAsync(src: string, output: MediaStudio.Output, options: Video.TransformOptions): Promise<MediaStudio.Result>;

        /** Draws text and image overlays (1 - 64) over a video, each for a time span. @since 6.8.1 */
        overlay(src: string, overlays: Video.Overlay[], output?: MediaStudio.Output, options?: Video.OverlayOptions | null): MediaStudio.Result;
        overlay(src: string, overlays: Video.Overlay[], options: Video.OverlayOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        /** {@link overlay} settled on the script thread. @since 6.8.1 */
        overlayAsync(src: string, overlays: Video.Overlay[], output?: MediaStudio.Output, options?: Video.OverlayOptions | null): Promise<MediaStudio.Result>;
        overlayAsync(src: string, overlays: Video.Overlay[], options: Video.OverlayOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;

        /**
         * Extracts frames as image files (at most 1000) and returns their paths; the output is a folder (default
         * `/sdcard/Pictures/3-Slate Studio/<source>-frames-<time>/`). Give one sampling: `at`, `times`, or a range with
         * `every` / `count` (and `start` / `end`).
         * @since 6.8.1
         */
        frames(src: string, options: Video.FramesOptions, outputDir?: MediaStudio.Output): string[];
        frames(src: string, outputDir: MediaStudio.Output, options: Video.FramesOptions): string[];
        /** {@link frames} settled on the script thread. @since 6.8.1 */
        framesAsync(src: string, options: Video.FramesOptions, outputDir?: MediaStudio.Output): Promise<string[]>;
        framesAsync(src: string, outputDir: MediaStudio.Output, options: Video.FramesOptions): Promise<string[]>;

        /**
         * One frame at `at` milliseconds as an image; takes no output path. The script recycles the image. The plugin
         * passes the frame through a hidden temporary file beside the default outputs, so it needs "All files access".
         * @since 6.8.1
         */
        frame(src: string, at: number, options?: Video.FrameOptions | null): ImageWrapper;
        /** {@link frame} settled on the script thread. @since 6.8.1 */
        frameAsync(src: string, at: number, options?: Video.FrameOptions | null): Promise<ImageWrapper>;

        /** One thumbnail image file (JPEG, 320 px wide by default) at `at` milliseconds, by default a third into the video. @since 6.8.1 */
        thumbnail(src: string, options?: Video.ThumbnailOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        thumbnail(src: string, output: MediaStudio.Output, options?: Video.ThumbnailOptions | null): MediaStudio.Result;
        /** {@link thumbnail} settled on the script thread. @since 6.8.1 */
        thumbnailAsync(src: string, options?: Video.ThumbnailOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        thumbnailAsync(src: string, output: MediaStudio.Output, options?: Video.ThumbnailOptions | null): Promise<MediaStudio.Result>;

        /** Converts a span of a video to an animated GIF (default 10 fps, at most 600 frames, else `LIMIT_EXCEEDED`). @since 6.8.1 */
        toGif(src: string, options?: Video.ToGifOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        toGif(src: string, output: MediaStudio.Output, options?: Video.ToGifOptions | null): MediaStudio.Result;
        /** {@link toGif} settled on the script thread. @since 6.8.1 */
        toGifAsync(src: string, options?: Video.ToGifOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        toGifAsync(src: string, output: MediaStudio.Output, options?: Video.ToGifOptions | null): Promise<MediaStudio.Result>;

        /** Writes the audio track of a video to an audio file (M4A by default). @since 6.8.1 */
        extractAudio(src: string, options?: Video.ExtractAudioOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        extractAudio(src: string, output: MediaStudio.Output, options?: Video.ExtractAudioOptions | null): MediaStudio.Result;
        /** {@link extractAudio} settled on the script thread. @since 6.8.1 */
        extractAudioAsync(src: string, options?: Video.ExtractAudioOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        extractAudioAsync(src: string, output: MediaStudio.Output, options?: Video.ExtractAudioOptions | null): Promise<MediaStudio.Result>;

        /** Copies a video without its audio track. @since 6.8.1 */
        removeAudio(src: string, output?: MediaStudio.Output, options?: Video.RemoveAudioOptions | null): MediaStudio.Result;
        removeAudio(src: string, options: Video.RemoveAudioOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        /** {@link removeAudio} settled on the script thread. @since 6.8.1 */
        removeAudioAsync(src: string, output?: MediaStudio.Output, options?: Video.RemoveAudioOptions | null): Promise<MediaStudio.Result>;
        removeAudioAsync(src: string, options: Video.RemoveAudioOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;

        /** Re-encodes a video (codec, size, bit rate, frame rate, audio track settings). @since 6.8.1 */
        transcode(src: string, options?: Video.TranscodeOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        transcode(src: string, output: MediaStudio.Output, options?: Video.TranscodeOptions | null): MediaStudio.Result;
        /** {@link transcode} settled on the script thread. @since 6.8.1 */
        transcodeAsync(src: string, options?: Video.TranscodeOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        transcodeAsync(src: string, output: MediaStudio.Output, options?: Video.TranscodeOptions | null): Promise<MediaStudio.Result>;

        /**
         * Renders a multi-track timeline (at most 8 video tracks and 16 audio tracks, 256 clips) with transitions,
         * overlays and subtitles into one video; the Studio timeline editor exports through the same call. When the device
         * runs out of codec instances (many video tracks with overlapping transitions decode two clips at once) the task
         * fails with `CODEC_ERROR` and a hint to use fewer tracks or overlapping transitions.
         * @since 6.8.1
         */
        compose(timeline: Video.Timeline, output?: MediaStudio.Output, options?: Video.ComposeOptions | null): MediaStudio.Result;
        compose(timeline: Video.Timeline, options: Video.ComposeOptions | null, output?: MediaStudio.Output): MediaStudio.Result;
        /** {@link compose} settled on the script thread. @since 6.8.1 */
        composeAsync(timeline: Video.Timeline, output?: MediaStudio.Output, options?: Video.ComposeOptions | null): Promise<MediaStudio.Result>;
        composeAsync(timeline: Video.Timeline, options: Video.ComposeOptions | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;

        /**
         * Burns subtitles into the picture. `subtitles` is an SRT / ASS file path or an array of cues (at most 10000).
         * SRT and cues default to white text with a black outline, the font size a 18th of the picture height; ASS keeps
         * its own styles (basic subset: unsupported tags are skipped with a warning), and keys given in `style` override
         * every style. `style` also takes `codec` / `bitRate` and `onProgress`.
         * @since 6.8.1
         */
        burnSubtitles(src: string, subtitles: string | MediaStudio.SubtitleCue[], style?: Video.BurnSubtitlesStyle | null, output?: MediaStudio.Output): MediaStudio.Result;
        burnSubtitles(src: string, subtitles: string | MediaStudio.SubtitleCue[], output: MediaStudio.Output, style?: Video.BurnSubtitlesStyle | null): MediaStudio.Result;
        /** {@link burnSubtitles} settled on the script thread. @since 6.8.1 */
        burnSubtitlesAsync(src: string, subtitles: string | MediaStudio.SubtitleCue[], style?: Video.BurnSubtitlesStyle | null, output?: MediaStudio.Output): Promise<MediaStudio.Result>;
        burnSubtitlesAsync(src: string, subtitles: string | MediaStudio.SubtitleCue[], output: MediaStudio.Output, style?: Video.BurnSubtitlesStyle | null): Promise<MediaStudio.Result>;
    }

    namespace Video {

        interface Subtitles {

            /**
             * Reads an SRT or ASS file into cues (plain text, markup removed); no limit on the number of cues.
             * @since 6.8.1
             */
            parse(path: string): MediaStudio.SubtitleCue[];
            /** {@link parse} settled on the script thread. @since 6.8.1 */
            parseAsync(path: string): Promise<MediaStudio.SubtitleCue[]>;

            /**
             * Writes cues (at most 10000) as SRT (CRLF, UTF-8) or ASS (1920x1080 with a Default style); the third argument is
             * the format or an options object, the extension decides when it is left out.
             * @since 6.8.1
             */
            write(path: string, cues: MediaStudio.SubtitleCue[], format?: MediaStudio.SubtitleFormat | Video.SubtitlesWriteOptions | null): MediaStudio.Result;
            /** {@link write} settled on the script thread. @since 6.8.1 */
            writeAsync(path: string, cues: MediaStudio.SubtitleCue[], format?: MediaStudio.SubtitleFormat | Video.SubtitlesWriteOptions | null): Promise<MediaStudio.Result>;
        }

        // ---------------------------------------------------------------- recording

        /** `"mic"` is short for `"microphone"`; `true` is the microphone, `false` / `null` / `"none"` no sound. */
        type RecordAudio = boolean | null | 'none' | MediaStudio.RecordSource | RecordAudioTrack;

        interface RecordAudioTrack {
            /** Default microphone. */
            source?: MediaStudio.RecordSource;
            /** Integer 8000 - 192000 Hz. Default 48000. */
            sampleRate?: number;
            /** Default 1 for the microphone, 2 for playback / mixed. */
            channels?: 1 | 2;
            /** Integer 16000 - 320000 bps. Default 128000 for the microphone, 192000 for playback / mixed. */
            bitRate?: number;
        }

        interface RecordOptions {
            /**
             * Integer 2 - 8192 px, even, given together with `height`. Default: the capture size fitted to the H.264
             * encoders of the device (aligned down, scaled down within their limits).
             */
            width?: number;
            /** Integer 2 - 8192 px, even, given together with `width`. */
            height?: number;
            /** Integer 1 - 120 fps. Default 30. */
            frameRate?: number;
            /** Integer bps. Default 8000000. */
            bitRate?: number;
            /**
             * The sound track: none (default), the microphone, `playback` (sound of other apps, Android 10+) or `mixed`;
             * AAC 48 kHz.
             */
            audio?: RecordAudio;
            /** Integer 0 - 86400000 ms; 0 (default) for no limit. */
            maxDuration?: number;
            /**
             * Runs once on the script thread when the recording ends, whichever way; the script stays alive until then.
             */
            onStop?: (this: void, info: MediaStudio.RecordStopInfo<ScreenRecordingResult>) => void;
        }

        interface ScreenRecording extends MediaStudio.Recording<ScreenRecordingResult, ScreenRecordingStatus> {
            /** The current frame of the recording; the script recycles the image. @since 6.8.1 */
            capture(): ImageWrapper;
        }

        interface ScreenRecordingStatus extends MediaStudio.RecordingStatusBase {
            readonly width: number;
            readonly height: number;
            readonly frameRate: number;
            readonly bitRate: number;
        }

        interface ScreenRecordingResult extends MediaStudio.RecordingResultBase {
            readonly width: number;
            readonly height: number;
            readonly frameRate: number;
            readonly bitRate: number;
            /** `video/mp4`. */
            readonly mime: string;
            readonly videoCodec: string;
            /** `null` without a sound track. */
            readonly audioCodec: string | null;
        }

        // ---------------------------------------------------------------- processing options

        interface TrimOptions extends MediaStudio.ProgressOptions {
            /** Integer 0 - 9007199254740992 ms. Default 0. */
            start?: number;
            /** Integer 1 - 9007199254740992 ms, after `start`. Excludes `duration`. Default: the end of the source. */
            end?: number;
            /** Integer 1 - 9007199254740992 ms. Excludes `end`. */
            duration?: number;
        }

        interface ConcatOptions extends MediaStudio.VideoEncodingOptions {
            /** Integer 16 - 8192 px. Default: the size of the first source. */
            width?: number;
            /** Integer 16 - 8192 px. */
            height?: number;
            /** How sources of another size fill the frame. Default contain. */
            fit?: MediaStudio.Fit;
        }

        interface SpeedOptions extends MediaStudio.VideoEncodingOptions {
            /** 0.25 - 8 x. */
            factor: number;
            /** Default true. */
            keepPitch?: boolean;
        }

        interface TransformOptions extends MediaStudio.VideoEncodingOptions {
            /** Integer 16 - 8192 px. Excludes `scale`. */
            width?: number;
            /** Integer 16 - 8192 px. Excludes `scale`. */
            height?: number;
            /** Greater than 0, at most 8 x. Excludes `width` / `height`. */
            scale?: number;
            /** Degrees clockwise, a multiple of 90. Default 0. */
            rotate?: number;
            /** In source display pixels, applied first. */
            crop?: TransformCrop | null;
            /** Default none. */
            flip?: MediaStudio.Flip;
            /** Default contain. */
            fit?: MediaStudio.Fit;
        }

        interface TransformCrop {
            /** Integer px. Default 0. */
            x?: number;
            /** Integer px. Default 0. */
            y?: number;
            /** Integer, at least 16 px. */
            width: number;
            /** Integer, at least 16 px. */
            height: number;
        }

        interface TranscodeOptions extends MediaStudio.VideoEncodingOptions {
            /** Integer 16 - 8192 px. */
            width?: number;
            /** Integer 16 - 8192 px. */
            height?: number;
            /** Default contain. */
            fit?: MediaStudio.Fit;
            /** 1 - 120 fps. */
            frameRate?: number;
            /** Settings of the audio track. */
            audio?: TranscodeAudio | null;
        }

        interface TranscodeAudio {
            /** Integer 8000 - 512000 bps. */
            bitRate?: number;
            sampleRate?: MediaStudio.SampleRate;
            channels?: 1 | 2;
        }

        interface ExtractAudioOptions extends MediaStudio.AudioOutputOptions {
            // Only the audio output keys.
        }

        /** `removeAudio` takes no option besides `onProgress`. */
        interface RemoveAudioOptions extends MediaStudio.ProgressOptions {
            // Only onProgress.
        }

        interface OverlayOptions extends MediaStudio.VideoEncodingOptions {
            // Only the encoding keys.
        }

        /** Where an overlay sits: `x` / `y` place its `anchor` point, in pixels or a percentage of the frame. */
        interface OverlayPlacement {
            /** Pixels -16384 - 16384 or a percentage "-1000%" - "1000%". Default "50%". */
            x?: number | string;
            /** Pixels -16384 - 16384 or a percentage "-1000%" - "1000%". Default "50%". */
            y?: number | string;
            /** Default center. */
            anchor?: MediaStudio.Anchor;
            /** Integer ms. Default 0. */
            from?: number;
            /** Integer ms, after `from`. Default: the end of the video. */
            to?: number;
            /** 0 - 1. Default 1. */
            alpha?: number;
        }

        interface TextOverlay extends MediaStudio.TextStyle, OverlayPlacement {
            type: 'text';
            /** 1 - 1000 characters; `\n` breaks lines. */
            text: string;
            /** Default 48 px. */
            fontSize?: number;
            /** Default "#FFFFFF". */
            color?: MediaStudio.Color;
            /** Default 4 px. */
            shadowRadius?: number;
            /** Default 2 px. */
            shadowDx?: number;
            /** Default 2 px. */
            shadowDy?: number;
            /** Alignment of the lines. Default center. */
            align?: 'left' | 'center' | 'right';
        }

        interface ImageOverlay extends OverlayPlacement {
            type: 'image';
            /** Absolute path of an image. */
            src: string;
            /** Greater than 0, at most 8. Excludes `width` / `height`. */
            scale?: number;
            /** Pixels or a percentage of the frame, greater than 0, at most 16384 px or "1000%". Excludes `scale`. */
            width?: number | string;
            /** Pixels or a percentage of the frame, greater than 0, at most 16384 px or "1000%". Excludes `scale`. */
            height?: number | string;
        }

        type Overlay = TextOverlay | ImageOverlay;

        interface FramesOptions extends ImageEncodingOptions {
            /** One frame at this time, ms. Excludes the other sampling keys. */
            at?: number;
            /** Up to 1000 times, ms. Excludes the other sampling keys. */
            times?: number[];
            /** A frame every this many ms (at least 1) from `start` to `end`. Excludes `at` / `times`. */
            every?: number;
            /** Integer 1 - 1000: with `every` the most frames to take, alone that many frames spread evenly over `start` - `end`. Excludes `at` / `times`. */
            count?: number;
            /** Start of the range of `every` / `count`, ms. Default 0. */
            start?: number;
            /** End of the range of `every` / `count`, ms (greater than `start`). Default: the end of the video. */
            end?: number;
            /** Default png. */
            format?: MediaStudio.ImageFormat;
        }

        interface FrameOptions extends ImageEncodingOptions {
            /** Default png. */
            format?: MediaStudio.ImageFormat;
        }

        interface ThumbnailOptions extends ImageEncodingOptions {
            /** ms. Default: a third of the duration. */
            at?: number;
            /** Default jpg. */
            format?: MediaStudio.ImageFormat;
            /** Integer 1 - 100. Default 85. Only with jpg / jpeg. */
            quality?: number;
            /** Integer 16 - 8192 px; the height follows the aspect ratio. Default 320 (never wider than the video). */
            width?: number;
        }

        interface ImageEncodingOptions extends MediaStudio.ProgressOptions {
            format?: MediaStudio.ImageFormat;
            /** Integer 1 - 100. Default 90. Only with jpg / jpeg. */
            quality?: number;
            /** Integer 16 - 8192 px; the height follows the aspect ratio. Default: the video width. */
            width?: number;
        }

        interface ToGifOptions extends MediaStudio.ProgressOptions {
            /** ms. Default 0. */
            start?: number;
            /** ms, greater than 0. Default: the end of the video. */
            end?: number;
            /** Integer 1 - 50 fps. Default 10. */
            fps?: number;
            /** Integer 16 - 8192 px. Default 480 (never wider than the video). */
            width?: number;
            /** `true` (default) loops forever, `false` plays once, an integer 0 - 65535 sets the loop count (0 forever). */
            loop?: boolean | number;
            /** Floyd-Steinberg dithering. Default false. */
            dither?: boolean;
        }

        interface ComposeOptions extends MediaStudio.VideoEncodingOptions {
            // Only the encoding keys.
        }

        interface BurnSubtitlesStyle extends MediaStudio.SubtitleStyle, MediaStudio.VideoEncodingOptions {
            // The subtitle style keys and the encoding keys.
        }

        interface SubtitlesWriteOptions extends MediaStudio.ProgressOptions {
            format: MediaStudio.SubtitleFormat;
        }

        // ---------------------------------------------------------------- timeline (roadmap appendix B.4, D33)

        /**
         * The timeline of {@link Video.compose}; times in milliseconds, unknown keys are `INVALID_OPTIONS` (the message
         * names the field path, e.g. `timeline.video[0].clips[1].transition.duration`). Track order is the z order
         * (`video[0]` at the bottom); overlays are drawn above the tracks and subtitles above the overlays. The output
         * lasts until the last clip ends.
         */
        interface Timeline {
            /** Integer 16 - 8192 px, made even. Default: the first video clip after its crop and rotation. */
            width?: number;
            /** Integer 16 - 8192 px, made even. With only one of width / height the other follows that clip. */
            height?: number;
            /** Integer 1 - 120 fps. Default 30. */
            frameRate?: number;
            /** Default black. */
            background?: MediaStudio.Color;
            /** At most 8 tracks, together holding at least one clip. */
            video?: TimelineVideoTrack[];
            /** At most 16 tracks. */
            audio?: TimelineAudioTrack[];
            /** Same as the overlays of {@link Video.overlay}; an empty array is no overlay. */
            overlays?: Overlay[];
            subtitles?: TimelineSubtitles | null;
        }

        interface TimelineVideoTrack {
            clips: TimelineVideoClip[];
        }

        interface TimelineAudioTrack {
            clips: TimelineAudioClip[];
        }

        interface TimelineClip {
            /** Absolute path of the media file. */
            src: string;
            /** Source time, integer ms. Default 0. */
            start?: number;
            /** Source time, integer ms, excluded. Default: the end of the source. */
            end?: number;
            /**
             * Timeline time, integer ms. Default: right after the previous clip of the track (with an overlapping
             * transition, its duration before that end; an explicit value must match it).
             */
            at?: number;
            /** Linear 0 - 16. Default 1. */
            volume?: number;
        }

        interface TimelineVideoClip extends TimelineClip {
            /** 0.25 - 8, keeping the pitch. Default 1. */
            speed?: number;
            transform?: TimelineTransform | null;
            /** The transition from the previous clip of the track into this one; the first clip has none. */
            transition?: TimelineTransition | null;
        }

        interface TimelineAudioClip extends TimelineClip {
            /** Integer ms. Default 0. */
            fadeIn?: number;
            /** Integer ms. Default 0. */
            fadeOut?: number;
        }

        interface TimelineTransform {
            /** Around the center after the fit, greater than 0, at most 8. Default 1. */
            scale?: number;
            /** Degrees clockwise, a multiple of 90. Default 0. */
            rotate?: number;
            crop?: TransformCrop | null;
            /** Default none. */
            flip?: MediaStudio.Flip;
            /** Default contain. */
            fit?: MediaStudio.Fit;
        }

        /**
         * `cut`; `fade` through black (half the duration on each side, the clips do not overlap); `dissolve`, `slide`,
         * `wipe`, `zoom` and `blur` overlap: the clip starts `duration` before the previous one ends. When the GPU cannot
         * run the shader transitions, `wipe` / `blur` fall back to `dissolve` and `fade` to `cut` (with a warning).
         */
        type TransitionType = 'cut' | 'fade' | 'dissolve' | 'slide' | 'wipe' | 'zoom' | 'blur';

        interface TimelineTransition {
            type: TransitionType;
            /** Integer 100 - 3000 ms, not longer than either clip. Default 500. */
            duration?: number;
            /** Only for slide and wipe; `left` brings the clip in from the right edge. Default left. */
            direction?: 'left' | 'right' | 'up' | 'down';
        }

        /** A subtitle file (`src`) or `cues`, exactly one, and an optional style (no encoding keys). */
        interface TimelineSubtitles {
            /** Absolute path of an SRT or ASS file. Excludes `cues`. */
            src?: string;
            /** At most 10000 cues. Excludes `src`. */
            cues?: MediaStudio.SubtitleCue[];
            style?: MediaStudio.SubtitleStyle | null;
        }
    }

    /** Types shared by the `video` and `audio` modules of 3-Slate Studio. */
    namespace MediaStudio {

        /** A path, or `null` (or a left-out argument) for the default output (roadmap D14). */
        type Output = string | null;

        type ErrorCode =
            | 'PLUGIN_UNAVAILABLE'
            | 'PLUGIN_DISABLED'
            | 'PLUGIN_INCOMPATIBLE'
            | 'INVALID_OPTIONS'
            | 'LIMIT_EXCEEDED'
            | 'TASK_LIMIT'
            | 'UNSUPPORTED_FORMAT'
            | 'CODEC_ERROR'
            | 'IO_ERROR'
            | 'STORAGE_PERMISSION_DENIED'
            | 'TASK_CANCELLED'
            | 'TASK_NOT_FOUND'
            | 'LIBRARY_MISSING'
            | 'PERMISSION_DENIED'
            | 'INTERNAL_ERROR';

        /**
         * Every failure of `video` / `audio` (host, recorder or plugin). `taskId` is the plugin task, `null` when the call
         * failed before a task started. `toString()` gives `MediaStudioError [CODE, task N]: message`. Errors thrown by
         * script callbacks (an `onProgress` that throws) arrive unchanged.
         */
        interface MediaStudioError extends Error {
            readonly name: 'MediaStudioError';
            readonly code: ErrorCode | string;
            readonly taskId: number | null;
            /** The underlying Java exception (not enumerable). */
            readonly javaException?: java.lang.Throwable;
        }

        interface ErrorConstructor {
            (message?: string, code?: ErrorCode | string, taskId?: number | null): MediaStudioError;
            new(message?: string, code?: ErrorCode | string, taskId?: number | null): MediaStudioError;
            readonly prototype: MediaStudioError;
        }

        /** `queued` / `probing` / `decoding` / `encoding` / `muxing` / `writing`. */
        type Stage = 'queued' | 'probing' | 'decoding' | 'encoding' | 'muxing' | 'writing' | string;

        interface Progress {
            /** 0 - 100, never decreasing. */
            readonly percent: number;
            readonly stage: Stage;
            /** Estimated remaining time in ms, -1 when unknown. */
            readonly etaMillis: number;
            readonly taskId: number;
        }

        interface ProgressOptions {
            /**
             * Task progress, at most every 200 ms; it runs on the calling thread for the synchronous form and on the
             * script thread for the `Async` form. When it throws, it receives no more progress and the call fails with
             * that error.
             */
            onProgress?: (this: void, progress: Progress) => void;
        }

        type VideoCodec = 'h264' | 'h265';

        interface VideoEncodingOptions extends ProgressOptions {
            /** Default h264; h265 needs an H.265 encoder on the device (else `UNSUPPORTED_FORMAT`). */
            codec?: VideoCodec;
            /** Integer 100000 - 200000000 bps. Default: estimated from the size and frame rate (1080p30 H.264 8 Mbps, H.265 0.6 of it). */
            bitRate?: number;
        }

        type AudioFormat = 'm4a' | 'wav' | 'flac' | 'ogg';

        /** The sample rates of the plugin; ogg (Opus) takes 8000, 12000, 16000, 24000 or 48000. */
        type SampleRate = 8000 | 11025 | 12000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;

        interface AudioOutputOptions extends ProgressOptions {
            /** m4a (AAC), wav (PCM 16), flac or ogg (Opus, Android 10+). Default: the output extension, else m4a. */
            format?: AudioFormat;
            /** Integer 8000 - 512000 bps. Not with flac / wav. */
            bitRate?: number;
            sampleRate?: SampleRate;
            channels?: 1 | 2;
        }

        type Fit = 'contain' | 'cover' | 'stretch';

        type Flip = 'none' | 'horizontal' | 'vertical' | 'both';

        type Anchor = 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';

        type ImageFormat = 'png' | 'jpg' | 'jpeg';

        /** `#RGB`, `#RRGGBB`, `#AARRGGBB`, a color name or an ARGB integer. */
        type Color = string | number;

        /** Text style keys of text overlays and subtitles. */
        interface TextStyle {
            /** `sans-serif` (default), `serif`, `monospace` or an absolute font file path. */
            font?: string;
            /** Greater than 0, at most 1000 px. */
            fontSize?: number;
            /** Default false. */
            bold?: boolean;
            /** Default false. */
            italic?: boolean;
            /** Default "#FFFFFF". */
            color?: Color;
            /** Outline color. */
            stroke?: Color;
            /** 0 - 100 px. */
            strokeWidth?: number;
            /** Shadow color. */
            shadow?: Color;
            /** 0 - 100 px. */
            shadowRadius?: number;
            /** -100 - 100 px. */
            shadowDx?: number;
            /** -100 - 100 px. */
            shadowDy?: number;
        }

        interface SubtitleStyle extends TextStyle {
            /** Default: a 18th of the picture height. */
            fontSize?: number;
            /** A box behind each line. */
            background?: Color;
            /** Anchor of the subtitle block. Default bottom. */
            align?: Anchor;
            /** Pixels 0 - 4096 or a percentage "0%" - "50%". Default "5%". */
            marginV?: number | string;
            /** Pixels 0 - 4096 or a percentage "0%" - "50%". Default "5%". */
            marginH?: number | string;
        }

        type SubtitleFormat = 'srt' | 'ass';

        interface SubtitleCue {
            /** Integer ms. */
            start: number;
            /** Integer ms, after `start`. */
            end: number;
            /** 1 - 1000 characters, not blank; may hold SRT markup (b, i, u, font color) when burnt in. */
            text: string;
        }

        /**
         * The result of a processing task (`taskId` is added by AutoJs6). Audio outputs carry `sampleRate` / `channels`,
         * video and image outputs `width` / `height`; `warnings` hold notes such as `OUTPUT_LARGE` (over 2 GB),
         * `DURATION_LONG` (over 60 minutes), encoder or transition fallbacks and the scaling of a mix.
         */
        interface Result {
            readonly path: string;
            readonly durationMillis?: number;
            readonly width?: number;
            readonly height?: number;
            readonly sizeBytes: number;
            readonly mime?: string;
            /** The codec of the main track, e.g. `h264`, `aac`. */
            readonly codec?: string;
            readonly sampleRate?: number;
            readonly channels?: number;
            readonly warnings: string[];
            readonly taskId: number;
        }

        interface TrackInfo {
            readonly mime: string;
            readonly codec: string;
            readonly width?: number;
            readonly height?: number;
            readonly sampleRate?: number;
            readonly channels?: number;
            readonly bitRate?: number;
            readonly language?: string;
            readonly frameRate?: number;
            readonly durationMillis?: number;
        }

        /** The result of `probe`: video keys only with a video track, audio keys only with an audio track. */
        interface MediaInfo {
            readonly path: string;
            readonly durationMillis: number;
            readonly sizeBytes: number;
            readonly mime?: string;
            readonly hasVideo: boolean;
            readonly hasAudio: boolean;
            /** The video codec, else the audio codec. */
            readonly codec?: string;
            readonly bitRate?: number;
            readonly width?: number;
            readonly height?: number;
            /** Degrees clockwise. */
            readonly rotation?: number;
            readonly frameRate?: number;
            readonly videoCodec?: string;
            readonly audioCodec?: string;
            readonly sampleRate?: number;
            readonly channels?: number;
            readonly language?: string;
            readonly tracks: TrackInfo[];
        }

        type TaskState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

        interface TaskInfo {
            readonly taskId: number;
            /** The contract operation, e.g. `trim`, `audioMix`. */
            readonly op: string;
            readonly state: TaskState;
            readonly percent: number;
            readonly stage: Stage;
            readonly output?: string;
            /** `script` or `studio`. */
            readonly origin: string;
            /** Epoch ms. */
            readonly submittedAt: number;
        }

        interface VersionInfo {
            readonly packageName: string;
            readonly versionName: string;
            readonly versionCode: number;
            readonly contractVersion: number;
            /** The operations the plugin runs. */
            readonly ops: string[];
        }

        /** `mic` is short for `microphone`; `playback` (sound of other apps) and `mixed` need Android 10+ and the screen capture consent. */
        type RecordSource = 'mic' | 'microphone' | 'playback' | 'mixed';

        interface AudioTrackInfo {
            readonly source: 'microphone' | 'playback' | 'mixed';
            readonly sampleRate: number;
            readonly channels: number;
            readonly bitRate: number;
        }

        type RecordingState = 'idle' | 'recording' | 'stopped' | 'cancelled' | 'failed';

        /**
         * `stopped` (stop() or the end of the script), `max-duration`, `max-size`, `notification-stop`, or for a failure
         * `recorder-error`.
         */
        type RecordingReason = 'stopped' | 'max-duration' | 'max-size' | 'notification-stop' | 'recorder-error' | string;

        interface RecordingStatusBase {
            readonly id: string;
            readonly state: RecordingState;
            readonly path: string;
            /** `null` without sound. */
            readonly audio: AudioTrackInfo | null;
            readonly elapsedMillis: number;
            /** 0 for no limit. */
            readonly maxDurationMillis: number;
            readonly error: string | null;
        }

        interface RecordingResultBase {
            readonly id: string;
            readonly path: string;
            readonly reason: RecordingReason;
            readonly sizeBytes: number;
            readonly durationMillis: number;
            readonly audio: AudioTrackInfo | null;
        }

        interface RecordingFailure {
            readonly id: string;
            readonly path: string;
            readonly reason: RecordingReason;
            readonly error: string | null;
        }

        /** The argument of `onStop`: the result, or `{id, path, reason, error}` when nothing was saved (`reason` is `"recorder-error"` for a failure). */
        type RecordStopInfo<R> = R | RecordingFailure;

        /** The handle of a running recording. */
        interface Recording<R, S> {
            readonly id: string;
            /** The target path (the file appears there when saved). */
            readonly path: string;
            /** Stops and saves the recording and returns the result. @since 6.8.1 */
            stop(): R;
            /** Stops without saving; whether a running recording was cancelled. @since 6.8.1 */
            cancel(): boolean;
            /** @since 6.8.1 */
            status(): S;
        }
    }
}
