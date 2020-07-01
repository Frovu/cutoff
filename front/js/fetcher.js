const update_interval_ms = 200;
let uid;    // rename to id? instance_id?

function start_spinner () {
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function stop_spinner () {
    document.getElementById("trace-spinner").style = "visibility:hidden;";
}

async function fetch_register_user (email, password) {
    let who = JSON.stringify({email: email, password: password});
    console.log(who);
    const response = await fetch('user', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: who
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { 
            console.log("Succesful register");
            is_logged_in = true;
            fetch_login_user(false, email, password);              

            //  HTTP 200-299
            //const json = await response.json();
            //uid = json.id;
            //fetch_data();
        } else {
            is_logged_in = false;
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
}

async function fetch_login_user (guest, email, password) {
    let who;
    if (guest) {
        who = JSON.stringify({guest: true});
    } else {
        who = JSON.stringify({email: email, password: password});
    }

    const response = await fetch('user/login', {
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        method: 'POST',
        body: who
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { 
            console.log("Succesful login");
            fetch_user();
            return "Success";
        } else {
            logged_in_as_user = false;
            switch (response.status) {
                case 400:
                    //show_error("Wrong password");
                    return "Wrong password";
                    break;

                case 404:
                    //show_error("User not found");
                    return "User not found";
                    break;

               case 500:
                    //show_error("Internal server error");
                    return "Internal server error";
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_user_instances () {
    const response = await fetch('instance', {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { 
            console.log("Succesful instance get");
            return response.json();
        } else {
            switch (response.status) {
                case 401:
                    show_error("Unauthorized");
                    break;
                case 404:
                    show_error("User not found");
                    break;
                default:
                    show_error(response.status);
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_user () {
    logged_in_as_user = false;

    const response = await fetch('/user/', {
        credentials: "same-origin",
        method: 'GET',
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { 
            return response;
        } else {
            switch (response.status) {
                case 400:
                    show_error("Wrong password");
                    break;

                case 404:
                    show_error("User not found.");
                    break;

               case 500:
                    show_error("Internal server error");
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_uid (settings) {
    const response = await fetch('instance', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: settings
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { //  HTTP 200-299
            const json = await response.json();
            uid = json.id;
            fetch_data();
        } else {
            switch (response.status) {
                case 400:
                    show_error("Bad settings");
                    break;

                case 401:
                    show_error("Please, log in to use Cutoff Visualiser");
                    break;
    
                case 500:
                    show_error("Internal server error");
                    break;
    
                case 503:
                    show_error("Server is busy");
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_data () {
    const response = await fetch('instance/' + uid, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            switch (json.status) {
                case "processing":
                    update_process(json.percentage.toFixed(1));

                    // i don't like it
                    status_updater = setTimeout(function() {
                        fetch_data();
                    }, update_interval_ms);
                    break;

                case "failed":
                    show_error("Data has failed to retreive");
                    break;

                case "completed":
                    console.log('Status: completed');
                    complete_process();
                    if (json.data != undefined && json.data != null) {
                        data = json.data;
                        update_settings ();
                        init_penumbra();
                    } else {
                        show_error("json.data field is null or undefined");
                    }
                    break;
            }
        } else {
            show_error("Calculation instance is not found on server");
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_trace (energy) {
    start_spinner();

    const response = await fetch('instance/' + uid + "/" + energy, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            stop_spinner();
            start_trace(json);
        } else {
            switch (response.status) {
                case 102: // processing
                    setTimeout(function (){
                        fetch_trace(energy);
                    }, update_interval_ms);
                    break;
                case 404:
                    show_error("Instance is not found on server");
                    break;
    
                case 500:
                    show_error("Instance has failed to calculate");
                    break;

                default:
                    console.log(response.status);
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_cancel () {
    const response = await fetch('instance/' + uid + "/kill", {
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) {
            const text = await response.text();
            console.log(text);
        } else {
            switch (response.status) {
                case 400:
                    show_error("Calculation instance is not processing");
                    break;
    
                case 404:
                    show_error("Calculation instance is not found on server");
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_JSON (callback, path) {
    const response = await fetch(path, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            callback(json);
        } else {
            show_error("Failed loading JSON: HTTP " + response.status);
        }
    } else {
        show_error(path + " didn't found on server");
    }
}