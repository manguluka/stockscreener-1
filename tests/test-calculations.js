// test-calculations.js
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

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60;

describe("calculations", function(){
    describe("SESSION", function(){
        var normal = {
            tz: 'America/New_York',
            marketOpensAt: '09:30:00',
            marketClosesAt: '16:00:00',
            premarketOpensAt: "09:30:00",
            afterHoursClosesAt: "16:00:00"
        };
        var allday = {
            tz: 'America/New_York',
            marketOpensAt: '00:00:00',
            marketClosesAt: '24:00:00',
            premarketOpensAt: "00:00:00",
            afterHoursClosesAt: "24:00:00"
        };
        var extended = {
            tz: 'America/New_York',
            marketOpensAt: '04:00:00',
            marketClosesAt: '20:00:00',
            premarketOpensAt: "04:00:00",
            afterHoursClosesAt: "20:00:00"
        };
        var interval = {
            "value": "m60"
        };
        var points = [{
            "asof": "2015-02-27T10:00:00.000Z",
            "high": 211.17,
            "low": 211.09,
            "open": 211.16,
            "close": 211.09,
            "total_volume": 2859,
            "volume": 2800
        }, {
            "asof": "2015-02-27T11:00:00.000Z",
            "high": 211.18,
            "low": 211.05,
            "open": 211.14,
            "close": 211.05,
            "total_volume": 17271,
            "volume": 14232
        }, {
            "asof": "2015-02-27T12:00:00.000Z",
            "high": 211.23,
            "low": 211.08,
            "open": 211.08,
            "close": 211.2,
            "total_volume": 21788,
            "volume": 4517
        }, {
            "asof": "2015-02-27T13:00:00.000Z",
            "high": 211.25,
            "low": 211.08,
            "open": 211.18,
            "close": 211.21,
            "total_volume": 109413,
            "volume": 87105
        }, {
            "asof": "2015-02-27T14:00:00.000Z",
            "high": 211.4,
            "low": 211.1,
            "open": 211.24,
            "close": 211.18,
            "total_volume": 424678,
            "volume": 312343
        }, {
            "asof": "2015-02-27T15:00:00.000Z",
            "high": 211.44,
            "low": 210.84,
            "open": 211.19,
            "close": 211.07,
            "total_volume": 11113646,
            "volume": 10098527
        }, {
            "asof": "2015-02-27T16:00:00.000Z",
            "high": 211.55,
            "low": 211.02,
            "open": 211.06,
            "close": 211.52,
            "total_volume": 21381358,
            "volume": 9624331
        }, {
            "asof": "2015-02-27T17:00:00.000Z",
            "high": 211.5399,
            "low": 211.17,
            "open": 211.52,
            "close": 211.39,
            "total_volume": 29920161,
            "volume": 5898687
        }, {
            "asof": "2015-02-27T18:00:00.000Z",
            "high": 211.58,
            "low": 211.3,
            "open": 211.38,
            "close": 211.36,
            "total_volume": 36501888,
            "volume": 4485999
        }, {
            "asof": "2015-02-27T19:00:00.000Z",
            "high": 211.4,
            "low": 211.1,
            "open": 211.36,
            "close": 211.27,
            "total_volume": 42632006,
            "volume": 6041752
        }, {
            "asof": "2015-02-27T20:00:00.000Z",
            "high": 211.35,
            "low": 210.78,
            "open": 211.28,
            "close": 210.91,
            "total_volume": 53606417,
            "volume": 9174962
        }, {
            "asof": "2015-02-27T21:00:00.000Z",
            "high": 211.06,
            "low": 210.64,
            "open": 210.9132,
            "close": 210.69,
            "total_volume": 82394367,
            "volume": 25959761
        }, {
            "asof": "2015-02-27T22:00:00.000Z",
            "high": 211.5,
            "low": 210.6,
            "open": 210.69,
            "close": 211,
            "total_volume": 105805276,
            "volume": 17964862
        }, {
            "asof": "2015-02-27T23:00:00.000Z",
            "high": 211.03,
            "low": 210.66,
            "open": 211.01,
            "close": 210.93,
            "total_volume": 107980314,
            "volume": 1673787
        }, {
            "asof": "2015-02-28T00:00:00.000Z",
            "high": 210.93,
            "low": 210.76,
            "open": 210.93,
            "close": 210.81,
            "total_volume": 108053144,
            "volume": 71248
        }, {
            "asof": "2015-02-28T01:00:00.000Z",
            "high": 210.86,
            "low": 210.82,
            "open": 210.83,
            "close": 210.83,
            "total_volume": 108075972,
            "volume": 21391
        }];
        it("empty", function(){
            var open = parseCalculation(normal, 'SESSION(SINCE(1,open))', interval).getValue;
            var close = parseCalculation(normal, 'SESSION(close)', interval).getValue;
            expect(open([])).toBeUndefined();
            expect(close([])).toBeUndefined();
        });
        it("24hr", function(){
            var open = parseCalculation(allday, 'SESSION(SINCE(1,open))', interval).getValue;
            var close = parseCalculation(allday, 'SESSION(close)', interval).getValue;
            expect(open(points)).toEqual(211.16);
            expect(close(points)).toEqual(210.83);
        });
        it("day", function(){
            var open = parseCalculation(normal, 'SESSION(SINCE(1,open))', interval).getValue;
            var close = parseCalculation(normal, 'SESSION(close)', interval).getValue;
            expect(open(points)).toEqual(211.19);
            expect(close(points)).toEqual(210.69);
        });
        it("extended", function(){
            var open = parseCalculation(extended, 'SESSION(SINCE(1,open))', interval).getValue;
            var close = parseCalculation(extended, 'SESSION(close)', interval).getValue;
            expect(open(points)).toEqual(211.16);
            expect(close(points)).toEqual(210.83);
        });
        it("long-term", function(done){
            screener.load("http://localhost/exchanges/arcx/SPY", ['open','close'], "m30", 6000, new Date("2014-11-22")).then(function(points){
                var open = parseCalculation(normal, 'SESSION(SINCE(50,open))', interval).getValue;
                var close = parseCalculation(normal, 'SESSION(close)', interval).getValue;
                expect(open(points)).toEqual(199.16);
                expect(close(points)).toEqual(206.68);
            }).then(done, unexpected(done));
        });
    });
    describe("DATE", function(){
        var WORKDAY = parseCalculation({tz: 'America/New_York'}, 'WORKDAY(asof)').getValue;
        it("WORKDAY0", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-18T04:00:00.000Z").toISOString()}])
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-19T04:00:00.000Z").toISOString()}])
            );
            expect(
                WORKDAY([{asof:new Date("2015-07-19T04:00:00.000Z").toISOString()}])
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-20T04:00:00.000Z").toISOString()}])
            );
            expect(
                WORKDAY([{asof:new Date("2015-07-18T04:00:00.000Z").toISOString()}])
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-20T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY1", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 1
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-17T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-1", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 1
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-15T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY1.5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 1.5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-17T16:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-1.5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 1.5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-14T16:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY2", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 2
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-20T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-2", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 2
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-14T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY2.5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 2.5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-20T16:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-2.5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 2.5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-13T16:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY4", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 4
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-22T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-4", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 4
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-10T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) + 5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-23T04:00:00.000Z").toISOString()}])
            );
        });
        it("WORKDAY-5", function(){
            expect(
                WORKDAY([{asof:new Date("2015-07-16T04:00:00.000Z").toISOString()}]) - 5
            ).toEqual(
                WORKDAY([{asof:new Date("2015-07-09T04:00:00.000Z").toISOString()}])
            );
        });
    });
    describe("BB", function(){
        it("stockcharts.com", function(){
            var data = [
                [86.1557],
                [89.0867],
                [88.7829],
                [90.3228],
                [89.0671],
                [91.1453],
                [89.4397],
                [89.175],
                [86.9302],
                [87.6752],
                [86.9596],
                [89.4299],
                [89.3221],
                [88.7241],
                [87.4497],
                [87.2634],
                [89.4985],
                [87.9006],
                [89.126],
                [90.7043,88.70794,1.291961214,91.2918624279,86.1240175721,5.8256846635],
                [92.9001,89.04516,1.4520538118,91.9492676236,86.1410523764,6.5227747889],
                [92.9784,89.239745,1.6864250699,92.6125951399,85.8668948601,7.559076149],
                [91.8021,89.390705,1.7717472688,92.9341995376,85.8472104624,7.9281051371],
                [92.6647,89.5078,1.9020749864,93.3119499729,85.7036500271,8.5001529986],
                [92.6843,89.68866,2.0198949731,93.7284499462,85.6488700538,9.0084743071],
                [92.3021,89.7465,2.07654609,93.8995921801,85.5934078199,9.255162441],
                [92.7725,89.91314,2.1765574337,94.2662548675,85.5600251325,9.6829337013],
                [92.5373,90.081255,2.2419205743,94.5650961486,85.5974138514,9.9551036419],
                [92.949,90.382195,2.2023586598,94.7869123196,85.9774776804,9.7468695458],
                [93.2039,90.65863,2.1921854885,95.0430009771,86.2742590229,9.6722639137],
                [91.0669,90.863995,2.0218050117,94.9076050235,86.8203849765,8.9003571183],
                [89.8318,90.88409,2.0094107591,94.9029115183,86.8652684817,8.8438394845],
                [89.7435,90.90516,1.9950800218,94.8953200436,86.9149999564,8.7787316883],
                [90.3994,90.988925,1.9360439667,94.8610129333,87.1168370667,8.5111192012],
                [90.7387,91.153375,1.7601270937,94.6736291873,87.6331208127,7.7238043843],
                [88.0177,91.19109,1.6827514893,94.5565929787,87.8255870213,7.3812101132],
                [88.0867,91.1205,1.779125753,94.678751506,87.562248494,7.8099911787],
                [88.8439,91.167665,1.7040602939,94.5757855878,87.7595444122,7.4765994891],
                [90.7781,91.25027,1.6420006532,94.5342713064,87.9662686936,7.1977897849],
                [90.5416,91.242135,1.6450855489,94.5323060978,87.9519639022,7.2119555244],
                [91.3894,91.1666,1.6013253508,94.3692507015,87.9639492985,7.0259298943],
                [90.65,91.05018,1.5491617342,94.1485034683,87.9518565317,6.8057492436]
            ];
            var SMA = parseCalculation(undefined, 'SMA(20,close)').getValue;
            var STDEV = parseCalculation(undefined, 'STDEV(20,close)').getValue;
            var upper = parseCalculation(undefined, 'ADD(SMA(20,close),MULTIPLY(2,STDEV(20,close)))').getValue;
            var lower = parseCalculation(undefined, 'SUBTRACT(SMA(20,close),MULTIPLY(2,STDEV(20,close)))').getValue;
            var bandWidth = parseCalculation(undefined, 'MULTIPLY(4,PERCENT(STDEV(20,close),SMA(20,close)))').getValue;
            data.forEach(function(datum,i,data){
                if (!datum[1]) return;
                var points = data.slice(0, i+1).map(function(datum){
                    return {
                        close: datum[0]
                    };
                }).slice(-20);
                expect(SMA(points)).toBeCloseTo(datum[1]);
                expect(STDEV(points)).toBeCloseTo(datum[2]);
                expect(SMA(points) + STDEV(points) * 2).toBeCloseTo(datum[3],0);
                expect(SMA(points) - STDEV(points) * 2).toBeCloseTo(datum[4],0);
                expect(upper(points)).toBeCloseTo(datum[3]);
                expect(lower(points)).toBeCloseTo(datum[4]);
                expect(bandWidth(points)).toBeCloseTo(datum[5]);
            });
        });
    });
    describe("MACD", function(){
        it("investexcel.net", function(){
            var data = [
                [459.99],
                [448.85],
                [446.06],
                [450.81],
                [442.8],
                [448.97],
                [444.57],
                [441.4],
                [430.47],
                [420.05],
                [431.14],
                [425.66,440.8975],
                [430.58,439.3101923077],
                [431.72,438.1424704142],
                [437.87,438.1005518889],
                [428.43,436.6127746753],
                [428.35,435.3415785714],
                [432.5,434.9044126373],
                [443.66,436.2514260777],
                [455.72,439.2465912965],
                [454.49,441.5917310971],
                [452.08,443.2053109283],
                [452.73,444.6706477086],
                [461.91,447.3228557534],
                [463.58,449.8239548683],
                [461.14,451.5648848885,443.2896153846,8.2752695039],
                [452.08,451.6441333672,443.9407549858,7.7033783815],
                [442.66,450.261959003,443.8458842461,6.416074757],
                [428.91,446.9770422333,442.7395224501,4.2375197833],
                [429.79,444.3328818897,441.7802985649,2.5525833249],
                [431.99,442.4339769836,441.0550912638,1.3788857199],
                [427.72,440.1702882169,440.0673067257,0.1029814912],
                [423.2,437.5594746451,438.8178765979,-1.2584019528],
                [426.21,435.8134016228,437.8839598129,-2.0705581901,3.0375258687,-5.1080840588],
                [426.98,434.4544167577,437.076259086,-2.6218423283,1.9056522293,-4.5274945576],
                [435.69,434.6445064873,436.9735732278,-2.3290667405,1.0587084354,-3.3877751758],
                [434.33,434.5961208739,436.7777529887,-2.1816321148,0.4106403253,-2.5922724401],
                [429.8,433.858256124,436.2608823969,-2.4026262729,-0.1520129943,-2.2506132786],
                [419.85,431.7031397973,435.0452614786,-3.3421216814,-0.7900347317,-2.5520869496],
                [426.24,430.8626567515,434.3930198876,-3.5303631361,-1.3381004126,-2.1922627235],
                [402.8,426.5453249436,432.0527961922,-5.5074712486,-2.1719745798,-3.3354966688],
                [392.05,421.2383518754,429.0896261039,-7.8512742286,-3.3078345095,-4.543439719],
                [390.53,416.5139900484,426.2333575036,-9.7193674552,-4.5901410987,-5.1292263566],
                [398.67,413.7687608102,424.1916273182,-10.422866508,-5.7566861806,-4.6661803275],
                [406.13,412.5935668394,422.8537289983,-10.2601621589,-6.6573813762,-3.6027807827],
                [405.46,411.4960950179,421.5653046281,-10.0692096101,-7.339747023,-2.7294625871],
                [408.38,411.0166957844,420.5886153964,-9.571919612,-7.7861815408,-1.7857380712],
                [417.2,411.967973356,420.3376068485,-8.3696334924,-7.9028719311,-0.4667615613],
                [430.12,414.7605928397,421.0622285634,-6.3016357237,-7.5826246896,1.280988966],
                [442.78,419.0712708644,422.6709523735,-3.5996815091,-6.7860360535,3.1863545444],
                [439.29,422.1818445776,423.9019929384,-1.7201483609,-5.772858515,4.0527101541],
                [445.52,425.7723300272,425.5033267949,0.2690032323,-4.5644861655,4.8334893978],
                [449.98,429.4965869461,427.3164136989,2.1801732471,-3.215554283,5.3957275301],
                [460.71,434.2986504928,429.7900126842,4.5086378086,-1.6707158647,6.1793536733],
                [458.66,438.046550417,431.9285302632,6.1180201538,-0.112968661,6.2309888148],
                [463.84,442.0147734298,434.2923428363,7.7224305935,1.4541111899,6.2683194036],
                [456.77,444.2848082867,435.957354478,8.3274538087,2.8287797137,5.498674095],
                [452.97,445.6209916272,437.2175504426,8.4034411846,3.9437120079,4.4597291768],
                [454.74,447.0239159923,438.5155096691,8.5084063232,4.8566508709,3.6517554523],
                [443.86,446.5371596858,438.9113978417,7.625761844,5.4104730656,2.2152887785],
                [428.85,443.8160581957,438.1661091127,5.6499490829,5.458368269,0.1915808139],
                [434.58,442.3951261656,437.9004714007,4.4946547649,5.2656255682,-0.7709708033],
                [433.26,440.9897221401,437.5567327784,3.4329893617,4.8990983269,-1.4661089652],
                [442.93,441.2882264262,437.9547525726,3.3334738536,4.5859734322,-1.2524995786],
                [439.66,441.037730053,438.0810671968,2.9566628561,4.260111317,-1.3034484609],
                [441.35,441.0857715833,438.3232103674,2.7625612158,3.9606012968,-1.198040081]
            ];
            var EMA12 = parseCalculation(undefined, 'EMA(12,close)').getValue;
            var EMA26 = parseCalculation(undefined, 'EMA(26,close)').getValue;
            var Line = parseCalculation(undefined, 'SUBTRACT(EMA(12,close),EMA(26,close))').getValue;
            var Signal = parseCalculation(undefined, 'EMA(9,CDO,12,26,EMA,close)').getValue;
            var Histogram = parseCalculation(undefined, 'SUBTRACT(SUBTRACT(EMA(12,close),EMA(26,close)),EMA(9,SUBTRACT(EMA(12,close),EMA(26,close))))').getValue;
            data.forEach(function(datum,i,data){
                var points = data.slice(0, i+1).map(function(datum){
                    return {
                        close: datum[0]
                    };
                });
                if (datum[1]) {
                    expect(EMA12(points)).toBeCloseTo(datum[1]);
                }
                if (datum[2]) {
                    expect(EMA26(points)).toBeCloseTo(datum[2]);
                }
                if (datum[3]) {
                    expect(Line(points)).toBeCloseTo(datum[3]);
                }
                if (datum[4] && points.length > 60) {
                    expect(Signal(points)).toBeCloseTo(datum[4]);
                }
                if (datum[5] && points.length > 60) {
                    expect(Histogram(points)).toBeCloseTo(datum[5]);
                }
            });
        });
    });
    describe("STO", function(){
        it("stockcharts.com", function(){
            var data = [
                [127.009,125.3574],
                [127.6159,126.1633],
                [126.5911,124.9296],
                [127.3472,126.0937],
                [128.173,126.8199],
                [128.4317,126.4817],
                [127.3671,126.034],
                [126.422,124.8301],
                [126.8995,126.3921],
                [126.8498,125.7156],
                [125.646,124.5615],
                [125.7156,124.5715],
                [127.1582,125.0689],
                [127.7154,126.8597,128.4317,124.5615,127.2876,70.438220247],
                [127.6855,126.6309,128.4317,124.5615,127.1781,67.6089091003],
                [128.2228,126.8001,128.4317,124.5615,128.0138,89.2021084182],
                [128.2725,126.7105,128.4317,124.5615,127.1085,65.8105524262],
                [128.0934,126.8001,128.4317,124.5615,127.7253,81.7477132965],
                [128.2725,126.1335,128.4317,124.5615,127.0587,64.5237972198],
                [127.7353,125.9245,128.2725,124.5615,127.3273,74.5297763406],
                [128.77,126.9891,128.77,124.5615,128.7103,98.5814423191],
                [129.2873,127.8148,129.2873,124.5615,127.8745,70.1045325659],
                [130.0633,128.4715,130.0633,124.5615,128.5809,73.0560907339],
                [129.1182,128.0641,130.0633,124.5615,128.6008,73.4177905413],
                [129.2873,127.6059,130.0633,124.5715,127.9342,61.2312902873],
                [128.4715,127.596,130.0633,125.0689,128.1133,60.9562710235],
                [128.0934,126.999,130.0633,125.9245,127.596,40.3861022519],
                [128.6506,126.8995,130.0633,125.9245,127.596,40.3861022519],
                [129.1381,127.4865,130.0633,125.9245,128.6904,66.828549338],
                [128.6406,127.397,130.0633,125.9245,128.2725,56.7314197352]
            ];
            var STO = parseCalculation(undefined, 'PERCENT(SUBTRACT(close,MIN(14,low)),SUBTRACT(MAX(14,high),MIN(14,low)))').getValue;
            data.forEach(function(datum,i,data){
                var sto = datum[5];
                var points = data.slice(0, i+1).map(function(datum){
                    return {
                        high: datum[0],
                        low: datum[1],
                        close: datum[4] || datum[1]
                    };
                });
                if (sto) {
                    expect(STO(points)).toBeCloseTo(sto);
                }
            });
        });
    });
    describe("RSI", function(){
        it("stockcharts.com", function(){
            var data = [
                [44.3389],
                [44.0902],
                [44.1497],
                [43.6124],
                [44.3278],
                [44.8264],
                [45.0955],
                [45.4245],
                [45.8433],
                [46.0826],
                [45.8931],
                [46.0328],
                [45.614],
                [46.282],
                [46.282,70.5327894837],
                [46.0028,66.3185618052],
                [46.0328,66.5498299355],
                [46.4116,69.4063053388],
                [46.2222,66.3551690563],
                [45.6439,57.9748557143],
                [46.2122,62.9296067546],
                [46.2521,63.2571475625],
                [45.7137,56.0592987153],
                [46.4515,62.3770714432],
                [45.7835,54.7075730813],
                [45.3548,50.4227744115],
                [44.0288,39.9898231454],
                [44.1783,41.4604819757],
                [44.2181,41.8689160925],
                [44.5672,45.4632124453],
                [43.4205,37.3040420899],
                [42.6628,33.0795229944],
                [43.1314,37.7729521144]
            ];
            var RSI = parseCalculation(undefined, 'RSI(14,close)').getValue;
            data.forEach(function(datum,i,data){
                var rsi = datum[1];
                var points = data.slice(0, i+1).map(function(datum){
                    return {
                        close: datum[0]
                    };
                });
                if (rsi) {
                    expect(RSI(points)).toBeCloseTo(rsi);
                }
            });
        });
    });
    describe("ATR", function(){
        it("stockcharts.com", function(){
            var data = [
                [48.7,47.79,48.16],
                [48.72,48.14,48.61],
                [48.9,48.39,48.75],
                [48.87,48.37,48.63],
                [48.82,48.24,48.74],
                [49.05,48.635,49.03],
                [49.2,48.94,49.07],
                [49.35,48.86,49.32],
                [49.92,49.5,49.91],
                [50.19,49.87,50.13],
                [50.12,49.2,49.53],
                [49.66,48.9,49.5],
                [49.88,49.43,49.75],
                [50.19,49.725,50.03,0.555],
                [50.36,49.26,50.31,0.5939285714],
                [50.57,50.09,50.52,0.5857908163],
                [50.65,50.3,50.41,0.5689486152],
                [50.43,49.21,49.34,0.6154522855],
                [49.63,48.98,49.37,0.6179199794],
                [50.33,49.61,50.23,0.6423542666],
                [50.29,49.2,49.2375,0.6743289618],
                [50.17,49.43,49.93,0.6927697503],
                [49.32,48.08,48.43,0.7754290538],
                [48.5,47.64,48.18,0.7814698357],
                [48.3201,41.55,46.57,1.2092291331],
                [46.8,44.2833,45.41,1.3026199093],
                [47.8,47.31,47.77,1.3802899158],
                [48.39,47.2,47.72,1.366697779],
                [48.66,47.9,48.62,1.3362193662],
                [48.79,47.7301,47.85,1.3164822686]
            ];
            var ATR = parseCalculation(undefined, 'ATR(14)').getValue;
            data.forEach(function(datum,i,data){
                var atr = datum[3];
                var points = data.slice(0, i+1).map(function(datum){
                    return {
                        high: datum[0],
                        low: datum[1],
                        close: datum[2]
                    };
                });
                if (atr) {
                    expect(ATR(points)).toBeCloseTo(atr);
                }
            });
        });
    });
});
