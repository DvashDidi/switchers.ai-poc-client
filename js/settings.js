// Function to populate the dropdown list with candidates
function populateDropList(povData) {
    const select = $('#pov-choice');
    select.empty(); // Clear existing options

    // Add the placeholder option
    select.append($('<option>', {
        value: "",
        text: "Select a candidate to inspect",
        disabled: true,
        selected: true
    }));

    let candidates = Object.keys(povData);

    // Add options for each candidate
    candidates.forEach(candidate => {
        let current_selected = (candidate === getPOV());

        select.append($('<option>', {
            value: candidate,
            text: candidate,
            selected: current_selected
        }));
    });

    select.change(function () {
        displayCandidateData(povData);
    });

    displayCandidateData(povData);
}

function displayCandidateData(povData) {
    const selectedCandidate = $('#pov-choice').val();
    const statisticData = $('#pov-data');
    statisticData.empty(); // Clear previous data

    if (selectedCandidate && povData[selectedCandidate]) {
        const data = povData[selectedCandidate];
        statisticData.append($('<h3>').text(selectedCandidate + " Statistics:"));
        Object.keys(data).forEach(key => {
            const filterData = data[key];

            // Ensure leading zero if the number is less than 10
            let ratioPercent = parseFloat(filterData.ratio).toFixed(2).padStart(5, '0');

            const description = `<strong>${key} Data:</strong><br>` +
                `${filterData.statistic_weight} participants<br>` +
                //`(${filterData.statistic_weight}/${filterData.total}) ` +
                `${ratioPercent}% of the research participants`;

            statisticData.append($('<div>', {
                html: description
            }).css({
                margin: '10px 0',
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '5px'
            }));
        });
    }
}

// Function to fetch points of view (povs) from the API
function getPovs() {
    fetch(apiQueryParams(`research/${getSelectedResearch()}/points-of-view`), {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            "Authorization": `bearer ${descopeSdk.getSessionToken()}`
        }
    })
        .then((response) => {
            if (!response.ok) {
                if (response.status === 404) {
                    outdatedResearchFound();
                }

                return response.text().then(function (message) {
                    throw new Error(`${message}`);
                });
            }

            return response.json();
        })
        .then(populateDropList)
        .catch(error => console.error('Error fetching povs:', error));
}

function showUserManagement() {
    let tenantId = getParameterByName('tenant');

    if (!tenantId) {
        tenantId = descopeSdk.getTenants(descopeSdk.getSessionToken())[0];
    }

    fetch(apiQueryParams(`user/${tenantId}/admin`), {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `bearer ${descopeSdk.getSessionToken()}`
            }
        }
    ).then(function (response) {
        if (!response.ok) {
            return response.text().then(function (message) {
                throw new Error(`${message}`);
            });
        }

        return response.json();
    }).then(function (is_admin) {
        if (is_admin) {
            const userManagementWidgetContainer = document.getElementById("user-management-widget-container");

            // Create the custom widget element
            const widget = document.createElement('descope-user-management-widget');
            widget.setAttribute('project-id', descopeProjectId);
            widget.setAttribute('widget-id', 'user-management-widget');
            widget.setAttribute('tenant', tenantId);

            // Append the widget to the container
            userManagementWidgetContainer.appendChild(widget);

            // Display the user management container
            const userManagementContainer = document.getElementById("user-management-container");
            userManagementContainer.style.display = "block";
        }
    }).catch(function (error) {
        console.error(error);
    });
}


// Document ready function
$(document).ready(() => {
    init_page().then(function () {
        createNavBar('settings');

        // Initialize points of view dropdown
        getPovs();

        try {
            showUserManagement();
        } catch (e) {
        }

        // Set up the save settings button click handler
        $("#save-settings").click(async () => {
            const candidate = $('#pov-choice').val();

            if (candidate) {
                const povElement = document.getElementById("pov-value");
                if (povElement) {
                    povElement.textContent = candidate;
                }

                localStorage.setItem('pov', candidate);
                Swal.fire({
                    title: "Settings Updated Successfully",
                    text: `You set the pov to '${candidate}'`,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }).catch(function () {
        createNavBar('settings');
    });
});
