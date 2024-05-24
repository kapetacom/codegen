/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */
export const OPTION_CONTEXT_AI = 'AIContext';

export interface TargetMethods {
    generate: (data: any, context: any) => GeneratedFile[];
    preprocess?: (data: any) => Promise<any>;
    postprocess?: (targetDir: string, files: GeneratedAsset[]) => Promise<void>;
    mergeFile?: (sourceFile: SourceFile, newFile: GeneratedFile, lastFile: GeneratedFile | null) => GeneratedFile;
}

export interface Target extends TargetMethods {
    new (options: any): Target;
}

export interface CodeGenerator {
    generate(): Promise<GeneratedResult>;
    generateForTarget(target: Target): Promise<GeneratedResult>;
    postprocess(targetDir: string, assets: GeneratedAsset[]): Promise<void>;
    postprocessForTarget(targetDir: string, assets: GeneratedAsset[], target: Target): Promise<void>;
}

export interface SourceFile {
    filename: string;
    content: Buffer;
    permissions: string;
}
export interface GeneratedResult {
    target: TargetMethods;
    files: GeneratedFile[];
}

export interface GeneratedFile {
    filename: string;
    content: string | Buffer;
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

export enum AIFileTypes {
    SERVICE = 'service',
    SERVICE_IF = 'service-interface',
    WEB_SCREEN = 'web-screen',
    DAO = 'dao',
    DTO = 'dto',
    CONFIG = 'config',
    CLIENT = 'client', // Various clients
    API = 'api',
    API_CLIENT = 'api-client', // API client
    EVENT_PUBLISHER = 'event-publisher',
    EVENT_CONSUMER = 'event-consumer',
    SECURITY = 'security',
    CONTEXT = 'context',
    IGNORE = 'ignore',
    INSTRUCTIONS = 'instructions',
    DOCUMENTATION = 'documentation',
}
