// Type definitions for AutoJs6 internal module camera
//
// Definitions by: SuperMonster003 <https://github.com/SuperMonster003>
// TypeScript Version: 5.1.3
//
// Last modified: Nov 6, 2026

/// <reference path="./index.d.ts" />

/**
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/CameraModule.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/Camera.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/CameraSession.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/CameraScriptOptions.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/CameraScriptValues.kt
 * @Source %AutoJs6%/app/src/main/java/org/autojs/autojs/runtime/api/modules/camera/CameraJsErrors.kt
 * @Source %AutoJs6%/docs/dev/camera-plugin-protocol-v1.md
 */

declare namespace Internal {

    /**
     * The global `camera` object (also `$camera`), available since AutoJs6 6.8.1 (build 6641) through the external
     * 3-Prism Camera plugin: pictures, continuous analysis frames and a preview in a `SurfaceView`. AutoJs6 has no camera
     * implementation of its own: while the plugin is missing, disabled or too old the calls throw a `CameraError` whose
     * `code` is `PLUGIN_NOT_INSTALLED`, `PLUGIN_DISABLED` or `HOST_VERSION_TOO_LOW`; {@link isAvailable} probes without
     * throwing.
     *
     * Frame lifetime: the `img` of an `analyze` callback (and of a `frame` listener) is valid only while the callback
     * runs. When it returns, AutoJs6 recycles the image at once and gives the buffer back to the plugin; touching it later
     * throws "image recycled". Call `img.clone()` to keep a copy beyond the callback and `recycle()` it yourself. Frames
     * that arrive while the callback still runs are dropped instead of queued (`state().dropped`, the `dropped` event).
     * Images returned by `capture` are ordinary images the script recycles.
     *
     * Discovery calls ({@link isAvailable}, {@link capabilities}, {@link list}, {@link requestPermission}) bind the
     * plugin: on the UI thread (a ui script) without a callback they return a Promise; with a callback as the only
     * argument they return `undefined` at once on any thread and call `callback(value, null)` or `callback(null, error)`
     * on the calling script thread; on other threads they return the value.
     */
    interface Camera {

        /** The error class of the module; `e instanceof camera.CameraError`. @since 6.8.1 */
        readonly CameraError: Camera.ErrorConstructor;

        /**
         * Whether the 3-Prism Camera plugin is installed, enabled and compatible; never throws.
         * @since 6.8.1
         */
        isAvailable(): boolean;
        /**
         * On the UI thread (a ui script) without a callback the call returns a Promise (it only resolves); name that form with the type argument: `await camera.isAvailable<Promise<boolean>>()`.
         * @since 6.8.1
         */
        isAvailable<R extends Promise<boolean>>(): R;
        /** Returns at once; `callback(available, null)` runs on the calling script thread. @since 6.8.1 */
        isAvailable(callback: Camera.DiscoveryCallback<boolean>): void;

        /**
         * The contract version, features, engine version, permission state and camera count of the plugin.
         * @since 6.8.1
         */
        capabilities(): Camera.Capabilities;
        /**
         * On the UI thread (a ui script) without a callback the call returns a Promise (it resolves with the value or rejects with a `CameraError`); name that form with the type argument: `await camera.capabilities<Promise<Internal.Camera.Capabilities>>()`.
         * @since 6.8.1
         */
        capabilities<R extends Promise<Camera.Capabilities>>(): R;
        /** Returns at once; `callback(value, null)` or `callback(null, error)` on the calling script thread. @since 6.8.1 */
        capabilities(callback: Camera.DiscoveryCallback<Camera.Capabilities>): void;

        /**
         * Asks for the camera permission of the plugin: `true` at once when it holds the permission, otherwise opens the
         * permission screen of the plugin (AutoJs6 has to be visible, else `UI_REQUIRES_FOREGROUND`) and waits until the
         * user comes back (at most two minutes); whether the plugin holds the permission then.
         * @since 6.8.1
         */
        requestPermission(): boolean;
        /**
         * On the UI thread (a ui script) without a callback the call returns a Promise (it resolves with the value or rejects with a `CameraError`); name that form with the type argument: `await camera.requestPermission<Promise<boolean>>()`.
         * @since 6.8.1
         */
        requestPermission<R extends Promise<boolean>>(): R;
        /** Returns at once; `callback(granted, null)` or `callback(null, error)` on the calling script thread. @since 6.8.1 */
        requestPermission(callback: Camera.DiscoveryCallback<boolean>): void;

        /** The cameras of the device (at most 16). @since 6.8.1 */
        list(): Camera.CameraInfo[];
        /**
         * On the UI thread (a ui script) without a callback the call returns a Promise (it resolves with the value or rejects with a `CameraError`); name that form with the type argument: `await camera.list<Promise<Internal.Camera.CameraInfo[]>>()`.
         * @since 6.8.1
         */
        list<R extends Promise<Camera.CameraInfo[]>>(): R;
        /** Returns at once; `callback(cameras, null)` or `callback(null, error)` on the calling script thread. @since 6.8.1 */
        list(callback: Camera.DiscoveryCallback<Camera.CameraInfo[]>): void;

        /**
         * Opens the camera exclusively (one session in the whole plugin, else `CAMERA_BUSY`). Keys left out are filled in
         * by the plugin from its settings page (default camera, analysis resolution and frame rate); `state()` gives the
         * values in effect. On the UI thread it returns at once and connects in the background: `state().open` stays
         * false meanwhile, controls wait in call order, `zoomState` / `exposureState` throw `INVALID_ARGUMENT` until
         * then, and a failed open arrives as the `error` event followed by `close("error")`. Elsewhere it returns once
         * the session is open.
         * @since 6.8.1
         */
        open(options?: Camera.OpenOptions): Camera.Session;

        /**
         * One picture: with a session of this script open it uses that camera, else it opens, captures and closes.
         * `{ ui: true }` opens the viewfinder of the plugin (AutoJs6 visible) and returns `null` when the user leaves it.
         * Not on the UI thread (`INVALID_ARGUMENT`), use {@link captureAsync} there. The image is the script's to recycle.
         * @since 6.8.1
         */
        capture(options?: Camera.ModuleCaptureOptions): ImageWrapper | null;

        /** The Promise form of {@link capture}; also usable on the UI thread. @since 6.8.1 */
        captureAsync(options?: Camera.ModuleCaptureOptions): Promise<ImageWrapper | null>;
    }

    namespace Camera {

        /** `callback(value, null)` on success, `callback(null, error)` on failure. */
        type DiscoveryCallback<T> = (value: T | null, error: CameraError | null) => void;

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
            | 'INTERNAL';

        interface ErrorDetails {
            /** Who holds the camera (`CAMERA_BUSY`): a script path, or `pluginUi` for the viewfinder of the plugin. */
            readonly holder: string | null;
            /** The camera concerned (`CAMERA_UNAVAILABLE`). */
            readonly cameraId: string | null;
            /** The bound that was exceeded (`INVALID_ARGUMENT`, `LIMIT_EXCEEDED`). */
            readonly limit: number | null;
            /** The untranslated detail. */
            readonly reason: string | null;
        }

        /** `name` is `'CameraError'`; `toString()` yields `CameraError [CODE]: message`; `message` is in the app language. */
        interface CameraError extends Error {
            readonly name: 'CameraError';
            readonly code: ErrorCode | string;
            readonly details: ErrorDetails;
        }

        interface ErrorConstructor {
            (message?: string, code?: ErrorCode | string, details?: Partial<ErrorDetails> | null): CameraError;
            new(message?: string, code?: ErrorCode | string, details?: Partial<ErrorDetails> | null): CameraError;
            readonly prototype: CameraError;
        }

        type Facing = 'back' | 'front';
        type FlashMode = 'off' | 'on' | 'auto';
        /** `script`: close() or the end of the script; `pluginUi`: the viewfinder of the plugin took the camera (the script then stops). */
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
            readonly facing: Facing | 'external' | string;
            readonly hasFlash: boolean;
            readonly sensorRotation: number;
            /** `[min, max]`. */
            readonly zoomRange: number[];
            /** `[min, max]`. */
            readonly exposureRange: number[];
            readonly exposureStep: number;
            /** `"WxH"` strings. */
            readonly analysisResolutions: string[];
            readonly captureResolutions: string[];
        }

        interface OpenOptions {
            /**
             * `facing` and `id` exclude each other. Left out (with `id` too), the plugin opens the camera chosen on its
             * settings page (the back camera unless the user changed it).
             */
            facing?: Facing;
            /** An `id` of {@link Camera.list}. */
            id?: string;
            /**
             * Analysis resolution `"WxH"`, 160x120 - 1920x1080. Left out, the default of the settings page of the plugin
             * (640x480 unless the user changed it).
             */
            resolution?: string;
            /** Target frame rate, 1 - 60. Left out, the default of the settings page (the camera's own rate unless changed). */
            fps?: number;
            /** Frames turned upright to the screen orientation; default true. */
            upright?: boolean;
            /**
             * Mirror the frames and pictures (both agree); default false. The preview of a front camera is always mirrored,
             * whatever this option says.
             */
            mirror?: boolean;
            /** Flash of pictures; default `"auto"`. */
            flashMode?: FlashMode;
        }

        /** Overrides of the open options for one analysis. */
        interface AnalyzeOptions {
            resolution?: string;
            fps?: number;
            upright?: boolean;
            mirror?: boolean;
        }

        interface CaptureOptions {
            /** Also writes the JPEG (EXIF kept) to this path. */
            path?: string;
            /** JPEG quality 1 - 100; default 95. */
            quality?: number;
            flashMode?: FlashMode;
            /** Capture resolution `"WxH"`. */
            resolution?: string;
            mirror?: boolean;
        }

        interface ModuleCaptureOptions extends CaptureOptions {
            /** Opens the viewfinder of the plugin (AutoJs6 visible); `null` when the user leaves it. */
            ui?: boolean;
            facing?: Facing;
            id?: string;
        }

        interface FocusOptions {
            /** Size of the metering area, 0 - 1; default 0.15. */
            size?: number;
            /** Milliseconds until the focus lock is released, 0 - 60000; default 5000. */
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
            /** Frames of this analysis dropped so far. */
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
            /** False while a session opened on the UI thread still connects, and after the session closed. */
            readonly open: boolean;
            readonly previewing: boolean;
            readonly analyzing: boolean;
            readonly id: string | null;
            readonly facing: Facing | string | null;
            /** The analysis size in effect, null when not analyzing. */
            readonly resolution: string | null;
            readonly fps: number | null;
            /** True for the preview of a front camera. */
            readonly previewMirrored: boolean;
            readonly torch: boolean;
            readonly flashMode: FlashMode | string | null;
            readonly zoom: number | null;
            readonly exposure: number | null;
            readonly frames: number;
            readonly dropped: number;
            readonly holder: string | null;
        }

        /**
         * Valid only while the callback runs: AutoJs6 recycles `img` when it returns; keep a copy with `img.clone()` and
         * recycle that yourself. A callback slower than the frame interval drops frames instead of queuing them.
         */
        type FrameCallback = (this: Session, img: ImageWrapper, meta: FrameMeta) => void;

        interface Session extends EventEmitter$ {
            /** The script path (or label) holding the session. */
            readonly holder: string | null;
            /** Frames dropped in the current analysis, or in the last one. */
            readonly dropped: number;

            /** Shows the camera in a `SurfaceView` of a ui layout or a floating window; the preview follows the surface. */
            preview(view: any, options?: {}): this;
            stopPreview(): this;
            /** Starts the analysis (one already running stops first). Frames: see {@link FrameCallback}. */
            analyze(callback?: FrameCallback | null, options?: AnalyzeOptions): this;
            analyze(options?: AnalyzeOptions): this;
            stopAnalysis(): this;
            /** Not on the UI thread; use {@link captureAsync} there. */
            capture(options?: CaptureOptions): ImageWrapper;
            captureAsync(options?: CaptureOptions): Promise<ImageWrapper>;
            torch(enabled: boolean): this;
            flashMode(mode: FlashMode): this;
            zoom(ratio: number): this;
            /** 0 - 1 between the minimum and the maximum zoom. */
            zoomLinear(linear: number): this;
            exposure(index: number): this;
            /** On the UI thread `INVALID_ARGUMENT` until `state().open` is true. */
            zoomState(): ZoomState;
            /** On the UI thread `INVALID_ARGUMENT` until `state().open` is true. */
            exposureState(): ExposureState;
            /**
             * Focuses at normalized coordinates (0 - 1 of the upright picture), waiting at most 5 seconds; whether the focus
             * locked. Not on the UI thread.
             */
            focusAt(x: number, y: number, options?: FocusOptions): boolean;
            state(): SessionState;
            /** Ends the session (reason `script`); idempotent. */
            close(): void;
            isClosed(): boolean;

            /** The image is valid only while the listener runs. */
            on(event: 'frame', listener: (this: Session, img: ImageWrapper, meta: FrameMeta) => void): this;
            on(event: 'dropped', listener: (this: Session, count: number, lastSeq: number) => void): this;
            on(event: 'error', listener: (this: Session, error: CameraError) => void): this;
            on(event: 'close', listener: (this: Session, reason: CloseReason) => void): this;
            on(event: string, listener: (...args: any[]) => void): this;
            once(event: string, listener: (...args: any[]) => void): this;
            /** Without a listener, removes every listener of the event. */
            off(event: string, listener?: (...args: any[]) => void): this;
        }
    }
}
