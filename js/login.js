const descopeSdk = Descope({projectId: descopeProjectId, persistTokens: true, autoRefresh: true});

const sessionToken = descopeSdk.getSessionToken();
let notValidToken;
if (sessionToken) {
    notValidToken = descopeSdk.isJwtExpired(sessionToken);
}

if (!sessionToken || notValidToken) {
    const LoginContainer = document.getElementById("descope-login-container");
    const wcElement = document.createElement('descope-wc');
    wcElement.setAttribute('project-id', descopeProjectId);
    wcElement.setAttribute('flow-id', "sign-up-or-in-social-or-otp");

    LoginContainer.appendChild(wcElement);

    const onSuccess = (e) => {
        let userDetails = e.detail?.user;

        if (userDetails) {
            onLoginSuccess(userDetails, false);
        } else {
            fetch(`${apiHost}/v1/user/`, {
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
                userDetails = {
                    userId: data.data.user["user_id"],
                    name: data.data.user["user_name"],
                    email: data.data.user["user_email"]
                };
            }).catch(function (error) {
                console.error(error);
            }).finally(function () {
                onLoginSuccess(userDetails, true);
            });
        }
    };
    const onError = (err) => console.log(err);

    wcElement.addEventListener('success', onSuccess);
    wcElement.addEventListener('error', onError);
} else {
    window.location.replace("net");
}

function onLoginSuccess(userDetails, isGuest=false) {
    if (isGuest) {
        localStorage.setItem("guestLoginMode", "true");
    } else {
        delete localStorage.guestLoginMode;
    }

    updateUserData(userDetails);
    descopeSdk.refresh();
    window.location.replace("net");
}