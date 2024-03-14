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
let questionsData = undefined;

// function addClickableItem(parentContainer, question) {
//     // Create the list item element
//     const listItem = document.createElement('a');
//     listItem.dataset.questionId = question["id"]
//     listItem.dataset.questionNumber = question["sequence_number"];
//     listItem.dataset.createdAt = question["created_at"];
//
//     listItem.href = '#'; // Add a dummy href attribute for styling
//     listItem.className = 'list-group-item list-group-item-action';
//
//     // Create a strong element for the question number
//     const strongElement = document.createElement('strong');
//     strongElement.textContent = `Question ${listItem.dataset.questionNumber}: `;
//
//     // Append the strong element to the list item
//     listItem.appendChild(strongElement);
//
//     // Append the question text to the list item
//     listItem.appendChild(document.createTextNode(question["text"]));
//
//     // Add click event listener to the list item
//     listItem.addEventListener('click', (event) => {
//         event.preventDefault(); // Prevent default link behavior
//         // Remove the 'clicked' class from all items
//         document.querySelectorAll('.list-group-item').forEach(item => {
//             item.classList.remove('clicked');
//         });
//         // Add the 'clicked' class to the clicked item
//         listItem.classList.add('clicked');
//
//         getQuestionData(listItem.dataset.questionId);
//     });
//
//     // Append the new item to the list
//     parentContainer.appendChild(listItem);
// }
// function addClickableItem(parentContainer, questionText, questionId, category) {
//     const listItem = document.createElement('a');
//     listItem.href = '#';
//     listItem.className = 'list-group-item list-group-item-action';
//     listItem.textContent = `${questionId}: ${questionText}`;
//
//     // Create a strong element for the question number
//     const strongElement = document.createElement('strong');
//     strongElement.textContent = `Question ${listItem.dataset.questionNumber}: `;
//
//     // Append the strong element to the list item
//     listItem.appendChild(strongElement);
//
//
//     // `Question ${listItem.dataset.questionNumber}: `
//     listItem.dataset.category = category; // Store category if needed
//     listItem.dataset.questionId = questionId;
//
//     listItem.addEventListener('click', (event) => {
//         event.preventDefault();
//
//         getQuestionData(listItem.dataset.questionId);
//     });
//
//     parentContainer.appendChild(listItem);
// }

// function populateQuestionsList(data) {
//     const questionsList = document.getElementById('questions-list');
//     questionsList.innerHTML = ''; // Clear the list first
//
//     // Iterate through each severity category ("low", "medium", "high")
//     Object.entries(data).forEach(([category, questions]) => {
//         // Add a category header (optional)
//         const categoryHeader = document.createElement('h3');
//         categoryHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize first letter
//         questionsList.appendChild(categoryHeader);
//
//         // Iterate through the questions in the current category
//         Object.entries(questions).forEach(([key, question]) => {
//             addClickableItem(questionsList, question.id, question.text);
//         });
//     });
// }
function populateQuestionsList(data, selectedCategory) {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = ''; // Clear the list first

    // Fetch questions from the selected category
    const questions = data[selectedCategory];

    // Iterate through the questions in the selected category
    Object.entries(questions).forEach(([questionNumber, question]) => {
        addClickableItem(questionsList, question.id, question.text, questionNumber);
    });
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
    // listItem.textContent = questionText; // Set the question text as the list item's text
    // listItem.classList.add("border-bottom", "border-light");

    // Add an event listener for clicks on this list item
    listItem.addEventListener('click', function () {
        console.log(`Question ID ${questionId} clicked`); // Example action
        // Implement the logic to handle the click event, e.g., fetch more data or display details
        getQuestionData(questionId);
    });

    parentContainer.appendChild(listItem); // Add the list item to the parent container
}


function getQuestionData(questionId) {
    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/question/${questionId}`, {

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
        // TODO: Define data in server
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

    configCopy.data.labels = configCopy.data.labels.map(label => label.split(' '));

    if (chartObj.chart) {
        chartObj.chart.destroy();
    }

    chartObj.chart = new Chart(chartObj.canvas, configCopy);
}


function getImpactsData(first) {
    if (!first) {
        updateQuestionData(charts.questions, {datasets: [], labels: []});
    }

    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/outliers`, {
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
        // document.getElementById('questions-list').innerHTML = "";
        // Object.entries(data).forEach((question) => {
        //     addClickableItem(document.getElementById('questions-list'), question);
        // });

        // const questionsList = document.getElementById('questions-list');
        // questionsList.innerHTML = ""; // Clear existing items
        //
        // // Flatten the grouped data into a list
        // const flattenedData = [];
        // Object.entries(data).forEach(([category, questions]) => {
        //     Object.entries(questions).forEach(([id, text]) => {
        //         flattenedData.push({ id, text, category });
        //     });
        // });
        //
        // // Populate the list with the flattened data
        // flattenedData.forEach(question => {
        //     addClickableItem(questionsList, question.text, question.id, question.category);
        // });

        questionsData = data;
        populateQuestionsList(questionsData, localStorage.getItem("impactLevel") || "medium");
    }).catch(function (error) {
        console.error(error);
    });
}

$(document).ready(function () {
    // Navigation button event handlers
    $("#questions-nav-btn, #net-nav-btn, #settings-nav-btn").each(function() {
        $(this).on('click', function (e) {
            e.preventDefault(); // Prevent the default action

            // Push the current state to the history stack
            history.pushState(null, null, location.href);

            // Redirect to the target page
            window.location.href = $(this).data('target');
        });
    });

    $("#new-data-btn").on("click", function () {
        getImpactsData();
    });

    $('.sensitivity-level-button').on('click', function () {
        // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
        $('.sensitivity-level-button').removeClass('btn-primary').addClass('btn-secondary');

        // Set the clicked button to 'btn-primary'
        $(this).removeClass('btn-secondary').addClass('btn-primary');

        localStorage.setItem("impactLevel", $(this).data('level'));

        populateQuestionsList(questionsData, localStorage.getItem("impactLevel"));
    });


    // Get the desired impact level from localStorage, defaulting to "medium" if not set
    const impactLevel = localStorage.getItem("impactLevel") || "medium";

    // Get all buttons with the class "sensitivity-level-button"
    const buttons = document.querySelectorAll('.sensitivity-level-button');

    // Iterate over the buttons to adjust classes
    buttons.forEach(button => {
        // Remove 'btn-primary' and add 'btn-secondary' for all buttons
        button.classList.remove('btn-primary');
        button.classList.add('btn-secondary');

        // If the button's value matches the impactLevel, switch classes
        if (button.dataset.level === impactLevel) {
            button.classList.remove('btn-secondary');
            button.classList.add('btn-primary');
        }
    });

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