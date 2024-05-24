import { BlockCodeGenerator } from './BlockCodeGenerator';
import { BlockDefinition, EntityType } from '@kapeta/schemas';
import { TargetRegistry } from './TargetRegistry';
import { GeneratedFile, Target, TargetMethods } from './types';
import { DEFAULT_FILE_PERMISSIONS, MODE_WRITE_ALWAYS } from './CodeWriter';

const block: BlockDefinition = {
    kind: 'kapeta/block-type-test:1.2.3',
    metadata: {
        name: 'test',
        title: 'Test',
    },
    spec: {
        target: {
            kind: 'kapeta/target-test:1.2.3',
        },
        entities: {
            types: [
                {
                    name: 'Test',
                    type: EntityType.Dto,
                    properties: {
                        id: {
                            type: 'string',
                            required: true,
                        },
                        name: {
                            type: 'string',
                            required: true,
                        },
                    },
                },
            ],
        },
        consumers: [
            {
                spec: {},
                kind: 'kapeta/consumer-test:1.2.3',
                metadata: {
                    name: 'test',
                    title: 'Test',
                },
            },
        ],
        providers: [
            {
                spec: {},
                kind: 'kapeta/provider-test:1.2.3',
                metadata: {
                    name: 'test',
                    title: 'Test',
                },
            },
        ],
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

describe('BlockCodeGenerator', () => {
    test('can generate for every kind', async () => {
        const generator = new BlockCodeGenerator(block, registry);

        const generated = await generator.generateForTarget(new TestTarget());
        expect(generated.files.map((f) => f.filename)).toEqual([
            'kapeta/block-type-test:1.2.3',
            'core/entity',
            'kapeta/consumer-test:1.2.3',
            'kapeta/provider-test:1.2.3',
        ]);
    });

    test('can receive additional options', async () => {
        const generator = new BlockCodeGenerator(block, registry);
        generator.withOption('test', 'test');

        expect(generator.getTargetOptions()).toEqual({ test: 'test' });
    });
});
