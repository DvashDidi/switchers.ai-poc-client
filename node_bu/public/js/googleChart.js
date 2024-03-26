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
    isStacked: true,
    // animation: {
    //     duration: 1000,
    //     easing: 'inAndOut',
    // }
};

// Set initial chart type and stack mode based on localStorage or defaults
const savedChartType = localStorage.getItem('chartType') || 'ColumnChart';
const savedStackMode = localStorage.getItem('stackMode') === 'true';
setChartTypeUI(savedChartType);
setStackModeUI(savedStackMode);

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

function toggleSeriesVisibility(seriesIndex) {
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

function drawChart(serverData) {
    const numberOfDatasets = Object.keys(serverData).length;
    seriesVisibility = new Array(numberOfDatasets).fill(true);

    _data = new google.visualization.DataTable();
    _data.addColumn('string', 'Category');

    // Add columns for each dataset
    Object.keys(serverData).forEach(dataset => {
        _data.addColumn('number', dataset);
    });

    // Now, build the rows by category
    const categories = Object.keys(serverData[Object.keys(serverData)[0]]);
    const rows = categories.map(category => {
        const row = [category];
        Object.keys(serverData).forEach(dataset => {
            row.push(serverData[dataset][category] || 0);
        });
        return row;
    });

    // Add rows to the DataTable
    _data.addRows(rows);

    const colorList = [];
    for (let idx = 0; idx < numberOfDatasets; idx++) {
        colorList.push(baseColors[idx % baseColors.length].border);
    }
    _options.colors = colorList;

    _view = new google.visualization.DataView(_data);

    // Default to ColumnChart type
    drawColumnType(localStorage.getItem('chartType') || 'ColumnChart');

    // Update legend labels to reflect visibility
    updateLegendLabels(seriesVisibility);
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

