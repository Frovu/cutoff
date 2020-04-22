
const fs = require('fs-extra');
const path = require('path');
const {spawnCutoff} = require('./instance.js');

module.exports = function(id, energy, callback) {
    fs.readdir(path.join(config.instancesDir, id), (err, files) => {
        if (err)
            callback(false);
        const fnpart = parseFloat(energy).toFixed(3).replace('.', '');
        const filename = `Trace${'00000'.slice(fnpart.length)}${fnpart}.dat`;
        const proceed = () => {
            fs.readFile(path.join(config.instancesDir, id, filename), (err, data) => {
                if (err) {
                    callback(false);
                } else {
                    const trace = data.toString().split(/\r?\n/).slice(1, -1)
                            .map(el => el.trim().split(/\s+/).slice(0, 4).map(e => Number(e)));
                    let optimized = [trace[0]]; let oi = 0;
                    const threshold = trace.length<300?0:(trace.length<4000?0.015:0.07);
                    if(threshold)
                        for(let i=1; i<trace.length; ++i) {
                            const dx = trace[i][1] - optimized[oi][1];
                            const dy = trace[i][2] - optimized[oi][2];
                            const dz = trace[i][3] - optimized[oi][3];
                            const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
                            if(d > threshold) {
                                optimized.push(trace[i]);
                                oi++;
                            }
                    }
                    log(`Trace. pts=${trace.length} optimized=${threshold?optimized.length:trace.length}`);
                    callback(threshold?optimized:trace);
                }
            });
        };
        if(!files.includes(filename)) {
            const start = new Date();
            const cutoff = spawnCutoff(id, energy);
            cutoff.cutoff.on('exit', (code, signal) => {
                log(`cutoff(trace) code=${code} sg=${signal} took ${(Date.now()-start)/1000} seconds`);
                if(code === 0) {
                    proceed();
                    fs.removeSync(path.join(config.instancesDir, id, 'Cutoff.dat'));
                } else {
                    callback(false);
                }
            });
        } else
            proceed();
    });
}
