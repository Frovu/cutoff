function is_logged_in () {
	// stuff
    return false;
}

function show_login_modal () {
    $("#login_modal").modal('toggle');
}

function login () {
	$("#login_modal").modal('hide');
	fetch_login_user(true);
}
