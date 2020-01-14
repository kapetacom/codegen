const Path = require('path');
const FS = require('fs');
const YAML = require('yaml');
const TARGET_KIND = 'core.blockware.com/v1/LanguageTarget'.toLowerCase();
const BLOCKWARE_YML = 'blockware.yml';


class TargetRegistry {

    constructor() {
        this._targets = {};
    }

    reset() {
        this._targets = {};
    }

    register(targetId, target) {
        this._targets[targetId.toLowerCase()] = target;
    }

    load(providerDir) {
        const providerDirs = FS.readdirSync(providerDir);

        providerDirs
            .map((dir) => {
                const modulePath = Path.join(providerDir, dir);
                const blockwareYmlPath = Path.join(modulePath, BLOCKWARE_YML);

                if (!FS.existsSync(blockwareYmlPath)) {
                    return null;
                }

                try {
                    let ymls = YAML.parseAllDocuments(FS.readFileSync(blockwareYmlPath).toString()).map((doc) => doc.toJSON());
                    ymls = ymls.filter((yml) => yml.kind && yml.kind.toLowerCase() === TARGET_KIND);

                    if (ymls.length > 1) {
                        console.error('Found multiple language targets in a single file: %s. Ignoring!', blockwareYmlPath);
                    }

                    if (ymls.length === 1) {
                        return {kind: ymls[0].metadata.id, path: modulePath};
                    }
                    return null;
                } catch(err) {
                    console.log('Failed to parse YML file: ' + blockwareYmlPath + '. Error: ' + err);
                    return null;
                }
            })
            .filter((data) => !!data)
            .forEach((data) => {

                try {
                    this.register(data.kind, require(data.path));
                    console.log('\t - Registered language target: %s [%s]', data.kind, data.path);
                } catch(err) {
                    console.log('Failed while registering language target: %s for %s. Error: %s', data.kind, data.path, err.stack);
                }
            });

    }

    async get(target) {
        const lcTarget = target.toLowerCase();
        if (!this._targets[lcTarget]) {
            //TODO: Attempt to download target if not available
            throw new Error('Target not supported: ' + target);
        }

        return this._targets[lcTarget];
    }
}

module.exports = TargetRegistry;