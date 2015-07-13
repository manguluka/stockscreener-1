// mentat.js
/* 
 *  Copyright (c) 2014 James Leigh, Some Rights Reserved
 * 
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 * 
 *  1. Redistributions of source code must retain the above copyright notice,
 *  this list of conditions and the following disclaimer.
 * 
 *  2. Redistributions in binary form must reproduce the above copyright
 *  notice, this list of conditions and the following disclaimer in the
 *  documentation and/or other materials provided with the distribution.
 * 
 *  3. Neither the name of the copyright holder nor the names of its
 *  contributors may be used to endorse or promote products derived from this
 *  software without specific prior written permission.
 * 
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

importScripts('../assets/moment-with-locales.js');
var window = { moment: moment };
importScripts('../assets/moment-timezone-with-data-2010-2020.js');
importScripts('../assets/underscore.js');

importScripts('calculations.js'); // parseCalculation
importScripts('intervals.js');
importScripts('utils.js');

var open = _.partial(openSymbolDatabase, indexedDB, _.map(intervals, 'storeName'));
onmessage = handle.bind(this, {
    start: function() {
        return "started";
    },

    stop: function() {
        self.close();
    },

    ping: function() {
        return 'pong';
    },

    fields: function(data) {
        var calcs = asCalculation(parseCalculation.bind(this, data.exchange), data.expressions);
        var errorMessage = _.first(_.compact(_.invoke(calcs, 'getErrorMessage')));
        if (!errorMessage) {
            return _.uniq(_.flatten(_.invoke(calcs, 'getFields')));
        } else {
            data.expressions.forEach(function(expression){
                var calc = parseCalculation(data.exchange, expression);
                var msg = calc.getErrorMessage();
                if (msg)
                    throw new Error(msg + ' in ' + expression);
            });
        }
    },
    validate: function(data) {
        return validateExpressions(parseCalculation.bind(this, data.exchange), intervals, data);
    },
    increment: function(data) {
        if (!intervals[interval]) throw Error("Unknown interval: " + data.interval);
        return data.exchanges.reduce(function(memo, exchange){
            var period = createPeriod(intervals, data.interval, exchange);
            var next = period.inc(data.asof, data.increment || 1);
            if (memo && ltDate(memo, next)) return memo;
            return next;
        }, null);
    },

    'import': function(data) {
        var period = createPeriod(intervals, data.interval, data.exchange);
        if (!period) throw Error("Unknown interval: " + data.interval);
        return importData(open, period, data.security, data.points);
    },
    reset: function(data) {
        return Promise.all(intervals.map(function(interval){
            return open(data.security, interval, "readwrite", function(store, resolve, reject) {
                return resolve(store.clear());
            });
        })).then(function(){
            return {
                status: 'success'
            };
        });
    },
    load: function(data) {
        var period = createPeriod(intervals, data.interval, data.exchange);
        if (!period) throw Error("Unknown interval: " + data.interval);
        return loadData(parseCalculation.bind(this, data.exchange), open, data.failfast, data.security,
            data.length, data.lower, data.upper, period, data.expressions
        );
    },
    signals: function(data){
        var filters = _.compact([].concat(data.screen.watch, data.screen.hold));
        var load = pointLoad(parseCalculation.bind(this, data.exchange), open, data.failfast, data.security, filters, data.begin, data.end);
        var periods = screenPeriods(intervals, data.exchange, filters);
        var hold = data.screen.hold || [];
        var watch = addChangeReference(data.screen.watch, filters);
        var stop = (_.isEmpty(hold) && watch || hold).filter(function(filter){
            return _.isFinite(filter.lower) || _.isFinite(filter.upper);
        });
        return findSignals(periods, load, data.security, watch, hold, stop, data.begin, data.end);
    },
    screen: function(data){
        var filters = _.compact([].concat(data.screen.watch, data.screen.hold, data.screen.stop));
        var load = pointLoad(parseCalculation.bind(this, data.exchange), open, data.failfast, data.security, filters, data.begin, data.end);
        var periods = screenPeriods(intervals, data.exchange, filters);
        var hold = data.screen.hold || [];
        var watch = addChangeReference(data.screen.watch, filters);
        var stop = (_.isEmpty(hold) && watch || hold).filter(function(filter){
            return _.isFinite(filter.lower) || _.isFinite(filter.upper);
        });
        return findSignals(periods, load, data.security, watch, hold, stop, data.begin, data.end).then(function(data){
            if (_.isEmpty(data.result)) return data;
            var watch;
            var duration = Date.parse(data.end) - Date.parse(data.begin);
            var exposure = data.result.reduce(function(exposure, signal, i, signals){
                if (signal.signal == 'watch') {
                    watch = signal;
                }
                if (signal.signal == 'stop' || i == signals.length-1) {
                    return exposure + Date.parse(signal.asof) - Date.parse(watch.asof);
                } else return exposure;
            }, 0);
            var performance = data.result.reduce(function(performance, signal, i, signals){
                if (signal.signal == 'watch') {
                    watch = signal;
                }
                if (signal.signal == 'stop' || i == signals.length-1) {
                    performance.push(100 * (signal.price - watch.price) / watch.price);
                }
                return performance;
            }, []);
            var drawup = data.result.reduce(function(drawup, item){
                if (item.signal == 'watch') {
                    watch = item;
                }
                var high = Math.max.apply(Math, _.compact(_.values(_.pick(item,_.keys(intervals))).map(function(point){
                    return point.high;
                }).concat(item.price)));
                return Math.max((high - watch.price) / watch.price * 100, drawup);
            }, 0);
            var drawdown = data.result.reduce(function(drawdown, item){
                if (item.signal == 'watch') {
                    watch = item;
                }
                var low = Math.min.apply(Math, _.compact(_.values(_.pick(item,_.keys(intervals))).map(function(point){
                    return point.low;
                }).concat(item.price)));
                return Math.min((low - watch.price) / watch.price * 100, drawdown);
            }, 0);
            var growth = performance.reduce(function(profit, ret){
                return profit + profit * ret / 100;
            }, 1) * 100 - 100;
            var risk_adjusted = Math.pow(performance.reduce(function(profit, ret){
                return profit + profit * ret / 100;
            }, 1), 365 * 24 * 60 * 60 * 1000 / exposure) - 1;
            return _.extend(data, {
                result: _.extend(_.last(data.result), {
                    positive_excursion: drawup,
                    negative_excursion: drawdown,
                    performance: performance,
                    growth: growth,
                    exposure: exposure / duration,
                    risk_adjusted: risk_adjusted * 100
                })
            });
        });
    }
});

function sum(numbers) {
    return numbers.reduce(function(sum, num){
        return sum + num;
    }, 0);
}

function addChangeReference(filters, changes) {
    return _.compact([].concat(filters, changes.map(function(filter){
        return filter.difference && {
            indicator: filter.difference
        };
    }), changes.map(function(filter){
        return filter.percentOf && {
            indicator: filter.percentOf
        };
    })));
}

function pointLoad(parseCalculation, open, failfast, security, filters, lower, upper) {
    var datasets = {};
    var exprs = _.compact(_.flatten(filters.map(function(filter){
        return [filter.indicator, filter.difference, filter.percentOf];
    }))).reduce(function(exprs, indicator){
        var expr = indicator.expression;
        var interval = indicator.interval;
        if (!exprs[interval]) exprs[interval] = [];
        if (exprs[interval].indexOf(expr) < 0) exprs[interval].push(expr);
        return exprs;
    }, {});
    return function(period, after, asof, until) {
        if (!datasets[period.interval]) {
            datasets[period.interval] = loadData(parseCalculation, open, failfast, security,
                1, asof, period.inc(upper, 1), period, exprs[period.interval]);
        }
        return datasets[period.interval].then(function(data){
            var idx = _.sortedIndex(data.result, {
                asof: toISOString(asof)
            }, 'asof');
            var i = Math.max(_.sortedIndex(data.result, {
                asof: toISOString(after)
            }, 'asof'), data.result[idx] && ltDate(data.result[idx].asof, asof, true) && idx, idx - 1);
            if (!data.result[i] || ltDate(until, data.result[i].asof)) return Promise.reject(_.extend(data, {
                status: 'error',
                message: "No results for interval: " + period.interval,
                interval: period.interval
            }));
            return _.extend({}, data, {
                result: _.clone(data.result[i]),
                until: i+1 < data.result.length ? data.result[i+1].asof : period.inc(asof, 1)
            });
        });
    };
}

function screenPeriods(intervals, exchange, filters) {
    var used = _.sortBy(_.compact(_.uniq(_.flatten(filters.map(function(filter){
            return [
                filter.indicator.interval,
                filter.difference && filter.difference.interval,
                filter.percentOf && filter.percentOf.interval
            ];
    })))), function(interval) {
        if (!intervals[interval]) throw Error("Unknown interval: " + interval);
        return intervals[interval].millis * -1;
    });
    return used.reduce(function(periods, interval){
        periods[interval] = createPeriod(intervals, interval, exchange);
        return periods;
    }, {});
}

function findSignals(periods, load, security, watch, hold, stop, begin, end) {
    return screenSignals(periods, load, security, watch, hold, stop, begin, end).then(function(signals){
        return _.extend(signals, {
            begin: begin,
            end: end
        });
    });
}

function screenSignals(periods, load, security, watch, hold, stop, begin, end) {
    var screen = screenSecurity.bind(this, periods, load, security);
    return screen('watch', watch, {}, begin, end).then(function(ws){
        if (!ws.result) return _.extend(ws, {
            result: []
        });
        return screen('stop', stop, ws.result, ws.result.asof, end).then(function(ss){
            var stopped = ss.result ? ss.result.asof : end;
            return holdSecurity(screen, hold, ws.result, ws.result.asof, stopped).then(function(hs) {
                if (_.isEmpty(hs.result) && _.isEmpty(ss.result)) return combineResult([ws]);
                else if (_.isEmpty(hs.result)) return combineResult([ws, ss]);
                else if (_.isEmpty(ss.result)) return combineResult([ws, hs]);
                _.last(hs.result).signal = ss.result.signal;
                return combineResult([ws, hs]);
            });
        });
    }).then(function(first){
        if (_.isEmpty(first.result) || _.last(first.result).signal != 'stop') return first;
        return screenSignals(periods, load, security, watch, hold, stop, first.until, end).then(function(rest){
            if (_.isEmpty(rest.result)) return first;
            return combineResult([first, rest]);
        });
    });
}

function holdSecurity(screen, filters, watching, begin, end) {
    return screen('hold', filters, watching, begin, end).then(function(first) {
        if (!first.result) return _.extend(first, {
            result: []
        });
        if (ltDate(end, first.until)) return _.extend(first, {
            result: [first.result]
        });
        return holdSecurity(screen, filters, watching, first.until, end).then(function(rest) {
            rest.result.unshift(first.result);
            return rest;
        });
    });
}

function screenSecurity(periods, load, security, signal, filters, watching, begin, end){
    if (!filters.length) return Promise.resolve({status: 'success'});
    var getInterval = _.compose(_.property('interval'), _.property('indicator'));
    var byInterval = _.groupBy(filters, getInterval);
    var sorted = _.sortBy(_.keys(byInterval), function(interval) {
        if (!periods[interval]) throw Error("Unknown interval: " + interval);
        return periods[interval].millis * -1;
    });
    var pass = signal == 'watch';
    return filterSecurityByPeriods(load, signal, watching, sorted.map(function(interval) {
        return {
            period: periods[interval],
            filters: byInterval[interval]
        };
    }), new Date(0), begin, begin, end).then(function(data){
        if (ltDate(data.result.asof, begin) && ltDate(data.until, end))
            return screenSecurity(periods, load, security, signal, filters, watching, data.until, end);
        else if (signal == 'watch' && data.status != 'success' ||
                signal == 'stop' && data.status == 'success')
            return {status: 'success'};
        else return _.extend(data, {
            status: 'success',
            result: _.extend(data.result, {
                security: security,
                signal: signal
            })
        });
    });
}

function filterSecurityByPeriods(load, signal, watching, periodsAndFilters, after, lower, begin, upper) {
    var rest = _.rest(periodsAndFilters);
    var period = _.first(periodsAndFilters).period;
    var filters = _.first(periodsAndFilters).filters;
    return findNextSignal(load, signal, !rest.length, period, filters, watching, after, begin, upper).then(function(data){
        if (data.status != 'success' || !rest.length) return {
            status: data.status,
            quote: data.quote,
            result: _.object([period.interval, 'price', 'asof'], [data.result, data.result.close, data.result.asof]),
            until: data.until
        };
        var reference = watching[period.interval] ? watching :
            _.extend(_.object([period.interval],[data.result]), watching);
        var start = maxDate(lower, data.result.asof);
        return filterSecurityByPeriods(load, signal, reference, rest, data.result.asof, start, start, minDate(upper, data.until)).then(function(child){
            if (ltDate(upper, data.until) ||
                    signal == 'watch' && child.status == 'success' ||
                    signal == 'stop' && child.status != 'success' ||
                    signal == 'hold') return {
                status: child.status,
                quote: _.compact(_.flatten([data.quote, child.quote])),
                result: _.extend(_.object([period.interval], [data.result]), child.result),
                until:  child.until
            };
            return filterSecurityByPeriods(load, signal, watching, periodsAndFilters, after, lower, data.until, upper);
        });
    });
}

function findNextSignal(load, signal, leaf, period, filters, watching, after, begin, until) {
    if (signal == 'watch')
        return findNextActiveFilter(true, load, period, filters, watching, after, begin, until);
    else if (signal == 'stop' && leaf)
        return findNextActiveFilter(false, load, period, filters, watching, after, begin, until);
    else if (signal == 'stop')
        return loadFilteredPoint(load, period, filters, watching, after, begin, until);
    else if (signal == 'hold')
        return load(period, after, minDate(begin,until));
    else throw Error("Unknown signal: " + signal);
}

function findNextActiveFilter(pass, load, period, filters, watching, after, begin, until) {
    return loadFilteredPoint(load, period, filters, watching, after, begin, until).then(function(data){
        if (pass != (data.status == 'success') && ltDate(data.until, until, true))
            return findNextActiveFilter(pass, load, period, filters, watching, after, data.until, until);
        else return data;
    });
}

function loadFilteredPoint(load, period, filters, watching, after, begin, until) {
    return load(period, after, minDate(begin,until), until).then(function(data){
        var pass =_.reduce(filters, function(pass, filter) {
            if (!pass) return false;
            var reference = watching[period.interval] ? watching :
                _.extend(_.object([period.interval],[data.result]), watching);
            var diff = valueOf(filter.difference, reference);
            var of = valueOf(filter.percentOf, reference);
            var x = data.result[filter.indicator.expression] - diff;
            var value = of ? x * 100 / Math.abs(of) : x;
            if (_.isFinite(filter.lower)) {
                if (value < +filter.lower)
                    return false;
            }
            if (_.isFinite(filter.upper)) {
                if (+filter.upper < value)
                    return false;
            }
            return pass;
        }, true);
        if (pass) {
            return _.extend(data, {
                status: 'success'
            });
        } else {
            return _.extend(data, {
                status: 'failure'
            });
        }
    });
}

function valueOf(indicator, watching) {
    var int = indicator && indicator.interval;
    if (!int || !watching[int]) return 0;
    return watching[int][indicator.expression];
}

function loadData(parseCalculation, open, failfast, security, length, lower, upper, period, expressions) {
    var calcs = asCalculation(parseCalculation, expressions);
    var n = _.max(_.invoke(calcs, 'getDataLength'));
    var errorMessage = _.first(_.compact(_.invoke(calcs, 'getErrorMessage')));
    if (errorMessage) throw Error(errorMessage);
    return collectIntervalRange(open, failfast, security, period, length + n - 1, lower, upper).then(function(data) {
        var updates = [];
        var startIndex = Math.max(lengthBelow(data.result, lower) - length, 0);
        var endIndex = Math.max(startIndex + length, lengthBelow(data.result, upper));
        var ar = startIndex || endIndex < data.result.length ? data.result.slice(startIndex, endIndex) : data.result;
        var result = _.map(ar, function(result, i) {
            var updated = false;
            var point = _.reduce(calcs, function(point, calc, c){
                if (_.isUndefined(point[expressions[c]])) {
                    var points = preceding(data.result, calc.getDataLength(), startIndex + i);
                    var value = calc.getValue(points);
                    if (_.isNumber(value)) {
                        point[expressions[c]] = value;
                        updated = true;
                    }
                }
                return point;
            }, result);
            if (updated) {
                updates.push(point);
            }
            return point;
        });
        if (updates.length) {
            return storeData(open, security, period, updates).then(_.constant(_.extend(data, {
                result: result
            })));
        }
        return _.extend(data, {
            result: result
        });
    });
}

function collectIntervalRange(open, failfast, security, period, length, lower, upper) {
    if (!period.derivedFrom)
        return collectRawRange(open, failfast, security, period, length, lower, upper);
    return open(security, period, 'readonly', collect.bind(this, length, lower, upper)).then(function(result){
        var next = result.length ? period.inc(result[result.length - 1].asof, 1) : null;
        var below = lengthBelow(result, lower);
        if (below >= length && next && (ltDate(upper, next) || ltDate(Date.now(), next))) {
            // result complete
            return {
                status: 'success',
                result: result
            };
        } else if (result.length && below >= length) {
            // need to update with newer data
            var last = result[result.length - 1];
            return collectAggregateRange(open, failfast, security, period, 0, last.asof, upper).then(function(aggregated){
                return storeData(open, security, period, aggregated.result).then(_.constant(aggregated));
            }).then(function(aggregated){
                return _.extend(aggregated, {
                    result: result.concat(aggregated.result)
                });
            });
        } else {
            // no data available
            var floored = period.floor(lower);
            return collectAggregateRange(open, failfast, security, period, length, floored, upper).then(function(aggregated){
                return storeData(open, security, period, aggregated.result).then(_.constant(aggregated));
            });
        }
    });
}

function collectAggregateRange(open, failfast, security, period, length, lower, upper) {
    var ceil = period.ceil;
    var end = ltDate(ceil(upper), upper, true) ? upper : period.floor(upper);
    var size = period.aggregate * length + 1;
    return collectRawRange(open, failfast, security, period.derivedFrom, size, lower, end).then(function(data){
        if (!data.result.length) return data;
        var upper, count, discard = ceil(data.result[0].asof);
        var result = data.result.reduce(function(result, point){
            if (ltDate(point.asof, discard, true)) return result;
            var preceding = result[result.length-1];
            if (!preceding || ltDate(upper, point.asof)) {
                result.push(point);
                upper = ceil(point.asof);
                count = 0;
            } else {
                result[result.length-1] = {
                    asof: point.asof,
                    open: preceding.open,
                    close: point.close,
                    total_volume: point.total_volume,
                    high: Math.max(preceding.high, point.high),
                    low: Math.min(preceding.low, point.low),
                    volume: period.interval.charAt(0) == 'd' ?
                        Math.round((preceding.volume * count + point.volume) / (++count)) :
                        (preceding.volume + point.volume)
                };
            }
            return result;
        }, []);
        return _.extend(data, {
            result: result
        });
    });
}

function collectRawRange(open, failfast, security, period, length, lower, upper) {
    return open(security, period, 'readonly', collect.bind(this, length, lower, upper)).then(function(result){
        var conclude = failfast ? Promise.reject.bind(Promise) : Promise.resolve.bind(Promise);
        var next = result.length ? period.inc(result[result.length - 1].asof, 1) : null;
        var below = lengthBelow(result, lower);
        if (below >= length && next && (ltDate(upper, next) || ltDate(new Date(), next))) {
            // result complete
            return {
                status: 'success',
                result: result
            };
        } else if (result.length && below >= length) {
            return open(security, period, 'readonly', nextItem.bind(this, upper)).then(function(newer){
                if (newer) return { // result complete
                    status: 'success',
                    result: result
                };
                // need to update with newer data
                return conclude({
                    status: failfast ? 'error' : 'warning',
                    message: 'Need newer data points',
                    result: result,
                    quote: [{
                        security: security,
                        interval: period.interval,
                        result: result,
                        start: period.format(result[result.length - 1].asof)
                    }]
                });
            });
        } else if (result.length && below < length) {
            var earliest = ltDate(lower, result[0].asof) ? lower : result[0].asof;
            // need more historic data
            var quote = [{
                security: security,
                interval: period.interval,
                start: period.format(period.dec(earliest, 2 * (length - below))),
                end: period.format(result[0].asof)
            }];
            if (ltDate(next, upper)) {
                quote.push({
                    security: security,
                    interval: period.interval,
                    start: period.format(result[result.length - 1].asof)
                });
            }
            return conclude({
                status: failfast ? 'error' : 'warning',
                message: 'Need more data points',
                result: result,
                quote: quote
            });
        } else {
            // no data available
            return open(security, period, 'readonly', nextItem.bind(this, null)).then(function(earliest){
                var d1 = period.dec(lower, length);
                var d2 = earliest ? moment(earliest.asof) : d1;
                var start = ltDate(d1, d2) ? d1 : d2;
                return Promise.reject({
                    status: 'error',
                    message: 'No data points available',
                    quote: [{
                        security: security,
                        interval: period.interval,
                        start: period.format(start),
                        end: earliest && period.format(earliest.asof)
                    }]
                });
            });
        }
    });
}

function importData(open, period, security, result) {
    var now = Date.now();
    var points = result.map(function(point){
        var obj = {};
        var tz = point.tz || period.tz;
        if (point.dateTime) {
            obj.asof = moment.tz(point.dateTime, tz).toISOString();
        } else if (point.date) {
            var time = point.date + ' ' + period.marketClosesAt;
            obj.asof = moment.tz(time, tz).toISOString();
        }
        for (var prop in point) {
            if (_.isNumber(point[prop]))
                obj[prop] = point[prop];
        }
        return obj;
    }).filter(function(point){
        // Yahoo provides weekly/month-to-date data
        return ltDate(point.asof, now, true);
    });
    return storeData(open, security, period, points).then(function(){
        return {
            status: 'success'
        };
    });
}

function storeData(open, security, period, data) {
    if (!data.length) return Promise.resolve(data);
    console.log("Storing", data.length, period.interval, security, data[data.length-1]);
    return open(security, period, "readwrite", function(store, resolve, reject){
        var counter = 0;
        var onsuccess = function(){
            if (++counter >= data.length) {
                resolve(data);
            }
        };
        data.forEach(function(datum,i){
            if (typeof datum.asof != 'string') {
                reject(Error("asof is not an ISOString: " + datum.asof));
            }
            var op = store.put(datum);
            op.onerror = reject;
            op.onsuccess = onsuccess;
        });
    });
}

function openSymbolDatabase(indexedDB, storeNames, security, period, mode, callback) {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(security, 5);
        request.onerror = reject;
        request.onupgradeneeded = function(event) {
            try {
                var db = event.target.result;
                // Create an objectStore for this database
                storeNames.forEach(function(name){
                    if (!db.objectStoreNames.contains(name)) {
                        db.createObjectStore(name, { keyPath: "asof" });
                    }
                });
            } catch(e) {
                reject(e);
            }
        };
        request.onsuccess = function(event) {
            try {
                var db = event.target.result;
                var trans = db.transaction(period.storeName, mode);
                return callback(trans.objectStore(period.storeName), resolve, reject);
            } catch(e) {
                reject(e);
            }
        };
    });
}

function collect(below, lower, upper, store, resolve, reject) {
    var results = [];
    var between = 0;
    var cursor = store.openCursor(IDBKeyRange.upperBound(toISOString(upper)), "prev");
    cursor.onerror = reject;
    cursor.onsuccess = function(event) {
        try {
            var cursor = event.target.result;
            if (cursor) {
                if (ltDate(lower, cursor.value.asof)) {
                    between = results.length + 1;
                }
                if (results.length < below + between) {
                    results.push(cursor.value);
                    cursor.continue();
                    return;
                }
            }
            resolve(results.reverse());
        } catch (e) {
            reject(e);
        }
    };
}

function lengthBelow(result, lower) {
    var below = _.sortedIndex(result, {
        asof: toISOString(lower)
    }, 'asof');
    return below < result.length && ltDate(result[below].asof, lower, true) ? below +1 : below;
}

function toISOString(date) {
    if (typeof date == 'string') return date;
    else return moment(date).toISOString();
}

function minDate(d1, d2) {
    return d1 && ltDate(d1, d2) || !d2 ? d1 : d2;
}

function maxDate(d1, d2) {
    return d1 && ltDate(d2, d1) || !d2 ? d1 : d2;
}

function ltDate(d1, d2, orEq) {
    if (typeof d1 == 'string' && typeof d2 == 'string') {
        return orEq && d1 <= d2 || d1 < d2;
    } else {
        return ltDate(toISOString(d1), toISOString(d2), orEq);
    }
}

function nextItem(lower, store, resolve, reject) {
    var cursor = lower ? store.openCursor(IDBKeyRange.lowerBound(toISOString(lower)), "next") : store.openCursor();
    cursor.onerror = reject;
    cursor.onsuccess = function(event) {
        try {
            var cursor = event.target.result;
            if (cursor) {
                resolve(cursor.value);
            } else {
                resolve(null);
            }
        } catch (e) {
            reject(e);
        }
    };
}

function findIndex(array, predicate) {
    for (var i=0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return undefined;
}

function preceding(array, len, endIndex) {
    var list = [];
    var startIndex = Math.max(0, endIndex - len + 1);
    for (var i=startIndex; i < array.length && i <= endIndex; i++) {
        list.push(array[i]);
    }
    return list;
}

function validateExpressions(parseCalculation, intervals, data) {
    var calc = parseCalculation(data.expression);
    var errorMessage = calc.getErrorMessage();
    if (errorMessage) {
        throw new Error(errorMessage);
    } else if (!data.interval || intervals[data.interval]) {
        return {
            status: 'success'
        };
    } else {
        throw new Error("Invalid interval: " + data.interval);
    }
}

function asCalculation(parseCalculation, expressions) {
    return _.map(expressions, function(expr){
        return parseCalculation(expr);
    });
}

function createPeriod(intervals, interval, exchange) {
    if (!exchange || !exchange.tz) throw Error("Missing exchange");
    var period = intervals[interval];
    var self = {};
    return period && _.extend(self, period, {
        interval: period.storeName,
        tz: exchange.tz,
        marketClosesAt: exchange.marketClosesAt,
        derivedFrom: period.derivedFrom && createPeriod(intervals, period.derivedFrom.storeName, exchange),
        floor: function(date) {
            return period.floor(exchange, date).toISOString();
        },
        ceil: function(date) {
            return period.ceil(exchange, date).toISOString();
        },
        inc: function(date, n) {
            return period.inc(exchange, date, n).toISOString();
        },
        dec: function(date, n) {
            return period.dec(exchange, date, n).toISOString();
        },
        format: function(date) {
            return moment.tz(date, exchange.tz).format();
        }
    });
}