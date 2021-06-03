const express = require('express');
const WebSocket = require('ws');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {template: 'index'});
});

app.get('/esp', (req, res) => {
    updateChartData();
    res.end();
});

app.get('/address', (req, res) => {
    res.send(req.get('host'));
    res.send(req.protocol + '://' + req.get('host'));
});

const server = require('http').createServer(app);
const wss = new WebSocket.Server({server: server});

let clients = [];

var CO2chartData = generateChartData();
var minValue = Math.min(...CO2chartData);
var maxValue = Math.max(...CO2chartData);

wss.on('connection', (ws) => {
    ws['id'] = Date.now();
    clients.push(ws);

    console.log('-----');
    console.log('client ' + ws.id + ' connected');
    console.log('number of clients: ' + clients.length);

    ws.send(JSON.stringify({
        type: 'init',
        CO2chartData,
        minValue,
        maxValue
    }));

    ws.on('message', (message) => {
        updateChartData();
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

function generateChartData() {
    let chartData = [];

    for(let i=0; i<24; i++){
        chartData.push(Math.random() * 3.3);
    }

    return chartData;
}

function updateChartData() {
    CO2chartData.shift();
    CO2chartData.push(Math.random() * 3.3);

    if(CO2chartData[CO2chartData.length - 1] < minValue) { minValue = CO2chartData[CO2chartData.length - 1] };
    if(CO2chartData[CO2chartData.length - 1] > maxValue) { maxValue = CO2chartData[CO2chartData.length - 1] };

    clients.forEach((client) => {
        client.send(JSON.stringify({
            type: 'update',
            CO2chartData: CO2chartData[CO2chartData.length - 1],
            minValue,
            maxValue
        }));
    });
}
