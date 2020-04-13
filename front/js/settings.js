const particles_limit = 10000;
let settings = {};
let first_start_occured = false;

const params = ['date', 'time', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2',
'kp', 'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper',
'step', 'flightTime'];

init_input_events();

function init_input_events () {
     params.forEach (function (param) {
        const el = document.getElementById(param);
        el.oninput = function() {
            settings_changed ();
            return;
        };
    });
}

function settings_changed () {
    if (!first_start_occured) return;
    const progress = document.getElementById('progress');
    progress.classList.add("bg-warning");
    progress.innerHTML = "Unsaved changes";
}

function submit () {
    if (processing) {
        cancel();
        return;
    }
    if (is_bad_input()) return;
    update_settings ();
    if ((settings.upper - settings.lower)/settings.step > particles_limit) {
        alert("Entered data is too large for the server to"+
        " calculate it properly.\nMaximum amount of traces is " + particles_limit+
        "\nEntered amount is " + (settings.upper - settings.lower)/settings.step + ".");
        return;
    }
    if (!first_start_occured) first_start_occured = true;
    limit_energy ();
    start_process ();
    fetch_uid(json());
}

function update_settings () {
    settings = {};
    settings.lower = document.getElementById('lower').value;
    settings.upper = document.getElementById('upper').value;
    settings.step = parseFloat(document.getElementById('step').innerHTML) + "";
    settings.energy = settings.lower;

	//settings.station = isStation(); // document.getElementById('station').innerHTML;
    settings.longitude = document.getElementById('lon').value;
    settings.latitude = document.getElementById('lat').value;
	settings.station = isStation(settings.latitude, settings.longitude);
    settings.altitude = document.getElementById('alt').value;
}

function limit_energy () {
    const energy_el = document.getElementById('energy');
    energy_el.value = settings.energy;
    energy_el.setAttribute("min", settings.lower);
    energy_el.setAttribute("max", settings.upper);
    energy_el.setAttribute("step", settings.step);
}

function is_bad_input() {
    let bad = false;
    //TODO
    /*
    if (parseFloat(document.getElementById('upper')) - parseFloat(document.getElementById('lower')) <= 0) {
        alert("Highest rigidity (GV) can't be less or equal than Lowest rigidity (GV).");
        bad = true;
    }*/
    params.forEach (function (param) {
        const el = document.getElementById(param);
        const value = el.innerHTML != '' ? el.innerHTML : el.value;
        if (el.classList.contains('is-invalid')) {
            el.classList.remove('is-invalid');
        }
        if (value == "") {
            console.error(el)
            el.classList.add('is-invalid');
            bad = true;
        }
    });
    return bad;
}

function change_step (value) {
	document.getElementById("step").innerHTML = value;
}

function json () {
    let object = {};
    params.forEach (function (param) {
        const el = document.getElementById(param);
		if (param == "step") {
			object[param] = parseFloat(el.innerHTML);
		}
		else if (param == "model") {
			object[param] = get_model_by_name(el.innerHTML).id;
		}
		else {
			object[param] = el.value;
		}
    });

    object.trace = '1';
	return JSON.stringify(object);
}
