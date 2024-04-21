const descopeSdk = Descope({projectId: 'P2em0AFZYHKGW50DjyAcu4Gdvhi0', persistTokens: true, autoRefresh: true});

const sessionToken = descopeSdk.getSessionToken()
let notValidToken
if (sessionToken) {
    notValidToken = descopeSdk.isJwtExpired(sessionToken)
}


if (!sessionToken || notValidToken) {
    const wcElement = document.getElementsByTagName('descope-wc')[0];
    const onSuccess = (e) => {
        let userDetails = e.detail?.user;

        if (userDetails) {
            delete localStorage.guestLoginMode;

            updateUserData(userDetails);
            descopeSdk.refresh();
            window.location.replace("net");
        } else {
            fetch(`${apiHost}/v1/user/guest-login`, {
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
                updateUserData(userDetails);

                localStorage.setItem("guestLoginMode", "true");

                // TODO: check if needed
                // const descopeJwtRefreshInterval = setInterval(() => {});
                descopeSdk.refresh();
                window.location.replace("net");
            });
        }
    };
    const onError = (err) => console.log(err);

    wcElement.addEventListener('success', onSuccess);
    wcElement.addEventListener('error', onError);
} else {
    window.location.replace("net");
}