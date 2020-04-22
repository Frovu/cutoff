// will be removed after testing
/*
const ip = 'localhost';
const port = 3050;
const url = 'http://' + ip + ':' + port;
*/
const update_interval_ms = 200;
let uid;    // rename to id? instance_id?

function start_spinner () {
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function stop_spinner () {
    document.getElementById("trace-spinner").style = "visibility:hidden;";
}

async function fetch_uid (settings) {
    const response = await fetch('/instance', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: settings
    }).catch ((error) => {
        show_error(error);
    });

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
}

async function fetch_data () {
    const response = await fetch('/instance/' + uid, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

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
                    //data.particles.unshift(0);
                    update_settings ();
                    init_penumbra();
                } else {
                    show_error("json.data field is null or undefined");
                }
                break;
        }
    } else {
        // i suppose that HTTP 404 - data doesn't exist ?
        show_error("Calculation instance is not found on server");
    }
}

async function fetch_trace (energy) {
    start_spinner();

    const response = await fetch('/instance/' + uid + "/" + energy, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

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
}

async function fetch_cancel () {
    const response = await fetch('/instance/' + uid + "/kill", {
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });

    if (response.ok) { //  HTTP 200-299
        //const json = await response.json();
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
}

// will be removed after testing
/*
function fetch_uid (settings) {
    try {
        fetch('/instance', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: settings
        }).then(res => res.text()).then(res_uid => {
            //console.log(res.status);
            uid = res_uid;
            fetch_status();
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}*/

/*
function fetch_trace (energy) {
    try {
        fetch('instance/'+ uid + '/' + energy, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => res.json()).then(function (data) {
            start_trace(data);
            document.getElementById("trace-spinner").style = "visibility:hidden;";
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}*/

/*
function fetch_status () {
    try {
        fetch('/instance/' + uid , {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => {res.json().then(res_status => {
            if (res_status.status == 'processing') {
                update_process(res_status.percentage.toFixed(1));
                status_updater = setTimeout(function() {
                    fetch_status();
                }, status_update_ms);
            } else if (res_status.status == 'completed') {
                complete_process();
                console.log(res_status);
                //fetch_data();
            } else if (res_status.status == 'failed') {
                console.error('Failed status ');
                console.error(data);
            }});
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}
*/
/*
function fetch_data () {
    try {
        fetch('instance/' + uid + '/', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => {
		res.json().then(received => {
            	data = received;
                update_settings ();
                init_penumbra();
         	});
	}).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}*/


/*
function fetch_cancel () {
    try {
        fetch(uid + '/kill', {
            method: 'POST',
            headers: { "Content-Type": "application/json" }
        }).then(res => res.text()).then(res_uid => {
            console.log("trace cancelled");
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}*/
