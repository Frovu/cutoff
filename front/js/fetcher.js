const update_interval_ms = 200;

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
            fetch_login_user(false, email, password);              

            //  HTTP 200-299
            //const json = await response.json();
            //uid = json.id;
            //fetch_data();
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
            //fetch_user();
            return "Success";
        } else {
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


async function fetch_logout () {
    const response = await fetch('user/logout', {
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) { 
            console.log("Succesful logout");
        } else {
            switch (response.status) {
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
            return response.json();
        } else {
            switch (response.status) {
                case 401:
                    show_error("Unauthorized");
                    break;
                case 404:
                    show_error("User not found");
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_user () {
    const response = await fetch('user', {
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

async function fetch_new_instance (settings) {
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
            fetch_instance_data(json.id);
            update_instance_list();
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

async function fetch_instance_progress (id) {
    const response = await fetch('instance/' + id, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            switch (json.status) {
                case "processing": return json.percentage;
                case "completed": return 100;
                case "failed": return 0;
            }
        }
    } else {
        show_error("Server didn't respond");
    }
}

async function fetch_instance_data (id) {
    const response = await fetch('instance/' + id, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            current_instance_id = id;
            switch (json.status) {
                case "processing":

                    status_updater = setTimeout(function() {
                        fetch_instance_data(id);
                    }, update_interval_ms);
                    break;

                case "failed":
                    show_error("Data has failed to retreive");
                    break;

                case "completed":
                    console.log('Status: completed');

                    if (json.data != undefined && json.data != null) {
                        data = json.data;
                        set_settings (json.data.settings);
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

    const response = await fetch('instance/' + current_instance_id + "/" + energy, {
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

async function fetch_cancel (id) {
    const response = await fetch('instance/' + id + "/kill", {
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });

    if (response != undefined) {
        if (response.ok) {
            const text = await response.text();
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
