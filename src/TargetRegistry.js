class TargetRegistry {

    constructor() {
        this._targets = {};
    }

    register(targetId, target) {
        this._targets[targetId] = target;
    }

    async get(target) {
        if (!this._targets[target]) {
            //TODO: Attempt to download target if not available
            throw new Error('Target not supported: ' + target);
        }

        return this._targets[target];
    }
}

module.exports = TargetRegistry;