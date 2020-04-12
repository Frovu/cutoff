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
    fetch(url + 'submit', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: settings
    }).then(res => res.text()).then(res_uid => {
        uid = res_uid;
        fetch_status();
    });
}

function fetch_status () {
    fetch(url + uid + '/status', {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    }).then(res => {
		res.json().then(res_status => {
		console.log(res_status.status+' '+res_status.percentage.toFixed(2));
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
    });
}

function fetch_data () {
    fetch(url + uid + '/dat', {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    }).then(res => {
		res.json().then(received => {
        	data = received;
        	//change_energy(settings.step * 2); // strange behaviour: painter > 0 here
            drawPenumbra();
   	 	});
	});
}

function fetch_trace (index) {
    fetch(url + uid + '/' + index, {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    }).then(res => res.json()).then(function (data) {
        //eraseAllPaths();    //if, of couse, we don't have to draw two paths
        let trace = data;
        trace.pop();    // useless last value from nowhere, so we just pop it
        start_trace(trace);
    });
}
