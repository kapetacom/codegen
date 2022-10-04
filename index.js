const BlockCodeGenerator = require('./src/BlockCodeGenerator');
const TargetRegistry = require('./src/TargetRegistry');
const CodeWriter = require('./src/CodeWriter');
const CodegenHelpers = require('./src/helpers');

BlockCodeGenerator.DEFAULT_REGISTRY = new TargetRegistry();

module.exports = {
    BlockCodeGenerator,
    CodeWriter,
    TargetRegistry,
    CodegenHelpers,
    registry: BlockCodeGenerator.DEFAULT_REGISTRY
};