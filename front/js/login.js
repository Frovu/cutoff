let logged_in_as_user = false;   // rename to logged_in_as_user?

// dropdown does not show in modals: fix (doesn't work)
$.fn.modal.Constructor.prototype._enforceFocus = function() {};


fetch_user().then((response) => {
    response.json().then((json) => {
        console.log(json.message);
        generate_instance_list ();
    });
});

function show_login_modal () {
    $("#login_modal").modal('toggle');
    $("#instance_modal").modal('hide');
	$("#register_modal").modal('hide');
}

function login () {
    fetch_login_user(false, document.getElementById("login-email").value, document.getElementById("login-password").value)
    .then((message) => {
        if (message == "Success") {
            $("#login_modal").modal('hide');
            if (show_instance_after_login) {
                show_instance_modal();
                show_instance_after_login = false;
            }
        }

        return response;

        console.log(list_cookies());
    });
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

