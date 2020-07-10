const progress_update_interval_ms = 500;
let current_instance_id;
let instances = [];			// instances at the dashboard
let active_instances = [];	// instances with penumbras on screen

/*
                <a href="#" class="list-group-item list-group-item-action flex-column align-items-start ">
                    <div class="d-flex w-100 justify-content-between">
                       <h5 class="mb-1">Irkutsk</h5>
                       <small class="text-muted">Done</small>
                   </div>
                   <p class="mb-1">
                        <i>Energy: 0.00 - 6.00 GV<br>
                        Date: 27.01.2007<br>
                        Time: 23:00<br>
                        </i>
                    </p>
                <!--<small class="text-muted">Donec id elit non mi porta.</small>-->
                </a>
*/

async function update_instance_progresses () {
	instances.forEach( async(instance) => {
		if(!instance.data.completed) {
			const p = await fetch_instance_progress(instance.data.id);
			instance.progressbar.setAttribute("style", `width: ${p}%`);
		}
	});
}
setInterval(update_instance_progresses, progress_update_interval_ms);

function update_instance_list () {
	//<a href="#" class="list-group-item list-group-item-action bg-light">Instance #1</a>
	fetch_user_instances().then((response)=>{
		document.getElementById("instances-list").innerHTML = "";
		instances = [];
		response.instances.forEach((instance) => {
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
			model_item.innerHTML = get_model_by_id(instance.settings.model).name;	// TODO: get instance status through  GET /instance/:id

			const description_item = document.createElement("p");
			description_item.className = "mb-1";
			description_item.innerHTML
			 = instance.settings.lower + " - " + instance.settings.upper + "GV<br>" + instance.settings.date + "</i>";	// instance.date time energy range

			const progress_item = document.createElement("div");
			progress_item.className = "progress";

			const progressbar_item = document.createElement("div");
			progressbar_item.className = "progress-bar";
			progressbar_item.setAttribute("role", "progressbar");
			progressbar_item.setAttribute("style", "width: 0%");



			const delete_item = document.createElement("a");
			delete_item.className = "mb-1 text-danger";
			delete_item.onclick = function(event) {
				event.stopPropagation();
				fetch_cancel(instance.id);
				//update_instance_list();

				// TODO remove deleted instance from instances variable
				for(i of instances){
					if(i.data == instance) {
						instances.splice(instances.indexOf(i), 1);
						document.getElementById("instances-list").removeChild(list_group_item);
					}
				}

			};
			delete_item.innerHTML = "Delete";	// instance.date time energy range

			header_item.appendChild(name_item);
			header_item.appendChild(model_item);
			list_group_item.appendChild(header_item);
			progress_item.appendChild(progressbar_item);
			list_group_item.appendChild(progress_item);
			list_group_item.appendChild(description_item);
			list_group_item.appendChild(delete_item);

			list_group_item.onclick = function() {
				fetch_instance_data(instance.id).then((data) => {
					add_penumbra(data, instance.settings);
					/*
					list_group_item.className += " active";
					name_item.className += " text-white";
					model_item.className += " text-light";
					description_item.className += " text-white";*/
				});
			};

			document.getElementById("instances-list").appendChild(list_group_item);

			instances.push({data: instance, progressbar: progressbar_item});
		});
	});

}

// TODO param-default pair to avoid this
function reset_instance_modal () {
	console.log("shit");
    params.forEach (function (param) {
        const el = document.getElementById(param);
        switch (param) {
        	case 'date':
        		console.log(param);
        		el.value = "2020.01.01";
        		break;
        	case 'time':
        		el.value = "12:00:00";
        		break;
        	case 'swdp':
        		el.value = "0.5";
        		break;
        	case 'dst':
        		el.value = "-30.0";
        		break;
        	case 'imfBy':
        		el.value = "-7.8";
        		break;
        	case 'imfBz':
        		el.value = "-2.9";
        		break;
        	case 'g1':
        		el.value = "1.8";
        		break;
        	case 'g2':
        		el.value = "7.0";
        		break;
			case 'kp':
				el.value = "2";
				break;
			case 'model':
				el.innerHTML = "IGRF";
				break;
			case 'alt':
				el.value = "20.0";
				break;
			case 'lat':
				el.value = "";
				break;
			case 'lon':
				el.value = "";
				break;
			case 'vertical':
				el.value = "0.00";
				break;
			case 'azimutal':
				el.value = "0.00";
				break;
			case 'lower':
				el.value = "0.00";
				break;
			case 'upper':
				el.value = "6.00";
				break;
			case 'step':
				el.innerHTML = "Step: 0.1 GV";
				break;
			case 'flightTime':
				el.value = "8.0";
				break;
        }
    });
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
