const progress_update_interval_ms = 500;
let instances = {};			// instances at the dashboard
let active_instances = [];	// instances with penumbras on screen
let progressBars = {};
const defaults = {
    areHtml: ['model', 'step'],
    params: {
        //date: "2020.01.01",
    	//time: "12:00:00",
    	swdp: "0.5",
    	dst: "-30.0",
    	imfBy: "-7.8",
    	imfBz: "-2.9",
    	g1: "1.8",
    	g2: "7.0",
    	kp: "2",
    	model: "IGRF",
    	alt: "20.0",
    	lat: "",
    	lon: "",
    	vertical: "0.00",
    	azimutal: "0.00",
    	lower: "0.00",
    	upper: "6.00",
    	step: "Step: 0.1 GV",
    	flightTime: "8.0"
    }
}

setInterval(update_instance_progresses, progress_update_interval_ms);

async function create_instance(settings) {
    const response = await fetch('instance', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: settings
    }).catch ((error) => {
        show_error(error);
    });
    if(response) {
        if (response.ok) {
            const json = await response.json();
            fetch_instance(json.id);
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

async function delete_instance(id) {
    const response = await fetch(`instance/${id}/kill`, {
        method: 'POST',
    }).catch ((error) => {
        show_error(error);
    });
    if(response) {
        if(response.ok) {
			delete instances[id];
			return true;
		} else {
			show_error("Calculation instance is not found on server");
		}
    } else {
        show_error("Server didn't respond");
    }
	return false;
}

async function fetch_instance(id) {
	if(instances[id] && instances[id].data)
		return instances[id];
    const response = await fetch('instance/' + id, {
        method: 'GET'
    }).catch((error) => {
        show_error(error);
    });
    if(response) {
        if(response.ok) {
            const resp = await response.json();
            current_instance_id = id;
            if(resp.status == "failed")
                show_error("Some critical error occurred during calculations");

			instances[id] = resp;

            if(resp.status == "completed") {
            	instances[id].id = id;	// k
				instances[id].settings.dublicate = function () {
        			clone = {};
        			clone.lower = this.lower;
        			clone.upper = this.upper;
        			clone.step = this.step;
        			clone.energy = this.energy;
        			clone.longitude = this.longitude;
        			clone.latitude = this.latitude;
        			clone.station = this.station;
        			clone.altitude = this.altitude;
        			clone.model = this.model;
        			return clone;
    			}
				add_penumbra(instances[id]);
            }

            return resp;
        } else {
            show_error("Instance not found on server or access forbidden");
        }
    }
    show_error("Server didn't respond or some error occurred");
    return null;
}

async function fetch_instance_progress (id) {
    const target = instances[id] && instances[id].status === "completed" ?
					instances[id] : await fetch_instance(id);
	if(!target) return 0;
    switch (target.status) {
        case "processing": return target.percentage;
        case "completed": return 100;
        case "failed": return 0;
    }
}

async function update_instance_progresses () {
	for(const i in instances) {
		if(!instances[i].completed) {
			const p = await fetch_instance_progress(i);
			progressBars[i].setAttribute("style", `width: ${p}%`);
		}
	}
}

async function update_instance_list() {
	const response = await fetch('instance', {
        method: 'GET'
	}).catch ((error) => {
		show_error(error);
	});
    if (!response || !response.ok)
        return show_error("Server didn't respond or some error occurred");

	const json = await response.json();
	instances = {};
	progressBars = {};
	document.getElementById("instances-list").innerHTML = "";
	for(const instance of json.instances) {
        instance.settings.datetime = new Date(instance.settings.datetime);
		const id = instance.id;
		instances[id] = instance;

		const list_group_item = document.createElement("a");
		list_group_item.className = "list-group-item list-group-item-action flex-column align-items-start ";
		const header_item = document.createElement("div");
		header_item.className = "d-flex w-100 justify-content-between";

		const name_item = document.createElement("h5");
		name_item.className = "mb-1";
		if (instance.name != null) {
			name_item.innerHTML = instance.name;
		} else {
			name_item.innerHTML = isStation(parseFloat(instance.settings.lat), parseFloat(instance.settings.lon));
		}

		const model_item = document.createElement("small");
		model_item.className = "text-muted";
		model_item.innerHTML = `${instance.settings.vertical}°/${instance.settings.azimutal}°,    ${get_model_by_id(instance.settings.model).name}`;

		const description_item = document.createElement("p");
		description_item.className = "mb-1";
		description_item.innerHTML = `${instance.settings.lower.toFixed(2)}-${instance.settings.upper.toFixed(2)} GV    /${instance.settings.step}<br>${instance.settings.datetime.toISOString().replace(/\..*/, '')}`;

	    const progress_item = document.createElement("div");
		progress_item.className = "progress";

		const progressbar_item = document.createElement("div");
		progressbar_item.className = "progress-bar";
		progressbar_item.setAttribute("role", "progressbar");
		progressbar_item.setAttribute("style", `width: ${instance.completed?100:0}%`);
		progressBars[id] = progressbar_item;

		const delete_item = document.createElement("a");
		delete_item.className = "mb-1 text-danger";
		delete_item.onclick = function(event) {
			event.stopPropagation();
			delete_instance(id);
			document.getElementById("instances-list").removeChild(list_group_item);
		};
		delete_item.innerHTML = "Delete";	// instance.date time energy range

		header_item.appendChild(name_item);
		header_item.appendChild(model_item);
		list_group_item.appendChild(header_item);
		progress_item.appendChild(progressbar_item);
		list_group_item.appendChild(progress_item);
		list_group_item.appendChild(description_item);
		list_group_item.appendChild(delete_item);

		list_group_item.onclick = async() => {
			await fetch_instance(id);
		};

		document.getElementById("instances-list").appendChild(list_group_item);
	}
}

function reset_instance_modal () {
    for(const param in defaults.params) {
        const el = document.getElementById(param);
        if(defaults.areHtml.includes(param))
            el.innerHTML = defaults.params[param];
        else
            el.value = defaults.params[param];
    }
    d = new Date().toISOString().replace(/\..*/,'').split('T');
    document.getElementById("date").value = d[0];
    document.getElementById("time").value = d[1];
}

function show_instance (id) {

}

function new_instance () {
	/*
	if (!logged_in_as_user) {
		show_login_modal ();
	} else {
		show_instance_modal ();
	}*/
	show_instance_modal ();
}


async function show_instance_modal () {
	const resp = await get_login_info();
	if(!resp.login) {
 		show_login_modal();
	} else {
		reset_instance_modal();
	    $("#instance_modal").modal('toggle');
		$("#login_modal").modal('hide');
		$("#register_modal").modal('hide');
	}
}
