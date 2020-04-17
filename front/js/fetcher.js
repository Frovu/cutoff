/*
// localhost settings
const ip = 'localhost';
const port = 3050;
const url = 'http://' + ip + ':' + port;
*/
// server settings
const url = '';

const status_update_ms = 200;   // default: 100
let uid;
let status_updater; // used by process.js to terminate status updates

function fetch_uid (settings) {
    try {
        fetch(url + 'submit', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: settings
        }).then(res => res.text()).then(res_uid => {
            uid = res_uid;
            fetch_status();
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}

function fetch_status () {
    try {
        fetch(url + uid + '/status', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => {
	   	   res.json().then(res_status => {
            if (res_status.status == 'processing') {
                update_process(res_status.percentage.toFixed(1));
                status_updater = setTimeout(function() {
                    fetch_status();
                }, status_update_ms);
            } else if (res_status.status == 'complete') {
                complete_process();
                fetch_data();
            } else if (res_status.status == 'failed') {
                console.error('Failed status ');
                console.error(data);
            }});
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}

function fetch_data () {
    try {
        fetch(url + uid + '/dat', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => {
		res.json().then(received => {
            	data = received;
                //data.particles.shift();
                update_settings ();
                draw_penumbra();
         	});
	}).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}

function fetch_trace (energy) {
    try {
        fetch(url + uid + '/' + energy, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        }).then(res => res.json()).then(function (data) {
            let trace = data;
            //trace.pop();    // useless last value from nowhere, so we just pop it
            start_trace(trace);
            draw_penumbra();
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}

function fetch_cancel () {
    try {
        fetch(url + uid + '/kill', {
            method: 'POST',
            headers: { "Content-Type": "application/json" }
        }).then(res => res.text()).then(res_uid => {
            console.log("trace cancelled");
        }).catch(error => show_error(error));
    } catch (error) {
        show_error(error);
    }
}
