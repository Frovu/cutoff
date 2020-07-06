let show_instance_after_login = false;	// weird variable but ok
let current_instance_id;

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
function update_instance_list () {
	//<a href="#" class="list-group-item list-group-item-action bg-light">Instance #1</a>
	fetch_user_instances().then((response)=>{
		document.getElementById("instances-list").innerHTML = "";
		response.instances.forEach((instance) => {

			console.log(instance)
			const list_group_item = document.createElement("a");
			list_group_item.className = "list-group-item list-group-item-action flex-column align-items-start ";

			const header_item = document.createElement("div");
			header_item.className = "d-flex w-100 justify-content-between";

			const name_item = document.createElement("h5");
			name_item.className = "mb-1";
			if (instance.name != null) {
				name_item.innerHTML = instance.name;
			} else {
				name_item.innerHTML = "Instance";
			}

			const status_item = document.createElement("small");
			status_item.className = "text-muted";
			status_item.innerHTML = "status";	// TODO: get instance status through  GET /instance/:id

			const description_item = document.createElement("p");
			description_item.className = "mb-1";
			description_item.innerHTML
			 = "<i>Model: " + get_model_by_id(instance.settings.model).name + 
			"<br>Range: " + instance.settings.lower + " - " + instance.settings.upper + "GV<br>Date: " + instance.settings.date + "</i>";	// instance.date time energy range

			const delete_item = document.createElement("a");
			delete_item.className = "mb-1 text-danger";
			delete_item.onclick = function(event) {
				 event.stopPropagation();
				fetch_cancel(instance.id);
				document.getElementById("instances-list").removeChild(list_group_item);
			};
			delete_item.innerHTML = "Delete";	// instance.date time energy range

			header_item.appendChild(name_item);
			header_item.appendChild(status_item);
			list_group_item.appendChild(header_item);
			list_group_item.appendChild(description_item);
			list_group_item.appendChild(delete_item);

			list_group_item.onclick = function() {
				fetch_instance_data(instance.id);
				list_group_item.className += " active";
			};

			document.getElementById("instances-list").appendChild(list_group_item);
		});
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
	$("#instance_modal").modal('toggle');
	$("#login_modal").modal('hide');
	$("#register_modal").modal('hide');
}
