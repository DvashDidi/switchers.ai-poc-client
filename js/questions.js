Chart.register(ChartDataLabels);

let emptyDataset = [
    {
        label: 'No data for selected question',
        data: [0, 0, 0],
        backgroundColor: "rgba(54, 162, 235, 0.7)"
    }
]

let charts = {
    questions: {
        label: 'Questions Data',
        canvas: $("#questions-chart"),
        chart: undefined,
        currentData: {},
        baseConfig: {
            type: 'bar',
            data: {
                labels: [],
                datasets: emptyDataset
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
                    //     text: 'Question data'
                    // }
                },
                height: 650
            }
        }
    }
};

function addClickableItem(parentContainer, question) {
    // Create the list item element
    const listItem = document.createElement('a');
    listItem.dataset.questionId = question["id"]
    listItem.dataset.questionNumber = question["sequence_number"];
    listItem.dataset.createdAt = question["created_at"];

    listItem.href = '#'; // Add a dummy href attribute for styling
    listItem.className = 'list-group-item list-group-item-action';

    // Create a strong element for the question number
    const strongElement = document.createElement('strong');
    strongElement.textContent = `Question ${listItem.dataset.questionNumber}: `;

    // Append the strong element to the list item
    listItem.appendChild(strongElement);

    // Append the question text to the list item
    listItem.appendChild(document.createTextNode(question["text"]));

    // Add click event listener to the list item
    listItem.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        // Remove the 'clicked' class from all items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('clicked');
        });
        // Add the 'clicked' class to the clicked item
        listItem.classList.add('clicked');

        getQuestionData(listItem.dataset.questionId);
    });

    // Append the new item to the list
    parentContainer.appendChild(listItem);
}

function getQuestionData(questionId) {
    updateQuestionData(charts.questions, {datasets: emptyDataset, labels: []});

    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/question/${questionId}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        }
    ).then(function (response) {
        if (!response.ok) {
            if (response.status === 404) {
                outdatedResearchFound();
            }

            return response.text().then(function (message) {
                throw new Error(`${message}`);
            });
        }

        return response.json();
    }).then(function (data) {
        updateQuestionData(charts.questions, translateStatistics(data));
    }).catch(function (error) {
        console.error(error);
    });
}

function translateStatistics(serverData) {
    // Collect all labels from the original object's sub-objects.
    // This set will help in ensuring uniqueness and the order of labels.
    const allLabels = new Set();
    Object.values(serverData).forEach(subObject => {
        Object.keys(subObject).forEach(label => {
            allLabels.add(label);
        });
    });
    const labels = Array.from(allLabels);

    // Construct the dataset array
    const datasets = Object.entries(serverData).map(([key, value]) => {
        return {
            label: key,
            data: labels.map(label => value[label] || 0) // Use || 0 to handle missing labels
        };
    });

    return {
        labels,
        datasets
    };
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
    configCopy.data.labels = configCopy.data.labels.map(label => label.split(' '));


    if (chartObj.chart) {
        chartObj.chart.destroy();
    }

    chartObj.chart = new Chart(chartObj.canvas, configCopy);
}

$(document).ready(function () {
    init_page().then(function () {
        // Navigation button event handlers
        $("#impacts-nav-btn, #net-nav-btn, #settings-nav-btn").each(function () {
            $(this).on('click', function (e) {
                e.preventDefault(); // Prevent the default action

                // Push the current state to the history stack
                history.pushState(null, null, location.href);

                // Redirect to the target page
                window.location.href = $(this).data('target');
            });
        });

        fetch(`${apiHost}/v1/research/${getSelectedResearch()}/questions`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(function (response) {
            if (!response.ok) {
                if (response.status === 404) {
                    outdatedResearchFound();
                }

                return response.text().then(function (message) {
                    throw new Error(`${message}`);
                });
            }

            return response.json();
        }).then(function (data) {

            // TODO: sort by q number

            for (const question of data) {
                addClickableItem(document.getElementById('questions-list'), question);
            }
            // Object.entries(data).forEach((question) => {
            //     addClickableItem(document.getElementById('questions-list'), question);
            // });
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
});