let toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timerProgressBar: true,
    didOpen: (toast) => {
        Swal.showLoading();
    }
});


async function fetchQuestions() {
    const response = await fetch(`${apiHost}/v1/research/${getSelectedResearch()}/questions`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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
            "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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

            var input = document.getElementById('filter-name');
            if (input.value.trim() === '') {
                isValid = false;
                toast.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    timer: 2000,
                    showConfirmButton: false,
                    timerProgressBar: true,
                    text: `Please choose a name for your filter`
                }).then(() => {
                    input.scrollIntoView({behavior: 'smooth', block: 'center'});
                    input.classList.add('is-invalid');

                    setTimeout(() => {
                        input.classList.remove('is-invalid');
                    }, 2100);
                });
            }

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
                "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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
    }).then(function (filterData) {
        toast.close(); // Close the loading Swal when data is received and processed
        localStorage.setItem('filterId', filterData.id);

        hideFilterCreationElements();
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

function deleteFilter() {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Deleting Filter.',
    });

    fetch(`${apiHost}/v1/research-participant-filters/${localStorage.getItem('filterId')}`, {
            method: "DELETE",
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
    }).then(function () {
        toast.close(); // Close the loading Swal when data is received and processed
        delete localStorage.filterId;

        location.reload();
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

function getFilters() {
    return new Promise(function (resolve, reject) {
        toast.fire({
            icon: "info",
            title: 'Loading...',
            text: 'Loading Your Filters.',
        });

        fetch(`${apiHost}/v1/research/${getSelectedResearch()}/research-participant-filters`, {
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
        }).then(function (clientFilters) {
            toast.close(); // Close the loading Swal when data is received and processed
            resolve(clientFilters);
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
    });
}

function hideFilterCreationElements() {
    const createFilterDiv = document.getElementById('create-filter');
    createFilterDiv.innerHTML = ''; // Clear the content of the div

    document.getElementById('add-filter-btn').remove();
    document.getElementById('logic-group').remove();
    document.getElementById('filter-name').disabled = true;

    // Get all elements with the class name 'remove-filter-btn'
    let elements = document.getElementsByClassName('remove-filter-btn');
    elements[0].style.display = ''; // Set display property to default
    elements[0].style.visibility = 'visible'; // Make sure the element is visible
}

function showSuccessAnimation() {
    Swal.fire({
        title: "Filter created successfully!",
        text: `You can now view the analysis changes`,
        icon: "success",
        showConfirmButton: true
    });
}

// Document ready function
$(document).ready(() => {
    init_page().then(function () {
        setNavigationHandlers(navigationIdsPrefixes.filter(v => v !== "filters"));

        $('input[name="logicOptions"]').change(function () {
            // Reset classes
            $('.btn-group-toggle label').each(function () {
                $(this).removeClass('bg-primary').addClass('btn-secondary');
            });

            // Apply bg-primary to the active label
            $('input[name="logicOptions"]:checked').parent().removeClass('btn-secondary').addClass('bg-primary');
        });

        let removeFilterButtons = document.getElementsByClassName('remove-filter-btn');
        for (let i = 0; i < removeFilterButtons.length; i++) {
            removeFilterButtons[i].addEventListener('click', function() {
                deleteFilter();
            });
        }

        getFilters().then(function (filtersData) {
            if (filtersData.length > 0) {
                document.getElementById('filter-name').value = filtersData[0].name;
                localStorage.setItem('filterId', filtersData[0].id);

                hideFilterCreationElements();
            } else {
                handleFilterCreation();
            }
        });
    }).catch(() => {
    })
});