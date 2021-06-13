const express = require('express');
const WebSocket = require('ws');

const app = express();

let chartData = [];
let thousandChartData = [];
let lastValue, minValue, maxValue;

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
    clients.forEach((client) => {
        chartData = [];
        thousandChartData = [];
        lastValue = null;
        minValue = null;
        maxValue = null;
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

    ws.on('message', (value) => {
        updateChartData(value);

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

function updateChartData(newValue) {
    newValue = Number(newValue);

    lastValue = newValue;

    if(chartData >= 24) { chartData.chartData.shift(); }
    if(thousandChartData.length >= 1000) { thousandChartData.shift() }

    chartData.push(newValue);

    let currentDate = new Date();
    thousandChartData.push(new Array(newValue, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()));

    if(!minValue) { minValue = newValue; }
    if(!maxValue) { maxValue = newValue; }
    if(newValue < minValue) { minValue = newValue };
    if(newValue > maxValue) { maxValue = newValue };
}
