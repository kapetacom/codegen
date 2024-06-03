/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { Deployment } from '@kapeta/schemas';
import { TargetRegistry } from './TargetRegistry';
import { CodeGenerator, GeneratedAsset, GeneratedFile, GeneratedResult, TargetMethods, ValidationResult } from './types';
import { registry as DefaultRegistry } from './DefaultRegistry';

export class DeploymentCodeGenerator implements CodeGenerator {
    private readonly _data: Deployment;
    private readonly _registry: TargetRegistry;

    constructor(deploymentData: Deployment, registry: TargetRegistry | null = null) {
        if (!deploymentData) {
            throw new Error('Deployment data was missing');
        }

        this._data = deploymentData;
        this._registry = registry ? registry : DefaultRegistry;

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
    public async generate(): Promise<GeneratedResult> {
        if (!this._data.spec.target) {
            throw new Error('Deployment has no target');
        }

        const targetClass = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.kind);

        return this.generateForTarget(target);
    }

    public async postprocess(targetDir: string, assets: GeneratedAsset[]): Promise<void> {
        if (!this._data.spec.target) {
            throw new Error('Deployment has no target');
        }

        const targetClass = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.kind);

        return this.postprocessForTarget(targetDir, assets, target);
    }

    public async postprocessForTarget(
        targetDir: string,
        assets: GeneratedAsset[],
        target: TargetMethods
    ): Promise<void> {
        if (target.postprocess) {
            await target.postprocess(targetDir, assets);
        }
    }

    public async generateForTarget(target: TargetMethods): Promise<GeneratedResult> {
        const data = target.preprocess ? await target.preprocess(this._data) : this._data;
        const files: GeneratedFile[] = target.generate(data, data);
        const out: GeneratedResult = {
            target,
            files,
        };

        const spec = this._data.spec;
        if (spec.services) {
            for (const service of spec.services) {
                try {
                    files.push(...target.generate(service, data));
                } catch (e: any) {
                    console.warn('Did not generate anything for service %s, Error: %s', service.kind, e.message);
                }
            }
        }
        return out;
    }

    public async validateForTarget(targetDir: string): Promise<ValidationResult> {
        if (!this._data.spec.target) {
            throw new Error('Deployment has no target');
        }

        const targetClass = await this._registry.get(this._data.spec.target.kind);

        const target = new targetClass(this._data.spec.target.kind);

        if (target.validate) {
            return target.validate(targetDir);
        }

        return {
            error: '',
            status: 'ok',
        };
    } 
}
