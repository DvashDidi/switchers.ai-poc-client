// Assuming ChartDataLabels is a dependency that needs to be registered
Chart.register(ChartDataLabels);

const charts = {
    net: {
        label: 'Net Data',
        canvas: $('#net-chart'),
        chart: undefined,
        currentData: {},
        baseConfig: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'No net data found',
                    data: [0, 0, 0],
                    backgroundColor: "rgba(255,0,0,0.34)",
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (context) => context[0].label.replaceAll(',', ' '),
                        }
                    },
                    datalabels: {
                        color: 'black',
                        formatter: (value) => value,
                    },
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        min: -100,
                        max: 100
                    }
                }
            }
        }
    }
};

// A helper function to deep copy configurations


// Update chart data
function updateNetData(data) {
    const scoreCategories = Object.keys(data[0].scores);
    charts.net.currentData = {
        labels: data.map(item => item.name),
        datasets: scoreCategories.map((category, idx) => ({
            label: category,
            data: data.map(item => parseFloat(item.scores[category]).toFixed(2)),
            backgroundColor: baseColors[idx % baseColors.length].background,
        }))
    };

    const configCopy = deepCopy(charts.net.baseConfig);
    configCopy.data = charts.net.currentData;

    if (charts.net.chart) charts.net.chart.destroy();
    charts.net.chart = new Chart(charts.net.canvas, configCopy);
}

$(document).ready(() => {
    // Navigation button event handlers
    $("#questions-nav-btn, #impacts-nav-btn, #settings-nav-btn").each(function() {
        $(this).on('click', function (e) {
            e.preventDefault(); // Prevent the default action

            // Push the current state to the history stack
            history.pushState(null, null, location.href);

            // Redirect to the target page
            window.location.href = $(this).data('target');
        });
    });

    // Create dynamic table
    function createDynamicTable(data) {
        const tableHeader = $('#table-header').empty();
        const tableBody = $('#table-body').empty();
        const headers = ["Name", ...Object.keys(data[0].scores)];

        $('<tr>').append(headers.map(text => $('<th>').text(text))).appendTo(tableHeader);
        data.forEach(item => {
            const row = $('<tr>').append($('<td>').text(item.name));
            Object.values(item.scores).forEach(score => row.append($('<td>').text(score)));
            row.appendTo(tableBody);
        });
    }

    // Fetch and update data
    const fetchDataAndUpdateUI = () => {
        const apiUrl = `${apiHost}/v1/research/${getSelectedResearch()}/statistics/${decodeURIComponent(localStorage.getItem('pov'))}/net`;
        fetch(apiUrl, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": true
            }
        })
            .then(response => response.json())
            .then(data => {
                createDynamicTable(data);
                updateNetData(data);
            })
            .catch(error => console.error('Failed to load data:', error));
    };

    fetchDataAndUpdateUI(); // Initiate fetch operation
});
