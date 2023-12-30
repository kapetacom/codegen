import { Deployment } from '@kapeta/schemas';
import { TargetRegistry } from './TargetRegistry';
import { GeneratedFile, Target, TargetMethods } from './types';
import { DEFAULT_FILE_PERMISSIONS, MODE_WRITE_ALWAYS } from './CodeWriter';
import { DeploymentCodeGenerator } from './DeploymentCodeGenerator';

const block: Deployment = {
    kind: 'core/deployment',
    metadata: {
        name: 'test',
        title: 'Test',
    },
    spec: {
        target: {
            ref: 'kapeta/target-test:1.2.3',
            image: 'kapeta/target-test:1.2.3',
        },
        plan: {
            ref: 'test',
        },
        configuration: {},
        network: [],
        services: [
            {
                ref: 'test',
                kind: 'kapeta/service-test:1.2.3',
                configuration: {},
                id: 'test',
                fallbackDNS: 'test',
            },
            {
                ref: 'test2',
                kind: 'kapeta/service-test2:1.2.3',
                configuration: {},
                id: 'test2',
                fallbackDNS: 'test2',
            },
        ],
        insights: {
            domain: 'test',
        },
        environment: {
            ref: 'test',
        },
    },
};

class TestTarget implements TargetMethods {
    generate(data: any, context: any): GeneratedFile[] {
        return [
            {
                filename: data.kind,
                content: '',
                mode: MODE_WRITE_ALWAYS,
                permissions: DEFAULT_FILE_PERMISSIONS,
            },
        ];
    }
}

const registry = new TargetRegistry();
registry.register('kapeta/target-test:1.2.3', TestTarget as any as Target);

describe('DeploymentCodeGenerator', () => {
    test('can generate for every kind', async () => {
        const generator = new DeploymentCodeGenerator(block, registry);

        const generated = await generator.generateForTarget(new TestTarget());
        expect(generated.files.map((f) => f.filename)).toEqual([
            'core/deployment',
            'kapeta/service-test:1.2.3',
            'kapeta/service-test2:1.2.3',
        ]);
    });
});
