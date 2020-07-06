// dropdown does not show in modals: fix (doesn't work)
$.fn.modal.Constructor.prototype._enforceFocus = function() {};

/*
fetch_user().then((response) => {
    response.json().then((json) => {
        if (!json.login) {
            document.getElementById("navbarUsernameDropdown").style.display = "none";
            document.getElementById("navbarLoginButton").style.display = "block";
        } else {
            document.getElementById("navbarUsernameDropdown").innerHTML = "Logged in as " + json.username;
            document.getElementById("navbarUsernameDropdown").style.display = "block";
            document.getElementById("navbarLoginButton").style.display = "none";
            generate_instance_list ();
        }

    });
});*/

login_check_done(function (json) {
    if (!json.login) {
        document.getElementById("navbarUsernameDropdown").style.display = "none";
        document.getElementById("navbarLoginButton").style.display = "block";
    } else {
        document.getElementById("navbarUsernameDropdown").innerHTML = "Logged in as " + json.username;
        document.getElementById("navbarUsernameDropdown").style.display = "block";
        document.getElementById("navbarLoginButton").style.display = "none";
        update_instance_list ();
    }
});

async function login_check_done (callback) {
    fetch_user().then((response) => {
        response.json().then((json) => {
            callback(json);
        });
    });
}
/*
async function is_logged_in_as_user () {
    fetch_user().then((response) => {
        response.json().then((json) => {

            if (json.username == "Guest") {  // logged in as guest
                document.getElementById("navbarUsernameDropdown").style.display = "none";
                document.getElementById("navbarLoginButton").style.display = "block";
            } else {    // logged in as user
                document.getElementById("navbarUsernameDropdown").style.display = "block";
                document.getElementById("navbarLoginButton").style.display = "none";
            }
            generate_instance_list ();
        });
    });
}*/

function show_login_modal () {
    $("#login_modal").modal('toggle');
    $("#instance_modal").modal('hide');
	$("#register_modal").modal('hide');
}

function login () {
    fetch_login_user(false, document.getElementById("login-email").value, document.getElementById("login-password").value)
    .then((message) => {
        if (message == "Success") {
            window.location.reload();
            /*
            $("#login_modal").modal('hide');
            if (show_instance_after_login) {
                show_instance_modal();
                show_instance_after_login = false;
            }*/
        }
    });
}

function logout () {
    fetch_logout ();
    window.location.reload();
}

function show_register_modal () {
    $("#register_modal").modal('toggle');
    $("#login_modal").modal('hide');
    $("#instance_modal").modal('hide');
}

function register () {
    if (document.getElementById("reg-password").value != document.getElementById("reg-confirm-password").value) {
        document.getElementById("reg-confirm-password").classList.add('is-invalid');
        const feedback = document.createElement('div');
        feedback.className = "invalid-feedback";
        feedback.innerHTML = "Passwords are not the same";
        document.getElementById("reg-confirm-password").parentNode.appendChild(feedback);
        return;
    }

	fetch_register_user(document.getElementById("reg-email").value, document.getElementById("reg-password").value);
    $("#register_modal").modal('hide');
}

