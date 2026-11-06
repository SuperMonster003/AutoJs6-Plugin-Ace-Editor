/**
 * Rhino's audio module for Node main threads and Workers: sound recording by AutoJs6 and audio processing by the external
 * 3-Slate Studio plugin. Every member returns a Promise; arguments, options, results and codes are those of Rhino's audio,
 * with the conventions of `video` (output argument, relative paths, `onProgress`). `audio` shares the task table and
 * `MediaStudioError` with `video`.
 *
 * Capabilities (project.json): processing, `tasks` and `cancelAll` need `media`; `record` needs `media` and
 * `media.recording` (Android RECORD_AUDIO); `isAvailable`, `version` and the recording handle need none.
 */
declare module "audio" {
  import video = require("video");
  namespace audio {
    interface API {
        readonly MediaStudioError: video.MediaStudioErrorConstructor;
        isAvailable(): Promise<boolean>;
        version(): Promise<video.VersionInfo>;
        /** The running tasks of this script (video and audio). */
        tasks(): Promise<video.TaskInfo[]>;
        cancelAll(): Promise<number>;
        /**
         * Starts a sound recording (by AutoJs6, no plugin needed) and answers its handle; the execution end saves a
         * recording that is still running. Without a path the file goes to `Music/AutoJs6/audio-<yyyyMMdd-HHmmss>.<ext>`.
         */
        record(path?: string | null, options?: RecordOptions | null): Promise<video.Recording>;
        record(options?: RecordOptions | null): Promise<video.Recording>;

        probe(src: string): Promise<video.MediaInfo>;
        probeAsync(src: string): Promise<video.MediaInfo>;
        trim(src: string, options: video.TrimOptions, output?: video.Output): Promise<video.ProcessResult>;
        trimAsync(src: string, options: video.TrimOptions, output?: video.Output): Promise<video.ProcessResult>;
        concat(sources: string[], output?: video.Output, options?: video.ProcessOptions | null): Promise<video.ProcessResult>;
        concat(sources: string[], options?: video.ProcessOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        concatAsync(sources: string[], output?: video.Output, options?: video.ProcessOptions | null): Promise<video.ProcessResult>;
        concatAsync(sources: string[], options?: video.ProcessOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        mix(inputs: MixInput[], output?: video.Output, options?: video.ProcessOptions | null): Promise<video.ProcessResult>;
        mixAsync(inputs: MixInput[], output?: video.Output, options?: video.ProcessOptions | null): Promise<video.ProcessResult>;
        volume(src: string, options: VolumeOptions, output?: video.Output): Promise<video.ProcessResult>;
        volumeAsync(src: string, options: VolumeOptions, output?: video.Output): Promise<video.ProcessResult>;
        convert(src: string, options: ConvertOptions, output?: video.Output): Promise<video.ProcessResult>;
        convertAsync(src: string, options: ConvertOptions, output?: video.Output): Promise<video.ProcessResult>;
        speed(src: string, options: video.SpeedOptions, output?: video.Output): Promise<video.ProcessResult>;
        speedAsync(src: string, options: video.SpeedOptions, output?: video.Output): Promise<video.ProcessResult>;
    }

        interface MixInput {
            src: string;
            volume?: number;
            /** Milliseconds. */
            at?: number;
        }

        interface VolumeOptions extends video.ProcessOptions {
            gain?: number;
            normalize?: boolean;
            /** Milliseconds. */
            fadeIn?: number;
            fadeOut?: number;
        }

        interface ConvertOptions extends video.ProcessOptions {
            format: 'm4a' | 'wav' | 'flac' | 'ogg' | string;
            sampleRate?: number;
            channels?: number;
            bitRate?: number;
        }

        interface RecordOptions {
            /** `mic` (default), `playback` (Android 10+, the screen capture consent) or `mixed`. */
            source?: 'mic' | 'microphone' | 'playback' | 'mixed';
            /** Follows the extension of the path when omitted. */
            format?: 'm4a' | 'wav';
            sampleRate?: number;
            channels?: number;
            bitRate?: number;
            /** Milliseconds, 0 (default) for no limit. */
            maxDuration?: number;
            /** Runs once on this runtime's JS thread after the recording ended; the script stays alive until then. */
            onStop?: (info: video.RecordStopInfo) => unknown;
            [option: string]: unknown;
        }
  }
  const audio: audio.API;
  export = audio;
}
declare module "autojs6:audio" { import audio = require("audio"); export = audio; }
