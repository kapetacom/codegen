export interface Target<T = any> {
    new (options?:any): Target<T>;

    generate(data:T, context:any):GeneratedFile[];
    preprocess?:(data:T) => Promise<any>
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
