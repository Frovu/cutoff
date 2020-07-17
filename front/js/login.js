
// initial login check on page load
verify_login();
async function verify_login() {
    const resp = await get_login_info();
    if (!resp || !resp.login) {
        document.getElementById("navbarUsernameDropdown").style.display = "none";
        document.getElementById("navbarLoginButton").style.display = "block";
        show_login_modal();
    } else {
        document.getElementById("navbarUsernameDropdown").innerHTML = "Logged in as " + resp.username;
        document.getElementById("navbarUsernameDropdown").style.display = "block";
        document.getElementById("navbarLoginButton").style.display = "none";
        update_instance_list();
    }
    // TODO Egor: do something with login as guest (show big red text or something)
}

async function get_login_info() {
    // TODO are credentials needed?
    const response = await fetch('user', {
        method: 'GET',
        credentials: "same-origin",
    }).catch((e) => {
        show_error(e);
    });

    if(response && response.ok)
        return await response.json();
    show_error("Server didn't respond or some error occured");
    return null;
}

async function fetch_login_user(guest, email, password) {
    const response = await fetch('user/login', {
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify(guest ? {guest: true}
            : {email: email, password: password})
    }).catch ((error) => {
        show_error(error);
    });
    if(response) {
        if(response.ok) {
            console.log("Succesful login");
            return true;
        }
        switch (response.status) {
            case 400:
                show_error("Wrong password");
                break;
            case 404:
                show_error("User not found");
                break;
        }
    } else {
        show_error("Server didn't respond");
    }
    return false; // failed to login
}

async function login() {
    const email = document.getElementById("login-email").value;
    const pass  = document.getElementById("login-password").value;
    const success = await fetch_login_user(false, email, pass);
    if(success)
        window.location.reload();
}

async function logout () {
    const response = await fetch('user/logout', {
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });

    if (response && response.ok) {
        console.log("Succesful logout");
        window.location.reload();
    } else {
        show_error("Failed to logout");
    }
}

async function register () {
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-password").value;

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById("reg-email").classList.add('is-invalid');
        const feedback = document.createElement('div');
        feedback.className = "invalid-feedback";
        feedback.innerHTML = "Doesn't seem like valid email";
        document.getElementById("reg-email").parentNode.appendChild(feedback);
        return;
    }
    if (document.getElementById("reg-password").value !== document.getElementById("reg-confirm-password").value) {
        document.getElementById("reg-confirm-password").classList.add('is-invalid');
        const feedback = document.createElement('div');
        feedback.className = "invalid-feedback";
        feedback.innerHTML = "Passwords are not the same";
        document.getElementById("reg-confirm-password").parentNode.appendChild(feedback);
        return;
    }
    if (pass.length < 6) {
        document.getElementById("reg-password").classList.add('is-invalid');
        const feedback = document.createElement('div');
        feedback.className = "invalid-feedback";
        feedback.innerHTML = "Password is too short";
        document.getElementById("reg-password").parentNode.appendChild(feedback);
        return;
    }

    const response = await fetch('user', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({email: email, password: pass})
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) {
            console.log("Succesfuly registered");
            if(await fetch_login_user(false, email, pass))
                window.location.reload();
        } else {
            switch (response.status) {
                case 400:
                    show_error("No user data provided");
                    break;
                case 409:
                    show_error("Email is already in use");
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }

    // TODO Egor: show message if success or not (or just remove this line?)
    $("#register_modal").modal('hide');
}

function show_register_modal () {
    $("#register_modal").modal('toggle');
    $("#login_modal").modal('hide');
    $("#instance_modal").modal('hide');
}

function show_login_modal () {
    $("#login_modal").modal('toggle');
    $("#instance_modal").modal('hide');
	$("#register_modal").modal('hide');
}
