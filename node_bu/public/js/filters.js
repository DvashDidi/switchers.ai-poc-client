let toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timerProgressBar: true,
    didOpen: (toast) => {
        Swal.showLoading();
    }
});

function setNavigationHandlers() {
    // Navigation button event handlers
    $("#questions-nav-btn, #net-nav-btn, #settings-nav-btn, #icebergs-nav-btn, #impacts-nav-btn").each(function () {
        $(this).on('click', function (e) {
            e.preventDefault(); // Prevent the default action

            // Push the current state to the history stack
            history.pushState(null, null, location.href);

            // Redirect to the target page
            window.location.href = $(this).data('target');
        });
    });
}

async function fetchQuestions() {
    const response = await fetch(`${apiHost}/v1/research/${getSelectedResearch()}/questions`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": sessionToken ? `bearer ${sessionToken}` : ""
            }
        }
    );
    return response.json();
}

async function fetchAnswers(questionId) {
    const response = await fetch(`${apiHost}/v1/question/${questionId}/answers`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            "Authorization": sessionToken ? `bearer ${sessionToken}` : ""
        }
    });
    return response.json();
}

function handleFilterCreation() {
    const conditionsContainer = document.getElementById('conditions-container');
    const addConditionBtn = document.getElementById('add-condition-btn');
    const addFilterBtn = document.getElementById('add-filter-btn');


    // Initially fetch questions and populate the first pair
    fetchQuestions().then(questions => {
        addQuestionAnswerPair(questions);
    });

    // Handle adding new condition pairs
    addConditionBtn.addEventListener('click', function () {
        fetchQuestions().then(questions => {
            addQuestionAnswerPair(questions, true);
        });
    });

    function addQuestionAnswerPair(questions, addDivider = false) {
        const template = document.querySelector('#condition-template').content.cloneNode(true);
        const questionDropdown = template.querySelector('.question-dropdown');
        const answerDropdown = template.querySelector('.answer-dropdown');
        const removeBtn = template.querySelector('.remove-condition-btn');
        const dividerPlaceholder = template.querySelector('.divider-placeholder');

        // Add divider if it's not the first condition
        if (addDivider) {
            const divider = document.createElement('div');
            divider.className = 'divider';
            dividerPlaceholder.appendChild(divider);
        } else {
            dividerPlaceholder.remove();
        }

        // Populate question dropdown
        questions.forEach(question => {
            const option = document.createElement('option');
            option.value = question.id;
            option.textContent = question.text;
            // Add dataset attributes to each question option
            option.dataset.sequenceNumber = question.sequence_number;
            option.dataset.questionId = question.id;
            option.dataset.researchId = question.research_id;
            questionDropdown.appendChild(option);
        });

        // Set up event listener for question selection
        questionDropdown.addEventListener('change', async function () {
            const questionId = this.value;
            const answers = await fetchAnswers(questionId);
            answerDropdown.innerHTML = ''; // Clear previous answers if any
            answers.forEach(answer => {
                const option = document.createElement('option');
                option.value = answer.id;
                option.textContent = answer.text;
                // Add dataset attributes to each answer option
                option.dataset.sequenceNumber = answer.sequence_number;
                option.dataset.answerId = answer.id;
                option.dataset.questionId = answer.question_id;
                answerDropdown.appendChild(option);
            });
        });

        // Set up event listener for the remove button
        removeBtn.addEventListener('click', function () {
            this.closest('.condition-pair').remove();
        });

        conditionsContainer.appendChild(template);
    }

    addFilterBtn.addEventListener('click', function () {
        const filterName = document.getElementById('filter-name').value;
        const useAndLogic = document.getElementById('andLogic').checked; // true if AND is selected, false if OR is selected

        const conditions = [];
        const conditionPairs = document.querySelectorAll('.condition-pair');
        let isValid = true;

        conditionPairs.forEach(pair => {
            const questionDropdown = pair.querySelector('.question-dropdown');
            const answerDropdown = pair.querySelector('.answer-dropdown'); // Ensure defined for use below

            if (questionDropdown.value === "") {
                isValid = false;
                toast.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true,
                    text: `Please choose a question or remove condition`
                }).then(() => {
                    questionDropdown.scrollIntoView({behavior: 'smooth', block: 'center'});
                    questionDropdown.classList.add('is-invalid');

                    setTimeout(() => {
                        questionDropdown.classList.remove('is-invalid');
                    }, 2100);
                });
            } else {
                const selectedQuestionOption = questionDropdown.selectedOptions[0];
                const selectedAnswerOptions = Array.from(answerDropdown.selectedOptions);
                const questionSequenceNumber = selectedQuestionOption.dataset.sequenceNumber;
                const answersSequenceNumbers = selectedAnswerOptions.map(opt => opt.dataset.sequenceNumber);

                const condition = {
                    question_sequence_number: parseInt(questionSequenceNumber),
                    answers_sequence_number: answersSequenceNumbers.map(Number),
                    is_excluded: true,
                    type: "FilterCondition"
                };

                conditions.push(condition);
            }
        });

        if (isValid) {
            const filterData = {
                name: filterName,
                pov: "",
                config: {
                    conditions: conditions,
                    use_and_logic: useAndLogic,
                    type: "CompositeFilter"
                }
            };

            addFilter(filterData)
        }
    });
}

function addFilter(filterData) {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Adding Filter.',
    });

    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/research-participant-filters`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": sessionToken ? `bearer ${sessionToken}` : ""
            },
            body: JSON.stringify(filterData)
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
    }).then(function () {
        toast.close(); // Close the loading Swal when data is received and processed
        showSuccessAnimation();
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

function showSuccessAnimation() {
    const createFilterDiv = document.getElementById('create-filter');
    createFilterDiv.innerHTML = ''; // Clear the content of the div

    Swal.fire({
        title: "Filter created successfully !",
        text: `You can now view the analysis changes`,
        icon: "success",
        showConfirmButton: true
    });

    document.getElementById('add-filter-btn').remove();
    document.getElementById('logic-group').remove();
}

function _main() {
    init_page().then(function () {
        setNavigationHandlers();

        $('input[name="logicOptions"]').change(function () {
            // Reset classes
            $('.btn-group-toggle label').each(function () {
                $(this).removeClass('bg-primary').addClass('btn-secondary');
            });
            // Apply bg-primary to the active label
            $('input[name="logicOptions"]:checked').parent().removeClass('btn-secondary').addClass('bg-primary');
        });

        handleFilterCreation();
    }).catch(() => {
    })
}

_main();