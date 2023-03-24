# Kapeta Code generator module
Uses code generator targets to generate code for blocks in any language and framework 

Currently only able to generate code for "Block YML" using BlockCodeGenerator, 
but could easily be extended to handle more types

The library pulls together the different parts involved in code generation:
1. Loading code generation targets (languages) 
1. Actually generating the code
1. Writing it to files

## Basic usage
```javascript
//Create a code generator for a block YML structure
//This will load the correct codegen-target based on the configuration in the YML 
const codeGenerator = new BlockCodeGenerator(blockYML);

//Generate the code itself - output will contain file names, content and
//file permissions 
const output = await codeGenerator.generate();

//Code writer takes the generated output and writes it to disk
//Base dir is the is prepended to all paths
const writer = new CodeWriter(baseDir);

//Will perform the actual writes to disk
writer.write(output);
```

 ## Language Targets
Language targets is what defines how a particular data structure should be
expressed in a given language / framework / context

This library uses a "Target Registry" to contain information about what 
language targets are available.

The **default** target registry is available as "registry" in the export
from this library. If you register targets to this registry it will automatically
be picked up by the rest of the code generation framework
```javascript
const {registry} = require('@kapeta/codegen');
```

To register a language target we do this:
```javascript
registry.register('target-identifier', TargetClass);
```
TargetClass is expected to extend ```Target``` which is found in the
```@kapeta/codegen-target``` module:
https://github.com/blockwarecom/codegen-target/blob/master/src/Target.js

