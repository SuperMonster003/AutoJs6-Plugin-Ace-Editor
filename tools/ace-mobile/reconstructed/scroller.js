// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Module: "ace/mouse/scroller.js"; original bytes: original/scroller.min.js.
//
// A port of the spline fling of Android's OverScroller (AOSP frameworks/base, Apache-2.0):
// the spline tables, DECELERATION_RATE, INFLEXION, START_TENSION and END_TENSION match
// OverScroller.SplineOverScroller. Only the fling path is ported (no spring back / overscroll).
// This reconstruction is a reference for porting and auditing.
ace.define("ace/mouse/scroller.js", ["require", "exports", "module"], function (require, exports, module) {
    "use strict";
    var GRAVITY_EARTH = 9.80665; // SensorManager.GRAVITY_EARTH
    var DECELERATION_RATE = Math.log(0.78) / Math.log(0.9);
    var INFLEXION = 0.35;
    var START_TENSION = 0.5;
    var END_TENSION = 1;
    var P1 = START_TENSION * INFLEXION;
    var P2 = 1 - END_TENSION * (1 - INFLEXION);
    var NB_SAMPLES = 100;
    var SPLINE_POSITION = new Array(NB_SAMPLES + 1);
    var SPLINE_TIME = new Array(NB_SAMPLES + 1);

    function currentAnimationTimeMillis() {
        return Date.now();
    }

    function Scroller(interpolator, flywheel, friction) {
        this.mInterpolator = interpolator;
        this.mFlywheel = flywheel;
        this.mFinished = true;
        // Fixed density instead of the device value (Android: displayMetrics.density * 160).
        this.mPpi = 440;
        this.mFlingFriction = friction;
        this.mPhysicalCoeff = this.computeDeceleration(0.84);
        this.mDeceleration = this.computeDeceleration(friction);
        // Quirk: the field is spelled "mCurrenVelocity" here and in getCurrVelocity(), while
        // computeScrollOffset() writes "mCurrVelocity". getCurrVelocity() therefore always returns 0
        // and the flywheel boost in fling() never adds velocity.
        this.mCurrenVelocity = 0;
        this.mVelocity = 0;
        this.mDuration = 0;
        this.mStartTime = 0;
        this.mStartX = 0;
        this.mStartY = 0;
        this.mDistance = 0;
        this.mMinX = 0;
        this.mMinY = 0;
        this.mMaxX = 0;
        this.mMaxY = 0;
        this.mFinalX = 0;
        this.mFinalY = 0;
    }

    function initSplineTables() {
        var xMin = 0;
        var yMin = 0;
        for (var i = 0; i < NB_SAMPLES; i++) {
            var alpha = i / NB_SAMPLES;
            var xMax = 1;
            var x, tx, coef;
            for (;;) {
                x = xMin + (xMax - xMin) / 2;
                coef = 3 * x * (1 - x);
                tx = coef * ((1 - x) * P1 + x * P2) + x * x * x;
                if (Math.abs(tx - alpha) < 1e-5) break;
                if (tx > alpha) xMax = x;
                else xMin = x;
            }
            SPLINE_POSITION[i] = coef * ((1 - x) * START_TENSION + x) + x * x * x;
            var yMax = 1;
            var y, dy;
            for (;;) {
                y = yMin + (yMax - yMin) / 2;
                coef = 3 * y * (1 - y);
                dy = coef * ((1 - y) * START_TENSION + y) + y * y * y;
                if (Math.abs(dy - alpha) < 1e-5) break;
                if (dy > alpha) yMax = y;
                else yMin = y;
            }
            SPLINE_TIME[i] = coef * ((1 - y) * P1 + y * P2) + y * y * y;
        }
        SPLINE_POSITION[NB_SAMPLES] = SPLINE_TIME[NB_SAMPLES] = 1;
    }

    initSplineTables();

    // ViewConfiguration.getScrollFriction() is 0.015.
    Scroller.createDefault = function () {
        return new Scroller(null, true, 0.015);
    };

    Scroller.prototype.fling = function (startX, startY, velocityX, velocityY, minX, maxX, minY, maxY) {
        if (this.mFlywheel && !this.mFinished) {
            var oldVelocity = this.getCurrVelocity();
            var dx = this.mFinalX - this.mStartX;
            var dy = this.mFinalY - this.mStartY;
            var hyp = Math.hypot(dx, dy);
            var ndx = dx / hyp;
            var ndy = dy / hyp;
            var oldVelocityX = ndx * oldVelocity;
            var oldVelocityY = ndy * oldVelocity;
            if (
                Math.signum(velocityX) == Math.signum(oldVelocityX) &&
                Math.signum(velocityY) == Math.signum(oldVelocityY)
            ) {
                velocityX += oldVelocityX;
                velocityY += oldVelocityY;
            }
        }
        this.mFinished = false;
        var velocity = Math.hypot(velocityX, velocityY);
        this.mVelocity = velocity;
        this.mDuration = this.getSplineFlingDuration(velocity);
        this.mStartTime = currentAnimationTimeMillis();
        this.mStartX = startX;
        this.mStartY = startY;
        var coeffX = velocity == 0 ? 1 : velocityX / velocity;
        var coeffY = velocity == 0 ? 1 : velocityY / velocity;
        var totalDistance = this.getSplineFlingDistance(velocity);
        this.mDistance = parseInt(totalDistance * Math.signum(velocity));
        this.mMinX = minX;
        this.mMaxX = maxX;
        this.mMinY = minY;
        this.mMaxY = maxY;
        this.mFinalX = startX + Math.round(totalDistance * coeffX);
        this.mFinalX = Math.min(this.mFinalX, this.mMaxX);
        this.mFinalX = Math.max(this.mFinalX, this.mMinX);
        this.mFinalY = startY + Math.round(totalDistance * coeffY);
        this.mFinalY = Math.min(this.mFinalY, this.mMaxY);
        this.mFinalY = Math.max(this.mFinalY, this.mMinY);
    };

    Scroller.prototype.computeDeceleration = function (friction) {
        return GRAVITY_EARTH * 39.37 * this.mPpi * friction; // inch/meter
    };

    Scroller.prototype.getCurrVelocity = function () {
        return this.mCurrenVelocity;
    };

    Scroller.prototype.getSplineFlingDuration = function (velocity) {
        var l = this.getSplineDeceleration(velocity);
        var decelMinusOne = DECELERATION_RATE - 1;
        return parseInt(1e3 * Math.exp(l / decelMinusOne));
    };

    Scroller.prototype.getSplineFlingDistance = function (velocity) {
        var l = this.getSplineDeceleration(velocity);
        var decelMinusOne = DECELERATION_RATE - 1;
        return this.mFlingFriction * this.mPhysicalCoeff * Math.exp((DECELERATION_RATE / decelMinusOne) * l);
    };

    Scroller.prototype.getSplineDeceleration = function (velocity) {
        return Math.log((INFLEXION * Math.abs(velocity)) / (this.mFlingFriction * this.mPhysicalCoeff));
    };

    // Returns false only when the animation had already finished before this call; the call that
    // reaches the final position still returns true.
    Scroller.prototype.computeScrollOffset = function () {
        if (this.mFinished) return false;
        var timePassed = parseInt(currentAnimationTimeMillis() - this.mStartTime);
        if (timePassed < this.mDuration) {
            var t = timePassed / this.mDuration;
            var index = parseInt(NB_SAMPLES * t);
            var distanceCoef = 1;
            var velocityCoef = 0;
            if (index < NB_SAMPLES) {
                var tInf = index / NB_SAMPLES;
                var tSup = (index + 1) / NB_SAMPLES;
                var dInf = SPLINE_POSITION[index];
                var dSup = SPLINE_POSITION[index + 1];
                velocityCoef = (dSup - dInf) / (tSup - tInf);
                distanceCoef = dInf + (t - tInf) * velocityCoef;
            }
            this.mCurrVelocity = ((velocityCoef * this.mDistance) / this.mDuration) * 1e3;
            this.mCurrX = this.mStartX + Math.round(distanceCoef * (this.mFinalX - this.mStartX));
            this.mCurrX = Math.min(this.mCurrX, this.mMaxX);
            this.mCurrX = Math.max(this.mCurrX, this.mMinX);
            this.mCurrY = this.mStartY + Math.round(distanceCoef * (this.mFinalY - this.mStartY));
            this.mCurrY = Math.min(this.mCurrY, this.mMaxY);
            this.mCurrY = Math.max(this.mCurrY, this.mMinY);
            if (this.mCurrX == this.mFinalX && this.mCurrY == this.mFinalY) this.mFinished = true;
        } else {
            this.mCurrX = this.mFinalX;
            this.mCurrY = this.mFinalY;
            this.mFinished = true;
        }
        return true;
    };

    Scroller.prototype.getCurrX = function () {
        return this.mCurrX;
    };

    Scroller.prototype.getCurrY = function () {
        return this.mCurrY;
    };

    Scroller.prototype.isFinished = function () {
        return this.mFinished;
    };

    Scroller.prototype.abortAnimation = function () {
        this.mCurrX = this.mFinalX;
        this.mCurrY = this.mFinalY;
        this.mFinished = true;
    };

    exports.Scroller = Scroller;
});
