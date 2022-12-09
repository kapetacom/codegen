const _ = require('lodash');

class DeploymentCodeGenerator {
    /**
     *
     * @param {object} deploymentData The parsed Deployment YAML
     * @param {TargetRegistry} [registry] Defaults to DeploymentCodeGenerator.DEFAULT_REGISTRY
     */
    constructor(deploymentData, registry) {
        if (!deploymentData) {
            throw new Error('Deployment data was missing');
        }

        this._data = deploymentData;
        this._registry = registry;

        if (!this._registry) {
            this._registry = DeploymentCodeGenerator.DEFAULT_REGISTRY;
        }

        if (!this._registry) {
            throw new Error('No target registry found for code generator');
        }
    }

    /**
     * Generates the code for a deployment and returns an array of objects
     *
     * Example:
     * [{filename:"index.js", content:"..."}, ...]
     *
     * @return {Promise<{filename: string, content: string,mode:string,permissions:string}[]>}
     */
    async generate() {
        if (!this._data.spec.target) {
            throw new Error('Deployment has no target');
        }

        const target = new Target(this._data.spec.target.kind);

        return this.generateForTarget(target);
    }

    /**
     *
     * @param target {Target}
     * @returns {Promise<{filename: string, content: string,mode:string,permissions:string}[]>}
     */
    async generateForTarget(target) {

        const result = []

        const spec = this._data.spec;
        if (spec.services) {
            for (const entity of spec.services) {
                try {
                    entity.kind = "deployment";
                    result.push(
                        ...target.generate(entity, this._data)
                    );
                } catch (e) {
                    console.warn('Did not generate anything for entity: %s, Error: %s', entity.kind, e.message);
                    //Ignore - not every consumer has code to be generated
                }
            }
        }

        return result;
    }
}

module.exports = DeploymentCodeGenerator;