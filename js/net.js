$(document).ready(function () {
    {
        $("#questions-nav-btn").on('click', function () {
            window.location.replace("questions");
        });
        $("#outliers-nav-btn").on('click', function () {
            window.location.replace("outliers");
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
        }).catch(function (error) {
            console.error(error)
        });
    }
});