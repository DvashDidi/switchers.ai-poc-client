const CHART_COLORS = {
    BLUE: 'rgb(54, 162, 235)',
    ORANGE: 'rgb(255, 159, 64)',
    GREEN: 'rgb(75,192,94)',
    RED: 'rgb(255, 99, 132)',
    PURPLE: 'rgb(153, 102, 255)',
    GREY: 'rgb(201, 203, 207)',
    YELLOW: 'rgb(255, 205, 86)',
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
    },
    {
        border: CHART_COLORS.PURPLE,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.PURPLE, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.PURPLE, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.PURPLE, 0.45),
    },
    {
        border: CHART_COLORS.GREY,
        hoverBorder: rgbaWithAlpha(CHART_COLORS.GREY, 0.8),
        background: rgbaWithAlpha(CHART_COLORS.GREY, 0.7),
        hoverBackground: rgbaWithAlpha(CHART_COLORS.GREY, 0.45),
    }
];

function setNavigationHandlers(navigationIds) {
    for (const navigationId of navigationIds) {
        const navigationBtn = document.getElementById(`${navigationId}-nav-btn`);
        if (navigationBtn) {
            navigationBtn.addEventListener('click', function (e) {
                e.preventDefault();
                history.pushState(null, null, location.href);
                window.location.href = navigationBtn.dataset.target;
            })
        }
    }
}

function createNavBar(activeName) {
    // Pages Order Is Significant !
    // This is the order the navigation bar would look like
    const pages = [
        {id: "settings-nav-btn", icon: "bi-gear", target: "settings", text: "Settings"},
        {id: "filters-nav-btn", icon: "bi-funnel", target: "filters", text: "Filters"},
        {id: "net-nav-btn", icon: "bi-speedometer2", target: "net", text: "Net"},
        {id: "questions-nav-btn", icon: "bi-pie-chart", target: "questions", text: "Questions"},
        {id: "impacts-nav-btn", icon: "bi-clipboard-data", color: "text-success", target: "impacts", text: "Impacts"},
        {
            id: "hazards-nav-btn",
            icon: "bi-exclamation-triangle",
            color: "text-danger",
            target: "hazards",
            text: "Hazardous"
        }
    ];


    let navHTML = "";

    pages.forEach(page => {
        const bgClass = page.id === `${activeName}-nav-btn` ? 'bg-primary text-white' : 'text-white';
        const iconColor = page.color || '';
        navHTML += `
            <button type="button" class="btn btn-sm ${bgClass} m-1" id="${page.id}"
                    data-target="${page.target}"
                    data-toggle="tooltip" data-placement="bottom" title="${page.text}">
                <i class="bi ${page.icon} ${iconColor}"></i>
                ${page.text}
            </button>
        `;
    });

    document.querySelector("#switchers-navbar").querySelector(".navbar-nav").innerHTML = navHTML;
    setNavigationHandlers(pages.map(v => v.target).filter(v => v !== activeName));
}

function rgbaWithAlpha(rgb, alpha) {
    const rgbComponents = rgb.match(/\d+/g);
    if (rgbComponents.length !== 3) {
        throw new Error('Invalid RGB color format');
    }

    const [r, g, b] = rgbComponents;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

$(function () {
    let tips = $('[data-toggle="tooltip"]')
    if (tips.length > 0) {
        tips.tooltip({
            trigger: 'hover'
        });
    }
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
                    'Content-Type': 'application/json',
                    "Authorization": `bearer ${descopeSdk.getSessionToken()}`
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

function getDefaultFiltersFromApi() {
    return new Promise(function (resolve, reject) {
        fetch(`${apiHost}/v1/research/${getSelectedResearch()}/research-participant-filters/active`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `bearer ${descopeSdk.getSessionToken()}`
                }
            }
        ).then(function (response) {
            if (!response.ok) {
                if (response.status === 404) {
                    outdatedResearchFound();
                }

                return response.text().then(function (message) {
                    throw new Error(`${message}`);
                });
            }

            return response.json();
        }).then(function (clientFilters) {
            // localStorage.filtersName = clientFilters.join(', ');
            if (clientFilters.length === 0) {
                $('#filter-value').hide()
            } else {
                const filterElement = document.getElementById("filter-name");
                filterElement.innerHTML = clientFilters[0] + " is active";
            }

            resolve(clientFilters);
        }).catch(function (error) {
            console.error(error);
            reject(error);
        });
    });
}

function showPOVNotification() {
    Swal.fire({
        // title: `<a href="settings" style="color: #333; text-decoration: underline;">Set up POV now</a>`,
        // text: `To enhance your experience, consider setting up your Point of View (POV).`,
        html: `<h3>To enhance your experience, consider <a href="settings" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">setting up your Point of View</a> (POV).</h3>`,
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

function init_page() {
    return new Promise((resolve, reject) => {
        setGlobalViewMode();

        const researchPromise = getSelectedResearch() === null ?
            getDefaultResearchFromApi().then(setSelectedResearch) :
            Promise.resolve();

        researchPromise.then(getDefaultFiltersFromApi).then(() => {
            const povValue = getPOV();
            const povElement = document.getElementById("pov-value");

            if (povValue === null) {
                showPOVNotification();
            }

            if (povElement) {
                povElement.innerHTML = povValue || `<a href="settings" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">setup here</a>`;
            }

            resolve(true);
        }).catch(function (error) {
            $('#main-view').hide();
            $('#no-data-message').show();
            reject(error);
        });
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

function updateUserData(userData) {
    localStorage.setItem('userId', userData.userId || "");
    localStorage.setItem('userPicture', userData.picture || "");
    localStorage.setItem('userEmail', userData.email || "");
    localStorage.setItem('userName', userData.name || "");
}

function deleteUserData() {
    delete localStorage.guestLoginMode;
    delete localStorage.userId;
    delete localStorage.userPicture;
    delete localStorage.userEmail;
    delete localStorage.userName;
}

$("#open-logout-modal-button").on("click", function () {
    $(`#user-name`).text(localStorage.getItem('userName') || "");
});