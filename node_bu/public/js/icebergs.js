let questionsData = undefined;
let mainGraphElement = undefined;
let questionList = undefined;
let questionMargin = undefined;

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

    // Add click event listener to the list item
    listItem.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        // Remove the 'clicked' class from all items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('clicked');
        });

        // Add the 'clicked' class to the clicked item
        listItem.classList.add('clicked');

        // Add additional text below the scrollable-container
        const additionalTextContainer = document.getElementById('additional-text-container');
        additionalTextContainer.innerHTML = `<div class="additional-text"><strong>Question ${listItem.dataset.questionNumber}:</strong> ${questionText}</div>`;

        getQuestionData(questionId);

        // Apply the new max heights to start the animations
        questionList.style.maxHeight =
            `${Math.max(mainGraphElement.offsetHeight - document.querySelector('.additional-text').offsetHeight - questionMargin, 0)}px`;
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
        updateChart = true;
        drawChart(data);
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

function getIcebergsData() {
    // TODO: GET THE REAL DATA !
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

function addPlaceholderListeners() {
    const placeholder = $('#chart-placeholder');
    const questionsList = $('#questions-list');

    placeholder.on("mouseenter", function () {
        questionsList.fadeTo(700, 0.3, function () {
            questionsList.fadeTo(500, 1);
        });
    });
}

$(document).ready(function () {
    init_page().then(function () {
        mainGraphElement = document.querySelector('#main-graph-data');
        questionList = document.querySelector('.scrollable-container');
        questionMargin = getMarginOfCSSClass('additional-text').margins.top;

        // Set question list height to be the same as the graph
        let questionSection = document.querySelector('#questions-section');
        questionSection.style.height = `${mainGraphElement.offsetHeight}px`;

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

        // Event listener for a window resize
        window.addEventListener('resize', resizeChart);

        addPlaceholderListeners();

        $('.sensitivity-level-button').on('click', function () {
            updateChart = false;

            $("#chart_div")
                .empty()
                .append(`<div style="text-align: center;">
                                    <strong id="chart-placeholder" class="text-black">Choose a question to inspect.</strong>
                                </div>`);
            addPlaceholderListeners();

            // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
            $('.sensitivity-level-button').removeClass('btn-primary').addClass('btn-secondary');

            // Set the clicked button to 'btn-primary'
            $(this).removeClass('btn-secondary').addClass('btn-primary');

            localStorage.setItem("icebergLevel", $(this).data('level') || "medium");

            populateQuestionsList(questionsData, localStorage.getItem("icebergLevel"));

            // Clear the additional text container
            document.getElementById('additional-text-container').innerHTML = '';
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

        getIcebergsData();
    });
});