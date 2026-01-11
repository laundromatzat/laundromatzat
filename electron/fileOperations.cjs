const { dialog } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execPromise = promisify(exec);

// Open directory picker and scan for media files
async function selectWorkspaceDirectory() {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "openFile", "multiSelections"],
    message: "Select a folder containing media files",
    title: "Select Workspace Directory",
  });

  if (result.canceled || !result.filePaths.length) return null;

  const dirPath = result.filePaths[0];
  const stats = await fs.stat(dirPath);

  let files;
  if (stats.isDirectory()) {
    files = await scanDirectory(dirPath);
  } else {
    // Single file selected
    files = [await getFileInfo(dirPath)].filter(Boolean);
  }

  return {
    path: dirPath,
    files: files,
  };
}

// Scan directory for supported media files
async function scanDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(dirPath, entry.name);
      const fileInfo = await getFileInfo(fullPath);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }
  }

  return files;
}

// Get file information
async function getFileInfo(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  const mediaType = getMediaType(ext);

  if (!mediaType) return null;

  const stats = await fs.stat(fullPath);

  return {
    name: path.basename(fullPath),
    path: fullPath,
    type: mediaType,
    size: stats.size,
    modified: stats.mtime,
  };
}

// Read file as base64
async function readFileAsBase64(filePath) {
  const buffer = await fs.readFile(filePath);
  return buffer.toString("base64");
}

// Rename file
async function renameFile(oldPath, newName) {
  const dir = path.dirname(oldPath);
  const newPath = path.join(dir, newName);
  await fs.rename(oldPath, newPath);
  return newPath;
}

// Set macOS extended attributes using native xattr command
async function setFileMetadata(filePath, metadata) {
  const { tags, summary, category } = metadata;

  try {
    // Set Finder tags using xattr command
    if (tags && tags.length > 0) {
      // macOS Finder tags are stored as a plist array
      const tagsPlist = tags.map((tag) => `<string>${tag}</string>`).join("");
      const plistContent = `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><array>${tagsPlist}</array></plist>`;

      // Write to temp file and set xattr
      const tempFile = `/tmp/tags_${Date.now()}.plist`;
      await fs.writeFile(tempFile, plistContent);
      await execPromise(
        `xattr -w com.apple.metadata:_kMDItemUserTags "$(cat ${tempFile})" "${filePath}"`
      );
      await fs.unlink(tempFile);
    }

    // Set Spotlight comment
    if (summary) {
      // Properly escape shell special characters
      const escapedSummary = summary
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\$/g, "\\$")
        .replace(/`/g, "\\`");

      await execPromise(
        `xattr -w com.apple.metadata:kMDItemComment "${escapedSummary}" "${filePath}"`
      );
    }

    // Set custom category attribute
    if (category) {
      // Escape category value
      const escapedCategory = category
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\$/g, "\\$")
        .replace(/`/g, "\\`");

      await execPromise(
        `xattr -w com.mediainsight.category "${escapedCategory}" "${filePath}"`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to set xattrs:", error);
    return { success: false, error: error.message };
  }
}

// Organize files into category folders
async function organizeFiles(baseDir, fileOperations) {
  const results = [];

  for (const op of fileOperations) {
    try {
      // Create category directory if needed
      const categoryDir = path.join(baseDir, op.category);
      await fs.mkdir(categoryDir, { recursive: true });

      // Move file to category folder
      const newPath = path.join(categoryDir, op.newName);
      await fs.rename(op.oldPath, newPath);

      // Set metadata
      if (op.metadata) {
        await setFileMetadata(newPath, op.metadata);
      }

      results.push({ success: true, oldPath: op.oldPath, newPath });
    } catch (error) {
      results.push({
        success: false,
        oldPath: op.oldPath,
        error: error.message,
      });
    }
  }

  return results;
}

function getMediaType(ext) {
  const imageExts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".heic",
    ".heif",
  ];
  const videoExts = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"];
  const audioExts = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".aac", ".flac"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  return null;
}

module.exports = {
  selectWorkspaceDirectory,
  readFileAsBase64,
  renameFile,
  setFileMetadata,
  organizeFiles,
};
