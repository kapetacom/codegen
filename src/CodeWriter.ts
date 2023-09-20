import { GeneratedAsset, GeneratedFile, GeneratedResult, Target } from './types';

import * as mkdirp from 'mkdirp';
import Path from 'path';
import FS from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import checksum from 'checksum';

const ASSETS_FILE = '.kapeta/generated-files.yml';
const MODE_MERGE = 'merge';
const MODE_CREATE_ONLY = 'create-only';
const MODE_WRITE_ALWAYS = 'write-always';

export interface CodeWriterOptions {
    skipAssetsFile?: boolean;
}

export class CodeWriter {
    private readonly _baseDir: string;
    private readonly _options: CodeWriterOptions;

    constructor(basedir: string, options?: CodeWriterOptions) {
        this._baseDir = basedir;
        this._options = options ? options : {};
    }

    /**
     * Ensures the target folder exists and returns the full path
     */
    private _createDestinationFolder(filename: string): string {
        const destinationFile = Path.join(this._baseDir, filename);
        mkdirp.sync(Path.dirname(destinationFile));

        return destinationFile;
    }

    /**
     * Get a file checksum from its contents
     */
    private _getFileChecksum(path: string): string | null {
        if (!FS.existsSync(path)) {
            return null;
        }

        const content = FS.readFileSync(path).toString();

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
        target: Target
    ): GeneratedAsset {
        const destinationFile = this._createDestinationFolder(newFile.filename);
        let mode = newFile.mode;
        const destinationExists = FS.existsSync(destinationFile);
        const existingChecksum = this._getFileChecksum(destinationFile);

        if (existingChecksum && existingAsset) {
            if (existingChecksum === existingAsset.checksum &&
                !existingAsset.merged) {
                //File has not changed since we generated it - so ignore any mode and just overwrite
                //Except if the file was merged - then it has diverged from the original generated file
                mode = MODE_WRITE_ALWAYS;
            }
        }

        let writeNow = false;
        let merged = false;
        switch (mode) {
            case MODE_MERGE:
                //Merge files
                writeNow = true;
                if (destinationExists && existingAsset) {
                    writeNow = false;
                    if (target.mergeFile) {
                        try {
                            const existingContent = FS.readFileSync(destinationFile).toString();
                            newFile = target.mergeFile(
                                {
                                    filename: existingAsset.filename,
                                    content: existingContent,
                                    permissions: existingAsset.permissions,
                                },
                                newFile
                            );
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

            default:
            case MODE_WRITE_ALWAYS:
                //Always write files
                writeNow = true;
                break;
        }

        let permissions = newFile.permissions;
        if (!permissions) {
            permissions = '644';
        }
        const newChecksum = checksum(newFile.content);
        const newAsset: GeneratedAsset = {
            filename: newFile.filename,
            mode: newFile.mode,
            checksum: newChecksum,
            permissions,
            modified: new Date().getTime(),
            merged
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
                merged: existingAsset ? existingAsset.merged : false
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
            FS.unlinkSync(Path.join(this._baseDir, existingAsset.filename));
        }

        FS.writeFileSync(destinationFile, newFile.content, {
            mode: parseInt(permissions, 8),
        });

        return newAsset;
    }

    /**
     * Reads the Kapeta assets bookkeeping file that allows us to
     * determine whether individual assets changed
     *
     */
    private _readAssetsFile(): { assets: GeneratedAsset[] } {
        const fullPath = Path.join(this._baseDir, ASSETS_FILE);

        if (!FS.existsSync(fullPath)) {
            return { assets: [] };
        }
        try {
            const yamlRaw = FS.readFileSync(fullPath).toString();
            return YAML.parse(yamlRaw);
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

        const fullPath = this._createDestinationFolder(ASSETS_FILE);

        console.log('Writing assets file: %s', fullPath);

        FS.writeFileSync(fullPath, content);
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
            const canDelete = asset.mode !== MODE_CREATE_ONLY || !this._hasManualChanges(asset);

            if (canDelete) {
                const fullPath = Path.join(this._baseDir, asset.filename);
                if (FS.existsSync(fullPath)) {
                    console.log('Cleaning up unused kapeta asset file: %s', asset.filename);
                    FS.unlinkSync(fullPath);
                    const folder = Path.dirname(fullPath);
                    // We delete empty folders recursively, so we don't leave any empty folders behind
                    this.deleteEmptyFolder(folder);
                }
            }
        });
    }

    private isFolderEmpty(path: string): boolean {
        const files = FS.readdirSync(path);
        return files.length === 0;
    }

    private deleteEmptyFolder(path: string): void {
        if (FS.existsSync(path) &&
            this.isFolderEmpty(path)) {
            FS.rmdirSync(path);
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
