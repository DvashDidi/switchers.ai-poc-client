const descopeProjectId = "P2fPv0N8xm1F4e4O7rYxWd5iZoJM";
const descopeSdk = Descope({projectId: descopeProjectId, persistTokens: true, autoRefresh: true});

const sessionToken = descopeSdk.getSessionToken();
let notValidToken;

if (sessionToken) {
    notValidToken = descopeSdk.isJwtExpired(sessionToken);
}

if ((!sessionToken || notValidToken) && !localStorage.getItem("guestLoginMode")) {
    loginPageRedirect();
}

descopeSdk.refresh();

function loginPageRedirect() {
    history.pushState(null, null, location.href); // Push the current state to the history stack
    window.location.href = "/login"; // Redirect to the target page
}


function logoutUser() {
    descopeSdk.logout().then(() => {
        deleteUserData();
        loginPageRedirect();
    });
}

document.getElementById("logout-button").addEventListener("click", logoutUser);