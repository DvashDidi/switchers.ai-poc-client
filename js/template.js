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
    Swal.fire({
        // title: `<a href="settings.html" style="color: #333; text-decoration: underline;">Set up POV now</a>`,
        // text: `To enhance your experience, consider setting up your Point of View (POV).`,
        html: `<h3>To enhance your experience, consider <a href="settings.html" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">setting up your Point of View</a> (POV).</h3>`,
        position: 'bottom',
        backdrop: false,
        timer: 15000,
        grow: 'row', // Adjust the growing behavior as needed
        showConfirmButton: false,
        showCloseButton: true,
        showClass: {
            popup: `
      animate__animated
      animate__fadeInUp
      animate__faster
    `,
        },
        hideClass: {
            popup: `
      animate__animated
      animate__fadeOutDown
      animate__faster
    `,
        },
        customClass: {
            popup: 'notification-bar', // Apply your class here
            closeButton: 'custom-close-button'
        }
    });
}

function disableHazardousPage() {
    // Get the button element by its ID
    const button = document.getElementById("icebergs-nav-btn");

    // Disable the button
    button.disabled = true;

    // Change the title
    $(button.parentElement).attr('title', 'Coming Soon').tooltip('dispose').tooltip();
}

function init_page() {
    // TODO: remove it after fixing - Hazardous page
    disableHazardousPage();

    return new Promise((resolve, reject) => {
        setGlobalViewMode();

        const researchPromise = getSelectedResearch() === null ?
            getDefaultResearchFromApi().then(setSelectedResearch) :
            Promise.resolve();

        researchPromise.then(() => {
            const povValue = getPOV();
            const povElement = document.getElementById("pov-value");

            if (povValue === null) {
                showPOVNotification();
            }

            if (povElement) {
                povElement.innerHTML = povValue || `<a href="settings.html" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">setup here</a>`;
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

function getMarginOfCSSClass(className) {
    // Create a temporary element
    let tempElement = document.createElement('div');

    // Apply the class to the element
    tempElement.className = className;

    // Append the element to the body (it needs to be part of the document to compute styles)
    document.body.appendChild(tempElement);

    // Use getComputedStyle to get the style properties
    let style = window.getComputedStyle(tempElement);

    let margins = {
        top: parseInt(style.marginTop, 10),
        right: parseInt(style.marginRight, 10),
        bottom: parseInt(style.marginBottom, 10),
        left: parseInt(style.marginLeft, 10)
    };

    let paddings = {
        top: parseInt(style.paddingTop, 10),
        right: parseInt(style.paddingRight, 10),
        bottom: parseInt(style.paddingBottom, 10),
        left: parseInt(style.paddingLeft, 10)
    };

    let borders = {
        top: parseInt(style.borderTopWidth, 10),
        right: parseInt(style.borderRightWidth, 10),
        bottom: parseInt(style.borderBottomWidth, 10),
        left: parseInt(style.borderLeftWidth, 10)
    };

    // Remove the temporary element from the document
    document.body.removeChild(tempElement);

    return { margins, paddings, borders };
}