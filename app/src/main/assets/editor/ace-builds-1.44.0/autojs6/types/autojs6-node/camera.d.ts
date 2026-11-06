/**
 * Rhino's camera module for Node main threads and Workers, through the external 3-Prism Camera plugin (capability camera).
 * Every member returns a Promise. Codes, options and close reasons are those of Rhino's camera; a JS runtime has no preview
 * view, so `preview` / `stopPreview` reject with UNSUPPORTED and frames come from `analyze`.
 */
declare module "camera" {
  namespace camera {
    /** No deadline by default: requestPermission and the viewfinder of `capture({ui: true})` wait for the user. */
    type CallOptions = Pick<AutoJs6Node.BridgeCallOptions, "signal" | "timeoutMs">;

    interface API {
        readonly CameraError: CameraErrorConstructor;
        /** Whether the 3-Prism Camera plugin is installed, enabled and compatible. */
        isAvailable(callOptions?: CallOptions): Promise<boolean>;
        capabilities(callOptions?: CallOptions): Promise<Capabilities>;
        list(callOptions?: CallOptions): Promise<CameraInfo[]>;
        /** Asks for the plugin's camera permission; needs AutoJs6 in the foreground (UI_REQUIRES_FOREGROUND). */
        requestPermission(callOptions?: CallOptions): Promise<boolean>;
        /**
         * One picture. Without `ui` the plugin takes it in the background (with the camera of an open session of this
         * script when there is one); `ui: true` opens the plugin's viewfinder and answers null when the user leaves it.
         * The script recycles the image with `recycle`.
         */
        capture(options?: ModuleCaptureOptions | null, callOptions?: CallOptions): Promise<AutoJs6Node.ImageHandle | null>;
        captureAsync(options?: ModuleCaptureOptions | null, callOptions?: CallOptions): Promise<AutoJs6Node.ImageHandle | null>;
        /** Opens a camera session; it lasts until `close()`, the end of the execution or the plugin closes it. */
        open(options?: OpenOptions | null, callOptions?: CallOptions): Promise<CameraSession>;
        /**
         * Frees a picture of `capture` (module or session) with the camera capability alone (host 6.8.1, build 6641 or
         * later); analysis frames are recycled by the module. Idempotent: a handle recycled before answers true as well.
         * Other images reject with INVALID_ARGUMENT; free them with `images.recycle`.
         */
        recycle(image: AutoJs6Node.ImageHandle): Promise<boolean>;
    }

        type ErrorCode =
            | 'PLUGIN_NOT_INSTALLED'
            | 'PLUGIN_DISABLED'
            | 'HOST_VERSION_TOO_LOW'
            | 'PERMISSION_DENIED'
            | 'CAMERA_BUSY'
            | 'CAMERA_UNAVAILABLE'
            | 'CAMERA_DISABLED'
            | 'UI_REQUIRES_FOREGROUND'
            | 'UNSUPPORTED'
            | 'INVALID_ARGUMENT'
            | 'SESSION_CLOSED'
            | 'TIMEOUT'
            | 'LIMIT_EXCEEDED'
            | 'INTERNAL'
            /** callOptions.signal ended the call. */
            | 'CANCELLED';

        interface ErrorDetails {
            readonly holder: string | null;
            readonly cameraId: string | null;
            readonly limit: number | null;
            readonly reason: string | null;
        }

        /** `name` is `'CameraError'`; `toString()` yields `CameraError [CODE]: message`; `message` is not enumerable. */
        interface CameraError extends Error {
            readonly name: 'CameraError';
            readonly code: ErrorCode | string;
            readonly details: ErrorDetails;
        }

        interface CameraErrorConstructor {
            (message?: string, code?: ErrorCode | string, details?: Partial<ErrorDetails> | null): CameraError;
            new(message?: string, code?: ErrorCode | string, details?: Partial<ErrorDetails> | null): CameraError;
            readonly prototype: CameraError;
        }

        type Facing = 'back' | 'front';
        type FlashMode = 'off' | 'on' | 'auto';
        type CloseReason = 'script' | 'host' | 'pluginUi' | 'cameraDisconnected' | 'policy' | 'error' | string;

        interface Capabilities {
            readonly contractVersion: number | null;
            readonly features: string[];
            readonly engineVersion: string | null;
            readonly permissionGranted: boolean | null;
            readonly sharedMemory: boolean | null;
            readonly cameraCount: number | null;
        }

        interface CameraInfo {
            readonly id: string;
            readonly facing: Facing | string;
            readonly hasFlash: boolean;
            readonly sensorRotation: number;
            readonly zoomRange: number[];
            readonly exposureRange: number[];
            readonly exposureStep: number;
            /** `"WxH"` strings. */
            readonly analysisResolutions: string[];
            readonly captureResolutions: string[];
        }

        interface OpenOptions {
            /**
             * `facing` and `id` exclude each other. Left out (with `id` too), the plugin opens the camera chosen on its
             * settings page (the back camera unless the user changed it, host build 6641 or later); `state().facing` / `id`
             * give the camera in effect.
             */
            facing?: Facing;
            id?: string;
            /**
             * Analysis resolution `"WxH"`. Left out, the plugin takes the default of its settings page (640x480 unless the
             * user changed it); `state().resolution` and the frames give the size in effect.
             */
            resolution?: string;
            /** Target frame rate. Left out, the plugin takes the default of its settings page (the camera's own rate unless changed). */
            fps?: number;
            /** Frames turned upright, true by default. */
            upright?: boolean;
            mirror?: boolean;
            flashMode?: FlashMode;
        }

        interface AnalyzeOptions {
            resolution?: string;
            fps?: number;
            upright?: boolean;
            mirror?: boolean;
        }

        interface CaptureOptions {
            /** Also saves the picture to this path. */
            path?: string;
            quality?: number;
            flashMode?: FlashMode;
            resolution?: string;
            mirror?: boolean;
        }

        interface ModuleCaptureOptions extends CaptureOptions {
            /** Opens the plugin's viewfinder (AutoJs6 in the foreground, no session of this script open). */
            ui?: boolean;
            facing?: Facing;
            id?: string;
        }

        interface FocusOptions {
            size?: number;
            autoCancelMillis?: number;
        }

        interface FrameMeta {
            readonly seq: number;
            readonly width: number;
            readonly height: number;
            readonly rotationDegrees: number;
            readonly upright: boolean;
            readonly mirrored: boolean;
            /** Milliseconds. */
            readonly timestamp: number;
            readonly facing: Facing | string;
            /** Frames of this analysis replaced by newer ones before the script pulled them. */
            readonly dropped: number;
        }

        interface ZoomState {
            readonly ratio: number;
            readonly min: number;
            readonly max: number;
            readonly linear: number;
        }

        interface ExposureState {
            readonly index: number;
            readonly min: number;
            readonly max: number;
            readonly step: number;
        }

        interface SessionState {
            readonly open: boolean;
            readonly previewing: boolean;
            readonly analyzing: boolean;
            readonly id: string | null;
            readonly facing: Facing | string | null;
            readonly resolution: string | null;
            readonly fps: number | null;
            readonly previewMirrored: boolean | null;
            readonly torch: boolean | null;
            readonly flashMode: FlashMode | string | null;
            readonly zoom: number | null;
            readonly exposure: number | null;
            readonly frames: number | null;
            readonly dropped: number;
            readonly holder: string | null;
        }

        /**
         * The image is valid only until the callback (or the Promise it returns) settles: the facade recycles it then (D11).
         * A callback that returns a Promise holds the next frame back until it settles; frames that arrive meanwhile replace
         * each other and count in `dropped`. Keep a picture with `images.copy` before returning.
         */
        type FrameCallback = (this: CameraSession, image: AutoJs6Node.ImageHandle, meta: FrameMeta) => unknown;

        interface CameraSession {
            readonly holder: string | null;
            /** Frames dropped in the current analysis, or in the last one after it stopped. */
            readonly dropped: number;
            /** The close reason, null while open. */
            readonly reason: CloseReason | null;
            isClosed(): boolean;
            /** Starts the analysis (an analysis already running stops first) and pulls frames until stopAnalysis or close. */
            analyze(callback?: FrameCallback | null, options?: AnalyzeOptions | null): Promise<this>;
            analyze(options?: AnalyzeOptions | null): Promise<this>;
            stopAnalysis(): Promise<this>;
            /** Rejects with UNSUPPORTED: a JS runtime has no preview view. */
            preview(...args: unknown[]): Promise<never>;
            stopPreview(): Promise<never>;
            capture(options?: CaptureOptions | null): Promise<AutoJs6Node.ImageHandle | null>;
            captureAsync(options?: CaptureOptions | null): Promise<AutoJs6Node.ImageHandle | null>;
            torch(on: boolean): Promise<this>;
            flashMode(mode: FlashMode): Promise<this>;
            zoom(ratio: number): Promise<this>;
            zoomLinear(linear: number): Promise<this>;
            exposure(index: number): Promise<this>;
            zoomState(): Promise<ZoomState>;
            exposureState(): Promise<ExposureState>;
            /** x and y in 0..1 of the analysis frame. */
            focusAt(x: number, y: number, options?: FocusOptions | null): Promise<boolean>;
            state(): Promise<SessionState>;
            /** Ends the session (reason `script`); idempotent. */
            close(): Promise<void>;
            /** Listeners run on this runtime's JS thread; the image of `frame` is valid only while the listener runs. */
            on(event: 'frame', listener: (this: CameraSession, image: AutoJs6Node.ImageHandle, meta: FrameMeta) => void): this;
            on(event: 'dropped', listener: (this: CameraSession, total: number, lastSeq: number) => void): this;
            on(event: 'error', listener: (this: CameraSession, error: CameraError) => void): this;
            /** `pluginUi`: the plugin's viewfinder took the camera; the execution ends after the close listeners ran (Q7). */
            on(event: 'close', listener: (this: CameraSession, reason: CloseReason) => void): this;
            on(event: string, listener: (...args: any[]) => void): this;
            addListener(event: string, listener: (...args: any[]) => void): this;
            once(event: 'close', listener: (this: CameraSession, reason: CloseReason) => void): this;
            once(event: string, listener: (...args: any[]) => void): this;
            /** Without a listener, removes every listener of the event. */
            off(event: string, listener?: (...args: any[]) => void): this;
            removeListener(event: string, listener?: (...args: any[]) => void): this;
            removeAllListeners(event?: string): this;
            listenerCount(event: string): number;
            toString(): string;
        }
  }
  const camera: camera.API;
  export = camera;
}
declare module "autojs6:camera" { import camera = require("camera"); export = camera; }
