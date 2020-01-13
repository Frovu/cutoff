const progress = document.getElementById('progress');
let processing = false;

function get_percent(last_line) {
	const total_lines = (settings.upper-settings.lower)/settings.step;
	return Math.trunc(last_line/total_lines*100.0);
}

function start_process () {
    processing = true;
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-danger btn-block");
    submit.innerHTML = "Cancel";
    console.log("started");
}

function update_process (percentage) {
    progress.setAttribute("style", "width: "+percentage+"%; font-size: 16;");
    //progress.setAttribute("aria-valuenow", percentage); // changes nothing
    progress.innerHTML = percentage+"%";
}

function reset_process () {
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-primary btn-block");
    submit.innerHTML = "Calculate";
    progress.setAttribute("style", "width: 0%; font-size: 16;");
    //progress.setAttribute("aria-valuenow", 0);	// changes nothing
    progress.innerHTML = "";
    console.log("reset");
}

function complete_process () {

    processing = false;
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-primary btn-block");
    submit.innerHTML = "Calculate";
    progress.setAttribute("style", "width: 100%; font-size: 16;");
    //progress.setAttribute("aria-valuenow", 100); // changes nothing
    progress.innerHTML = "Completed";
    console.log("complete");
    //update_constraints (); // is it even nessecary?
}

function cancel () {
    processing = false;
    clearInterval(status_updater);
    reset_process();
}
