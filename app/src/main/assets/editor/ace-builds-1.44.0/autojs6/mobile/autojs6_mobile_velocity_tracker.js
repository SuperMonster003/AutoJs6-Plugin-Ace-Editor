// Touch velocity estimation of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-2).
//
// A first-order least squares fit over the samples of the last 100 ms. The normal equations are solved the way
// regression-js 2.0 (Tom Alexander, MIT) solves polynomial fits and the slope is rounded to 0.01 px/ms, as in the
// Ace 1.4.12 Auto.js build, so that flings keep the same velocities (tools/ace-mobile verifies this).
ace.define("autojs6/mobile/velocity_tracker", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var HORIZON_MS = 100;
    var PRECISION = 2;

    function round(value) {
        var factor = Math.pow(10, PRECISION);
        return Math.round(value * factor) / factor;
    }

    // Gaussian elimination with column pivoting on the column-major normal equations (regression-js 2.0).
    function solve(matrix, order) {
        var n = matrix.length - 1;
        var coefficients = [order];
        for (var i = 0; i < n; i++) {
            var pivot = i;
            for (var j = i + 1; j < n; j++) {
                if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][pivot])) {
                    pivot = j;
                }
            }
            for (var k = i; k < n + 1; k++) {
                var swap = matrix[k][i];
                matrix[k][i] = matrix[k][pivot];
                matrix[k][pivot] = swap;
            }
            for (var row = i + 1; row < n; row++) {
                for (var column = n; column >= i; column--) {
                    matrix[column][row] -= (matrix[column][i] * matrix[i][row]) / matrix[i][i];
                }
            }
        }
        for (var back = n - 1; back >= 0; back--) {
            var total = 0;
            for (var next = back + 1; next < n; next++) {
                total += matrix[next][back] * coefficients[next];
            }
            coefficients[back] = (matrix[n][back] - total) / matrix[back][back];
        }
        return coefficients;
    }

    // Slope (px/ms) of the line through [relativeTimeMs, position] samples.
    function slope(samples) {
        if (samples.length < 2) {
            return 0;
        }
        var terms = 2;
        var matrix = [];
        var rightHandSide = [];
        for (var i = 0; i < terms; i++) {
            var weighted = 0;
            for (var s = 0; s < samples.length; s++) {
                weighted += Math.pow(samples[s][0], i) * samples[s][1];
            }
            rightHandSide.push(weighted);
            var column = [];
            for (var j = 0; j < terms; j++) {
                var powerSum = 0;
                for (var p = 0; p < samples.length; p++) {
                    powerSum += Math.pow(samples[p][0], i + j);
                }
                column.push(powerSum);
            }
            matrix.push(column);
        }
        matrix.push(rightHandSide);
        return round(solve(matrix, terms)[1]);
    }

    function VelocityTracker() {
        this.clear();
    }

    VelocityTracker.prototype.clear = function() {
        this.points = [];
        this.velocityX = 0;
        this.velocityY = 0;
    };

    VelocityTracker.prototype.addMovement = function(x, y, timeStamp) {
        this.points.push({ x: x, y: y, timeStamp: timeStamp });
    };

    // Velocity in px per `units` ms, negated so that it points in the direction the scroll offset has to move.
    VelocityTracker.prototype.computeVelocity = function(units) {
        if (this.points.length < 2) {
            this.velocityX = 0;
            this.velocityY = 0;
            return false;
        }
        var newest = this.points[this.points.length - 1];
        var xSamples = [];
        var ySamples = [];
        for (var i = this.points.length - 1; i >= 0; i--) {
            var point = this.points[i];
            var age = newest.timeStamp - point.timeStamp;
            if (age > HORIZON_MS) {
                break;
            }
            xSamples.push([-age, point.x]);
            ySamples.push([-age, point.y]);
        }
        this.velocityX = -slope(xSamples) * units;
        this.velocityY = -slope(ySamples) * units;
        return true;
    };

    exports.VelocityTracker = VelocityTracker;
});
