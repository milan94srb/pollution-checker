const updateButton = document.querySelector('#update-button');
const minValueElement = document.querySelector('#pc-min-value');
const maxValueElement = document.querySelector('#pc-max-value');
const exportButton = document.querySelector('#export-button');

const currentDate = new Date();
let currentHour = currentDate.getHours();

let chartLabels = [];

for(let i=0; i<24; i++){
    if(currentHour < 0){ currentHour = 23 };
    // chartLabels.push(currentHour.toLocaleString('en-US', { minimumIntegerDigits: 2 }) + 'h');
    chartLabels.push('');
    currentHour--;
}

chartLabels = chartLabels.reverse();

var ctx = document.getElementById('pollution-chart').getContext('2d');
var pollutionChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: chartLabels,
        datasets: [
            {
                label: 'Received signal',
                data: [],
                borderColor: '#f88c00',
                backgroundColor: '#f88c00',
                spanGaps: true,
                pointRadius: 0
            },
        ]
    },
    options: {
        maintainAspectRatio: false,
        normalized: true,
        animation: false,
        scales: {
            x: {
                minRotation: 0,
                maxRotation: 0,
                ticks: {
                    sampleSize: 24
                }
            },
            y: {
                beginAtZero: true,
                max: 3.5,
                steps: 7,
                stepValue: 0.5,
                ticks: {
                    sampleSize: 8
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
            pollutionChart.data.datasets[0].data = parsedMessage.CO2chartData;
            pollutionChart.update();

            break;

        case 'update':
            pollutionChart.data.datasets[0].data.shift();
            pollutionChart.data.datasets[0].data.push(parsedMessage.CO2chartData);
            pollutionChart.update();
    }

    minValueElement.textContent = parsedMessage.minValue;
    maxValueElement.textContent = parsedMessage.maxValue;
});

updateButton.addEventListener('click', () => {
    socket.send('');
});

exportButton.addEventListener('click', () => {
    fetch(location.origin + '/export')
        .then((response) => {
            response.json()
                .then((data) => {
                    var csv = 'Value,Hours,Minutes,Seconds,Milliseconds\n';
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
