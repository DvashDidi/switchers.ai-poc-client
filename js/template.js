let apiHost = "https://ba00-2a06-c701-4cf4-af00-d5f9-1ba8-6bee-bc47.ngrok-free.app";

const CHART_COLORS = {
    BLUE: 'rgb(54, 162, 235)',
    GREEN: 'rgb(75,192,94)',
    ORANGE: 'rgb(255, 159, 64)',
    RED: 'rgb(255, 99, 132)',
    YELLOW: 'rgb(255, 205, 86)',
    PURPLE: 'rgb(153, 102, 255)',
    GREY: 'rgb(201, 203, 207)',
    BLACK: 'rgb(0, 0, 0)'
};

const baseColors = [
    {
        border: CHART_COLORS.BLUE,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.BLUE, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.BLUE, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.BLUE, 0.45),
    },
    {
        border: CHART_COLORS.ORANGE,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.ORANGE, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.ORANGE, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.ORANGE, 0.45),
    },
    {
        border: CHART_COLORS.GREEN,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.GREEN, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.GREEN, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.GREEN, 0.45),
    },
    {
        border: CHART_COLORS.RED,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.RED, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.RED, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.RED, 0.45),
    }
];

function rgbaWithAlpha(rgb, alpha) {
    const rgbComponents = rgb.match(/\d+/g);
    if (rgbComponents.length !== 3) {
        throw new Error('Invalid RGB color format');
    }

    const [r, g, b] = rgbComponents;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// User UX //
function getRandomColor() {
    let color = [];
    for (let i = 0; i < 3; i++) {
        color.push(Math.floor(Math.random() * 256));
    }
    return 'rgb(' + color.join(', ') + ')';
}

function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return primitive values and null as is
    }
    let copy = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach(key => {
        copy[key] = deepCopy(obj[key]);
    });
    return copy;
}

$(".random-color").on("mouseover mouseout", function () {
    // this.style.color = getRandomColor();
    // using important to override bootstrap important
    this.style.setProperty('color', getRandomColor(), 'important');
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover'
    });
})

$("#toggle-dark-mode").on("click", function () {
    JSON.parse(localStorage.getItem('light-mode')) ?
        localStorage.setItem('light-mode', JSON.stringify(false)) :
        localStorage.setItem('light-mode', JSON.stringify(true));

    updateLightDarkView();
});

function updateLightDarkView() {
    $(".bg-dark, .bg-light").toggleClass("bg-dark bg-light");
    $(".bg-primary, .bg-info").toggleClass("bg-primary bg-info");
    $(".btn-success, .btn-info").toggleClass("btn-success btn-info");
    $(".text-dark, .text-white").toggleClass("text-dark text-white");
    $(".body-background-dark, .body-background-light").toggleClass("body-background-dark body-background-light");

    $('#site-logo').toggleClass('light-logo');
}

function setGlobalViewMode() {
    if (!localStorage.getItem('light-mode')) {
        localStorage.setItem('light-mode', JSON.stringify(false));
    } else {
        let lightMode = JSON.parse(localStorage.getItem('light-mode'));
        if (lightMode) {
            updateLightDarkView();
            $("#toggle-dark-mode").attr('checked', 'checked');
        }
    }
}

setGlobalViewMode();


///////////////////////////////////////////
///////////////////////////////     filters
const pov_filters = {
    "Arben Vitia": {
        "Vitia's Base Voters": {
            "filters": [{
                "question_id": 13,
                "excluded_answers_ids": [2, 10, 11, 12]
            }],
            "logical_operator": "AND"
        },
        "Vitia's Potential Voters": {
            "filters": [{
                "question_id": 13,
                "excluded_answers_ids": [1, 2]
            }, {
                "question_id": 15,
                "excluded_answers_ids": [3, 5, 6]
            }, {
                "question_id": 16,
                "excluded_answers_ids": [1, 2]
            }],
            "logical_operator": "AND"
        }
    },
    "Përparim Rama": {
        "Rama's Base Voters": {
            "filters": [{
                "question_id": 13,
                "excluded_answers_ids": [1, 10, 11, 12]
            }],
            "logical_operator": "AND"
        },
        "Rama's Potential Voters": {
            "filters": [{
                "question_id": 13,
                "excluded_answers_ids": [1, 2]
            }, {
                "question_id": 15,
                "excluded_answers_ids": [1, 2]
            }, {
                "question_id": 16,
                "excluded_answers_ids": [3, 5, 6]
            }],
            "logical_operator": "AND"
        }
    }
}

async function set_pov(pov_name, filters_list) {
    if (pov_name in pov_filters) {
        let new_filters = Object.keys(pov_filters[pov_name]);

        if (!new_filters.includes("All")) {
            new_filters.push("All");
        }

        const filtersToRemove = filters_list.filter(item => !new_filters.includes(item));
        const filtersToAdd = new_filters.filter(item => !filters_list.includes(item));

        // Remove old filters
        filtersToRemove.forEach(async value => await remove_filter(value));

        // Create new filters
        for (const filter_name of filtersToAdd) {
            await create_filter(filter_name, pov_filters[pov_name][filter_name]);
        }
    }
}

function remove_filter(filter_name) {
    return new Promise(function (resolve, reject) {
        fetch(`${apiHost}/filter/${filter_name}`, {
                method: "DELETE",
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
            resolve(data);
        }).catch(function (error) {
            reject(error);
        });
    });
}

function create_filter(filter_name, filter_config) {
    return new Promise(function (resolve, reject) {
        fetch(`${apiHost}/filter/${filter_name}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": true
                },
                body: JSON.stringify(filter_config)
            }
        ).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (message) {
                    throw new Error(`${message}`);
                });
            }

            return response.json();
        }).then(function (data) {
            resolve(data);
        }).catch(function (error) {
            reject(error);
        });
    });
}

function getAllFilters() {
    return new Promise(function (resolve, reject) {
        fetch(`${apiHost}/filter`, {
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
            resolve(data);
        }).catch(function (error) {
            reject(error);
        });
    });
}

//////////////////////////////////////////