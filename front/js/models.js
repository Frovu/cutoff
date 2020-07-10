const model_params = [params[2], params[3], params[4], params[5], params[6], params[7], params[8]];

const models = [
    new Model('Dipole', '00', []),
    new Model('IGRF', '10', []),
    new Model('T89_Kp', '89', [params[8]]),
    new Model('T96_01', '96', [params[2], params[3], params[4], params[5]]),
    new Model('T01_01', '01', [params[2], params[3], params[4], params[5], params[6], params[7]])
];

function Model (name, id, params) {
	this.name = name;
    this.id = id;
    this.params = params;
}

function get_model_by_name (name) {
    return models.find(model => {
        return model.name == name;
    })
}

function get_model_by_id (id) {
    return models.find(model => {
        return model.id == id;
    })
}

function change_model (model_name) {
    document.getElementById('model').innerHTML = model_name;
    show_model_params(get_model_by_name(model_name));
    //settings_changed();
}

function show_model_params (model) {
    model_params.forEach (function (param) {
        const el = document.getElementById(param);
        el.parentElement.classList.add('d-none');
        if (model.params.includes(param)) {
            el.parentElement.classList.remove('d-none');
        }
    });
}

change_model('IGRF');
