/**
 * Rhino's video module for Node main threads and Workers: screen recording by AutoJs6 and media processing by the external
 * 3-Slate Studio plugin. Every member returns a Promise. Arguments, options, results, error codes and the capabilities a
 * call declares are those of Rhino's video; after the required arguments a string is the output path, null the default
 * output and an object the options (a second string or a second object is INVALID_OPTIONS). Relative paths resolve
 * against the script's working directory. `video` and `audio` share one task table and `MediaStudioError`.
 *
 * Capabilities (project.json): processing, `tasks` and `cancelAll` need `media`; `record` needs `screen_capture` (after
 * `images.requestScreenCapture` in the same execution), recording sound also `media` and `media.recording`;
 * `isAvailable`, `version` and the recording handle need none.
 */
declare module "video" {
  namespace video {
    interface API {
        readonly MediaStudioError: MediaStudioErrorConstructor;
        /** Whether the 3-Slate Studio plugin is installed, enabled and compatible. */
        isAvailable(): Promise<boolean>;
        /** The plugin's version, contract version and the operations it runs. */
        version(): Promise<VersionInfo>;
        /** The running tasks of this script (video and audio). */
        tasks(): Promise<TaskInfo[]>;
        /** Cancels every running task of this script and answers how many. */
        cancelAll(): Promise<number>;
        /**
         * Starts a screen recording (by AutoJs6, no plugin needed) and answers its handle; the execution end saves a
         * recording that is still running. Without a path the file goes to `Movies/AutoJs6/screen-<yyyyMMdd-HHmmss>.mp4`.
         */
        record(path?: string | null, options?: RecordOptions | null): Promise<ScreenRecording>;
        record(options?: RecordOptions | null): Promise<ScreenRecording>;

        probe(src: string): Promise<MediaInfo>;
        probeAsync(src: string): Promise<MediaInfo>;
        trim(src: string, options: TrimOptions, output?: Output): Promise<ProcessResult>;
        trimAsync(src: string, options: TrimOptions, output?: Output): Promise<ProcessResult>;
        concat(sources: string[], options?: ConcatOptions | null, output?: Output): Promise<ProcessResult>;
        concat(sources: string[], output?: Output, options?: ConcatOptions | null): Promise<ProcessResult>;
        concatAsync(sources: string[], options?: ConcatOptions | null, output?: Output): Promise<ProcessResult>;
        concatAsync(sources: string[], output?: Output, options?: ConcatOptions | null): Promise<ProcessResult>;
        /** factor 0.25 - 8. */
        speed(src: string, options: SpeedOptions, output?: Output): Promise<ProcessResult>;
        speedAsync(src: string, options: SpeedOptions, output?: Output): Promise<ProcessResult>;
        transform(src: string, options: TransformOptions, output?: Output): Promise<ProcessResult>;
        transformAsync(src: string, options: TransformOptions, output?: Output): Promise<ProcessResult>;
        overlay(src: string, overlays: Overlay[], output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        overlayAsync(src: string, overlays: Overlay[], output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        /** Answers the paths of the extracted frames. */
        frames(src: string, options?: FramesOptions | null, outputDir?: Output): Promise<string[]>;
        framesAsync(src: string, options?: FramesOptions | null, outputDir?: Output): Promise<string[]>;
        /** One frame at `at` milliseconds; the script recycles the image. */
        frame(src: string, at: number, options?: FrameOptions | null): Promise<AutoJs6Node.ImageHandle>;
        frameAsync(src: string, at: number, options?: FrameOptions | null): Promise<AutoJs6Node.ImageHandle>;
        thumbnail(src: string, options?: ThumbnailOptions | null, output?: Output): Promise<ProcessResult>;
        thumbnailAsync(src: string, options?: ThumbnailOptions | null, output?: Output): Promise<ProcessResult>;
        toGif(src: string, options?: GifOptions | null, output?: Output): Promise<ProcessResult>;
        toGifAsync(src: string, options?: GifOptions | null, output?: Output): Promise<ProcessResult>;
        extractAudio(src: string, options?: ExtractAudioOptions | null, output?: Output): Promise<ProcessResult>;
        extractAudioAsync(src: string, options?: ExtractAudioOptions | null, output?: Output): Promise<ProcessResult>;
        removeAudio(src: string, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        removeAudioAsync(src: string, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        transcode(src: string, options?: TranscodeOptions | null, output?: Output): Promise<ProcessResult>;
        transcodeAsync(src: string, options?: TranscodeOptions | null, output?: Output): Promise<ProcessResult>;
        /** Multi-track composition of a timeline (3-Slate Studio roadmap appendix B.4; times in milliseconds). */
        compose(timeline: Timeline, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        composeAsync(timeline: Timeline, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        /** `subtitles` is a subtitle file path or an array of cues. */
        burnSubtitles(src: string, subtitles: string | SubtitleCue[], style?: SubtitleStyle | null, output?: Output): Promise<ProcessResult>;
        burnSubtitlesAsync(src: string, subtitles: string | SubtitleCue[], style?: SubtitleStyle | null, output?: Output): Promise<ProcessResult>;
        readonly subtitles: Subtitles;
    }

        interface Subtitles {
            /** Reads an SRT / ASS file into cues. */
            parse(path: string): Promise<SubtitleCue[]>;
            parseAsync(path: string): Promise<SubtitleCue[]>;
            /** Writes cues; the third argument is the format or options, the format follows the extension when omitted. */
            write(path: string, cues: SubtitleCue[], format?: SubtitleFormat | SubtitleWriteOptions | null): Promise<ProcessResult>;
            writeAsync(path: string, cues: SubtitleCue[], format?: SubtitleFormat | SubtitleWriteOptions | null): Promise<ProcessResult>;
        }

        /** A path, or null (or omitted) for the default output next to the source (3-Slate Studio D14). */
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

        /** `name` is `'MediaStudioError'`; `toString()` yields `MediaStudioError [CODE, task N]: message`; `message` is not enumerable. */
        interface MediaStudioError extends Error {
            readonly name: 'MediaStudioError';
            readonly code: ErrorCode | string;
            /** The plugin task, null when the call failed before a task started. */
            readonly taskId: number | null;
            /** A request the host refused for a capability (project.json or a Bun grant). */
            readonly capability?: string;
            readonly missingCapabilities?: string[];
        }

        interface MediaStudioErrorConstructor {
            (message?: string, code?: ErrorCode | string, taskId?: number | null): MediaStudioError;
            new(message?: string, code?: ErrorCode | string, taskId?: number | null): MediaStudioError;
            readonly prototype: MediaStudioError;
        }

        interface Progress {
            /** 0 - 100. */
            readonly percent: number;
            readonly stage: string;
            readonly etaMillis: number;
            readonly taskId: number;
        }

        /**
         * Options of a processing call. `onProgress` runs on this runtime's JS thread; when it throws (or its Promise
         * rejects) it receives no more progress and the call rejects with that error, unless the task failed. The host
         * drops intermediate progress when more than 16 events are pending.
         */
        interface ProcessOptions {
            onProgress?: (progress: Progress) => unknown;
            [option: string]: unknown;
        }

        interface VersionInfo {
            readonly packageName: string;
            readonly versionName: string;
            readonly versionCode: number;
            readonly contractVersion: number;
            readonly ops: string[];
        }

        interface TaskInfo {
            readonly taskId: number;
            readonly op: string;
            readonly [key: string]: unknown;
        }

        interface ProcessResult {
            readonly path: string;
            readonly durationMillis?: number;
            readonly width?: number;
            readonly height?: number;
            readonly sizeBytes?: number;
            readonly mime?: string;
            readonly codec?: string;
            readonly warnings?: string[];
            readonly taskId: number;
            readonly [key: string]: unknown;
        }

        interface MediaInfo {
            readonly path: string;
            readonly durationMillis?: number;
            readonly mime?: string;
            readonly sizeBytes?: number;
            readonly taskId: number;
            readonly [key: string]: unknown;
        }

        interface TrimOptions extends ProcessOptions {
            /** Milliseconds. */
            start: number;
            end?: number;
            duration?: number;
        }

        type ConcatOptions = ProcessOptions;

        interface SpeedOptions extends ProcessOptions {
            factor: number;
            keepPitch?: boolean;
        }

        interface TransformOptions extends ProcessOptions {
            width?: number;
            height?: number;
            scale?: number;
            rotate?: number;
            crop?: {x: number, y: number, width: number, height: number} | null;
            flip?: 'horizontal' | 'vertical' | string;
        }

        interface Overlay {
            type: 'text' | 'image';
            text?: string;
            src?: string;
            /** Milliseconds. */
            from?: number;
            to?: number;
            /** Pixels or a percentage string such as `"50%"`. */
            x?: number | string;
            y?: number | string;
            [option: string]: unknown;
        }

        interface FramesOptions extends ProcessOptions {
            at?: number;
            times?: number[];
            every?: number;
            count?: number;
            width?: number;
            format?: 'png' | 'jpg' | 'webp' | string;
        }

        interface FrameOptions {
            width?: number;
            height?: number;
            [option: string]: unknown;
        }

        interface ThumbnailOptions extends ProcessOptions {
            at?: number;
            width?: number;
            height?: number;
        }

        interface GifOptions extends ProcessOptions {
            start?: number;
            end?: number;
            fps?: number;
            width?: number;
            loop?: number | boolean;
            dither?: boolean | string;
        }

        interface ExtractAudioOptions extends ProcessOptions {
            format?: 'm4a' | 'wav' | 'flac' | 'ogg' | string;
        }

        interface TranscodeOptions extends ProcessOptions {
            codec?: 'h264' | 'h265' | string;
            width?: number;
            height?: number;
            bitRate?: number;
            frameRate?: number;
            audio?: boolean | Record<string, unknown>;
        }

        interface Timeline {
            width?: number;
            height?: number;
            frameRate?: number;
            background?: string;
            video?: {clips: Record<string, unknown>[]}[];
            audio?: {clips: Record<string, unknown>[]}[];
            overlays?: Overlay[];
            subtitles?: {src?: string, cues?: SubtitleCue[], style?: SubtitleStyle};
            [option: string]: unknown;
        }

        type SubtitleFormat = 'srt' | 'ass' | string;

        interface SubtitleWriteOptions extends ProcessOptions {
            format?: SubtitleFormat;
        }

        interface SubtitleCue {
            /** Milliseconds. */
            start: number;
            end: number;
            text: string;
            [key: string]: unknown;
        }

        interface SubtitleStyle extends ProcessOptions {
            fontSize?: number;
            color?: string;
            stroke?: string;
            align?: 'top' | 'center' | 'bottom' | string;
        }

        /** `"none"` / false / null (default), `"mic"` / `"microphone"`, `"playback"`, `"mixed"` or a track object. */
        type RecordAudio = false | null | 'none' | 'mic' | 'microphone' | 'playback' | 'mixed' | AudioTrack;

        interface AudioTrack {
            source?: 'mic' | 'microphone' | 'playback' | 'mixed';
            sampleRate?: number;
            channels?: number;
            bitRate?: number;
        }

        interface RecordOptions {
            audio?: RecordAudio;
            /** Width and height go together; the default is the capture size rounded down to even numbers. */
            width?: number;
            height?: number;
            frameRate?: number;
            bitRate?: number;
            /** Milliseconds, 0 (default) for no limit. */
            maxDuration?: number;
            /** Runs once on this runtime's JS thread after the recording ended; the script stays alive until then. */
            onStop?: (info: RecordStopInfo) => unknown;
            [option: string]: unknown;
        }

        interface RecordingStatus {
            readonly id: string;
            readonly state: string;
            readonly path: string;
            readonly audio: AudioTrack | null;
            readonly elapsedMillis: number;
            readonly maxDurationMillis: number;
            readonly error: string | null;
            readonly [key: string]: unknown;
        }

        interface RecordResult {
            readonly id: string;
            readonly path: string;
            readonly reason: string;
            readonly sizeBytes: number;
            readonly durationMillis: number;
            readonly mime: string;
            readonly audio: AudioTrack | null;
            readonly [key: string]: unknown;
        }

        /** The result, or `{id, path, reason: 'recorder-error', error}` when the recording failed. */
        type RecordStopInfo = RecordResult | {readonly id: string, readonly path: string, readonly reason: string, readonly error: string | null};

        interface Recording {
            readonly id: string;
            readonly path: string;
            /** Stops and saves the recording. */
            stop(): Promise<RecordResult>;
            /** Stops and deletes the file; answers whether a running recording was cancelled. */
            cancel(): Promise<boolean>;
            status(): Promise<RecordingStatus>;
        }

        interface ScreenRecording extends Recording {
            /** The current screen frame of the recording; the script recycles the image. */
            capture(): Promise<AutoJs6Node.ImageHandle>;
        }
  }
  const video: video.API;
  export = video;
}
declare module "autojs6:video" { import video = require("video"); export = video; }
