// Function to populate the dropdown list with candidates
function populateDropList(candidates) {
    const select = $('#pov-choice');
    select.empty(); // Clear existing options

    // Add the placeholder option
    select.append($('<option>', {
        value: '',
        text: 'Select a candidate to inspect',
        disabled: true,
        selected: true
    }));

    // Add options for each candidate
    candidates.forEach(candidate => {
        select.append($('<option>', {
            value: candidate,
            text: candidate
        }));
    });
}

// Function to fetch points of view (povs) from the API
function getPovs() {
    fetch(`${apiHost}/v1/research/${getSelectedResearch()}/points-of-view`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": true
        }
    })
        .then(response => response.ok ? response.json() : Promise.reject(response.text()))
        .then(populateDropList)
        .catch(error => console.error('Error fetching povs:', error));
}

// Document ready function
$(document).ready(() => {
    init_page().then(function () {
        // Initialize points of view dropdown
        getPovs();

        // Setup navigation button event handlers
        $("#impacts-nav-btn, #net-nav-btn, #questions-nav-btn").on('click', function (e) {
            e.preventDefault();
            history.pushState(null, null, location.href); // Push the current state to the history stack
            window.location.href = $(this).data('target'); // Redirect to the target page
        });

        // Setup the save settings button click handler
        $("#save-settings").click(async () => {
            const candidate = $('#pov-choice').val();

            if (candidate) {
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
    });
});
