const update_interval_ms = 200;
let uid;    // rename to id? instance_id?

function start_spinner () {
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function stop_spinner () {
    document.getElementById("trace-spinner").style = "visibility:hidden;";
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
                    alert("bad settings");
                    break;
    
                case 500:
                    alert("failed");
                    break;
    
                case 503:
                    alert("too many instances");
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

async function loadJSON (callback, path) {
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