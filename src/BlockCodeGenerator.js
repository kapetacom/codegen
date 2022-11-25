const _ = require('lodash');

const ENTITY_KIND = 'core/entity';

class BlockCodeGenerator {
    /**
     *
     * @param {object} blockData The parsed Block YAML
     * @param {TargetRegistry} [registry] Defaults to BlockCodeGenerator.DEFAULT_REGISTRY
     */
    constructor(blockData, registry) {
        if (!blockData) {
            throw new Error('Block data was missing');
        }

        this._data = blockData;
        this._registry = registry;

        if (!this._registry) {
            this._registry = BlockCodeGenerator.DEFAULT_REGISTRY;
        }

        if (!this._registry) {
            throw new Error('No target registry found for code generator');
        }
    }

    /**
     * Generates the code for a block and returns an array of objects
     *
     * Example:
     * [{filename:"index.js", content:"..."}, ...]
     *
     * @return {Promise<{filename: string, content: string,mode:string,permissions:string}[]>}
     */
    async generate() {
        if (!this._data.spec.target) {
            throw new Error('Block has no target');
        }

        const Target = await this._registry.get(this._data.spec.target.kind);

        const target = new Target(this._data.spec.target.options);

        return this.generateForTarget(target);
    }

    /**
     *
     * @param target {Target}
     * @returns {Promise<{filename: string, content: string,mode:string,permissions:string}[]>}
     */
    async generateForTarget(target) {

        const result = target.generate(this._data, this._data);

        const spec = this._data.spec;

        if (spec.entities &&
            spec.entities.types) {
            spec.entities.types.forEach((entity) => {
                try {
                    entity.kind = ENTITY_KIND;
                    result.push(
                        ...target.generate(entity, this._data)
                    );
                } catch (e) {
                    console.warn('Did not generate anything for entity: %s, Error: %s', entity.kind, e.message);
                    //Ignore - not every consumer has code to be generated
                }
            });
        }

        if (spec.consumers) {
            spec.consumers.forEach((consumer) => {
                try {
                    result.push(
                        ...target.generate(consumer, this._data)
                    );
                } catch (e) {
                    console.warn('Did not generate anything for consumer: %s, Error: %s', consumer.kind, e.message);
                    //Ignore - not every consumer has code to be generated
                }
            });
        }

        if (spec.providers) {
            spec.providers.forEach((provider) => {
                try {
                    result.push(
                        ...target.generate(provider, this._data)
                    );
                } catch(e) {
                    console.warn('Did not generate anything for provider: %s, Error: %s', provider.kind, e.message);
                    //Ignore - not every provider has code to be generated
                }
            });

        }

        return result;
    }
}

module.exports = BlockCodeGenerator;