const BlockCodeGenerator = require('./src/BlockCodeGenerator');
const TargetRegistry = require('./src/TargetRegistry');
const CodeWriter = require('./src/CodeWriter');
const CodegenHelpers = require('./src/helpers');
const DeploymentCodeGenerator = require('./src/DeploymentCodeGenerator');
const DefaultRegistry = require("./src/DefaultRegistry");

module.exports = {
    BlockCodeGenerator,
    DeploymentCodeGenerator,
    CodeWriter,
    TargetRegistry,
    CodegenHelpers,
    registry: DefaultRegistry
};