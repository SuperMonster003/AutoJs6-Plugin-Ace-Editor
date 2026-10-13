// Fling animation of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-1).
//
// The spline follows Android's OverScroller.SplineOverScroller (AOSP, Apache-2.0) with the constants of the
// Ace 1.4.12 Auto.js build: fixed 440 ppi density, friction 0.015 and no spring back. The arithmetic keeps the
// original operation order so that scroll offsets match the 1.4.12 build exactly (tools/ace-mobile).
ace.define("autojs6/mobile/scroller", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var GRAVITY_EARTH = 9.80665;
    var INCHES_PER_METER = 39.37;
    var PPI = 440;
    var FLING_FRICTION = 0.015;
    var DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
    var INFLEXION = 0.35;
    var START_TENSION = 0.5;
    var END_TENSION = 1;
    var P1 = START_TENSION * INFLEXION;
    var P2 = 1 - END_TENSION * (1 - INFLEXION);
    var NB_SAMPLES = 100;
    var PHYSICAL_COEFF = GRAVITY_EARTH * INCHES_PER_METER * PPI * 0.84;
    var SPLINE_POSITION = createSplinePositions();

    // Distance fraction covered at time fraction index / NB_SAMPLES.
    function createSplinePositions() {
        var positions = new Array(NB_SAMPLES + 1);
        var xMin = 0;
        for (var i = 0; i < NB_SAMPLES; i++) {
            var alpha = i / NB_SAMPLES;
            var xMax = 1;
            var x;
            var coef;
            for (;;) {
                x = xMin + (xMax - xMin) / 2;
                coef = 3 * x * (1 - x);
                var tx = coef * ((1 - x) * P1 + x * P2) + x * x * x;
                if (Math.abs(tx - alpha) < 1e-5) {
                    break;
                }
                if (tx > alpha) {
                    xMax = x;
                } else {
                    xMin = x;
                }
            }
            positions[i] = coef * ((1 - x) * START_TENSION + x) + x * x * x;
        }
        positions[NB_SAMPLES] = 1;
        return positions;
    }

    function splineDeceleration(velocity) {
        return Math.log((INFLEXION * Math.abs(velocity)) / (FLING_FRICTION * PHYSICAL_COEFF));
    }

    function splineFlingDuration(velocity) {
        return Math.floor(1e3 * Math.exp(splineDeceleration(velocity) / (DECELERATION_RATE - 1)));
    }

    function splineFlingDistance(velocity) {
        var decelerationRateMinusOne = DECELERATION_RATE - 1;
        return FLING_FRICTION * PHYSICAL_COEFF *
            Math.exp((DECELERATION_RATE / decelerationRateMinusOne) * splineDeceleration(velocity));
    }

    function clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }

    function Scroller(now) {
        this.now = now || Date.now;
        this.finished = true;
        this.duration = 0;
        this.startTime = 0;
        this.startX = 0;
        this.startY = 0;
        this.finalX = 0;
        this.finalY = 0;
        this.currX = 0;
        this.currY = 0;
        this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // Velocities are in px/s in the direction the scroll offset moves.
    Scroller.prototype.fling = function(startX, startY, velocityX, velocityY, bounds) {
        var velocity = Math.hypot(velocityX, velocityY);
        var coeffX = velocity === 0 ? 1 : velocityX / velocity;
        var coeffY = velocity === 0 ? 1 : velocityY / velocity;
        var distance = splineFlingDistance(velocity);
        this.finished = false;
        this.duration = splineFlingDuration(velocity);
        this.startTime = this.now();
        this.startX = startX;
        this.startY = startY;
        this.bounds = bounds;
        this.finalX = clamp(startX + Math.round(distance * coeffX), bounds.minX, bounds.maxX);
        this.finalY = clamp(startY + Math.round(distance * coeffY), bounds.minY, bounds.maxY);
    };

    // Returns false only when the animation had already finished; the step reaching the end returns true.
    Scroller.prototype.computeScrollOffset = function() {
        if (this.finished) {
            return false;
        }
        var elapsed = Math.floor(this.now() - this.startTime);
        if (elapsed < this.duration) {
            var t = elapsed / this.duration;
            var index = Math.floor(NB_SAMPLES * t);
            var distanceCoef = 1;
            if (index < NB_SAMPLES) {
                var tInf = index / NB_SAMPLES;
                var tSup = (index + 1) / NB_SAMPLES;
                var dInf = SPLINE_POSITION[index];
                var velocityCoef = (SPLINE_POSITION[index + 1] - dInf) / (tSup - tInf);
                distanceCoef = dInf + (t - tInf) * velocityCoef;
            }
            this.currX = clamp(
                this.startX + Math.round(distanceCoef * (this.finalX - this.startX)),
                this.bounds.minX,
                this.bounds.maxX
            );
            this.currY = clamp(
                this.startY + Math.round(distanceCoef * (this.finalY - this.startY)),
                this.bounds.minY,
                this.bounds.maxY
            );
            if (this.currX === this.finalX && this.currY === this.finalY) {
                this.finished = true;
            }
        } else {
            this.currX = this.finalX;
            this.currY = this.finalY;
            this.finished = true;
        }
        return true;
    };

    Scroller.prototype.abortAnimation = function() {
        this.currX = this.finalX;
        this.currY = this.finalY;
        this.finished = true;
    };

    Scroller.prototype.isFinished = function() {
        return this.finished;
    };

    exports.Scroller = Scroller;
});
