/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const FolderMoveIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 13l-3-3m0 0l-3 3m3-3v8" />
    </svg>
);

export default FolderMoveIcon;