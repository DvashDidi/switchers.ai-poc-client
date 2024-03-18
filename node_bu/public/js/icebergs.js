Chart.register(ChartDataLabels);

let emptyDataset = [
    {
        label: 'No data for selected iceberg',
        data: [0, 0, 0],
        backgroundColor: "rgba(54, 162, 235, 0.7)"
    }
]

let charts = {
    questions: {
        endpoint: "query/prediction/accuracy",
        label: 'Iceberg Data',
        canvas: $("#icebergs-chart"),
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
                    }
                },
                height: 650
            }
        }
    }
};
let questionsData = undefined;

function populateQuestionsList(data, selectedCategory) {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = ''; // Clear the list first

    // Fetch questions from the selected category
    const questions = data[selectedCategory];

    if (questions !== undefined) {
        // Iterate through the questions in the selected category
        Object.entries(questions).forEach(([questionNumber, question]) => {
            addClickableItem(questionsList, question.id, question.text, questionNumber);
        });
    }
}

function addClickableItem(parentContainer, questionId, questionText, questionNumber) {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item list-group-item-action';
    listItem.dataset.questionId = questionId; // Store the question ID as a data attribute for later use
    listItem.dataset.questionNumber = questionNumber;

    const strongElement = document.createElement('strong');
    strongElement.textContent = `Question ${listItem.dataset.questionNumber}: `;

    // Append the strong element to the list item
    listItem.appendChild(strongElement);

    // Append the question text to the list item
    listItem.appendChild(document.createTextNode(questionText));

    // Add an event listener for clicks on this list item
    listItem.addEventListener('click', function () {
        // Implement the logic to handle the click event, e.g., fetch more data or display details
        getQuestionData(questionId);
    });

    parentContainer.appendChild(listItem); // Add the list item to the parent container
}

function getQuestionData(questionId) {
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
        // TODO: Define data in server
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

function getIcebergsData(first) {
    if (!first) {
        updateQuestionData(charts.questions, {datasets: emptyDataset, labels: []});
    }

    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/outliers`, {
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
        questionsData = data;
        populateQuestionsList(questionsData, localStorage.getItem("icebergLevel") || "medium");
    }).catch(function (error) {
        console.error(error);
    });
}

$(document).ready(function () {
    init_page().then(function () {
        // Navigation button event handlers
        $("#questions-nav-btn, #impacts-nav-btn, #net-nav-btn, #settings-nav-btn").each(function () {
            $(this).on('click', function (e) {
                e.preventDefault(); // Prevent the default action

                // Push the current state to the history stack
                history.pushState(null, null, location.href);

                // Redirect to the target page
                window.location.href = $(this).data('target');
            });
        });

        $("#new-data-btn").on("click", function () {
            updateQuestionData(charts.questions, {datasets: emptyDataset, labels: []});

            getIcebergsData();
        });

        $('.sensitivity-level-button').on('click', function () {
            updateQuestionData(charts.questions, {datasets: emptyDataset, labels: []});

            // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
            $('.sensitivity-level-button').removeClass('btn-primary').addClass('btn-secondary');

            // Set the clicked button to 'btn-primary'
            $(this).removeClass('btn-secondary').addClass('btn-primary');

            localStorage.setItem("icebergLevel", $(this).data('level'));

            populateQuestionsList(questionsData, localStorage.getItem("icebergLevel"));
        });

        // Get the desired iceberg level from localStorage, defaulting to "medium" if not set
        const icebergLevel = localStorage.getItem("icebergLevel") || "medium";

        // Get all buttons with the class "sensitivity-level-button"
        const buttons = document.querySelectorAll('.sensitivity-level-button');

        // Iterate over the buttons to adjust classes
        buttons.forEach(button => {
            // Remove 'btn-primary' and add 'btn-secondary' for all buttons
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');

            // If the button's value matches the icebergLevel, switch classes
            if (button.dataset.level === icebergLevel) {
                button.classList.remove('btn-secondary');
                button.classList.add('btn-primary');
            }
        });

        getIcebergsData(true);

        charts.questions.currentData = charts.questions.baseConfig.data;
        charts.questions.chart = new Chart(charts.questions.canvas, charts.questions.baseConfig);
    });
});