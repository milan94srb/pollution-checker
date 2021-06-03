const updateButton = document.querySelector('#update-button');
const minValueElement = document.querySelector('#pc-min-value');
const maxValueElement = document.querySelector('#pc-max-value');

const currentDate = new Date();
let currentHour = currentDate.getHours();

let chartLabels = [];

for(let i=0; i<24; i++){
    if(currentHour < 0){ currentHour = 23 };
    chartLabels.push(currentHour.toLocaleString('en-US', { minimumIntegerDigits: 2 }) + 'h');
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
                label: 'CO2',
                data: [],
                borderColor: 'red',
                backgroundColor: 'red'
            },
        ]
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
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
