/**
 * Rhino's video module for Node main threads and Workers: screen recording by AutoJs6 and media processing by the external
 * 3-Slate Studio plugin. Every member returns a Promise. Arguments, options, results, error codes and the capabilities a
 * call declares are those of Rhino's video; after the required arguments a string is the output path, null the default
 * output and an object the options, in either order (a second string or a second object is INVALID_OPTIONS). Relative
 * paths resolve against the script's working directory. `video` and `audio` share one task table and `MediaStudioError`.
 * The option types follow the option schemas of 3-Slate Studio (its docs/development/media-studio-options.d.ts); unknown
 * keys are INVALID_OPTIONS.
 *
 * Default outputs: videos `/sdcard/Movies/3-Slate Studio/<source>-<operation>-<time>.mp4`, audio
 * `/sdcard/Music/3-Slate Studio/`, images and GIF `/sdcard/Pictures/3-Slate Studio/`. The plugin needs the "All files
 * access" permission (STORAGE_PERMISSION_DENIED otherwise; `frame` needs it too).
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
        /** The tasks of this script (video and audio). */
        tasks(): Promise<TaskInfo[]>;
        /** Cancels every unfinished task of this script and answers how many. */
        cancelAll(): Promise<number>;
        /**
         * Starts a screen recording (by AutoJs6, no plugin needed) and answers its handle; one per script
         * (LIMIT_EXCEEDED). Without a path the file goes to `Movies/AutoJs6/screen-<yyyyMMdd-HHmmss>.mp4`; an explicit path is
         * absolute, ends with `.mp4` and does not exist. A cancelled or failed recording leaves no file; the execution end
         * saves a recording that is still running.
         */
        record(path?: string | null, options?: RecordOptions | null): Promise<ScreenRecording>;
        record(options: RecordOptions | null, path?: string | null): Promise<ScreenRecording>;

        probe(src: string): Promise<MediaInfo>;
        probeAsync(src: string): Promise<MediaInfo>;
        /** Give at least one of start, end or duration. */
        trim(src: string, options: TrimOptions, output?: Output): Promise<ProcessResult>;
        trim(src: string, output: Output, options: TrimOptions): Promise<ProcessResult>;
        trimAsync(src: string, options: TrimOptions, output?: Output): Promise<ProcessResult>;
        trimAsync(src: string, output: Output, options: TrimOptions): Promise<ProcessResult>;
        concat(sources: string[], options?: ConcatOptions | null, output?: Output): Promise<ProcessResult>;
        concat(sources: string[], output: Output, options?: ConcatOptions | null): Promise<ProcessResult>;
        concatAsync(sources: string[], options?: ConcatOptions | null, output?: Output): Promise<ProcessResult>;
        concatAsync(sources: string[], output: Output, options?: ConcatOptions | null): Promise<ProcessResult>;
        /** factor 0.25 - 8. */
        speed(src: string, options: SpeedOptions, output?: Output): Promise<ProcessResult>;
        speed(src: string, output: Output, options: SpeedOptions): Promise<ProcessResult>;
        speedAsync(src: string, options: SpeedOptions, output?: Output): Promise<ProcessResult>;
        speedAsync(src: string, output: Output, options: SpeedOptions): Promise<ProcessResult>;
        /** Crop, rotate, flip, then scale; give at least one of size, scale, rotate, crop or flip. */
        transform(src: string, options: TransformOptions, output?: Output): Promise<ProcessResult>;
        transform(src: string, output: Output, options: TransformOptions): Promise<ProcessResult>;
        transformAsync(src: string, options: TransformOptions, output?: Output): Promise<ProcessResult>;
        transformAsync(src: string, output: Output, options: TransformOptions): Promise<ProcessResult>;
        /** 1 - 64 text and image overlays. */
        overlay(src: string, overlays: Overlay[], output?: Output, options?: OverlayOptions | null): Promise<ProcessResult>;
        overlay(src: string, overlays: Overlay[], options: OverlayOptions | null, output?: Output): Promise<ProcessResult>;
        overlayAsync(src: string, overlays: Overlay[], output?: Output, options?: OverlayOptions | null): Promise<ProcessResult>;
        overlayAsync(src: string, overlays: Overlay[], options: OverlayOptions | null, output?: Output): Promise<ProcessResult>;
        /** Answers the paths of the extracted frames (at most 1000); the output is a folder. */
        frames(src: string, options: FramesOptions, outputDir?: Output): Promise<string[]>;
        frames(src: string, outputDir: Output, options: FramesOptions): Promise<string[]>;
        framesAsync(src: string, options: FramesOptions, outputDir?: Output): Promise<string[]>;
        framesAsync(src: string, outputDir: Output, options: FramesOptions): Promise<string[]>;
        /** One frame at `at` milliseconds; no output path. The script recycles the image. */
        frame(src: string, at: number, options?: FrameOptions | null): Promise<AutoJs6Node.ImageHandle>;
        frameAsync(src: string, at: number, options?: FrameOptions | null): Promise<AutoJs6Node.ImageHandle>;
        /** One thumbnail file, by default JPEG, 320 px wide, a third into the video. */
        thumbnail(src: string, options?: ThumbnailOptions | null, output?: Output): Promise<ProcessResult>;
        thumbnail(src: string, output: Output, options?: ThumbnailOptions | null): Promise<ProcessResult>;
        thumbnailAsync(src: string, options?: ThumbnailOptions | null, output?: Output): Promise<ProcessResult>;
        thumbnailAsync(src: string, output: Output, options?: ThumbnailOptions | null): Promise<ProcessResult>;
        /** Default 10 fps, 480 px wide, at most 600 frames. */
        toGif(src: string, options?: GifOptions | null, output?: Output): Promise<ProcessResult>;
        toGif(src: string, output: Output, options?: GifOptions | null): Promise<ProcessResult>;
        toGifAsync(src: string, options?: GifOptions | null, output?: Output): Promise<ProcessResult>;
        toGifAsync(src: string, output: Output, options?: GifOptions | null): Promise<ProcessResult>;
        extractAudio(src: string, options?: ExtractAudioOptions | null, output?: Output): Promise<ProcessResult>;
        extractAudio(src: string, output: Output, options?: ExtractAudioOptions | null): Promise<ProcessResult>;
        extractAudioAsync(src: string, options?: ExtractAudioOptions | null, output?: Output): Promise<ProcessResult>;
        extractAudioAsync(src: string, output: Output, options?: ExtractAudioOptions | null): Promise<ProcessResult>;
        removeAudio(src: string, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        removeAudio(src: string, options: ProcessOptions | null, output?: Output): Promise<ProcessResult>;
        removeAudioAsync(src: string, output?: Output, options?: ProcessOptions | null): Promise<ProcessResult>;
        removeAudioAsync(src: string, options: ProcessOptions | null, output?: Output): Promise<ProcessResult>;
        transcode(src: string, options?: TranscodeOptions | null, output?: Output): Promise<ProcessResult>;
        transcode(src: string, output: Output, options?: TranscodeOptions | null): Promise<ProcessResult>;
        transcodeAsync(src: string, options?: TranscodeOptions | null, output?: Output): Promise<ProcessResult>;
        transcodeAsync(src: string, output: Output, options?: TranscodeOptions | null): Promise<ProcessResult>;
        /** Multi-track composition of a timeline (at most 8 video and 16 audio tracks, 256 clips; times in milliseconds). */
        compose(timeline: Timeline, output?: Output, options?: ComposeOptions | null): Promise<ProcessResult>;
        compose(timeline: Timeline, options: ComposeOptions | null, output?: Output): Promise<ProcessResult>;
        composeAsync(timeline: Timeline, output?: Output, options?: ComposeOptions | null): Promise<ProcessResult>;
        composeAsync(timeline: Timeline, options: ComposeOptions | null, output?: Output): Promise<ProcessResult>;
        /** `subtitles` is an SRT / ASS file path or an array of cues; the style also takes codec / bitRate and onProgress. */
        burnSubtitles(src: string, subtitles: string | SubtitleCue[], style?: SubtitleStyle | null, output?: Output): Promise<ProcessResult>;
        burnSubtitles(src: string, subtitles: string | SubtitleCue[], output: Output, style?: SubtitleStyle | null): Promise<ProcessResult>;
        burnSubtitlesAsync(src: string, subtitles: string | SubtitleCue[], style?: SubtitleStyle | null, output?: Output): Promise<ProcessResult>;
        burnSubtitlesAsync(src: string, subtitles: string | SubtitleCue[], output: Output, style?: SubtitleStyle | null): Promise<ProcessResult>;
        readonly subtitles: Subtitles;
    }

        interface Subtitles {
            /** Reads an SRT / ASS file into cues (plain text). */
            parse(path: string): Promise<SubtitleCue[]>;
            parseAsync(path: string): Promise<SubtitleCue[]>;
            /** Writes cues; the third argument is the format or options, the format follows the extension when omitted. */
            write(path: string, cues: SubtitleCue[], format?: SubtitleFormat | SubtitleWriteOptions | null): Promise<ProcessResult>;
            writeAsync(path: string, cues: SubtitleCue[], format?: SubtitleFormat | SubtitleWriteOptions | null): Promise<ProcessResult>;
        }

        /** A path, or null (or omitted) for the default output (3-Slate Studio D14). */
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

        type Stage = 'queued' | 'probing' | 'decoding' | 'encoding' | 'muxing' | 'writing' | string;

        interface Progress {
            /** 0 - 100, never decreasing. */
            readonly percent: number;
            readonly stage: Stage;
            /** -1 when unknown. */
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
        }

        type VideoCodec = 'h264' | 'h265';

        interface VideoEncodingOptions extends ProcessOptions {
            /** Default h264; h265 needs an H.265 encoder (else UNSUPPORTED_FORMAT). */
            codec?: VideoCodec;
            /** Integer 100000 - 200000000 bps. Default: estimated from the size and frame rate. */
            bitRate?: number;
        }

        type AudioFormat = 'm4a' | 'wav' | 'flac' | 'ogg';

        /** ogg (Opus) takes 8000, 12000, 16000, 24000 or 48000. */
        type SampleRate = 8000 | 11025 | 12000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;

        interface AudioOutputOptions extends ProcessOptions {
            /** Default: the output extension, else m4a. */
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
            readonly state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
            readonly percent: number;
            readonly stage: Stage;
            readonly output?: string;
            /** `script` or `studio`. */
            readonly origin: string;
            /** Epoch milliseconds. */
            readonly submittedAt: number;
        }

        /** Audio outputs carry sampleRate / channels, video and image outputs width / height. */
        interface ProcessResult {
            readonly path: string;
            readonly durationMillis?: number;
            readonly width?: number;
            readonly height?: number;
            readonly sizeBytes: number;
            readonly mime?: string;
            readonly codec?: string;
            readonly sampleRate?: number;
            readonly channels?: number;
            /** OUTPUT_LARGE, DURATION_LONG, encoder or transition fallbacks, the scaling of a mix. */
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

        /** Video keys only with a video track, audio keys only with an audio track. */
        interface MediaInfo {
            readonly path: string;
            readonly durationMillis: number;
            readonly sizeBytes: number;
            readonly mime?: string;
            readonly hasVideo: boolean;
            readonly hasAudio: boolean;
            readonly codec?: string;
            readonly bitRate?: number;
            readonly width?: number;
            readonly height?: number;
            readonly rotation?: number;
            readonly frameRate?: number;
            readonly videoCodec?: string;
            readonly audioCodec?: string;
            readonly sampleRate?: number;
            readonly channels?: number;
            readonly language?: string;
            readonly tracks: TrackInfo[];
        }

        interface TrimOptions extends ProcessOptions {
            /** Integer milliseconds. Default 0. */
            start?: number;
            /** Excludes duration. */
            end?: number;
            /** Excludes end. */
            duration?: number;
        }

        interface ConcatOptions extends VideoEncodingOptions {
            /** Integer 16 - 8192 px. */
            width?: number;
            height?: number;
            /** Default contain. */
            fit?: Fit;
        }

        interface SpeedOptions extends VideoEncodingOptions {
            /** 0.25 - 8. */
            factor: number;
            /** Default true. */
            keepPitch?: boolean;
        }

        interface TransformCrop {
            /** Default 0. */
            x?: number;
            /** Default 0. */
            y?: number;
            /** At least 16 px. */
            width: number;
            height: number;
        }

        interface TransformOptions extends VideoEncodingOptions {
            /** Integer 16 - 8192 px; width / height exclude scale. */
            width?: number;
            height?: number;
            /** Greater than 0, at most 8. */
            scale?: number;
            /** Degrees clockwise, a multiple of 90. */
            rotate?: number;
            crop?: TransformCrop | null;
            /** Default none. */
            flip?: Flip;
            /** Default contain. */
            fit?: Fit;
        }

        interface TranscodeAudio {
            /** Integer 8000 - 512000 bps. */
            bitRate?: number;
            sampleRate?: SampleRate;
            channels?: 1 | 2;
        }

        interface TranscodeOptions extends VideoEncodingOptions {
            width?: number;
            height?: number;
            fit?: Fit;
            /** 1 - 120 fps. */
            frameRate?: number;
            audio?: TranscodeAudio | null;
        }

        type ExtractAudioOptions = AudioOutputOptions;
        type OverlayOptions = VideoEncodingOptions;
        type ComposeOptions = VideoEncodingOptions;

        interface OverlayPlacement {
            /** Pixels or a percentage string such as `"50%"`. Default "50%". */
            x?: number | string;
            y?: number | string;
            /** Default center. */
            anchor?: Anchor;
            /** Milliseconds. Default 0. */
            from?: number;
            /** Milliseconds. Default: the end. */
            to?: number;
            /** 0 - 1. Default 1. */
            alpha?: number;
        }

        interface TextStyle {
            /** `sans-serif` (default), `serif`, `monospace` or an absolute font file path. */
            font?: string;
            fontSize?: number;
            bold?: boolean;
            italic?: boolean;
            /** Default "#FFFFFF". */
            color?: Color;
            stroke?: Color;
            strokeWidth?: number;
            shadow?: Color;
            shadowRadius?: number;
            shadowDx?: number;
            shadowDy?: number;
        }

        interface TextOverlay extends TextStyle, OverlayPlacement {
            type: 'text';
            /** 1 - 1000 characters. */
            text: string;
            /** Default center. */
            align?: 'left' | 'center' | 'right';
        }

        interface ImageOverlay extends OverlayPlacement {
            type: 'image';
            /** Absolute path of an image. */
            src: string;
            /** Excludes width / height. */
            scale?: number;
            /** Pixels or a percentage of the frame. */
            width?: number | string;
            height?: number | string;
        }

        type Overlay = TextOverlay | ImageOverlay;

        interface ImageEncodingOptions extends ProcessOptions {
            format?: ImageFormat;
            /** Integer 1 - 100, only with jpg / jpeg. */
            quality?: number;
            /** Integer 16 - 8192 px; the height follows the aspect ratio. */
            width?: number;
        }

        interface FramesOptions extends ImageEncodingOptions {
            /** One of at, times, or every / count (with start / end). */
            at?: number;
            /** Up to 1000 times. */
            times?: number[];
            every?: number;
            /** Integer 1 - 1000. */
            count?: number;
            start?: number;
            end?: number;
        }

        type FrameOptions = ImageEncodingOptions;

        interface ThumbnailOptions extends ImageEncodingOptions {
            /** Default: a third of the duration. */
            at?: number;
        }

        interface GifOptions extends ProcessOptions {
            start?: number;
            end?: number;
            /** Integer 1 - 50. Default 10. */
            fps?: number;
            /** Default 480. */
            width?: number;
            /** true (default) forever, false once, or a loop count 0 - 65535. */
            loop?: boolean | number;
            /** Floyd-Steinberg dithering. Default false. */
            dither?: boolean;
        }

        type SubtitleFormat = 'srt' | 'ass';

        interface SubtitleWriteOptions extends ProcessOptions {
            format: SubtitleFormat;
        }

        interface SubtitleCue {
            /** Milliseconds. */
            start: number;
            end: number;
            text: string;
        }

        /** The style of burnSubtitles (with codec / bitRate) and of a timeline's subtitles (without). */
        interface SubtitleStyle extends TextStyle, VideoEncodingOptions {
            /** A box behind each line. */
            background?: Color;
            /** Default bottom. */
            align?: Anchor;
            /** Pixels or a percentage "0%" - "50%". Default "5%". */
            marginV?: number | string;
            marginH?: number | string;
        }

        type TransitionType = 'cut' | 'fade' | 'dissolve' | 'slide' | 'wipe' | 'zoom' | 'blur';

        interface TimelineTransition {
            type: TransitionType;
            /** 100 - 3000 ms. Default 500. */
            duration?: number;
            /** Only for slide and wipe. Default left. */
            direction?: 'left' | 'right' | 'up' | 'down';
        }

        interface TimelineTransform {
            scale?: number;
            rotate?: number;
            crop?: TransformCrop | null;
            flip?: Flip;
            fit?: Fit;
        }

        interface TimelineClip {
            /** Absolute path. */
            src: string;
            /** Source time, ms. */
            start?: number;
            end?: number;
            /** Timeline time, ms; default right after the previous clip. */
            at?: number;
            /** Linear 0 - 16. Default 1. */
            volume?: number;
        }

        interface TimelineVideoClip extends TimelineClip {
            speed?: number;
            transform?: TimelineTransform | null;
            transition?: TimelineTransition | null;
        }

        interface TimelineAudioClip extends TimelineClip {
            fadeIn?: number;
            fadeOut?: number;
        }

        interface Timeline {
            width?: number;
            height?: number;
            /** Integer 1 - 120. Default 30. */
            frameRate?: number;
            background?: Color;
            video?: {clips: TimelineVideoClip[]}[];
            audio?: {clips: TimelineAudioClip[]}[];
            overlays?: Overlay[];
            /** A file (src) or cues, and a style without codec / bitRate. */
            subtitles?: {src?: string, cues?: SubtitleCue[], style?: Omit<SubtitleStyle, 'codec' | 'bitRate' | 'onProgress'> | null} | null;
        }

        /** `"none"` / false / null (default), `"mic"` / `"microphone"` / true, `"playback"`, `"mixed"` or a track object. */
        type RecordAudio = boolean | null | 'none' | 'mic' | 'microphone' | 'playback' | 'mixed' | AudioTrack;

        interface AudioTrack {
            /** Default microphone. */
            source?: 'mic' | 'microphone' | 'playback' | 'mixed';
            /** 8000 - 192000 Hz. Default 48000. */
            sampleRate?: number;
            /** Default 1 for the microphone, 2 for playback / mixed. */
            channels?: 1 | 2;
            /** 16000 - 320000 bps. Default 128000 for the microphone, 192000 for playback / mixed. */
            bitRate?: number;
        }

        interface AudioTrackInfo {
            readonly source: 'microphone' | 'playback' | 'mixed';
            readonly sampleRate: number;
            readonly channels: number;
            readonly bitRate: number;
        }

        interface RecordOptions {
            audio?: RecordAudio;
            /**
             * Width and height go together (2 - 8192, even); the default is the capture size fitted to the H.264
             * encoders of the device (aligned down, scaled down within their limits).
             */
            width?: number;
            height?: number;
            /** 1 - 120. Default 30. */
            frameRate?: number;
            /** Default 8000000. */
            bitRate?: number;
            /** Milliseconds, 0 (default) for no limit, at most 24 hours. */
            maxDuration?: number;
            /** Runs once on this runtime's JS thread after the recording ended; the script stays alive until then. */
            onStop?: (info: RecordStopInfo<ScreenRecordResult>) => unknown;
        }

        type RecordingState = 'idle' | 'recording' | 'stopped' | 'cancelled' | 'failed';

        interface RecordingStatus {
            readonly id: string;
            readonly state: RecordingState;
            readonly path: string;
            readonly audio: AudioTrackInfo | null;
            readonly elapsedMillis: number;
            readonly maxDurationMillis: number;
            readonly error: string | null;
        }

        interface ScreenRecordingStatus extends RecordingStatus {
            readonly width: number;
            readonly height: number;
            readonly frameRate: number;
            readonly bitRate: number;
        }

        interface RecordResult {
            readonly id: string;
            readonly path: string;
            /** `stopped`, `max-duration`, `max-size` or `notification-stop`. */
            readonly reason: string;
            readonly sizeBytes: number;
            readonly durationMillis: number;
            readonly mime: string;
            readonly audio: AudioTrackInfo | null;
        }

        interface ScreenRecordResult extends RecordResult {
            readonly width: number;
            readonly height: number;
            readonly frameRate: number;
            readonly bitRate: number;
            readonly videoCodec: string;
            readonly audioCodec: string | null;
        }

        /** The result, or `{id, path, reason: 'recorder-error', error}` when the recording failed. */
        type RecordStopInfo<R extends RecordResult = RecordResult> = R | {readonly id: string, readonly path: string, readonly reason: string, readonly error: string | null};

        interface Recording<R extends RecordResult = RecordResult, S extends RecordingStatus = RecordingStatus> {
            readonly id: string;
            readonly path: string;
            /** Stops and saves the recording. */
            stop(): Promise<R>;
            /** Stops and deletes the file; answers whether a running recording was cancelled. */
            cancel(): Promise<boolean>;
            status(): Promise<S>;
        }

        interface ScreenRecording extends Recording<ScreenRecordResult, ScreenRecordingStatus> {
            /** The current screen frame of the recording; the script recycles the image. */
            capture(): Promise<AutoJs6Node.ImageHandle>;
        }
  }
  const video: video.API;
  export = video;
}
declare module "autojs6:video" { import video = require("video"); export = video; }
