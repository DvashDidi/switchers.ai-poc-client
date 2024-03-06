Chart.register(ChartDataLabels);

let charts = {
    questions: {
        endpoint: "query/prediction/accuracy",
        label: 'Questions Data',
        canvas: $("#questions-chart"),
        chart: undefined,
        currentData: {},
        baseConfig: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Empty Data',
                        data: [0, 0, 0],
                        backgroundColor: "rgba(255,0,0,0.34)",
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        anchor: 'end', // Position of the labels (start, end, center, etc.)
                        align: 'end', // Alignment of the labels (start, end, center, etc.)
                        color: 'black', // Color of the labels
                        // font: {
                        //     weight: 'bold',
                        // },
                        formatter: function (value, context) {
                            return value; // Display the actual data value
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Question data'
                    }
                },
                height: 650
            }
        }
    }
};

function addClickableItem(questionNumber, questionText) {
    // Create the list item element
    const listItem = document.createElement('a');
    listItem.dataset.questionNumber = questionNumber;

    listItem.href = '#'; // Add a dummy href attribute for styling
    listItem.className = 'list-group-item list-group-item-action';

    // Create a strong element for the question number
    const strongElement = document.createElement('strong');
    strongElement.textContent = `Question ${questionNumber}: `;

    // Append the strong element to the list item
    listItem.appendChild(strongElement);

    // Append the question text to the list item
    listItem.appendChild(document.createTextNode(questionText));

    // Add click event listener to the list item
    listItem.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        // Remove the 'clicked' class from all items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('clicked');
        });
        // Add the 'clicked' class to the clicked item
        listItem.classList.add('clicked');

        getQuestionData(questionNumber);
    });

    // Append the new item to the list
    document.getElementById('questions-list').appendChild(listItem);
}

function getQuestionData(questionNumber) {
    fetch(`${apiHost}/statistics/${questionNumber}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": true
            }
        }
    ).then(function (response) {
        if (!response.ok) {
            return response.text().then(function (message) {
                throw new Error(`${message}`);
            });
        }

        return response.json();
    }).then(function (data) {
        updateQuestionData(charts.questions, data);
    }).catch(function (error) {
        console.error(error);
    });
}

function updateQuestionData(chartObj, data) {
    let idx = 0;
    for (let dataset of data.datasets) {
        // dataset.backgroundColor = = getRandomColor();
        dataset.borderColor = baseColors[idx % baseColors.length].border;
        dataset.hoverBorderColor = baseColors[idx % baseColors.length].hoverBackground.hoverBorder;
        dataset.backgroundColor = baseColors[idx % baseColors.length].background;
        dataset.hoverBackgroundColor = baseColors[idx % baseColors.length].hoverBackground;

        idx += 1;
    }

    chartObj.currentData = data;

    let configCopy = deepCopy(chartObj.baseConfig);

    configCopy.data = chartObj.currentData;

    if (chartObj.chart) {
        chartObj.chart.destroy();
    }

    chartObj.chart = new Chart(chartObj.canvas, configCopy);
}


$(document).ready(function () {
    $("#net-nav-btn").on('click', function () {
        window.location.replace("net");
    });
    $("#outliers-nav-btn").on('click', function () {
        window.location.replace("outliers");
    });
    $("#settings-nav-btn").on('click', function () {
        window.location.replace("settings");
    });

    fetch(`${apiHost}/question`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": true
            }
        }
    ).then(function (response) {
        if (!response.ok) {
            return response.text().then(function (message) {
                throw new Error(`${message}`);
            });
        }

        return response.json();
    }).then(function (data) {

        // TODO: sort by q number

        Object.entries(data).forEach((question) => {
            addClickableItem(question[0], question[1]);
        });
    }).catch(function (error) {
        console.error(error);
    });

    charts.questions.currentData = charts.questions.baseConfig.data;
    charts.questions.chart = new Chart(charts.questions.canvas, charts.questions.baseConfig);

    // TODO: Change button style
    // // calling each table to refresh values
    // for (let chart of Object.keys(charts)) {
    //     charts[chart].changeTableStyleBtn.on('click', function () {
    //         changeChartType(charts[chart]);
    //     });
    // }
    //
    // function changeChartType(chartObj, type = "bar") {
    //     if (!chartObj || !chartObj.chart) return;
    //
    //     if (chartObj.chart) chartObj.chart.destroy();
    //     chartObj.config.type = type;
    //     chartObj.chart = new Chart(chartObj.canvas, chartObj.config);
    //     chartObj.canvas[0].style.display = "";
    // }
});