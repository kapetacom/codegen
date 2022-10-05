const CodeWriter = require('./CodeWriter');
const BlockCodeGenerator = require('./BlockCodeGenerator');
const Path = require("path");
const FS = require("fs");

let expect = () => {
    throw new Error('jest tests must be run using jest');
};
try {
    //jest globals throws when imported outside of jest tests
    const globals = require("@jest/globals");
    expect = globals.expect;
} catch (e) {}


function toUnixPermissions(statsMode) {
    return (statsMode & parseInt('777', 8)).toString(8);
}

function walkDirectory(dir) {
    let results = [];
    if (!FS.existsSync(dir)) {
        return results;
    }

    const stat = FS.statSync(dir);

    if (!stat.isDirectory()) {
        return results;
    }

    const files = FS.readdirSync(dir);

    files.forEach((file) => {
        file = Path.resolve(dir, file);
        const stat = FS.statSync(file);
        if (stat && stat.isDirectory()) {
            const subResults = walkDirectory(file);
            results.push(...subResults);
        } else {
            results.push(file);
        }
    });

    return results;
}

async function testCodeGenFor(target, data, basedir) {
    const generator = new BlockCodeGenerator(data);
    const results = await generator.generateForTarget(target);

    let allFiles = walkDirectory(basedir);
    if (allFiles.length === 0) {
        const writer = new CodeWriter(basedir, {skipAssetsFile: true});
        console.log('No files found in directory: %s - generating output', basedir);
        writer.write(results);
        allFiles = walkDirectory(basedir);
    }

    results.forEach(result => {
        const fullPath = Path.join(basedir,result.filename);
        const expected = FS.readFileSync(fullPath).toString();
        const stat = FS.statSync(fullPath);
        expect(toUnixPermissions(stat.mode)).toBe(result.permissions);
        expect(expected).toBe(result.content);

        const ix = allFiles.indexOf(fullPath);
        expect(allFiles).toContain(fullPath);
        if (ix > -1) {
            allFiles.splice(ix, 1);
        }
    });

    expect(allFiles.length).toBe(0);
}

module.exports = {
    walkDirectory,
    testCodeGenFor
}