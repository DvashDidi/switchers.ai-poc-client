let mainGraphElement = undefined;
let questionList = undefined;
let questionMargin = undefined;

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

        // Add additional text below the scrollable-container
        const additionalTextContainer = document.getElementById('additional-text-container');
        additionalTextContainer.innerHTML = `<div class="additional-text rounded"><strong>Selected Question ${listItem.dataset.questionNumber}:</strong><br><span>${question["text"]}</span></div>`;

        getQuestionData(listItem.dataset.questionId);

        // Apply the new max heights to start the animations
        questionList.style.maxHeight =
            `${Math.max(mainGraphElement.offsetHeight - document.querySelector('.additional-text').offsetHeight - questionMargin, 0)}px`;
    });

    // Append the new item to the list
    parentContainer.appendChild(listItem);
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
        drawChart(translateToGoogleChartsData(data));
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

function getQuestionsData() {
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
            text: 'Fetching questions data.',
        });
    }

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
        for (const question of data) {
            addClickableItem(document.getElementById('questions-list'), question);
        }

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

function _main() {
    addPlaceholderListeners();

    init_page().then(function () {
        mainGraphElement = document.querySelector('#main-graph-data');
        questionList = document.querySelector('.scrollable-container');
        questionMargin = getMarginOfCSSClass('additional-text').margins.bottom;

        // Set question list height to be the same as the graph
        let questionSection = document.querySelector('#questions-section');
        questionSection.style.height = `${mainGraphElement.offsetHeight}px`;

        // Navigation button event handlers
        $("#impacts-nav-btn, #net-nav-btn, #settings-nav-btn, #icebergs-nav-btn").each(function () {
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

        getQuestionsData();
    });
}

$(document).ready(function () {
    google.charts.setOnLoadCallback(_main);
});