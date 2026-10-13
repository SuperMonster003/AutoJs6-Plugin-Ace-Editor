// Reconstructed from the Auto.js customized Ace build (ace-builds-1.4.12/src-min-noconflict/ace.js).
// Module: "ace/mouse/regression.js"; original bytes: original/regression.min.js (see original/manifest.json).
//
// The module is regression-js 2.0.x (Tom Alexander, MIT, https://github.com/Tom-Alexander/regression-js)
// transpiled by Babel. The minified build relied on the global Babel helpers `_objectSpread`,
// `_defineProperty2` and `_toConsumableArray` defined at the top of ace.js (original/babel-helpers.min.js).
// This reconstruction is a reference for porting and auditing; it is not loaded by the editor.
ace.define("ace/mouse/regression.js", ["require", "exports", "module"], function (require, exports, module) {
    var DEFAULT_OPTIONS = { order: 2, precision: 2, period: null };

    // Coefficient of determination (r^2) of a fit.
    function determinationCoefficient(data, results) {
        var predictions = [];
        var observations = [];
        data.forEach(function (d, i) {
            if (d[1] !== null) {
                observations.push(d);
                predictions.push(results[i]);
            }
        });
        var sum = observations.reduce(function (a, observation) {
            return a + observation[1];
        }, 0);
        var mean = sum / observations.length;
        var ssyy = observations.reduce(function (a, observation) {
            var difference = observation[1] - mean;
            return a + difference * difference;
        }, 0);
        var sse = observations.reduce(function (accum, observation, index) {
            var prediction = predictions[index];
            var residual = observation[1] - prediction[1];
            return accum + residual * residual;
        }, 0);
        return 1 - sse / ssyy;
    }

    // Solves the normal equations; `input` is column-major with the right-hand side as the last column.
    function gaussianElimination(input, order) {
        var matrix = input;
        var n = input.length - 1;
        var coefficients = [order];
        for (var i = 0; i < n; i++) {
            var maxrow = i;
            for (var j = i + 1; j < n; j++) {
                if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][maxrow])) maxrow = j;
            }
            for (var k = i; k < n + 1; k++) {
                var tmp = matrix[k][i];
                matrix[k][i] = matrix[k][maxrow];
                matrix[k][maxrow] = tmp;
            }
            for (var j2 = i + 1; j2 < n; j2++) {
                for (var k2 = n; k2 >= i; k2--) {
                    matrix[k2][j2] -= (matrix[k2][i] * matrix[i][j2]) / matrix[i][i];
                }
            }
        }
        for (var j3 = n - 1; j3 >= 0; j3--) {
            var total = 0;
            for (var k3 = j3 + 1; k3 < n; k3++) total += matrix[k3][j3] * coefficients[k3];
            coefficients[j3] = (matrix[n][j3] - total) / matrix[j3][j3];
        }
        return coefficients;
    }

    function round(number, precision) {
        var factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }

    var methods = {
        linear: function (data, options) {
            var sum = [0, 0, 0, 0, 0];
            var len = 0;
            for (var n = 0; n < data.length; n++) {
                if (data[n][1] !== null) {
                    len++;
                    sum[0] += data[n][0];
                    sum[1] += data[n][1];
                    sum[2] += data[n][0] * data[n][0];
                    sum[3] += data[n][0] * data[n][1];
                    sum[4] += data[n][1] * data[n][1];
                }
            }
            var run = len * sum[2] - sum[0] * sum[0];
            var rise = len * sum[3] - sum[0] * sum[1];
            var gradient = run === 0 ? 0 : round(rise / run, options.precision);
            var intercept = round(sum[1] / len - (gradient * sum[0]) / len, options.precision);
            var predict = function (x) {
                return [round(x, options.precision), round(gradient * x + intercept, options.precision)];
            };
            var points = data.map(function (point) {
                return predict(point[0]);
            });
            return {
                points: points,
                predict: predict,
                equation: [gradient, intercept],
                r2: round(determinationCoefficient(data, points), options.precision),
                string: intercept === 0 ? "y = " + gradient + "x" : "y = " + gradient + "x + " + intercept,
            };
        },

        exponential: function (data, options) {
            var sum = [0, 0, 0, 0, 0, 0];
            for (var n = 0; n < data.length; n++) {
                if (data[n][1] !== null) {
                    sum[0] += data[n][0];
                    sum[1] += data[n][1];
                    sum[2] += data[n][0] * data[n][0] * data[n][1];
                    sum[3] += data[n][1] * Math.log(data[n][1]);
                    sum[4] += data[n][0] * data[n][1] * Math.log(data[n][1]);
                    sum[5] += data[n][0] * data[n][1];
                }
            }
            var denominator = sum[1] * sum[2] - sum[5] * sum[5];
            var a = Math.exp((sum[2] * sum[3] - sum[5] * sum[4]) / denominator);
            var b = (sum[1] * sum[4] - sum[5] * sum[3]) / denominator;
            var coeffA = round(a, options.precision);
            var coeffB = round(b, options.precision);
            var predict = function (x) {
                return [round(x, options.precision), round(coeffA * Math.exp(coeffB * x), options.precision)];
            };
            var points = data.map(function (point) {
                return predict(point[0]);
            });
            return {
                points: points,
                predict: predict,
                equation: [coeffA, coeffB],
                string: "y = " + coeffA + "e^(" + coeffB + "x)",
                r2: round(determinationCoefficient(data, points), options.precision),
            };
        },

        logarithmic: function (data, options) {
            var sum = [0, 0, 0, 0];
            var len = data.length;
            for (var n = 0; n < len; n++) {
                if (data[n][1] !== null) {
                    sum[0] += Math.log(data[n][0]);
                    sum[1] += data[n][1] * Math.log(data[n][0]);
                    sum[2] += data[n][1];
                    sum[3] += Math.pow(Math.log(data[n][0]), 2);
                }
            }
            var a = (len * sum[1] - sum[2] * sum[0]) / (len * sum[3] - sum[0] * sum[0]);
            var coeffB = round(a, options.precision);
            var coeffA = round((sum[2] - coeffB * sum[0]) / len, options.precision);
            var predict = function (x) {
                return [
                    round(x, options.precision),
                    round(round(coeffA + coeffB * Math.log(x), options.precision), options.precision),
                ];
            };
            var points = data.map(function (point) {
                return predict(point[0]);
            });
            return {
                points: points,
                predict: predict,
                equation: [coeffA, coeffB],
                string: "y = " + coeffA + " + " + coeffB + " ln(x)",
                r2: round(determinationCoefficient(data, points), options.precision),
            };
        },

        power: function (data, options) {
            var sum = [0, 0, 0, 0, 0];
            var len = data.length;
            for (var n = 0; n < len; n++) {
                if (data[n][1] !== null) {
                    sum[0] += Math.log(data[n][0]);
                    sum[1] += Math.log(data[n][1]) * Math.log(data[n][0]);
                    sum[2] += Math.log(data[n][1]);
                    sum[3] += Math.pow(Math.log(data[n][0]), 2);
                }
            }
            var b = (len * sum[1] - sum[0] * sum[2]) / (len * sum[3] - Math.pow(sum[0], 2));
            var a = (sum[2] - b * sum[0]) / len;
            var coeffA = round(Math.exp(a), options.precision);
            var coeffB = round(b, options.precision);
            var predict = function (x) {
                return [
                    round(x, options.precision),
                    round(round(coeffA * Math.pow(x, coeffB), options.precision), options.precision),
                ];
            };
            var points = data.map(function (point) {
                return predict(point[0]);
            });
            return {
                points: points,
                predict: predict,
                equation: [coeffA, coeffB],
                string: "y = " + coeffA + "x^" + coeffB,
                r2: round(determinationCoefficient(data, points), options.precision),
            };
        },

        polynomial: function (data, options) {
            var lhs = [];
            var rhs = [];
            var a = 0;
            var b = 0;
            var len = data.length;
            var k = options.order + 1;
            for (var i = 0; i < k; i++) {
                for (var l = 0; l < len; l++) {
                    if (data[l][1] !== null) a += Math.pow(data[l][0], i) * data[l][1];
                }
                lhs.push(a);
                a = 0;
                var c = [];
                for (var j = 0; j < k; j++) {
                    for (var l2 = 0; l2 < len; l2++) {
                        if (data[l2][1] !== null) b += Math.pow(data[l2][0], i + j);
                    }
                    c.push(b);
                    b = 0;
                }
                rhs.push(c);
            }
            rhs.push(lhs);
            var coefficients = gaussianElimination(rhs, k).map(function (v) {
                return round(v, options.precision);
            });
            var predict = function (x) {
                return [
                    round(x, options.precision),
                    round(
                        coefficients.reduce(function (sum, coeff, power) {
                            return sum + coeff * Math.pow(x, power);
                        }, 0),
                        options.precision,
                    ),
                ];
            };
            var points = data.map(function (point) {
                return predict(point[0]);
            });
            var string = "y = ";
            for (var i2 = coefficients.length - 1; i2 >= 0; i2--) {
                if (i2 > 1) string += coefficients[i2] + "x^" + i2 + " + ";
                else if (i2 === 1) string += coefficients[i2] + "x + ";
                else string += coefficients[i2];
            }
            return {
                string: string,
                points: points,
                predict: predict,
                // Highest order first: for order 1 this is [gradient, intercept].
                equation: coefficients.slice().reverse(),
                r2: round(determinationCoefficient(data, points), options.precision),
            };
        },
    };

    // Every exported method merges its options over DEFAULT_OPTIONS; `_round` is exported as well.
    function createWrapper() {
        var api = { _round: round };
        Object.keys(methods).forEach(function (method) {
            api[method] = function (data, configuration) {
                var options = {};
                var key;
                for (key in DEFAULT_OPTIONS) options[key] = DEFAULT_OPTIONS[key];
                for (key in configuration) options[key] = configuration[key];
                return methods[method](data, options);
            };
        });
        return api;
    }

    module.exports = createWrapper();
});
