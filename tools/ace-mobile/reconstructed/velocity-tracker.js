// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Module: "ace/mouse/velocity-tracker.js"; original bytes: original/velocity-tracker.min.js.
//
// Estimates the touch velocity from the samples of the last 100 ms with a least-squares fit
// (Android VelocityTracker style). This reconstruction is a reference for porting and auditing.
ace.define(
    "ace/mouse/velocity-tracker.js",
    ["require", "exports", "module", "ace/mouse/regression.js"],
    function (require, exports) {
        "use strict";
        // Declared by the original module but never read.
        var UNUSED_DEGREE = 2;
        var HORIZON_MS = 100;

        var Point = (function () {
            function Point(x, y, timeStamp) {
                this.x = x;
                this.y = y;
                this.timeStamp = timeStamp;
            }
            return Point;
        })();
        exports.Point = Point;

        var regression = require("./regression.js");

        var VelocityTracker = (function () {
            function VelocityTracker() {
                this.clear();
            }

            // Returns the first-order coefficient (px per ms) of the fit through `samples`
            // ([relativeTimeMs, position] pairs, newest first, relative time <= 0).
            function solveSlope(samples) {
                if (samples.length < 2) return 0;
                // Quirk: the original compares the sample array itself with 3. An array of pairs converts to
                // NaN, so the comparison is always false and the fit is always first order (linear).
                var order = samples >= 3 ? 2 : 1;
                var result = regression.polynomial(samples, { order: order });
                // regression.polynomial rounds every coefficient to 2 decimals (DEFAULT_OPTIONS.precision),
                // so the slope is quantized to 0.01 px/ms, i.e. 10 px/s after computeVelocity(1000).
                return result.equation[result.equation.length - 2];
            }

            VelocityTracker.prototype.clear = function () {
                this.points = new Array();
                this.vx = 0;
                this.vy = 0;
                // Debug leftovers, never read.
                this.kotlin = "";
                this.js = "";
            };

            VelocityTracker.prototype.addMovement = function (point, timeStamp) {
                if (typeof timeStamp == "undefined") timeStamp = Date.now();
                this.points.push(new Point(point.x, point.y, timeStamp));
            };

            VelocityTracker.prototype.getPoint = function (index) {
                return this.points[index];
            };

            // `units` scales px/ms (1000 -> px/s). The result is negated: a finger moving down yields a
            // negative vy, which is the direction the scroll offset has to move for a fling.
            VelocityTracker.prototype.computeVelocity = function (units) {
                if (this.points.length < 2) {
                    this.vx = 0;
                    this.vy = 0;
                    return false;
                }
                var newest = this.points[this.points.length - 1];
                var xSamples = new Array();
                var ySamples = new Array();
                for (var i = this.points.length - 1; i >= 0; i--) {
                    var point = this.points[i];
                    var age = newest.timeStamp - point.timeStamp;
                    if (age > HORIZON_MS) break;
                    xSamples.push([-age, point.x]);
                    ySamples.push([-age, point.y]);
                }
                // Re-checks the total point count (not the windowed samples); solveSlope returns 0 when
                // fewer than two samples fall inside the window.
                if (this.points.length < 2) {
                    this.vx = 0;
                    this.vy = 0;
                    return false;
                }
                this.vx = -solveSlope(xSamples) * units;
                this.vy = -solveSlope(ySamples) * units;
                return true;
            };

            VelocityTracker.prototype.getXVelocity = function () {
                return this.vx;
            };

            VelocityTracker.prototype.getYVelocity = function (id, unused) {
                return this.vy;
            };

            return VelocityTracker;
        })();
        exports.VelocityTracker = VelocityTracker;
    },
);

// Evaluated together with the module definition above (outside of the module factory).
// The scroller module relies on this global polyfill.
Math.signum ||
    (Math.signum = function (value) {
        return value === 0 ? 0 : value > 0 ? 1 : -1;
    });
