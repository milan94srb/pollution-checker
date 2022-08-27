const express = require('express');
const WebSocket = require('ws');

const app = express();

let chartData = [];
let thousandChartData = [];
let startTime = false;
let lastValue, minValue, maxValue, lastTime;

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {template: 'index'});
});

app.get('/address', (req, res) => {
    res.send(req.get('host'));
    res.send(req.protocol + '://' + req.get('host'));
});

app.get('/export', (req, res) => {
    res.json({
        export: thousandChartData
    });
});

app.get('/reset', (req, res) => {
    chartData = [];
    thousandChartData = [];
    startTime = false;
    lastValue = null;
    minValue = null;
    maxValue = null;
    lastTime = null;
    
    clients.forEach((client) => {
        client.send(JSON.stringify({
            type: 'init',
            chartData,
            minValue,
            maxValue
        }));
    });
});

const server = require('http').createServer(app);
const wss = new WebSocket.Server({server: server});

let clients = [];

wss.on('connection', (ws) => {
    ws['id'] = Date.now();
    clients.push(ws);

    console.log('-----');
    console.log('client ' + ws.id + ' connected');
    console.log('number of clients: ' + clients.length);

    ws.send(JSON.stringify({
        type: 'init',
        chartData,
        minValue,
        maxValue
    }));

    ws.on('message', (values) => {
        updateChartData(values);

        clients.forEach((client) => {
            client.send(JSON.stringify({
                type: 'update',
                lastValue,
                minValue,
                maxValue
            }));
        });
    });

    ws.on('close', () => {
        clients = clients.filter((client) => {
            return client.id !== ws.id;
        });

        console.log('-----');
        console.log('client ' + ws.id + ' disconnected');
    });
});

server.listen(process.env.PORT || 3000, () => { console.log('listening on port 3000' )});

function updateChartData(newValues) {
    newValues = newValues.split(',');
    newValue = Number(newValues[0]);

    lastValue = newValue;

    if(chartData >= 1000) { chartData.chartData.shift(); }
    if(thousandChartData.length >= 1000) { thousandChartData.shift() }

    chartData.push(newValue);

    let currentDate = new Date();

    if(!startTime && newValue !== 0) {
        startTime = currentDate.getTime();
        lastTime = startTime;
        thousandChartData.push(new Array(currentDate.getDate(), currentDate.getMonth(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds(), newValue, newValues[1], newValues[2]));
    }
    else if(startTime) {
        const currentTime = currentDate.getTime();
        // const fromZero = currentTime - startTime;
        // const delay = currentTime - lastTime;

        lastTime = currentTime;

        thousandChartData.push(new Array(currentDate.getDate(), currentDate.getMonth(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds(), newValue, newValues[1], newValues[2]));
    }
    else {
        thousandChartData.push(new Array(currentDate.getDate(), currentDate.getMonth(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds(), newValue, newValues[1], newValues[2]));
    }

    if(minValue == null) { minValue = newValue; }
    if(maxValue == null) { maxValue = newValue; }
    if(newValue < minValue) { minValue = newValue };
    if(newValue > maxValue) { maxValue = newValue };
}
