const { contextBridge, ipcRenderer } = require("electron");

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Select workspace directory
  selectWorkspace: () => ipcRenderer.invoke("select-workspace"),

  // Read file as base64
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

  // Rename file
  renameFile: (oldPath, newName) =>
    ipcRenderer.invoke("rename-file", oldPath, newName),

  // Set file metadata
  setMetadata: (filePath, metadata) =>
    ipcRenderer.invoke("set-metadata", filePath, metadata),

  // Organize files into folders
  organizeFiles: (baseDir, operations) =>
    ipcRenderer.invoke("organize-files", baseDir, operations),

  // Check if running in Electron
  isElectron: true,
});
