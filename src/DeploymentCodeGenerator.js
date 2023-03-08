const _ = require('lodash');
const DefaultRegistry = require("./DefaultRegistry");

class DeploymentCodeGenerator {
    /**
     *
     * @param {object} deploymentData The parsed Deployment YAML
     * @param {TargetRegistry} [registry] Defaults to DefaultRegistry
     */
    constructor(deploymentData, registry) {
        if (!deploymentData) {
            throw new Error('Deployment data was missing');
        }

        this._data = deploymentData;
        this._registry = registry;

        if (!this._registry) {
            this._registry = DefaultRegistry;
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

        const Target = await this._registry.get(this._data.spec.target.kind);

        const target = new Target(this._data.spec.target.kind);

        return this.generateForTarget(target);

    }

    /**
     *
     * @param target {Target}
     * @returns {Promise<{filename: string, content: string,mode:string,permissions:string}[]>}
     */
    async generateForTarget(target) {

        const data = target.preprocess ? await target.preprocess(this._data) : this._data;
        const result = target.generate(data, data);

        const spec = this._data.spec;
        if (spec.services) {
            for (const service of spec.services) {
                try {
                    result.push(
                        ...target.generate(service, data)
                    );
                } catch (e) {
                    console.warn('Did not generate anything for service %s, Error: %s', service.kind, e.message);
                }
            }
        }
        return result;
    }
}

module.exports = DeploymentCodeGenerator;