

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface PinState {
  petImage: string | null; // Base64
  petType: string;
  petCount: number;
  generatedImage: string | null; // URL
  isLoading: boolean;
  isDetecting: boolean;
}

export const SUGGESTED_TYPES = ["DOG", "CAT", "RAT", "BUNNY", "LIZARD"];