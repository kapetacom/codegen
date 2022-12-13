
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