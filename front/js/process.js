const progress = document.getElementById('progress');
let processing = false;
let status_updater;

function start_process () {
    processing = true;
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-danger btn-block");
    submit.innerHTML = "Cancel";
    const progress = document.getElementById('progress');
    progress.classList.remove("bg-warning");
    console.log("started");
}

function update_process (percentage) {
    progress.setAttribute("style", "width: "+percentage+"%; font-size: 16;");
    progress.innerHTML = percentage+"%";
}

function reset_process () {
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-primary btn-block");
    submit.innerHTML = "Calculate";
    progress.classList.remove("bg-warning");
    progress.classList.remove("bg-danger");
    progress.setAttribute("style", "width: 0%; font-size: 16;");
    progress.innerHTML = "";
    console.log("reset");
}

function complete_process () {
    processing = false;
    const submit = document.getElementById('submit');
    submit.setAttribute("class", "btn btn-primary btn-block");
    submit.innerHTML = "Calculate";
    progress.classList.remove("bg-warning");
    progress.classList.remove("bg-danger");
    progress.setAttribute("style", "width: 100%; font-size: 16;");
    progress.innerHTML = "Completed";
    console.log("complete");
}

function cancel () {
    processing = false;
    fetch_cancel();
    clearInterval(status_updater);
    reset_process();
}
