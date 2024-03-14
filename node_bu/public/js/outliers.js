Chart.register(ChartDataLabels);

let charts = {
    questions: {
        endpoint: "query/prediction/accuracy",
        label: 'Impact Data',
        canvas: $("#impacts-chart"),
        chart: undefined,
        currentData: {},
        baseConfig: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'No data for selected impact',
                        data: [0, 0, 0],
                        backgroundColor: "rgba(255,0,0,0.34)",
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                      callbacks: {
                          title: (context) => {
                              return context[0].label.replaceAll(',', ' ');
                          }
                      }
                    },
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
                    // title: {
                    //     display: true,
                    //     text: 'Impact data'
                    // }
                },
                height: 650
            }
        }
    }
};

let sensitivityLevel = 30;

function addClickableItem(parentContainer, questionNumber, questionText) {
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
    parentContainer.appendChild(listItem);
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
    // for (let dataset of data.datasets) {
    //     dataset.backgroundColor = getRandomColor();
    // }

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

    configCopy.data.labels =  configCopy.data.labels.map(label => label.split (' '));

    if (chartObj.chart) {
        chartObj.chart.destroy();
    }

    chartObj.chart = new Chart(chartObj.canvas, configCopy);
}


function getImpactsData(first) {
    if (!first) {
        updateQuestionData(charts.questions, {datasets:[], labels: []});
    }


    fetch(`${apiHost}/statistics/outliers/${sensitivityLevel}`, {
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
        document.getElementById('questions-list').innerHTML = "";

        // TODO: sort by q number
        Object.entries(data).forEach((question) => {
            addClickableItem(document.getElementById('questions-list'), question[0], question[1]);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

$(document).ready(function () {
    $("#net-nav-btn").on('click', function () {
        window.location.replace("net");
    });
    $("#questions-nav-btn").on('click', function () {
        window.location.replace("questions");
    });
    $("#settings-nav-btn").on('click', function () {
        window.location.replace("settings");
    });

    $('#sensitivity-level-input').on('input', function () {
        sensitivityLevel = $(this).val();
        $('#sensitivity-level-value').text(sensitivityLevel);
    });

    $('#sensitivity-level-input').val(sensitivityLevel);
    $('#sensitivity-level-value').text(sensitivityLevel);

    $("#new-data-btn").on("click", function () {
        getImpactsData();
    });

    $('.sensitivity-level-button').on('click', function() {
        // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
        $('.sensitivity-level-button').removeClass('btn-primary').addClass('btn-secondary');

        // Set the clicked button to 'btn-primary'
        $(this).removeClass('btn-secondary').addClass('btn-primary');

        // Check the dataset level and perform actions accordingly
        if ($(this).data('level') === "high") {
            sensitivityLevel = 60;
            // Code for 'high' level button
        } else if ($(this).data('level') === "low") {
            // Code for 'low' level button
            sensitivityLevel = 20;
        } else {
            // Code for other cases
            sensitivityLevel = 40;
        }

        getImpactsData();
    });

    // document.querySelectorAll('').forEach(button => {
    //     button.addEventListener('click', function() {
    //         // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
    //         document.querySelectorAll('.sensitivity-level-button').forEach(btn => {
    //             btn.classList.remove('btn-success');
    //             btn.classList.add('btn-secondary');
    //         });
    //
    //         // Set the clicked button to 'btn-primary'
    //         this.classList.remove('btn-secondary');
    //         this.classList.add('btn-success');
    //
    //         if (button.dataset.level === "high") {
    //
    //         } else if (button.dataset.level === "low") {
    //
    //         } else {
    //
    //         }
    //     });
    // });

    getImpactsData(true);

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