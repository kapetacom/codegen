export interface Target {
    new (options:any):Target;
    generate:(data:any, context:any) => GeneratedFile[];
    preprocess?:(data:any) => Promise<any>
    postprocess?:(files:GeneratedAsset[]) => Promise<void>
}

export interface CodeGenerator {
    generate():Promise<GeneratedFile[]>;
    generateForTarget(target:Target):Promise<GeneratedFile[]>
}

export interface GeneratedFile {
    filename: string;
    content: string;
    mode:string;
    permissions:string;
}

export interface GeneratedAsset {
    filename: string;
    mode:string;
    permissions:string;
    modified?:number
    checksum?:string
}
