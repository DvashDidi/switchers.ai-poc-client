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
    const response = await fetch(apiQueryParams(`research/${getSelectedResearch()}/questions`), {
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
    const response = await fetch(apiQueryParams(`question/${questionId}/answers`), {
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
    document.getElementById('conditions-container').innerHTML = "";

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
            option.textContent = `Q${question.sequence_number}: ${question.text}`;

            // Add dataset attributes to each questions option
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
        const filterName = document.getElementById('new-filter-name').value;
        const useAndLogic = document.getElementById('andLogic').checked; // true if AND is selected, false if OR is selected

        const conditions = [];
        const conditionPairs = document.querySelectorAll('.condition-pair');
        let isValid = true;

        let input = document.getElementById('new-filter-name');
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
                let answersSequenceNumbers = selectedAnswerOptions.map(opt => opt.dataset.sequenceNumber);
                let is_excluded = false;

                if (answersSequenceNumbers.length === 0) {
                    // Check if the user hasn't chosen any answer for a specific question.
                    // If so, filter out participants who did not respond to this question.
                    answersSequenceNumbers = Array.from(answerDropdown).map(opt => opt.dataset.sequenceNumber);
                    is_excluded = true;
                }

                const condition = {
                    question_sequence_number: parseInt(questionSequenceNumber),
                    answers_sequence_number: answersSequenceNumbers.map(Number),
                    is_excluded: is_excluded,
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

            addFilter(filterData);
        }
    });
}

function cleanAddFilterForm() {
    // Clear the input for the filter name
    document.getElementById('new-filter-name').value = '';
    document.querySelector("#andLogic").click();

    // Optionally, clear any error messages or invalid classes if you are using form validation
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.error-message').forEach(el => el.textContent = ''); // Assuming error messages might be displayed

    handleFilterCreation();
}

function addFilter(filterData) {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Adding Filter.',
    });

    fetch(apiQueryParams(`research/${getSelectedResearch()}/research-participant-filters`), {
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

        Swal.fire({
            title: "Filter created successfully!",
            text: `You can activate it in the Filter List`,
            icon: "success",
            showConfirmButton: true
        }).then(() => {
            cleanAddFilterForm();
            location.reload();
        });
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

function toggleFilter(filterId, isActive) {
    if (isActive) {
        deactivateFilter(filterId)
    } else {
        activateFilter(filterId)
    }
}

function activateFilter(filterId) {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Activating Filter.',
    });

    fetch(apiQueryParams(`research-participant-filters/${filterId}/activate`), {
            method: "PUT",
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

        Swal.fire({
            title: "Filter activated successfully!",
            text: `filter is now active`,
            icon: "success",
            showConfirmButton: false
        });

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

function deactivateFilter(filterId) {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Deactivating Filter.',
    });

    fetch(apiQueryParams(`research-participant-filters/${filterId}/deactivate`), {
            method: "PUT",
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

        Swal.fire({
            title: "Filter deactivated successfully!",
            text: `filter is deactivated now`,
            icon: "success",
            showConfirmButton: false
        });

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

function deleteFilter(filterId) {
    toast.fire({
        icon: "info",
        title: 'Loading...',
        text: 'Deleting Filter.',
    });

    fetch(apiQueryParams(`research-participant-filters/${filterId}`), {
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

        fetch(apiQueryParams(`research/${getSelectedResearch()}/research-participant-filters`), {
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

function confirmDeleteFilter(filterName, filterId) {
    Swal.fire({
        title: `Are you sure you want to delete '${filterName}' filter?`,
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'No',
        confirmButtonColor: '#d33',  // Red color for the Delete button
        cancelButtonColor: '#3085d6',  // Blue color for the No button
        reverseButtons: true  // Reverses the order of the buttons
    }).then((result) => {
        if (result.isConfirmed) {
            deleteFilter(filterId);  // Call your function to delete the filter
        }
    });
}

function displayFilters(filters) {
    const listGroup = document.querySelector('.list-group');
    listGroup.innerHTML = '';  // Clear existing filters

    filters.forEach(filter => {
        const isActive = filter.is_active;
        const filterElement = document.createElement('div');
        filterElement.className = 'list-group-item';
        filterElement.classList.add("list-group-item", "m-2");
        filterElement.innerHTML = `
            <div class="row align-items-center">
                <div class="col-xs-12 col-sm-12 col-md-7">
                    <h5>${filter.name}</h5>
                    <p>Status: <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">${isActive ? 'Active' : 'Inactive'}</span></p>
        
                    <button class="btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'} activate-btn">${isActive ? 'Deactivate' : 'Activate'}</button>
                    <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                </div>
                <div class="col-xs-12 col-sm-12 col-md-5">
                    <table class="table">
                        <thead>
                            <tr>
                                <th> </th>
                                <th>Participants</th>
                                <th>% of the research participants</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight: bold">All</td>
                                <td>${parseFloat(filter.statistic_weight).toFixed(2)}</td>
                                <td>${filter.ratio}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        listGroup.appendChild(filterElement);

        // Add event listeners for buttons
        const activateBtn = filterElement.querySelector('.activate-btn');
        activateBtn.addEventListener('click', () => toggleFilter(filter.id, isActive));

        const deleteBtn = filterElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => confirmDeleteFilter(filter.name, filter.id));
    });
}

function sortFilters(filters) {
    return filters.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
}

function reloadPreviousActiveTab() {
    // Set the active tab from localStorage if exists
    const activeTab = localStorage.getItem('activeTab');
    if (activeTab) {
        $('.nav-tabs button[data-bs-target="' + activeTab + '"]').tab('show');
    } else {
        // Optionally set a default tab if none is stored
        $('.nav-tabs button[data-bs-target="#create-filter"]').tab('show');
    }

    // Update localStorage when tab changes
    $('button[data-bs-toggle="tab"]').on('click', function (e) {
        const activeTab = $(e.target).attr('data-bs-target');
        localStorage.setItem('activeTab', activeTab);
    });
}

// Document ready function
$(document).ready(() => {
    init_page().then(function () {
        createNavBar('filters');

        reloadPreviousActiveTab();

        $('input[name="logicOptions"]').change(function () {
            // Reset classes
            $('.btn-group-toggle label').each(function () {
                $(this).removeClass('bg-primary').addClass('btn-secondary');
            });

            // Apply bg-primary to the active label
            $('input[name="logicOptions"]:checked').parent().removeClass('btn-secondary').addClass('bg-primary');
        });

        getFilters().then(function (filtersData) {
            if (filtersData.length > 0) {
                sortFilters(filtersData);
                displayFilters(filtersData);
            }
        });
    }).catch(() => {
        createNavBar('filters');
    });

    handleFilterCreation();
});