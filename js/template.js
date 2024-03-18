let apiHost = "https://api.switchers.ai";

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

    $('#site-logo').toggleClass('light-mode-logo');
    $('#site-logo').toggleClass('dark-mode-logo');
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

function getSelectedResearch() {
    return localStorage.getItem("selectedResearch");
}

function getPOV() {
    return localStorage.getItem("pov");
}

function setSelectedResearch(value) {
    if (value) {
        localStorage.setItem("selectedResearch", value);
    }
}

function getDefaultResearchFromApi() {
    return new Promise(function (resolve, reject) {
        fetch(`${apiHost}/v1/research/default`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
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
            resolve(data.id);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
}

function showPOVNotification() {
    $('#notificationBar').html('To enhance your experience, consider setting up your Point of View (POV). <a href="settings.html" style="color: #333; text-decoration: underline;">Set up POV now</a> <button class="close-pov-notification" id="closeNotification">&times;</button>')
        .css('display', 'block');

    // Close button functionality
    $('#closeNotification').click(function () {
        $('#notificationBar').fadeOut(1000);
    });

    // Hide the notification after some time
    setTimeout(function () {
        $('#notificationBar').fadeOut(1000);
    }, 15000); // Hides after 15 seconds
}

function init_page() {
    return new Promise((resolve, reject) => {
        setGlobalViewMode();

        const researchPromise = getSelectedResearch() === null ?
            getDefaultResearchFromApi().then(setSelectedResearch) :
            Promise.resolve();

        researchPromise.then(() => {
            if (getPOV() === null) {
                showPOVNotification();
            }

            resolve(true);
        }).catch(reject);
    });
}


function outdatedResearchFound() {
    Swal.fire({
        title: "Research data was updated",
        text: `Fetching new data...`,
        icon: "info",
        timer: 1800,
        showConfirmButton: false
    }).then(() => {
        delete localStorage.selectedResearch;
        location.reload();
    });
}