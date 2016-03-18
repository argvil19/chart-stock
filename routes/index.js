var http = require('http');
var async = require('async');
var activeCharts = [];
var wait = 0;

module.exports = function(app, io) {
    app.get('/', function(req, res) {
        return res.render('index');
    });
    
    app.get('/getChartData', function(req, res) {
        getCharData(function(response) {
            return res.send(response);
        });
    });
    
    
    io.on('connection', function(socket) {
        if (activeCharts.length)
            socket.emit('init chart');
        
        socket.on('new chart', function(stockSym) {
            if (activeCharts.indexOf(stockSym) === -1) {
                checkValid(stockSym, function() {
                    if (activeCharts.length === 3) {
                        activeCharts.pop();
                    }
                    activeCharts.push(stockSym);
                    getCharData(function(response) {
                        return io.emit('chart update', response);
                    }, socket);
                }, socket);
            }
        });
    
        socket.on('delete chart', function(Sym) {
            activeCharts.splice(activeCharts.indexOf(Sym), 1);
            return getCharData(function(response) {
                return io.emit('chart update', response);
            });
        });
    });
    
    
};

function randomColor() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ';
}

function checkValid(stockSym, cb, socket) {
    http.get('http://d.yimg.com/autoc.finance.yahoo.com/autoc?query=' + stockSym + '&region=1&lang=en&callback=YAHOO.Finance.SymbolSuggest.ssCallback', function(data) {
        data.setEncoding('utf8');
        var dataRes = '';
        data.on('data', function(d) {
            dataRes += d;
        });
        data.on('end', function(){
            dataRes = dataRes.substring(dataRes.indexOf('{'), dataRes.length - 2)
            data = JSON.parse(dataRes);
            if (data.ResultSet.result === null) {
                return cantFind(socket);
            }
            if (data.ResultSet.Result.length) {
                return cb();
            } else {
                return cantFind(socket);
            }
        });
    });
}

function getCharData(callback, socket) {
    var response = {
        datasets:[]
    };
    var info = [];
    async.each(activeCharts, function(val, cb) {
        http.get('http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/json?parameters=%7B%22Normalized%22%3Afalse%2C%22NumberOfDays%22%3A365%2C%22DataPeriod%22%3A%22Day%22%2C%22Elements%22%3A%5B%7B%22Symbol%22%3A%22' + val + '%22%2C%22Type%22%3A%22price%22%2C%22Params%22%3A%5B%22c%22%5D%7D%5D%7D', function(data) {
	            data.setEncoding('utf8');
	            var dataRes = '';
	            data.on('data', function(d) {
	                dataRes += d;
	            });
	            data.on('end', function() {
	                if (data[0] === '<') {
	                    activeCharts.splice(activeCharts.indexOf(val), 1);
	                    return cantFind(socket);
	                }
	                data = JSON.parse(dataRes);
	                if (!data.Dates) {
	                    activeCharts.splice(activeCharts.indexOf(val), 1);
	                    return cantFind(socket);
	                }
	                var values;
	                var dates = [];
	                var color = randomColor();
	                if (!response.labels) {
    	                for (var i=0;i<data.Dates.length;i++) {
    	                   dates.push(data.Dates[i].substr(0,10));
    	                }
    	                response.labels = dates;
	                }
	                values = data.Elements[0].DataSeries.close.values;

	                response.datasets.push({
	                        label:val,
	                        fillColor:color + '0.2)',
	                        strokeColor:color + '1)',
	                        data: values
	                });
	                cb();
	            });
        	});
    }, function(err) {
        if (err) {
            return err;
        }
        return async.each(activeCharts, function(val, cb) {
            http.get('http://d.yimg.com/autoc.finance.yahoo.com/autoc?query=' + val + '&region=1&lang=en&callback=YAHOO.Finance.SymbolSuggest.ssCallback', function(data) {
                    var dataRes = '';
                data.on('data', function(d) {
                    dataRes += d;
                });
                data.on('end', function() {
                    var arrItem = {};
                    dataRes = dataRes.substring(dataRes.indexOf('{'), dataRes.length - 2)
                    data = JSON.parse(dataRes);
                    arrItem.symbol = data.ResultSet.Result[0].symbol;
                    arrItem.name = data.ResultSet.Result[0].name;
                    info.push(arrItem);
                    cb();
                });
            });
        }, function(err) {
            if (err)
                return err;
            return callback({
                response:response,
                activeCharts:info
            });
        });
    });
}

function cantFind(socket) {
    return socket.emit('not found', "We can't find that symbol");
}

function checkSame() {
    for (var i=0;i<activeCharts.length;i++) {
        var count = 0;
        for (var x=0;x<activeCharts.length;x++) {
            if (activeCharts[i] === activeCharts[x]) {
                count++;
            }
            if (x === activeCharts.length - 1) {
                if (count === 2) {
                    activeCharts.splice(activeCharts.indexOf(activeCharts[i]), 1);
                }
            }
        }
    };
}

setInterval(checkSame, 1000);