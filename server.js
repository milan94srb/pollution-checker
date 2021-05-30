const express = require('express');
const WebSocket = require('ws');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {template: 'index'});
});

app.get('/address', (req, res) => {
    res.send(req.protocol + '://' + req.get('host'));
});

const server = require('http').createServer(app);
const wss = new WebSocket.Server({server: server});

let clients = [];

var CO2chartData = generateChartData();
var NOchartData = generateChartData();
var NH3chartData = generateChartData();

wss.on('connection', (ws) => {
    ws['id'] = Date.now();
    clients.push(ws);

    console.log('-----');
    console.log('client ' + ws.id + ' connected');
    console.log('number of clients: ' + clients.length);

    ws.send(JSON.stringify({
        type: 'init',
        CO2chartData,
        NOchartData,
        NH3chartData
    }));

    ws.on('message', (message) => {
        CO2chartData.shift();
        CO2chartData.push(Math.floor(Math.random() * 11));

        NOchartData.shift();
        NOchartData.push(Math.floor(Math.random() * 11));

        NH3chartData.shift();
        NH3chartData.push(Math.floor(Math.random() * 11));

        clients.forEach((client) => {
            client.send(JSON.stringify({
                type: 'update',
                CO2chartData: CO2chartData[CO2chartData.length - 1],
                NOchartData: NOchartData[NOchartData.length - 1],
                NH3chartData: NH3chartData[NH3chartData.length - 1]
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

function generateChartData() {
    let chartData = [];

    for(let i=0; i<24; i++){
        chartData.push(Math.floor(Math.random() * 11));
    }

    return chartData;
}
