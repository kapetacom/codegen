const BlockCodeGenerator = require('./src/BlockCodeGenerator');
const TargetRegistry = require('./src/TargetRegistry');

BlockCodeGenerator.DEFAULT_REGISTRY = new TargetRegistry();

module.exports = {
    BlockCodeGenerator,
    TargetRegistry,
    registry: BlockCodeGenerator.DEFAULT_REGISTRY
};