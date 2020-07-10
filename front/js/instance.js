const progress_update_interval_ms = 500;
let current_instance_id;
let instances = [];

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
				fetch_instance_data(instance.id);
				/*
				list_group_item.className += " active";
				name_item.className += " text-white";
				model_item.className += " text-light";
				description_item.className += " text-white";*/

			};

			document.getElementById("instances-list").appendChild(list_group_item);

			instances.push({data: instance, progressbar: progressbar_item});
		});
	});

}

function reset_instance_modal () {
    params.forEach (function (param) {
        const el = document.getElementById(param);
		if (param == "step") {
			object[param] = parseFloat(parse_sentence_for_number(el.innerHTML));
		} else if (param == "model") {
			object[param] = get_model_by_name(el.innerHTML).id;
		} else if (param == "date") {
            object[param] = front_to_back_date(el.value);
        } else if (param == "time") {
            // handle . and :
            object[param] = front_to_back_time(el.value);
        }
		else {
			object[param] = el.value;
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

function show_instance_modal () {
	login_check_done(function (json) {
    	if (!json.login) {
     		show_login_modal ();
    	} else {
    	    $("#instance_modal").modal('toggle');
			$("#login_modal").modal('hide');
			$("#register_modal").modal('hide');
    	}
	});
}
