import {BlockCodeGenerator} from './BlockCodeGenerator';
import {TargetRegistry} from './TargetRegistry';
import {CodeWriter} from './CodeWriter';
import {DeploymentCodeGenerator} from './DeploymentCodeGenerator';
import * as CodegenHelpers from './helpers';
import DefaultRegistry from "./DefaultRegistry";

export default {
    BlockCodeGenerator,
    DeploymentCodeGenerator,
    CodeWriter,
    TargetRegistry,
    CodegenHelpers,
    registry: DefaultRegistry
};