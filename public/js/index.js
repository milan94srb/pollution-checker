const updateButton = document.querySelector('#update-button');
const dateValueElement = document.querySelector('#pc-date-value');
const timeValueElement = document.querySelector('#pc-time-value');
const minValueElement = document.querySelector('#pc-min-value');
const maxValueElement = document.querySelector('#pc-max-value');
const suggestedValueElement = document.querySelector('#pc-suggested-value');
const temperatureElement = document.querySelector('#pc-temperature-value');
const humidityElement = document.querySelector('#pc-humidity-value');
const pressureElement = document.querySelector('#pc-pressure-value');
const exportButton = document.querySelector('#export-button');

const currentDate = new Date();
dateValueElement.textContent = currentDate.toLocaleDateString();
timeValueElement.textContent = currentDate.toLocaleTimeString();

let chartLabels = [];

for(let i=0; i<1000; i++){
    chartLabels.push('');
}

var ctx = document.getElementById('pollution-chart').getContext('2d');
var pollutionChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: chartLabels,    
        datasets: [
            {
                label: 'CO2 Concetration',
                data: [],
                borderColor: 'green',
                backgroundColor: 'green',
                spanGaps: true,
                pointRadius: 0  
            },
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        animation: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                minRotation: 0,
                maxRotation: 0,
                ticks: {
                    sampleSize: 120
                }
            },
            y: {
                beginAtZero: true,
                max: 10,
                steps: 9,
                stepValue: 1,
                ticks: {
                    sampleSize: 10
                }
            }
        }
    }
});

const socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

socket.addEventListener('message', (event) => {
    let message = event.data;
    let parsedMessage = JSON.parse(message);

    switch(parsedMessage.type){
        case 'init':
            pollutionChart.data.datasets[0].data = parsedMessage.chartData;
            pollutionChart.update();
            break;

        case 'update':
            if(pollutionChart.data.datasets[0].data.length >= 1000) { pollutionChart.data.datasets[0].data.shift(); }
            pollutionChart.data.datasets[0].data.push(parsedMessage.lastValue);
            pollutionChart.update();
    }

    minValueElement.textContent = parsedMessage.minValue;
    maxValueElement.textContent = parsedMessage.maxValue;
    suggestedValueElement.textContent = parsedMessage.suggestedValue;
    temperatureElement.textContent = parsedMessage.temperature;
    humidityElement.textContent = parsedMessage.humidity;
    pressureElement.textContent = parsedMessage.pressure;
});

updateButton.addEventListener('click', () => {
    let newValue = Math.random() * 10;
    socket.send(newValue + ',' + 19 + ',' + 76 + ',' + 1010);
});

exportButton.addEventListener('click', () => {
    fetch(location.origin + '/export')
        .then((response) => {
            response.json()
                .then((data) => {
                    var csv = 'Month,Day,Hours,Minutes,Seconds,Milliseconds,Gas,Temperature,Humidity,Pressure\n';
                    data.export.forEach((row) => {
                        csv += row.join(',');
                        csv += '\n';
                    });

                    var hiddenElement = document.createElement('a');
                    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
                    hiddenElement.target = '_blank';
                    hiddenElement.download = 'values.csv';
                    hiddenElement.click();
                });
        });
});

async function updateFromCSV() {
    const response = await fetch('../uploads/data-sample.csv', { headers: { 'Content-Type': 'text/csv' } });
    
    if(response.status !== 200) return;

    const data = await response.text();
    let rows = data.split(/\r?\n/);
    rows.splice(0, 1);
    rows.forEach((row) => {
        let values = row.split(',');
        values.splice(0, 1);
        values = values.join(',');
        socket.send(values);
    });
}
updateFromCSV();
