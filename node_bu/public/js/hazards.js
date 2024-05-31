let questionDivider = undefined;
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

    // Add click event listener to the list item
    listItem.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior

        questionDivider.style.display = 'block';

        // Remove the 'clicked' class from all items
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('clicked');
        });

        // Add the 'clicked' class to the clicked item
        listItem.classList.add('clicked');

        // Add additional text below the scrollable-container
        const additionalTextContainer = document.getElementById('additional-text-container');
        additionalTextContainer.innerHTML = `
            <div class="additional-text rounded">
                <strong>Selected Question ${listItem.dataset.questionNumber}:</strong>
                <br>
                <span>${questionText}</span>
            </div>
        `;

        getQuestionData(questionId);
    });

    parentContainer.appendChild(listItem); // Add the list item to the parent container
}

function getQuestionData(questionId) {
    fetch(apiQueryParams(`research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/question/${questionId}`), {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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
        drawChart(translateToGoogleChartsData(data));
    }).catch(function (error) {
        console.error(error);
    });
}

function getHazardsData() {
    let toast;
    if (getPOV()) {
        toast = Swal.mixin({
            toast: true,
            position: "bottom-end",
            showConfirmButton: false,
            timerProgressBar: true,
            didOpen: (toast) => {
                Swal.showLoading();
            }
        });

        toast.fire({
            icon: "info",
            title: 'Loading...',
            text: 'Fetching Hazardous data.',
        });
    }

    fetch(apiQueryParams(`research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/hazards`), {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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
        populateQuestionsList(questionsData, localStorage.getItem("hazardLevel") || "medium");

        if (getPOV()) {
            toast.close(); // Close the loading Swal when data is received and processed
        }
    }).catch(function (error) {
        console.error(error);

        if (getPOV()) {
            toast.fire({ // Show error Swal
                icon: 'error',
                title: 'Oops...',
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true,
                text: `An error occurred: ${error.message}`
            });
        }
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


function _main() {
    init_page().then(function () {
        createNavBar('hazards');

        questionDivider = document.getElementById("additional-text-divider");

        // Set question list height to be the same as the graph
        const mainGraphElement = document.querySelector('#main-graph-data');
        const questionSection = document.querySelector('#questions-section');
        questionSection.style.height = `${mainGraphElement.offsetHeight}px`;

        // Event listener for a window resize
        window.addEventListener('resize', resizeChart);

        addPlaceholderListeners();

        $('.sensitivity-level-button').on('click', function () {
            questionDivider.style.display = 'none';
            updateChart = false;

            $("#chart-div")
                .empty()
                .append(`<div style="text-align: center;">
                                    <strong id="chart-placeholder" class="text-black">Choose a question to inspect.</strong>
                                </div>`);
            addPlaceholderListeners();

            // Remove 'btn-primary' from all buttons and set them to 'btn-secondary'
            $('.sensitivity-level-button').removeClass('btn-primary').addClass('btn-secondary');

            // Set the clicked button to 'btn-primary'
            $(this).removeClass('btn-secondary').addClass('btn-primary');

            localStorage.setItem("hazardLevel", $(this).data('level') || "medium");

            populateQuestionsList(questionsData, localStorage.getItem("hazardLevel"));

            // Clear the additional text container
            document.getElementById('additional-text-container').innerHTML = '';
        });

        // Get the desired hazard level from localStorage, defaulting to "medium" if not set
        const hazardLevel = localStorage.getItem("hazardLevel") || "medium";

        // Get all buttons with the class "sensitivity-level-button"
        const buttons = document.querySelectorAll('.sensitivity-level-button');

        // Iterate over the buttons to adjust classes
        buttons.forEach(button => {
            // Remove 'btn-primary' and add 'btn-secondary' for all buttons
            button.classList.remove('btn-primary');
            button.classList.add('btn-secondary');

            // If the button's value matches the hazardLevel, switch classes
            if (button.dataset.level === hazardLevel) {
                button.classList.remove('btn-secondary');
                button.classList.add('btn-primary');
            }
        });

        getHazardsData();
    }).catch(function (error) {
        createNavBar('hazards');
    });
}

$(document).ready(function () {
    google.charts.setOnLoadCallback(_main);
});