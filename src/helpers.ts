import * as Path from "path";
import * as FS from "fs";
import {CodeGenerator, Target} from "./types";
import {CodeWriter} from './CodeWriter';
import {Stats} from "fs";

function toUnixPermissions(statsMode:number) {
    return (statsMode & parseInt('777', 8)).toString(8);
}

export function walkDirectory(dir:string):string[] {
    let results:string[] = [];
    if (!FS.existsSync(dir)) {
        return results;
    }

    const stat:Stats = FS.statSync(dir);

    if (!stat.isDirectory()) {
        return results;
    }

    const files:string[] = FS.readdirSync(dir);

    files.forEach((file) => {
        let resolvedFile:string = Path.resolve(dir, file);
        const stat = FS.statSync(resolvedFile);
        if (stat && stat.isDirectory()) {
            const subResults = walkDirectory(resolvedFile);
            results.push(...subResults);
        } else {
            results.push(resolvedFile);
        }
    });

    return results;
}

export async function testCodeGenFor(target:Target, generator:CodeGenerator, basedir:string) {
    const {expect} = require("@jest/globals");
    const results = await generator.generateForTarget(target);

    let allFiles = walkDirectory(basedir);
    if (allFiles.length === 0) {
        const writer = new CodeWriter(basedir, {skipAssetsFile: true});
        console.log('No files found in directory: %s - generating output', basedir);
        writer.write(results);
        allFiles = walkDirectory(basedir);
    }

    results.forEach(result => {
        const fullPath = Path.join(basedir, result.filename);
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
