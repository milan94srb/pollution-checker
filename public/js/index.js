const updateButton = document.querySelector('#update-button');
const minValueElement = document.querySelector('#pc-min-value');
const maxValueElement = document.querySelector('#pc-max-value');
const exportButton = document.querySelector('#export-button');

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
                max: 1000,
                steps: 9,
                stepValue: 100,
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
});

updateButton.addEventListener('click', () => {
    let newValue = Math.random() * 1000;
    socket.send(newValue + ',' + 27 + ',' + 103);
});

exportButton.addEventListener('click', () => {
    fetch(location.origin + '/export')
        .then((response) => {
            response.json()
                .then((data) => {
                    var csv = 'Month,Day,Hours,Minutes,Seconds,Milliseconds,Gas,Temperature,Humidity\n';
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
