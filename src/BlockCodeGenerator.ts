import { BlockDefinition } from '@kapeta/schemas';
import { TargetRegistry } from './TargetRegistry';
import { CodeGenerator, GeneratedAsset, GeneratedFile, GeneratedResult, Target } from './types';
import { registry as DefaultRegistry } from './DefaultRegistry';

const ENTITY_KIND = 'core/entity';

export class BlockCodeGenerator implements CodeGenerator {
    private readonly _data: BlockDefinition;
    private readonly _registry: TargetRegistry;

    constructor(blockData: BlockDefinition, registry: TargetRegistry | null = null) {
        if (!blockData) {
            throw new Error('Block data was missing');
        }

        this._data = blockData;
        this._registry = registry ? registry : DefaultRegistry;

        if (!this._registry) {
            throw new Error('No target registry found for code generator');
        }
    }

    /**
     * Generates the code for a block and returns an array of objects
     *
     * Example:
     * [{filename:"index.js", content:"..."}, ...]
     */
    public async generate(): Promise<GeneratedResult> {
        if (!this._data.spec.target) {
            throw new Error('Block has no target');
        }

        const targetClass = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.options);

        return this.generateForTarget(target);
    }

    public async postprocess(targetDir: string, assets: GeneratedAsset[]): Promise<void> {
        if (!this._data.spec.target) {
            throw new Error('Block has no target');
        }

        const targetClass = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.options);

        return this.postprocessForTarget(targetDir, assets, target);
    }

    public async postprocessForTarget(targetDir: string, assets: GeneratedAsset[], target:Target): Promise<void> {
        if (target.postprocess) {
            await target.postprocess(targetDir, assets);
        }
    }

    public async generateForTarget(target: Target): Promise<GeneratedResult> {
        const files = target.generate(this._data, this._data);
        const out: GeneratedResult = {
            files,
            target,
        };

        const spec = this._data.spec;

        if (spec.entities && spec.entities.types) {
            spec.entities.types.forEach((entity) => {
                try {
                    entity.kind = ENTITY_KIND;
                    files.push(...target.generate(entity, this._data));
                } catch (e: any) {
                    console.warn('Did not generate anything for entity: %s, Error: %s', entity.kind, e.message);
                    //Ignore - not every consumer has code to be generated
                }
            });
        }

        if (spec.consumers) {
            spec.consumers.forEach((consumer) => {
                try {
                    files.push(...target.generate(consumer, this._data));
                } catch (e: any) {
                    console.warn('Did not generate anything for consumer: %s, Error: %s', consumer.kind, e.message);
                    //Ignore - not every consumer has code to be generated
                }
            });
        }

        if (spec.providers) {
            spec.providers.forEach((provider) => {
                try {
                    files.push(...target.generate(provider, this._data));
                } catch (e: any) {
                    console.warn('Did not generate anything for provider: %s, Error: %s', provider.kind, e.message);
                    //Ignore - not every provider has code to be generated
                }
            });
        }

        return out;
    }
}
