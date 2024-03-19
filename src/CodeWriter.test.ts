/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */
import { test, describe } from '@jest/globals';
import {
    ASSETS_FILE,
    CodeWriter,
    DEFAULT_FILE_PERMISSIONS,
    FileSystemHandler,
    MODE_CREATE_ONLY,
    MODE_MERGE,
    MODE_WRITE_ALWAYS,
} from './CodeWriter';
import { GeneratedFile, GeneratedResult, SourceFile, TargetMethods } from './types';
import Path from 'node:path';
import YAML from 'yaml';
import checksum from 'checksum';
import { Stats } from 'fs';

const BASEDIR = '$tmp';

interface TestFile {
    filename: string;
    content: Buffer;
    permissions: string;
}

class TestFileSystemHandler implements FileSystemHandler {
    private files: Record<string, TestFile> = {};

    listFiles() {
        const out = Object.keys(this.files);
        out.sort();
        return out;
    }

    countFiles() {
        return this.listFiles().length;
    }

    write(filename: string, content: string | Buffer, permissions?: string) {
        this.files[filename] = {
            filename,
            content: Buffer.from(content),
            permissions: permissions || DEFAULT_FILE_PERMISSIONS,
        };
    }

    read(filename: string) {
        if (!this.files[filename]) {
            throw new Error(`File not found: ${filename}`);
        }
        return this.files[filename].content;
    }

    mkdirp(dirname: string) {
        // No-op
    }

    readDir(filename: string) {
        return Object.entries(this.files)
            .filter(([path, file]) => {
                return path.startsWith(filename);
            })
            .map(([path]) => Path.dirname(path));
    }

    exists(filename: string) {
        return !!this.files[filename];
    }

    removeFile(filename: string) {
        delete this.files[filename];
    }

    removeDir(filename: string) {
        this.readDir(filename).forEach((path) => {
            delete this.files[path];
        });
    }
    stat(filename: string) {
        return {
            mode: 33188,
        } as Stats;
    }
}

const TestTarget: TargetMethods = {
    generate: (data: any, context: any) => {
        return [];
    },
    mergeFile: (sourceFile: SourceFile, newFile: GeneratedFile, lastFile: GeneratedFile | null) => {
        if (!sourceFile.filename.endsWith('.json')) {
            throw new Error('Only json files are supported');
        }
        const srcData = JSON.parse(sourceFile.content.toString());
        const lastData = lastFile ? JSON.parse(lastFile.content.toString()) : null;
        const newData = JSON.parse(newFile.content.toString());

        Object.entries(newData).forEach(([key, value]) => {
            if (lastData) {
                if (key in lastData && !(key in srcData)) {
                    return;
                }

                if (key in lastData && key in srcData && srcData[key] !== lastData[key]) {
                    return;
                }
            }
            srcData[key] = value;
        });

        if (lastData) {
            Object.entries(lastData).forEach(([key, value]) => {
                if (key in srcData && !(key in newData) && srcData[key] === value) {
                    // Wasn't changed by user, and removed in new data - so remove it in srcData
                    delete srcData[key];
                }
            });
        }

        return {
            ...newFile,
            content: JSON.stringify(srcData),
        };
    },
};

describe('CodeWriter', () => {
    test('will clean up previously generated files with no changes', () => {
        const fileSystemHandler = new TestFileSystemHandler();
        const writer = new CodeWriter(BASEDIR, {
            fileSystemHandler: fileSystemHandler,
        });

        const files: GeneratedFile[] = [
            {
                filename: 'test.json',
                content: JSON.stringify({
                    test: 'test',
                }),
                mode: MODE_MERGE,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
            {
                filename: 'create.txt',
                content: 'CREATING ONLY',
                mode: MODE_CREATE_ONLY,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
            {
                filename: 'write.txt',
                content: 'WRITE ALWAYS',
                mode: MODE_WRITE_ALWAYS,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
        ];

        let assets = writer.write({
            target: TestTarget,
            files,
        });

        expect(assets).toHaveLength(3);
        expect(fileSystemHandler.listFiles()).toEqual([
            Path.join(BASEDIR, ASSETS_FILE),
            Path.join(BASEDIR, CodeWriter.getInternalMergePath('test.json')),
            Path.join(BASEDIR, 'create.txt'),
            Path.join(BASEDIR, 'test.json'),
            Path.join(BASEDIR, 'write.txt'),
        ]);

        assets = writer.write({
            target: TestTarget,
            files: [],
        });

        expect(assets).toHaveLength(0);
        expect(fileSystemHandler.countFiles()).toBe(1);
    });

    test('will not delete files that has user changes except write-always', () => {
        const fileSystemHandler = new TestFileSystemHandler();
        const writer = new CodeWriter(BASEDIR, {
            fileSystemHandler: fileSystemHandler,
        });

        const files: GeneratedFile[] = [
            {
                filename: 'test.json',
                content: JSON.stringify({
                    test: 'test',
                }),
                mode: MODE_MERGE,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
            {
                filename: 'create.txt',
                content: 'CREATING ONLY',
                mode: MODE_CREATE_ONLY,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
            {
                filename: 'write.txt',
                content: 'WRITE ALWAYS',
                mode: MODE_WRITE_ALWAYS,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
        ];

        let assets = writer.write({
            target: TestTarget,
            files,
        });

        expect(assets).toHaveLength(3);
        expect(fileSystemHandler.listFiles()).toEqual([
            Path.join(BASEDIR, ASSETS_FILE),
            Path.join(BASEDIR, CodeWriter.getInternalMergePath('test.json')),
            Path.join(BASEDIR, 'create.txt'),
            Path.join(BASEDIR, 'test.json'),
            Path.join(BASEDIR, 'write.txt'),
        ]);

        fileSystemHandler.write(
            Path.join(BASEDIR, 'test.json'),
            JSON.stringify({
                test: 'user changed',
            })
        );
        fileSystemHandler.write(Path.join(BASEDIR, 'create.txt'), 'user changed');
        fileSystemHandler.write(Path.join(BASEDIR, 'write.txt'), 'user changed');

        assets = writer.write({
            target: TestTarget,
            files: [],
        });

        expect(assets).toHaveLength(0);
        expect(fileSystemHandler.listFiles()).toEqual([
            Path.join(BASEDIR, ASSETS_FILE),
            Path.join(BASEDIR, CodeWriter.getInternalMergePath('test.json')),
            Path.join(BASEDIR, 'create.txt'),
            Path.join(BASEDIR, 'test.json'),
        ]);
    });

    test('can merge using merge file paths', () => {
        const fileSystemHandler = new TestFileSystemHandler();
        const writer = new CodeWriter(BASEDIR, {
            fileSystemHandler: fileSystemHandler,
        });

        const filename = 'test.json';
        const lastFilePath = Path.join(BASEDIR, CodeWriter.getInternalMergePath(filename));
        const srcFilePath = Path.join(BASEDIR, filename);

        const lastFile: GeneratedFile = {
            filename,
            content: JSON.stringify({
                last1: 'last value 1',
                last2: 'last value 2',
                last3: 'last value 3',
            }),
            mode: MODE_MERGE,
            permissions: DEFAULT_FILE_PERMISSIONS,
        };

        fileSystemHandler.write(
            Path.join(BASEDIR, ASSETS_FILE),
            YAML.stringify({
                version: '1.0.0',
                assets: [
                    {
                        filename: filename,
                        mode: MODE_MERGE,
                        permissions: DEFAULT_FILE_PERMISSIONS,
                        checksum: checksum(lastFile.content),
                        merged: false,
                    },
                ],
            })
        );

        const sourceFile: SourceFile = {
            filename,
            content: Buffer.from(
                JSON.stringify({
                    last1: 'last value 1',
                    last2: 'user changed last 2',
                    last3: 'last value 3',
                    user1: 'user value 1',
                })
            ),
            permissions: DEFAULT_FILE_PERMISSIONS,
        };

        fileSystemHandler.write(lastFilePath, lastFile.content, lastFile.permissions);
        fileSystemHandler.write(srcFilePath, sourceFile.content, sourceFile.permissions);

        const newFile: GeneratedFile = {
            filename,
            content: JSON.stringify({
                last1: 'last value 1B',
                new1: 'new value 1',
            }),
            mode: MODE_MERGE,
            permissions: DEFAULT_FILE_PERMISSIONS,
        };

        const result: GeneratedResult = {
            target: TestTarget,
            files: [newFile],
        };

        const assets = writer.write(result);
        const newSrc = fileSystemHandler.read(srcFilePath);
        expect(newSrc.toString()).toBe(
            JSON.stringify({
                last1: 'last value 1B',
                last2: 'user changed last 2',
                user1: 'user value 1',
                new1: 'new value 1',
            })
        );

        expect(fileSystemHandler.listFiles()).toEqual([
            Path.join(BASEDIR, ASSETS_FILE),
            Path.join(BASEDIR, CodeWriter.getInternalMergePath('test.json')),
            Path.join(BASEDIR, 'test.json'),
        ]);

        const lastSrc = fileSystemHandler.read(lastFilePath);
        expect(lastSrc.toString()).toBe(newFile.content);

        expect(assets).toHaveLength(1);
        expect(assets[0].merged).toBe(true);
        expect(assets[0].filename).toBe(filename);
        expect(assets[0].mode).toBe(MODE_MERGE);
        expect(assets[0].permissions).toBe(DEFAULT_FILE_PERMISSIONS);
    });
});
