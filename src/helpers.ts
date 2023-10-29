/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import * as Path from 'path';
import * as FS from 'fs';
import { CodeGenerator } from './types';
import { CodeWriter } from './CodeWriter';
import { Stats } from 'fs';

function toUnixPermissions(statsMode: number) {
    return (statsMode & parseInt('777', 8)).toString(8);
}

export function walkDirectory(dir: string): string[] {
    const results: string[] = [];
    if (!FS.existsSync(dir)) {
        return results;
    }

    const stat: Stats = FS.statSync(dir);

    if (!stat.isDirectory()) {
        return results;
    }

    const files: string[] = FS.readdirSync(dir);

    files.forEach((file) => {
        const resolvedFile: string = Path.resolve(dir, file);
        const resolvedFileStat = FS.statSync(resolvedFile);
        if (resolvedFileStat && resolvedFileStat.isDirectory()) {
            const subResults = walkDirectory(resolvedFile);
            results.push(...subResults);
        } else {
            results.push(resolvedFile);
        }
    });

    return results;
}

export async function testCodeGenFor(target: any, generator: CodeGenerator, basedir: string) {
    const results = await generator.generateForTarget(target);
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const { expect } = require('@jest/globals');
    let allFiles = walkDirectory(basedir);
    if (allFiles.length === 0 || process?.env?.FORCE_GENERATE) {
        const writer = new CodeWriter(basedir, { skipAssetsFile: true });
        console.log('No files found in directory: %s - generating output', basedir);
        writer.write(results);
        allFiles = walkDirectory(basedir);
    }

    results.files.forEach((result) => {
        const fullPath = Path.join(basedir, result.filename);
        const expected = FS.readFileSync(fullPath).toString();
        const stat = FS.statSync(fullPath);
        console.log(`Comparing files: ${fullPath}`);
        expect(toUnixPermissions(stat.mode)).toBe(result.permissions);
        expect(expected).toBe(result.content);

        const ix = allFiles.indexOf(fullPath);
        expect(allFiles).toContain(fullPath);
        if (ix > -1) {
            allFiles.splice(ix, 1);
        }
    });
    expect(allFiles).toEqual([]);
}
