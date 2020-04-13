let recording = false;
let gif;
let frames = [];
let framesCount = 240;

function record_gif () {
    if (!recording || gif == null) return;

    if (frames.length > framesCount) {
        for (let i = 0; i < frames.length; i++) {
            gif.addFrame(frames[i], {copy: true, delay: 40});
        }

        $("#progress")
        .css("width", "100%")
        .attr("aria-valuenow", 100)
        .text("Rendering...");

        frames = [];
        recording = false;
        gif.render();
    } else {
        let img = $('<img>', {src: renderer.domElement.toDataURL()})[0];
        frames.push(img);
        let record_percent = Math.trunc((frames.length*1.0) / (framesCount*1.0) * 100.0);
        $("#progress")
        .css("width", record_percent + "%")
        .attr("aria-valuenow", record_percent)
        .text("Recording... " + record_percent + "%");
    }
}

function downloadGif(blob, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    let file_url = URL.createObjectURL(blob);
    a.href = file_url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(file_url);
}

function makeGif() {
	gif = new GIF({
  		workers: 2,
  		quality: 20,
		width: 800,
		height: 500,
		workerScript: ".\\js\\gl\\gif\\gif.worker.js",
		debug: true
	});
	recording = true;
	framesCount = Math.trunc($("#gifTime").val() * 25);	// 25 frames per second
	gif.on('finished', function(blob) {
		downloadGif(blob, "cutoff_gif.gif");
		complete_process();
	});
}