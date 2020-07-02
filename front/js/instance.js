let show_instance_after_login = false;	// weird variable but ok

function generate_instance_list () {
	//<a href="#" class="list-group-item list-group-item-action bg-light">Instance #1</a>
	console.log("generating..")
	fetch_user_instances().then((json)=>{
		console.log(json);
		/*
		let node = document.createElement("a");                 // Create a <li> node
		let textnode = document.createTextNode("Instance");         // Create a text node
		node.appendChild(textnode);                              // Append the text to <li>
		document.getElementById("myList").appendChild(node);     // Append <li> to <ul> with id="myList"*/
	});

}

function show_instance () {
	//instances-list
}

function new_instance () {
	if (!logged_in_as_user) {
		show_instance_after_login = true;
		show_login_modal ();
	} else {
		show_instance_modal ();
	}
}

function show_instance_modal () {
	$("#instance_modal").modal('toggle');
	$("#login_modal").modal('hide');
	$("#register_modal").modal('hide');
}