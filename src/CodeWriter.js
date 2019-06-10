const mkdirp = require('mkdirp');
const Path = require('path');
const FS = require('fs');

class CodeWriter {

    constructor(basedir) {
        this._baseDir = basedir;
    }

    _writeFile(filename, content, mode) {
        var destinationFile = Path.join(this._baseDir, filename);
        mkdirp.sync(Path.dirname(destinationFile));

        const destinationExists = !FS.existsSync(destinationFile);

        let writeNow = false;
        switch (mode) {
            case 'write-always':
                //Always write files
                writeNow = true;
                break;
            case 'merge':
                //Merge files
                writeNow = true;
                if (destinationExists) {
                    console.warn('Could not merge into %s yet - not implemented. Overriding content.', destinationFile);
                }

                break;
            case 'create-only':
                //Only write if file does not exist
                writeNow = !FS.existsSync(destinationFile);
                break;
        }

        if (!writeNow) {
            console.log('Skipping file: ', destinationFile);
            return;
        }

        if (destinationExists) {
            console.log('Updating file: ', destinationFile);
        } else {
            console.log('Creating file: ', destinationFile);
        }

        FS.writeFileSync(destinationFile, content);

    }

    write(generatedOutput) {
        generatedOutput.forEach((file) => this._writeFile(file.filename, file.content, file.mode));
    }
}

module.exports = CodeWriter;