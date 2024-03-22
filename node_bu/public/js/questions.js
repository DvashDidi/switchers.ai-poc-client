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
        additionalTextContainer.innerHTML = `<div class="additional-text"><strong>Q${listItem.dataset.questionNumber}:</strong> ${question["text"]}</div>`;

        getQuestionData(listItem.dataset.questionId);
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
        drawChart(data);
    }).catch(function (error) {
        console.error(error);
    });
}

function addPlaceholderListeners() {
    const placeholder = $('#chart-placeholder');
    const questionsList = $('#questions-list');

    placeholder.on("mouseenter", function () {
        questionsList.fadeTo(700, 0.3, function() {
            questionsList.fadeTo(500, 1);
        });
    });
}

$(document).ready(function () {
    addPlaceholderListeners();

    init_page().then(function () {
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

        // Event listener for window resize
        window.addEventListener('resize', resizeChart);

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
        }).catch(function (error) {
            console.error(error);
        });
    });
});