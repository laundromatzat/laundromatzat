const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fileOps = require("./fileOperations.cjs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#f8f8f8",
    title: "MediaInsight Pro",
  });

  // Load from Vite dev server or built files
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  if (isDev) {
    // Load MediaInsight directly in dev mode (no auth required)
    mainWindow.loadURL("http://localhost:5173/tools/media-insight");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/tools/media-insight",
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIPCHandlers() {
  // Select workspace directory
  ipcMain.handle("select-workspace", async () => {
    try {
      return await fileOps.selectWorkspaceDirectory();
    } catch (error) {
      console.error("Failed to select workspace:", error);
      return null;
    }
  });

  // Read file as base64
  ipcMain.handle("read-file", async (event, filePath) => {
    try {
      return await fileOps.readFileAsBase64(filePath);
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  });

  // Rename file
  ipcMain.handle("rename-file", async (event, oldPath, newName) => {
    try {
      return await fileOps.renameFile(oldPath, newName);
    } catch (error) {
      console.error("Failed to rename file:", error);
      throw error;
    }
  });

  // Set file metadata
  ipcMain.handle("set-metadata", async (event, filePath, metadata) => {
    try {
      return await fileOps.setFileMetadata(filePath, metadata);
    } catch (error) {
      console.error("Failed to set metadata:", error);
      throw error;
    }
  });

  // Organize files
  ipcMain.handle("organize-files", async (event, baseDir, operations) => {
    try {
      return await fileOps.organizeFiles(baseDir, operations);
    } catch (error) {
      console.error("Failed to organize files:", error);
      throw error;
    }
  });

  // Generate thumbnail
  ipcMain.handle("generate-thumbnail", async (event, filePath) => {
    try {
      return await fileOps.generateThumbnail(filePath);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
      throw error;
    }
  });

  // Open file
  ipcMain.handle("open-file", async (event, filePath) => {
    try {
      return await fileOps.openFile(filePath);
    } catch (error) {
      console.error("Failed to open file:", error);
      throw error;
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  registerIPCHandlers();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle app quit
app.on("before-quit", () => {
  // Cleanup if needed
});
