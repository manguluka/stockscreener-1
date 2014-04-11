// tmx-list.js

importScripts('../assets/xls.js');

var sectors = {
    "Mining": "http://www.tmx.com/en/pdf/Mining_Companies.xls",
    "Oil and Gas": "http://www.tmx.com/en/pdf/OilAndGas.xls",
    "Energy": "http://www.tmx.com/en/pdf/Energy.xls",
    "Clean Techology": "http://www.tmx.com/en/pdf/Cleantech.xls",
    "Life Sciences": "http://www.tmx.com/en/pdf/LifeSciences_Companies.xls",
    "Technology": "http://www.tmx.com/en/pdf/Technology.xls",
    "Diversified Industries": "http://www.tmx.com/en/pdf/Diversified_Industries.xls",
    "Real Estate": "http://www.tmx.com/en/pdf/RealEstate.xls"
};

onmessage = dispatch.bind(this, {
    close: function() {
        self.close();
    },
    ping: function() {
        return 'pong';
    },
    hello: function(event) {
        var channel = new MessageChannel();
        channel.port2.addEventListener('message', onmessage, false);
        channel.port2.start();
        event.ports[0].postMessage({
            cmd: 'register',
            service: 'list'
        }, [channel.port1]);
    },
    'sector-list': function(event) {
        var exchange = event.data.exchange;
        var mic = exchange.mic;
        if (mic != 'XTSE' && mic != 'XTSX')
            return {status: 'success', result: []};
        var result = [];
        for (var sector in sectors) {
            result.push(sector);
        }
        return {
            status: 'success',
            result: result
        };
    },
    'security-list': (function(listResults, tickersForLetter, event) {
        var exchange = event.data.exchange;
        var mic = exchange.mic;
        if (mic != 'XTSE' && mic != 'XTSX')
            return {status: 'success', result: []};
        var sheetNumber = mic == 'XTSE' ? 0 : 1;
        var url = sectors[event.data.sector];
        if (!url)
            throw new Error('Unknown sector: ' + event.data.sector);
        return listResults(url).then(function(lists){
            return lists[sheetNumber];
        }).then(function(roots){
            var market = mic == 'XTSE' ? 'T' : 'V';
            return Promise.all(roots.map(function(root){
                var letter = root.charAt(0);
                return tickersForLetter(market + letter).then(function(tickers){
                    return tickers.filter(function(ticker){
                        return ticker == root || ticker.indexOf(root) == 0 && ticker.charAt(root.length) == '.';
                    });
                });
            })).then(function(arrays){
                return arrays.reduce(function(list, array){
                    return list.concat(array);
                }, []);
            });
        }).then(function(tickers){
            return tickers.map(function(ticker){
                return exchange.iri + '/' + encodeURI(ticker);
            });
        }).then(function(securities){
            return {
                status: 'success',
                result: securities
            };
        });
    }).bind(this, memoize(synchronized(loadWorkbookSheetsAsTickers.bind(this, XLS))), memoize(synchronized(tickersForLetter)))
});

function decodeSymbol(pattern, symbol) {
    var regex = pattern.replace(/\./, '\\.').replace(/\{.?\}/, "\(.*\)");
    var m = symbol.match(new RegExp(regex));
    if (!m) return symbol;
    if (pattern.indexOf("{-}") >= 0)
        return m[1].replace(/[\-]/g, '.');
    return m[1];
}

function loadWorkbookSheetsAsTickers(XLS, url) {
    return promiseBinaryString(url).then(function(bin){
        return XLS.read(bin, {type:"binary"});
    }).then(function(workbook){
        var array = [];
        return workbook.SheetNames.reduce(function(promise, sheetName){
            return promise.then(sheetToTickers.bind(this, workbook.Sheets[sheetName])).then(function(results){
                array.push(results);
                return array;
            });
        }, Promise.resolve());
    });
}

function sheetToTickers(sheet) {
    return Promise.resolve(sheet).then(function(sheet){
        var out = [];
        if(!sheet || !sheet["!ref"]) throw new Error('Missing sheet');
        var range = XLS.utils.decode_range(sheet["!ref"]);
        var fs = ",", rs = "\n";

        for(var R = range.s.r; R <= range.e.r; ++R) {
            var row = [];
            for(var C = range.s.c; C <= range.e.c; ++C) {
                var cell = sheet[XLS.utils.encode_cell({c:C,r:R})];
                row.push(cell ? String(cell.v) : undefined);
            }
            out.push(row);
        }
        return out;
    }).then(function(rows){
        var rootTicker = findRootTicker(rows);
        if (!rootTicker)
            throw new Error("Could not find Root Ticker column");
        var roots = [];
        for (var r=rootTicker[0] + 1; r<rows.length; r++) {
            roots.push(rows[r][rootTicker[1]]);
        }
        return roots;
    });
}

function findRootTicker(rows){
    for (var r=0; r<rows.length; r++) {
        var row = rows[r];
        for (var c=0; c<row.length; c++) {
            if (row[c] && row[c].match(/Root\s+Ticker/i)) {
                return [r, c];
            }
        }
    }
}

function tickersForLetter(marketLetter) {
    var market = marketLetter.charAt(0);
    var letter = marketLetter.charAt(1);
    var url = [
        "http://www.tmx.com/TMX/HttpController?GetPage=ListedCompaniesViewPage&SearchCriteria=Symbol&SearchKeyword=", letter,
        "&SearchType=StartWith&SearchIsMarket=Yes&Page=1&Market=", market, "&Language=en"
    ].join('');
    return promiseText(url).then(scrapeAllTickers.bind(this, []));
}

function scrapeAllTickers(previously, html){
    var results = previously.concat(scrapeTickers(html));
    var next = scrapeNextPage(html);
    if (!next) return results;
    return promiseText(next).then(scrapeAllTickers.bind(this, results));
}

function scrapeTickers(html) {
    var m;
    var result = [];
    var regex = /href="http:\/\/web.tmxmoney.com\/quote.php\?qm_symbol=[^"]+">(\S+)<\/a>/g;
    while (m = regex.exec(html)) {
        result.push(m[1]);
    }
    return result;
}

function scrapeNextPage(html) {
    var regex = /\/TMX\/HttpController\?(GetPage=ListedCompaniesViewPage[^"]*)">Next/;
    var qs = html.match(regex);
    if (!qs) return null;
    return "http://www.tmx.com/TMX/HttpController?" + qs[1].replace(/&amp;/g, '&');
}

function synchronized(func) {
    var promise = Promise.resolve();
    return function(/* arguments */) {
        var context = this;
        var args = arguments;
        return promise = promise.catch(function() {
            // ignore previous error
        }).then(function() {
            return func.apply(context, args);
        });
    };
}

function memoize(func) {
    var memo = {};
    return function(key) {
        return memo[key] ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
}

function promiseBinaryString(url) {
    return new Promise(function(resolve, reject) {
        console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 203)) {
                resolve(xhr.responseText);
            } else if (xhr.readyState == 4) {
                reject({status: xhr.statusText, message: xhr.responseText, url: url});
            }
        };
        xhr.open("GET", url, true);
        xhr.overrideMimeType('text\/plain; charset=x-user-defined');
        xhr.send();
    });
}

function promiseText(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 203)) {
                resolve(xhr.responseText);
            } else if (xhr.readyState == 4) {
                reject({status: xhr.statusText, message: xhr.responseText, url: url});
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    });
}

function dispatch(handler, event){
    var cmd = event.data.cmd || event.data;
    if (typeof cmd == 'string' && typeof handler[cmd] == 'function') {
        Promise.resolve(event).then(handler[cmd]).then(function(result){
            if (result !== undefined) {
                event.ports[0].postMessage(result);
            }
        }).catch(rejectNormalizedError).catch(function(error){
            event.ports[0].postMessage(error);
        });
    } else if (event.ports && event.ports.length) {
        console.log('Unknown command ' + cmd);
        event.ports[0].postMessage({
            status: 'error',
            message: 'Unknown command ' + cmd
        });
    } else {
        console.log(event.data);
    }
}

function rejectNormalizedError(error) {
    if (error.status != 'error' || error.message) {
        console.log(error);
    }
    if (error && error.status == 'error') {
        return Promise.reject(error);
    } else if (error.target && error.target.errorCode){
        return Promise.reject({
            status: 'error',
            errorCode: error.target.errorCode
        });
    } else if (error.message && error.stack) {
        return Promise.reject({
            status: 'error',
            message: error.message,
            stack: error.stack
        });
    } else if (error.message) {
        return Promise.reject({
            status: 'error',
            message: error.message
        });
    } else {
        return Promise.reject({
            status: 'error',
            message: error
        });
    }
}
