/**
 * Electron API type declarations for MediaInsight
 */

declare global {
  interface Window {
    electronAPI?: {
      selectWorkspace: () => Promise<{
        path: string;
        files: Array<{
          name: string;
          path: string;
          type: string;
          size: number;
          modified: Date;
        }>;
      } | null>;
      readFile: (path: string) => Promise<string>;
      renameFile: (oldPath: string, newName: string) => Promise<string>;
      setMetadata: (
        path: string,
        metadata: { tags?: string[]; summary?: string; category?: string }
      ) => Promise<{ success: boolean; error?: string }>;
      organizeFiles: (
        baseDir: string,
        operations: Array<{
          oldPath: string;
          newName: string;
          category: string;
          metadata: {
            tags?: string[];
            summary?: string;
            category?: string;
          };
        }>
      ) => Promise<
        Array<{
          success: boolean;
          oldPath: string;
          newPath?: string;
          error?: string;
        }>
      >;
      generateThumbnail: (path: string) => Promise<string | null>;
      openFile: (path: string) => Promise<{ success: boolean; error?: string }>;
      isElectron: boolean;
    };
  }
}

export {};
