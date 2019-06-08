const BlockCodeGenerator = require('./src/BlockCodeGenerator');
const TargetRegistry = require('./src/TargetRegistry');
const CodeWriter = require('./src/CodeWriter');

BlockCodeGenerator.DEFAULT_REGISTRY = new TargetRegistry();

module.exports = {
    BlockCodeGenerator,
    CodeWriter,
    TargetRegistry,
    registry: BlockCodeGenerator.DEFAULT_REGISTRY
};