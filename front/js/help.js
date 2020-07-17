let current_tab;

$("#settings_help_text").hide();
$("#instances_help_text").hide();
$("#rigidities_help_text").hide();
$("#trajectories_help_text").hide();
$("#advices_help_text").hide();
$("#physics_help_text").hide();
$("#credit_help_text").hide();

function show_help_modal() {
	$("#help_modal").modal('toggle');
}

function select_help_tab (tab) {
	$("#startup_help_text").hide();

	$(`#${current_tab}_help_text`).hide();
	$(`#${current_tab}_help_tab`).removeClass("active");

	$(`#${tab}_help_text`).show();
	$(`#${tab}_help_tab`).addClass("active");

	current_tab = tab;
}