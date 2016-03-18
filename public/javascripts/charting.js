var ctx = document.getElementById("myChart").getContext("2d");
var options = {
            pointDot:true,
            pointDotRadius : 0,
            pointDotStrokeWidth : 0,
            pointHitDetectionRadius : 2,
        };

var data = {
    labels: [],
    datasets: [
        {
            label: "It's empty",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            data: []
        },
        {
            label: "It's empty",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            data: [12,13,14,15,16,16,2]
        }
    ]
};

Chart.defaults.global.showScale = false;
Chart.defaults.global.responsive = true;

function randomColor() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ';
}

var socket = io.connect('https://fcc-din-apps-argvil19.c9users.io:8081');

var i;

$(document).ready(function() {
    
    var myLineChart = new Chart(ctx).Line(data, options);
    
    $(document.forms[0]).on('submit', function() {
        if ($('#newCode').val().length) {
            socket.emit('new chart', $('#newCode').val());
            return false;
        }
    });
    
    socket.on('chart update', function(data) {
        
        $('.status').fadeOut(500);
        
        $('ul').empty();
        for (var i=0;i<data.activeCharts.length;i++) {
            var li = $('<li/>');
            var X = $('<i/>').addClass('glyphicon glyphicon-remove pull-right');
            var div = $('<div/>').append($('<h4/>').html(data.activeCharts[i].symbol)).append($('<p/>').html(data.activeCharts[i].name));
            li.append(X).append(div);
            $('ul').append(li);
        }
            
        $('i').click(function() {
            var sym = this.nextElementSibling.firstChild.nextElementSibling.innerHTML;
            socket.emit('delete chart', sym);
        })
        var myLineChart = new Chart(ctx).Line(data.response, options);
    });
    
    socket.on('init chart', function() {
        return $.get('/getChartData', function(data) {
            $('ul').empty();
            for (var i=0;i<data.activeCharts.length;i++) {
                var li = $('<li/>');
                var X = $('<i/>').addClass('glyphicon glyphicon-remove pull-right');
                var div = $('<div/>').append($('<h4/>').html(data.activeCharts[i].symbol)).append($('<p/>').html(data.activeCharts[i].name));
                li.append(X).append(div);
                $('ul').append(li);
            }
            
            $('i').click(function() {
                var sym = this.nextElementSibling.firstChild.nextElementSibling.innerHTML;
                socket.emit('delete chart', sym);
            })
            var myLineChart = new Chart(ctx).Line(data.response, options);
            return true;
        });
    });
    
    socket.on('not found', function(data) {
        $('.status').fadeOut(0).html(data).fadeIn(1000);
    })
    
});