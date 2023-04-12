import {Deployment} from "@kapeta/schemas";
import {TargetRegistry} from "./TargetRegistry";
import {CodeGenerator, GeneratedFile, Target} from "./types";
import {registry as DefaultRegistry} from "./DefaultRegistry";

export class DeploymentCodeGenerator implements CodeGenerator {
    private readonly _data: Deployment;
    private readonly _registry: TargetRegistry;
    /**
     *
     * @param {object} deploymentData The parsed Deployment YAML
     * @param {TargetRegistry} [registry] Defaults to DefaultRegistry
     */
    constructor(deploymentData:Deployment, registry:TargetRegistry) {
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
     */
    public async generate():Promise<GeneratedFile[]> {
        if (!this._data.spec.target) {
            throw new Error('Deployment has no target');
        }

        const targetClass:Target = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.kind);

        return this.generateForTarget(target);

    }

    public async generateForTarget(target:Target):Promise<GeneratedFile[]> {

        const data = target.preprocess ? await target.preprocess(this._data) : this._data;
        const result:GeneratedFile[] = target.generate(data, data);

        const spec = this._data.spec;
        if (spec.services) {
            for (const service of spec.services) {
                try {
                    result.push(
                        ...target.generate(service, data)
                    );
                } catch (e:any) {
                    console.warn('Did not generate anything for service %s, Error: %s', service.kind, e.message);
                }
            }
        }
        return result;
    }
}