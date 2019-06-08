const mkdirp = require('mkdirp');
const Path = require('path');
const FS = require('fs');

class CodeWriter {

    constructor(basedir) {
        this._baseDir = basedir;
    }

    _writeFile(filename, content) {
        var destinationFile = Path.join(this._baseDir, filename);
        mkdirp.sync(Path.dirname(destinationFile));
        console.log('Writing file: ', destinationFile);
        FS.writeFileSync(destinationFile, content);
    }

    write(generatedOutput) {
        generatedOutput.forEach((file) => this._writeFile(file.filename, file.content));
    }
}

module.exports = CodeWriter;