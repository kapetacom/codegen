/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

export interface Target {
    new (options: any): Target;
    generate: (data: any, context: any) => GeneratedFile[];
    preprocess?: (data: any) => Promise<any>;
    postprocess?: (targetDir: string, files: GeneratedAsset[]) => Promise<void>;
    mergeFile?: (sourceFile: SourceFile, newFile: GeneratedFile) => GeneratedFile;
}

export interface CodeGenerator {
    generate(): Promise<GeneratedResult>;
    generateForTarget(target: Target): Promise<GeneratedResult>;
    postprocess(targetDir: string, assets: GeneratedAsset[]): Promise<void>;
    postprocessForTarget(targetDir: string, assets: GeneratedAsset[], target:Target): Promise<void>;
}

export interface SourceFile {
    filename: string;
    content: string;
    permissions: string;
}
export interface GeneratedResult {
    target: Target;
    files: GeneratedFile[];
}

export interface GeneratedFile {
    filename: string;
    content: string;
    mode: string;
    permissions: string;
}

export interface GeneratedAsset {
    filename: string;
    mode: string;
    permissions: string;
    modified?: number;
    checksum?: string;
    merged?: boolean;
}
