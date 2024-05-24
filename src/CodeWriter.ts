/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { GeneratedAsset, GeneratedFile, GeneratedResult, SourceFile, Target, TargetMethods } from './types';

import * as mkdirp from 'mkdirp';
import Path from 'path';
import FS from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import checksum from 'checksum';

const KAPETA_FOLDER = '.kapeta';
export const ASSETS_FILE = Path.join(KAPETA_FOLDER, 'generated-files.yml');
export const MODE_MERGE = 'merge';
export const MODE_CREATE_ONLY = 'create-only';
export const MODE_WRITE_ALWAYS = 'write-always';
export const MODE_WRITE_NEVER = 'write-never';
export const DEFAULT_FILE_PERMISSIONS = '644';

export interface FileSystemHandler {
    write: (filename: string, content: string | Buffer, permissions?: string) => void;
    read: (filename: string) => Buffer;
    readDir: (filename: string) => string[];
    exists: (filename: string) => boolean;
    removeFile: (filename: string) => void;
    removeDir: (filename: string) => void;
    stat: (filename: string) => FS.Stats;
    mkdirp: (dirname: string) => void;
}

const DefaultFileSystemHandler: FileSystemHandler = {
    exists: (filename: string) => FS.existsSync(filename),
    read: (filename: string) => FS.readFileSync(filename),
    readDir: (filename: string) => FS.readdirSync(filename),
    removeFile: (filename: string) => FS.unlinkSync(filename),
    removeDir: (filename: string) => FS.rmdirSync(filename),
    mkdirp: (dirname: string) => mkdirp.sync(dirname),
    stat: (filename: string) => FS.statSync(filename),
    write: (filename, content, permissions) => {
        const opts = permissions
            ? {
                  mode: parseInt(permissions, 8),
              }
            : {};
        FS.writeFileSync(filename, content, opts);
    },
};

export interface CodeWriterOptions {
    skipAssetsFile?: boolean;
    fileSystemHandler?: FileSystemHandler;
}

export class CodeWriter {
    private readonly _baseDir: string;
    private readonly _options: Required<CodeWriterOptions>;

    static getInternalMergePath(filename: string): string {
        return Path.join(KAPETA_FOLDER, 'merged', filename);
    }

    constructor(basedir: string, options?: CodeWriterOptions) {
        this._baseDir = basedir;
        this._options = {
            fileSystemHandler: DefaultFileSystemHandler,
            skipAssetsFile: false,
            ...options,
        };
    }

    private get fs(): FileSystemHandler {
        return this._options.fileSystemHandler;
    }

    /**
     * Ensures the target folder exists and returns the full path
     */
    private _ensureDestinationFolder(filename: string): string {
        const destinationFile = Path.join(this._baseDir, filename);
        this.fs.mkdirp(Path.dirname(destinationFile));

        return destinationFile;
    }

    /**
     * Get a file checksum from its contents
     */
    private _getFileChecksum(path: string): string | null {
        if (!this.fs.exists(path)) {
            return null;
        }

        const content = this.fs.read(path);

        return checksum(content);
    }

    /**
     * Update files using generated code - respecting the mode of the file
     * and checking if the file has changed since last time we generated it
     *
     */
    private _updateAssetFile(
        newFile: GeneratedFile,
        existingAsset: GeneratedAsset | undefined,
        target: TargetMethods
    ): GeneratedAsset {
        const destinationFile = this._ensureDestinationFolder(newFile.filename);
        let mode = newFile.mode;
        const destinationExists = this.fs.exists(destinationFile);
        const existingChecksum = this._getFileChecksum(destinationFile);

        if (existingChecksum && existingAsset) {
            if (existingChecksum === existingAsset.checksum && !existingAsset.merged) {
                //File has not changed since we generated it - so ignore any mode and just overwrite
                //Except if the file was merged - then it has diverged from the original generated file
                mode = MODE_WRITE_ALWAYS;
            }
        }
        const originalFile = newFile;
        const lastFileName = CodeWriter.getInternalMergePath(newFile.filename);
        const lastFilePath = Path.join(this._baseDir, lastFileName);
        let writeNow = false;
        let merged = false;
        switch (mode) {
            case MODE_MERGE:
                //Merge files
                writeNow = true;
                if (destinationExists) {
                    writeNow = false;
                    if (target.mergeFile) {
                        try {
                            // We store the previous original file in the merged folder
                            // so we can use that when determining what the user changed directly

                            let lastFile: GeneratedFile | null = null;
                            if (this.fs.exists(lastFilePath)) {
                                lastFile = {
                                    filename: newFile.filename,
                                    content: this.fs.read(lastFilePath),
                                    permissions: existingAsset?.permissions || DEFAULT_FILE_PERMISSIONS,
                                    mode: MODE_MERGE,
                                };
                            }
                            const existingContent = this.fs.read(destinationFile);
                            // Convert file permissions from octal number to base10 string and remove 100 prefix
                            const existingPermissions = this.fs.stat(destinationFile).mode.toString(8).slice(-3);
                            const sourceFile: SourceFile = {
                                filename: newFile.filename,
                                content: existingContent,
                                permissions: existingPermissions,
                            };

                            newFile = target.mergeFile(sourceFile, newFile, lastFile);
                            writeNow = true;
                            merged = true;
                        } catch (e: any) {
                            console.warn(
                                'Could not merge into %s yet - failed due to: %s. Skipping...',
                                e.message,
                                destinationFile
                            );
                        }
                    } else {
                        console.warn('Could not merge into %s yet - not implemented. Skipping...', destinationFile);
                    }
                }

                break;
            case MODE_CREATE_ONLY:
                //Only write if file does not exist
                writeNow = !destinationExists;
                break;
            case MODE_WRITE_NEVER:
                //Never write files. This is useful for files that are generated but should not be written
                writeNow = false;
                break;

            default:
            case MODE_WRITE_ALWAYS:
                //Always write files
                writeNow = true;
                break;
        }

        if (newFile.mode === MODE_MERGE) {
            // We always write the last file to the merge folder
            // so we can use that when determining what the user changed directly
            this._ensureDestinationFolder(lastFileName);
            this._writeFile(lastFilePath, originalFile.content, originalFile.permissions);
        }

        let permissions = newFile.permissions;
        if (!permissions) {
            permissions = DEFAULT_FILE_PERMISSIONS;
        }
        const newChecksum = checksum(newFile.content);
        const wasChanged = existingChecksum && existingChecksum !== newChecksum;
        const newAsset: GeneratedAsset = {
            filename: newFile.filename,
            mode: newFile.mode,
            checksum: newChecksum,
            permissions,
            modified: !wasChanged && existingAsset ? existingAsset.modified : new Date().getTime(),
            merged,
        };

        if (!writeNow) {
            if (!existingAsset) {
                existingAsset = newAsset;
            }

            console.log('Skipping file: ', destinationFile);
            return {
                filename: existingAsset.filename,
                mode: existingAsset.mode,
                checksum: existingAsset.checksum,
                permissions,
                modified: existingAsset ? existingAsset.modified : new Date().getTime(),
                merged: existingAsset ? existingAsset.merged : false,
            };
        }

        if (destinationExists) {
            console.log('Updating file: ', destinationFile);
        } else {
            console.log('Creating file: ', destinationFile);
        }

        if (destinationExists && existingAsset) {
            // We delete this always since this might be changing casing and on OSX / Windows
            // the FS does not register that as an actual change (case-insensitive systems)
            this.fs.removeFile(Path.join(this._baseDir, existingAsset.filename));
        }

        this._writeFile(destinationFile, newFile.content, permissions);

        return newAsset;
    }

    private _writeFile(filename: string, content: string | Buffer, permissions: string): void {
        this.fs.write(filename, content, permissions);
    }

    /**
     * Reads the Kapeta assets bookkeeping file that allows us to
     * determine whether individual assets changed
     *
     */
    private _readAssetsFile(): { assets: GeneratedAsset[] } {
        const fullPath = Path.join(this._baseDir, ASSETS_FILE);

        if (!this.fs.exists(fullPath)) {
            return { assets: [] };
        }
        try {
            const yamlRaw = this.fs.read(fullPath);
            return YAML.parse(yamlRaw.toString());
        } catch (err: any) {
            console.error('Failed to parse assets file:', err.stack);
            return { assets: [] };
        }
    }

    /**
     * Update the assets bookkeeping file
     */
    private _writeAssetsFile(generatedFiles: GeneratedAsset[]): void {
        const content = [
            '# FILES GENERATED BY KAPETA',
            '# This file keeps track of generated files in your block.',
            '# You should add this to your version control system but avoid',
            '# modifying it manually',
            '',
            YAML.stringify({
                version: '1.0.0', //We put a version in here in the event that we would need to change this format at any point
                assets: generatedFiles,
            }),
        ].join('\n');

        const fullPath = this._ensureDestinationFolder(ASSETS_FILE);

        console.log('Writing assets file: %s', fullPath);

        this.fs.write(fullPath, content);
    }

    /**
     * Check if an asset has manual changes since it was generated
     */
    private _hasManualChanges(asset: GeneratedAsset): boolean {
        const fullPath = Path.join(this._baseDir, asset.filename);
        const fileChecksum = this._getFileChecksum(fullPath);
        return fileChecksum !== asset.checksum;
    }

    /**
     * Clean up assets that we no longer need and have no changes
     */
    private _cleanupAssets(oldAssets: GeneratedAsset[]) {
        oldAssets.forEach((asset) => {
            // We only clean up files automatically if they should be
            // overwritten or they do not have any manual changes
            const canDelete = asset.mode === MODE_WRITE_ALWAYS || !this._hasManualChanges(asset);

            if (canDelete) {
                const fullPath = Path.join(this._baseDir, asset.filename);
                const mergePath = Path.join(this._baseDir, CodeWriter.getInternalMergePath(asset.filename));
                if (this.fs.exists(fullPath)) {
                    console.log('Cleaning up unused kapeta asset file: %s', asset.filename);
                    this.fs.removeFile(fullPath);
                    const folder = Path.dirname(fullPath);
                    // We delete empty folders recursively, so we don't leave any empty folders behind
                    this.deleteEmptyFolder(folder);
                }

                if (this.fs.exists(mergePath)) {
                    // Also cleanup merge file info
                    this.fs.removeFile(mergePath);
                }
            }
        });
    }

    private isFolderEmpty(path: string): boolean {
        const files = this.fs.readDir(path);
        return files.length === 0;
    }

    private deleteEmptyFolder(path: string): void {
        if (this.fs.exists(path) && this.isFolderEmpty(path)) {
            this.fs.removeDir(path);
            return this.deleteEmptyFolder(Path.dirname(path));
        }
    }

    /**
     * Takes the output from the code generator and persists it to file
     */
    public write({ files, target }: GeneratedResult): GeneratedAsset[] {
        try {
            let assets: null | GeneratedAsset[] = null;
            if (!this._options.skipAssetsFile) {
                const result = this._readAssetsFile();
                assets = result.assets;
            }

            const previousAssets: GeneratedAsset[] = assets ? [...assets] : [];

            const generatedFiles = files.map((file) => {
                const existingAsset: GeneratedAsset | undefined = _.find(assets, (asset: GeneratedAsset) => {
                    //Find assets case insensitive to handle OSX / Windows correctly
                    return asset.filename.toLowerCase() === file.filename.toLowerCase();
                });

                if (assets) {
                    // we pull used assets out since we need the remaining list to clean up
                    _.pull(assets, existingAsset);
                }

                return this._updateAssetFile(file, existingAsset, target);
            });

            if (assets) {
                this._cleanupAssets(assets);
            }

            if (this._options.skipAssetsFile) {
                return generatedFiles;
            }

            this._writeAssetsFile(generatedFiles);

            return generatedFiles.filter((file) => {
                const previousAsset: GeneratedAsset | undefined = _.find(previousAssets, (asset: GeneratedAsset) => {
                    return asset.filename.toLowerCase() === file.filename.toLowerCase();
                });

                if (!previousAsset) {
                    //New file
                    return true;
                }
                if (previousAsset.checksum !== file.checksum) {
                    //File changed
                    return true;
                }

                return false;
            });
        } catch (err: any) {
            console.error('Failed while generating code for block: %s', this._baseDir, err.stack);
            return [];
        }
    }
}
