const updateButton = document.querySelector('#update-button');

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
            {
                label: 'NO',
                data: [],
                borderColor: 'green',
                backgroundColor: 'green'
            },
            {
                label: 'NH3',
                data: [],
                borderColor: 'blue',
                backgroundColor: 'blue'
            }
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

const socket = new WebSocket('ws://pollution-checker.herokuapp.com/');

socket.addEventListener('message', (event) => {
    let message = event.data;
    let parsedMessage = JSON.parse(message);

    switch(parsedMessage.type){
        case 'init':
            pollutionChart.data.datasets[0].data = parsedMessage.CO2chartData;
            pollutionChart.data.datasets[1].data = parsedMessage.NOchartData;
            pollutionChart.data.datasets[2].data = parsedMessage.NH3chartData;
        
            pollutionChart.update();

            break;

        case 'update':
            pollutionChart.data.datasets[0].data.shift();
            pollutionChart.data.datasets[0].data.push(parsedMessage.CO2chartData);

            pollutionChart.data.datasets[1].data.shift();
            pollutionChart.data.datasets[1].data.push(parsedMessage.NOchartData);

            pollutionChart.data.datasets[2].data.shift();
            pollutionChart.data.datasets[2].data.push(parsedMessage.NH3chartData);

            pollutionChart.update();
    }
});

updateButton.addEventListener('click', () => {
    socket.send('');
});
