declare class Target {
    constructor(options:any);
    generate(data:any, context:any);
    preprocess?:(data:any) => Promise<any>
}