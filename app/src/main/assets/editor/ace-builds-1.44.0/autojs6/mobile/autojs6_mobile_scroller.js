// Fling animation of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-1, rewritten for A0-5).
//
// The motion follows the spline fling of Android's android.widget.Scroller (Android Open Source Project, Apache
// License 2.0, see THIRD_PARTY_NOTICES.md): a fling covers getSplineFlingDistance(v) in getSplineFlingDuration(v),
// and the position at time t is interpolated from a 100-sample table of the spline. Parameters match the editor
// touch behavior that AutoJs6 users know (tools/ace-mobile/README.md): 440 ppi, scroll friction 0.015, one combined
// two-dimensional fling, positions clamped to the bounds and no flywheel. JavaScript doubles replace Java floats.
ace.define("autojs6/mobile/scroller", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var SAMPLE_COUNT = 100;
    var PIXELS_PER_INCH = 440;
    var SCROLL_FRICTION = 0.015;
    var DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
    var INFLEXION = 0.35;
    var START_TENSION = 0.5;
    var END_TENSION = 1;
    var GRAVITY_EARTH = 9.80665;
    // Deceleration of a fling in px/s^2 per unit friction (Android: GRAVITY_EARTH * 39.37 * ppi * 0.84).
    var PHYSICAL_COEFFICIENT = GRAVITY_EARTH * 39.37 * PIXELS_PER_INCH * 0.84;

    // splinePosition[i]: share of the fling distance covered after i / SAMPLE_COUNT of its duration.
    var splinePosition = (function() {
        var p1 = START_TENSION * INFLEXION;
        var p2 = 1 - END_TENSION * (1 - INFLEXION);
        var table = [];
        var lower = 0;
        for (var sample = 0; sample < SAMPLE_COUNT; sample++) {
            var target = sample / SAMPLE_COUNT;
            var upper = 1;
            var x;
            var weight;
            // Bisection for the curve parameter whose time coordinate reaches the sample time.
            while (true) {
                x = lower + (upper - lower) / 2;
                weight = 3 * x * (1 - x);
                var time = weight * ((1 - x) * p1 + x * p2) + x * x * x;
                if (Math.abs(time - target) < 1e-5) {
                    break;
                }
                if (time > target) {
                    upper = x;
                } else {
                    lower = x;
                }
            }
            table.push(weight * ((1 - x) * START_TENSION + x) + x * x * x);
        }
        table.push(1);
        return table;
    })();

    function decelerationLog(velocity) {
        return Math.log((INFLEXION * Math.abs(velocity)) / (SCROLL_FRICTION * PHYSICAL_COEFFICIENT));
    }

    function flingDurationMs(velocity) {
        return Math.floor(1000 * Math.exp(decelerationLog(velocity) / (DECELERATION_RATE - 1)));
    }

    function flingDistancePx(velocity) {
        var exponent = DECELERATION_RATE / (DECELERATION_RATE - 1);
        return SCROLL_FRICTION * PHYSICAL_COEFFICIENT * Math.exp(exponent * decelerationLog(velocity));
    }

    // Share of the distance covered at fraction t (0 <= t < 1) of the duration, linear between table samples.
    function distanceShareAt(t) {
        var index = Math.floor(SAMPLE_COUNT * t);
        if (index >= SAMPLE_COUNT) {
            return 1;
        }
        var startTime = index / SAMPLE_COUNT;
        var endTime = (index + 1) / SAMPLE_COUNT;
        var startShare = splinePosition[index];
        var slope = (splinePosition[index + 1] - startShare) / (endTime - startTime);
        return startShare + (t - startTime) * slope;
    }

    function limit(value, lowest, highest) {
        return Math.max(Math.min(value, highest), lowest);
    }

    // now(): milliseconds clock (Date.now by default).
    function Scroller(now) {
        this.now = now || Date.now;
        this.motion = null;
        this.currX = 0;
        this.currY = 0;
    }

    // Starts a fling from (startX, startY). Velocities are in px/s in the direction the scroll offset moves;
    // bounds = { minX, maxX, minY, maxY }.
    Scroller.prototype.fling = function(startX, startY, velocityX, velocityY, bounds) {
        var speed = Math.hypot(velocityX, velocityY);
        var directionX = speed === 0 ? 1 : velocityX / speed;
        var directionY = speed === 0 ? 1 : velocityY / speed;
        var distance = flingDistancePx(speed);
        this.motion = {
            startedAt: this.now(),
            durationMs: flingDurationMs(speed),
            fromX: startX,
            fromY: startY,
            toX: limit(startX + Math.round(distance * directionX), bounds.minX, bounds.maxX),
            toY: limit(startY + Math.round(distance * directionY), bounds.minY, bounds.maxY),
            bounds: bounds
        };
    };

    // Advances currX / currY to the current time. Returns false once the fling has ended; the step that
    // reaches the end still returns true.
    Scroller.prototype.computeScrollOffset = function() {
        var motion = this.motion;
        if (!motion) {
            return false;
        }
        var elapsed = Math.floor(this.now() - motion.startedAt);
        if (elapsed >= motion.durationMs) {
            this.finish();
            return true;
        }
        var share = distanceShareAt(elapsed / motion.durationMs);
        this.currX = limit(motion.fromX + Math.round(share * (motion.toX - motion.fromX)),
            motion.bounds.minX, motion.bounds.maxX);
        this.currY = limit(motion.fromY + Math.round(share * (motion.toY - motion.fromY)),
            motion.bounds.minY, motion.bounds.maxY);
        if (this.currX === motion.toX && this.currY === motion.toY) {
            this.motion = null;
        }
        return true;
    };

    // Jumps to the end of the fling.
    Scroller.prototype.abortAnimation = function() {
        if (this.motion) {
            this.finish();
        }
    };

    Scroller.prototype.finish = function() {
        this.currX = this.motion.toX;
        this.currY = this.motion.toY;
        this.motion = null;
    };

    Scroller.prototype.isFinished = function() {
        return !this.motion;
    };

    exports.Scroller = Scroller;
});
