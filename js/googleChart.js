google.charts.load('current', {'packages': ['corechart']});

const chartDiv = document.getElementById('chart-div');

let updateChart = true;

let _chart, _data, _view;
let seriesVisibility = [];
let _options = {
    // Your chart options
    // title: 'Your Chart Title',
    width: '100%',
    height: '100%',
    chartArea: {
        // Define as percentages to maintain the aspect ratio
        width: '90%',
        // height: '80%'
    },
    bars: 'vertical', // Required for vertical bar chart (column chart)
    // vAxis: {format: 'decimal'},
    // hAxis: {format: 'decimal'},
    legend: {position: 'top', maxLines: 3},
    bar: {groupWidth: '75%'},
    isStacked: false,
    // animation: {
    //     duration: 1000,
    //     easing: 'inAndOut',
    // }
};

// Set initial chart type and stack mode based on localStorage or defaults
const savedChartType = localStorage.getItem('chartType') || 'ColumnChart';
const savedStackMode = localStorage.getItem('stackMode') === 'true';
setChartTypeUI(savedChartType);
// setStackModeUI(savedStackMode); TODO: uncomment after fixing stack mode

// Ensure chart options reflect saved preferences
_options.isStacked = savedStackMode;

function resizeChart() {
    if (_chart && _data && _options) {
        _chart.draw(_view, _options);
    }
}

function setChartTypeUI(type) {
    const columnBtn = document.querySelector("#chartTypeToggle .btn:first-child");
    const barBtn = document.querySelector("#chartTypeToggle .btn:last-child");

    if (type === 'ColumnChart') {
        columnBtn.classList.add('active');
        barBtn.classList.remove('active');
    } else {
        columnBtn.classList.remove('active');
        barBtn.classList.add('active');
    }
}

function setStackModeUI(isStacked) {
    const stackBtn = document.querySelector("#stackedGroupedToggle .btn:first-child");
    const groupBtn = document.querySelector("#stackedGroupedToggle .btn:last-child");

    if (isStacked) {
        stackBtn.classList.add('active');
        groupBtn.classList.remove('active');
    } else {
        stackBtn.classList.remove('active');
        groupBtn.classList.add('active');
    }
}

function toggleChartType(type) {
    localStorage.setItem('chartType', type);
    setChartTypeUI(type);
    drawColumnType(type);
}

function toggleStackMode(isStacked) {
    localStorage.setItem('stackMode', isStacked.toString());
    setStackModeUI(isStacked);
    _options.isStacked = isStacked;
    _chart.draw(_view, _options);
}

function updateLegendLabels(seriesVisibility) {
    google.visualization.events.addListener(_chart, 'ready', function () {
        let textElements = document.querySelectorAll('#chart-div text[text-anchor="start"]');
        let legendTextElements = Array.from(textElements);

        legendTextElements.forEach((text, index) => {
            if (index < seriesVisibility.length) {
                if (!seriesVisibility[index]) {
                    text.style.textDecoration = 'line-through';
                } else {
                    text.style.textDecoration = 'none';
                }
            }
        });
    });
}

function toggleSeriesVisibility(seriesIndex) {
    if (seriesVisibility.filter(v => v === true).length === 1 && seriesVisibility[seriesIndex]) return;

    // Toggle the visibility
    seriesVisibility[seriesIndex] = !seriesVisibility[seriesIndex];

    // Generate the view columns with visibility
    let viewColumns = [0];
    seriesVisibility.forEach(function (visible, index) {
        if (visible) { // If the series is visible
            viewColumns.push(index + 1);
        } else { // Otherwise, skip the series data
            viewColumns.push({
                label: _data.getColumnLabel(index + 1),
                type: _data.getColumnType(index + 1),
                sourceColumn: index + 1,
                calc: function () {
                    return null;
                }
            });
        }
    });

    // Update the view with new columns for visibility
    _view.setColumns(viewColumns);
    _chart.draw(_view, _options); // Redraw the chart with the new view
}

function drawColumnType(type) {
    if (!updateChart) return;

    // Preserve the series visibility state when changing chart types
    const viewColumns = [0]; // The first column (categories) is always visible

    seriesVisibility.forEach((visible, index) => {
        if (visible) {
            viewColumns.push(index + 1); // Visible series
        } else {
            // Invisible series: add a calc function that returns null
            viewColumns.push({
                type: 'number',
                label: _data.getColumnLabel(index + 1),
                calc: function () {
                    return null;
                }
            });
        }
    });

    // Create a DataView with the viewColumns to manage series visibility
    _view = new google.visualization.DataView(_data);
    _view.setColumns(viewColumns);

    if (type === 'ColumnChart') {
        _chart = new google.visualization.ColumnChart(chartDiv);
    } else if (type === 'BarChart') {
        _chart = new google.visualization.BarChart(chartDiv);
    }

    _chart.draw(_view, _options);

    // Update legend labels to reflect visibility
    updateLegendLabels(seriesVisibility);

    // Add click event listener to toggle series visibility
    google.visualization.events.addListener(_chart, 'select', function () {
        var selection = _chart.getSelection();
        if (selection.length > 0) {
            var col = selection[0].column;
            if (col) {
                // Toggle the series visibility
                toggleSeriesVisibility(col - 1);
            }
        }
    });
}

function transformNetDataForGoogleCharts(data) {
    // Step 1: Prepare the header
    const header = ['Name']; // Starting with "Name" column
    const scoresCategories = Object.keys(data[0].scores);
    header.push(...scoresCategories); // Adding categories to the header

    // Step 2: Prepare the data rows
    const rows = data.map(item => {
        const row = [item.name]; // Starting each row with the name
        scoresCategories.forEach(category => {
            row.push(item.scores[category]); // Adding each score by category
        });
        return row;
    });

    // Step 3: Combine header and rows
    return [header, ...rows];
}

function translateToGoogleChartsData(serverData) {
    // Step 1: Prepare the header
    const categories = ['Answer', ...Object.keys(serverData)];
    const data = [categories];

    // Step 2: Aggregate all unique keys from all categories
    const uniqueKeys = new Set();
    Object.values(serverData).forEach(categoryData => {
        Object.keys(categoryData).forEach(key => {
            uniqueKeys.add(key);
        });
    });

    // Step 3: Prepare the data rows
    uniqueKeys.forEach(key => {
        const row = [key];
        categories.slice(1).forEach(category => {
            const value = serverData[category][key];
            row.push(value !== undefined ? value : 0); // Add the value if it exists; otherwise, use 0
        });
        data.push(row);
    });

    return data;
}

function drawChart(drawData) {
    const numberOfDatasets = drawData[0].length - 1;
    seriesVisibility = new Array(numberOfDatasets).fill(true);

    _data = new google.visualization.arrayToDataTable(drawData);

    const colorList = [];
    for (let idx = 0; idx < numberOfDatasets; idx++) {
        colorList.push(baseColors[idx % baseColors.length].border);
    }
    _options.colors = colorList;

    _view = new google.visualization.DataView(_data);

    // Default to ColumnChart type
    drawColumnType(localStorage.getItem('chartType') || 'ColumnChart');
}

// endregion chart