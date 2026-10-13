// Touch velocity estimation of the AutoJs6 mobile overlay (Roadmap-Ace-1.44.0.md A2-2, rewritten for A0-5).
//
// Velocity is the slope of a least squares line through the samples of the last 100 ms, rounded to 0.01 px/ms.
// The normal equations are solved by Gaussian elimination with partial pivoting as in regression-js 2.0
// (Tom Alexander, MIT License, see THIRD_PARTY_NOTICES.md), so the rounded slopes are reproducible bit for bit.
ace.define("autojs6/mobile/velocity_tracker", ["require", "exports", "module"], function(require, exports) {
    "use strict";

    var WINDOW_MS = 100;
    var SLOPE_DECIMALS = 2;

    // Solves the augmented system stored column by column (columns[k][row]); columns.length - 1 unknowns.
    function solveColumns(columns) {
        var size = columns.length - 1;
        for (var pivotColumn = 0; pivotColumn < size; pivotColumn++) {
            var best = pivotColumn;
            for (var row = pivotColumn + 1; row < size; row++) {
                if (Math.abs(columns[pivotColumn][row]) > Math.abs(columns[pivotColumn][best])) {
                    best = row;
                }
            }
            for (var column = pivotColumn; column <= size; column++) {
                var kept = columns[column][pivotColumn];
                columns[column][pivotColumn] = columns[column][best];
                columns[column][best] = kept;
            }
            for (var lower = pivotColumn + 1; lower < size; lower++) {
                for (var eliminated = size; eliminated >= pivotColumn; eliminated--) {
                    columns[eliminated][lower] -=
                        (columns[eliminated][pivotColumn] * columns[pivotColumn][lower]) / columns[pivotColumn][pivotColumn];
                }
            }
        }
        var unknowns = [];
        for (var index = size - 1; index >= 0; index--) {
            var known = 0;
            for (var later = index + 1; later < size; later++) {
                known += columns[later][index] * unknowns[later];
            }
            unknowns[index] = (columns[size][index] - known) / columns[index][index];
        }
        return unknowns;
    }

    // Least squares line value = intercept + slope * time through [time, value] points; returns the rounded slope.
    function fittedSlope(points) {
        if (points.length < 2) {
            return 0;
        }
        var columns = [];
        var rightHandSide = [];
        for (var power = 0; power < 2; power++) {
            var weightedValues = 0;
            for (var p = 0; p < points.length; p++) {
                weightedValues += Math.pow(points[p][0], power) * points[p][1];
            }
            rightHandSide.push(weightedValues);
            var column = [];
            for (var other = 0; other < 2; other++) {
                var momentSum = 0;
                for (var q = 0; q < points.length; q++) {
                    momentSum += Math.pow(points[q][0], power + other);
                }
                column.push(momentSum);
            }
            columns.push(column);
        }
        columns.push(rightHandSide);
        var scale = Math.pow(10, SLOPE_DECIMALS);
        return Math.round(solveColumns(columns)[1] * scale) / scale;
    }

    function VelocityTracker() {
        this.clear();
    }

    VelocityTracker.prototype.clear = function() {
        this.samples = [];
        this.velocityX = 0;
        this.velocityY = 0;
    };

    VelocityTracker.prototype.addMovement = function(x, y, timeStamp) {
        this.samples.push({ x: x, y: y, time: timeStamp });
    };

    // Computes velocityX / velocityY in px per `units` ms. They point against the finger: the direction in which
    // the scroll offset has to move. Returns false when fewer than two samples exist.
    VelocityTracker.prototype.computeVelocity = function(units) {
        this.velocityX = 0;
        this.velocityY = 0;
        if (this.samples.length < 2) {
            return false;
        }
        var latest = this.samples[this.samples.length - 1].time;
        var horizontal = [];
        var vertical = [];
        // Newest first; time is measured backwards from the latest sample (0, -8, -16, ...).
        for (var index = this.samples.length - 1; index >= 0; index--) {
            var sample = this.samples[index];
            var age = latest - sample.time;
            if (age > WINDOW_MS) {
                break;
            }
            horizontal.push([-age, sample.x]);
            vertical.push([-age, sample.y]);
        }
        this.velocityX = -fittedSlope(horizontal) * units;
        this.velocityY = -fittedSlope(vertical) * units;
        return true;
    };

    exports.VelocityTracker = VelocityTracker;
});
