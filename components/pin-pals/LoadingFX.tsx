/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export const LoadingFX: React.FC = () => {
    return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center space-y-6">
            <div className="relative w-16 h-16">
                 <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
                 <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin"></div>
            </div>
            
            <div className="text-center space-y-2">
                <h2 className="text-lg font-medium text-white tracking-tight animate-pulse">
                    Designing Pin...
                </h2>
                <p className="text-sm text-zinc-500">
                    AI is crafting your vector illustration
                </p>
            </div>
        </div>
    );
};