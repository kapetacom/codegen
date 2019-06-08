const mkdirp = require('mkdirp');
const Path = require('path');
const FS = require('fs');

class CodeWriter {

    constructor(basedir) {
        this._baseDir = basedir;
    }

    writeFile(filename, content) {
        var destinationFile = Path.join(this._baseDir, target);
        mkdirp.sync(Path.dirname(destinationFile));
        console.log('Writing file: ', destinationFile);
        FS.writeFileSync(destinationFile, content);
    }

    writeGeneratedData(files) {
        files.forEach((file) => this.writeFile(file.filename, file.content));
    }
}

module.exports = CodeWriter;