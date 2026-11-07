/**
 * Rhino's audio module for Node main threads and Workers: sound recording by AutoJs6 and audio processing by the external
 * 3-Slate Studio plugin. Every member returns a Promise; arguments, options, results and codes are those of Rhino's audio,
 * with the conventions of `video` (output argument in either order, relative paths, `onProgress`). `audio` shares the task
 * table and `MediaStudioError` with `video`. Without an output path and `format` the result is M4A (AAC) in
 * `/sdcard/Music/3-Slate Studio/`.
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
        /** The tasks of this script (video and audio). */
        tasks(): Promise<video.TaskInfo[]>;
        cancelAll(): Promise<number>;
        /**
         * Starts a sound recording (by AutoJs6, no plugin needed) and answers its handle: `microphone` (default),
         * `playback` (sound of other apps, Android 10+) or `mixed`; the last two need the screen capture session of
         * `images.requestScreenCapture` (else PERMISSION_DENIED). Without a path the file goes to
         * `Music/AutoJs6/audio-<yyyyMMdd-HHmmss>.<m4a|wav>`; an explicit path is absolute, ends with `.m4a` or `.wav` and
         * does not exist (unless `overwrite`). A cancelled or failed recording leaves no file; the execution end saves a
         * recording that is still running.
         */
        record(path?: string | null, options?: RecordOptions | null): Promise<AudioRecording>;
        record(options: RecordOptions | null, path?: string | null): Promise<AudioRecording>;

        /** Media information of a file with an audio track (else UNSUPPORTED_FORMAT). */
        probe(src: string): Promise<video.MediaInfo>;
        probeAsync(src: string): Promise<video.MediaInfo>;
        /** Give at least one of start, end or duration. */
        trim(src: string, options: TrimOptions, output?: video.Output): Promise<video.ProcessResult>;
        trim(src: string, output: video.Output, options: TrimOptions): Promise<video.ProcessResult>;
        trimAsync(src: string, options: TrimOptions, output?: video.Output): Promise<video.ProcessResult>;
        trimAsync(src: string, output: video.Output, options: TrimOptions): Promise<video.ProcessResult>;
        concat(sources: string[], output?: video.Output, options?: ConcatOptions | null): Promise<video.ProcessResult>;
        concat(sources: string[], options: ConcatOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        concatAsync(sources: string[], output?: video.Output, options?: ConcatOptions | null): Promise<video.ProcessResult>;
        concatAsync(sources: string[], options: ConcatOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        /** 2 - 16 inputs; when the sum would clip, the mix is scaled down to -1 dBFS and `warnings` report it. */
        mix(inputs: (string | MixInput)[], output?: video.Output, options?: MixOptions | null): Promise<video.ProcessResult>;
        mix(inputs: (string | MixInput)[], options: MixOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        mixAsync(inputs: (string | MixInput)[], output?: video.Output, options?: MixOptions | null): Promise<video.ProcessResult>;
        mixAsync(inputs: (string | MixInput)[], options: MixOptions | null, output?: video.Output): Promise<video.ProcessResult>;
        /** Give at least one of gain, normalize, fadeIn or fadeOut. */
        volume(src: string, options: VolumeOptions, output?: video.Output): Promise<video.ProcessResult>;
        volume(src: string, output: video.Output, options: VolumeOptions): Promise<video.ProcessResult>;
        volumeAsync(src: string, options: VolumeOptions, output?: video.Output): Promise<video.ProcessResult>;
        volumeAsync(src: string, output: video.Output, options: VolumeOptions): Promise<video.ProcessResult>;
        /** To m4a, wav, flac or ogg; `format` may be left out when the output path ends with one of these extensions. */
        convert(src: string, options: ConvertOptions, output?: video.Output): Promise<video.ProcessResult>;
        convert(src: string, output: string, options?: Partial<ConvertOptions> | null): Promise<video.ProcessResult>;
        convertAsync(src: string, options: ConvertOptions, output?: video.Output): Promise<video.ProcessResult>;
        convertAsync(src: string, output: string, options?: Partial<ConvertOptions> | null): Promise<video.ProcessResult>;
        /** factor 0.25 - 8, keeping the pitch by default. */
        speed(src: string, options: SpeedOptions, output?: video.Output): Promise<video.ProcessResult>;
        speed(src: string, output: video.Output, options: SpeedOptions): Promise<video.ProcessResult>;
        speedAsync(src: string, options: SpeedOptions, output?: video.Output): Promise<video.ProcessResult>;
        speedAsync(src: string, output: video.Output, options: SpeedOptions): Promise<video.ProcessResult>;
    }

        interface TrimOptions extends video.AudioOutputOptions {
            /** Integer milliseconds. Default 0. */
            start?: number;
            /** Excludes duration. */
            end?: number;
            /** Excludes end. */
            duration?: number;
        }

        type ConcatOptions = video.AudioOutputOptions;
        /** Only the audio output keys; the settings of each input go into `inputs`. */
        type MixOptions = video.AudioOutputOptions;

        interface MixInput {
            /** Path of an audio or video file. */
            src: string;
            /** Linear 0 - 16. Default 1. */
            volume?: number;
            /** Where the input starts in the mix, milliseconds. Default 0. */
            at?: number;
        }

        interface VolumeOptions extends video.AudioOutputOptions {
            /** Linear 0 - 16 (0.5 is about -6 dB). Excludes normalize. */
            gain?: number;
            /** true (peak to -1 dBFS) or a target -60 - 0 dBFS. Excludes gain. */
            normalize?: boolean | number;
            /** Milliseconds. Default 0. */
            fadeIn?: number;
            fadeOut?: number;
        }

        interface ConvertOptions extends video.AudioOutputOptions {
            format: video.AudioFormat;
        }

        interface SpeedOptions extends video.AudioOutputOptions {
            /** 0.25 - 8. */
            factor: number;
            /** Default true. */
            keepPitch?: boolean;
        }

        interface RecordOptions {
            /** Default microphone. */
            source?: 'mic' | 'microphone' | 'playback' | 'mixed';
            /** Default: the extension of the path, else m4a. */
            format?: 'm4a' | 'wav';
            /** 8000 - 192000 Hz. Default 48000. */
            sampleRate?: number;
            /** Default 1 for the microphone, 2 for playback / mixed. */
            channels?: 1 | 2;
            /** 16000 - 320000 bps (m4a). Default 128000 for the microphone, 192000 for playback / mixed. */
            bitRate?: number;
            /** Milliseconds, 0 (default) for no limit, at most 24 hours. */
            maxDuration?: number;
            /** Replace an existing file at the path. Default false. */
            overwrite?: boolean;
            /** Runs once on this runtime's JS thread after the recording ended; the script stays alive until then. */
            onStop?: (info: video.RecordStopInfo<AudioRecordResult>) => unknown;
        }

        interface AudioRecordingStatus extends video.RecordingStatus {
            readonly format: 'm4a' | 'wav';
            /** The time recorded so far, ms. */
            readonly recordedMillis: number;
        }

        interface AudioRecordResult extends video.RecordResult {
            readonly format: 'm4a' | 'wav';
            /** The wall time from start to stop, ms. */
            readonly elapsedMillis: number;
        }

        type AudioRecording = video.Recording<AudioRecordResult, AudioRecordingStatus>;
  }
  const audio: audio.API;
  export = audio;
}
declare module "autojs6:audio" { import audio = require("audio"); export = audio; }
