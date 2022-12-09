const BlockCodeGenerator = require('./src/BlockCodeGenerator');
const TargetRegistry = require('./src/TargetRegistry');
const CodeWriter = require('./src/CodeWriter');
const CodegenHelpers = require('./src/helpers');
const DeploymentCodeGenerator = require('./src/DeploymentCodeGenerator');

BlockCodeGenerator.DEFAULT_REGISTRY = new TargetRegistry();
DeploymentCodeGenerator.DEFAULT_REGISTRY = new TargetRegistry();

module.exports = {
    BlockCodeGenerator,
    DeploymentCodeGenerator,
    CodeWriter,
    TargetRegistry,
    CodegenHelpers,
    registry: BlockCodeGenerator.DEFAULT_REGISTRY
};