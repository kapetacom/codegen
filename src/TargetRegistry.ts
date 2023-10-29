/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { Target } from './types';

export class TargetRegistry {
    private _targets: { [key: string]: Target } = {};

    public reset(): void {
        this._targets = {};
    }

    public register(targetId: string, target: Target): void {
        this._targets[targetId.toLowerCase()] = target;
    }

    public async get(target: string): Promise<Target> {
        const lcTarget = target.toLowerCase();
        if (!this._targets[lcTarget]) {
            //TODO: Attempt to download target if not available
            throw new Error('Target not supported: ' + target);
        }

        return this._targets[lcTarget];
    }
}
