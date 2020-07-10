const update_interval_ms = 200;

function start_spinner () {
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function stop_spinner () {
    document.getElementById("trace-spinner").style = "visibility:hidden;";
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
