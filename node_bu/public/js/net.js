function createBootstrapTableFromData(googleChartData) {
    // Clear existing table data
    const tableHeader = document.getElementById('table-header');
    const tableBody = document.getElementById('table-body');
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create the header row
    const headerRow = document.createElement('tr');
    googleChartData[0].forEach(headerText => {
        const headerCell = document.createElement('th');
        headerCell.textContent = headerText;
        headerRow.appendChild(headerCell);
    });
    tableHeader.appendChild(headerRow);

    // Create the data rows
    googleChartData.slice(1).forEach(rowData => {
        const row = document.createElement('tr');
        rowData.forEach(cellData => {
            const cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}
function fetchDataAndUpdateUI() {
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
            text: 'Fetching Net data.',
        });
    }

    const apiUrl = `${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/net`;
    fetch(apiUrl, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
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
        .then(data => {
            const googleChartData = transformNetDataForGoogleCharts(data);
            createBootstrapTableFromData(googleChartData);
            drawChart(googleChartData);

            if (getPOV()) {
                toast.close(); // Close the loading Swal when data is received and processed
            }
        })
        .catch((error) => {
            console.error('Failed to load data:', error);

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

function main() {
    init_page().then(function () {
        // Navigation button event handlers
        $("#questions-nav-btn, #impacts-nav-btn, #settings-nav-btn, #icebergs-nav-btn").each(function () {
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

        fetchDataAndUpdateUI(); // Initiate fetch operation
    });
}

$(document).ready(function () {
    google.charts.setOnLoadCallback(main);
});
