Chart.register(ChartDataLabels);

let charts = {
    net: {
        label: 'Net Data',
        canvas: $("#net-chart"),
        chart: undefined,
        currentData: {},
        baseConfig: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'No net data found',
                        data: [0, 0, 0],
                        backgroundColor: "rgba(255,0,0,0.34)",
                    }
                ]
            },

        }
    }
};

function updateQuestionData(data) {
        const ctx = document.getElementById('net-chart').getContext('2d');
        const chartLabels = data.rows.map(row => row[0]);
        const chartData = data.rows.map(row => row.slice(1)); // Skip the first element (name)

        const datasets = chartData[0].map((_, index) => ({
            label: data.headers[index + 1], // Skip the first header (name)
            data: chartData.map(row => row[index]),
            borderColor: baseColors[index % baseColors.length].border,
            hoverBorderColor: baseColors[index % baseColors.length].hoverBackground.hoverBorder,
            backgroundColor: baseColors[index % baseColors.length].background,
            hoverBackgroundColor: baseColors[index % baseColors.length].hoverBackground
        }));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                return context[0].label.replaceAll(',', ' ');
                            }
                        }
                    },
                    datalabels: {
                        color: 'black', // Color of the labels
                        formatter: function (value, context) {
                            return value; // Display the actual data value
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                },
                height: 650,
                scales: {
                    y: {
                        min: -100,
                        max: 100
                    }
                }
            }
        });
}

$(document).ready(function () {
    {
        $("#questions-nav-btn").on('click', function () {
            window.location.replace("questions");
        });
        $("#impacts-nav-btn").on('click', function () {
            window.location.replace("outliers");
        });
        $("#settings-nav-btn").on('click', function () {
            window.location.replace("settings");
        });

        // Function to create the dynamic table
        function createDynamicTable(headers, rows) {
            // Create the header of the table
            const headerRow = document.createElement('tr');
            headers.forEach(headerText => {
                const header = document.createElement('th');
                header.textContent = headerText;
                headerRow.appendChild(header);
            });
            document.getElementById('table-header').appendChild(headerRow);

            // Create the body of the table
            const tbody = document.getElementById('table-body');
            tbody.classList.add("bg-white");
            rows.forEach(rowData => {
                const row = document.createElement('tr');
                rowData.forEach(cellData => {
                    const cell = document.createElement('td');
                    cell.textContent = cellData;
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
        }

        fetch( `${apiHost}/statistics/net`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": true
                }
            }
        ).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (message) {
                    throw new Error(`${message}`);
                });
            }

            return response.json();
        }).then(function (data) {
            createDynamicTable(data.headers, data.rows);

            updateQuestionData(data);

        }).catch(function (error) {
            console.error(error);
        });
    }
});