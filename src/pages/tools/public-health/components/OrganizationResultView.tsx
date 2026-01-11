/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AnalysisResult, AnalyzedDocument, SavedDocument } from "@/types";
import {
  FolderIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  EyeIcon,
  ClockIcon as HistoryIcon,
  ArrowDownTrayIcon as DownloadIcon,
  ArrowDownOnSquareIcon as SaveIcon,
  MagnifyingGlassIcon as SearchIcon,
  PencilSquareIcon as EditIcon,
  FolderPlusIcon,
  FolderArrowDownIcon as FolderMoveIcon,
} from "@heroicons/react/24/outline";

interface OrganizationResultViewProps {
  result: AnalysisResult | null;
  existingDocuments?: SavedDocument[];
  uploadedFiles: File[];
  onStartChat: () => void;
  onReset: () => void;
  onSave: (documents: AnalyzedDocument[]) => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  children: TreeNode[];
  doc?: AnalyzedDocument;
  path: string;
  hasDuplicates?: boolean;
  isExisting?: boolean; // New Flag
}

interface FolderActions {
  onRename: (node: TreeNode) => void; // Keeps modal option available if needed
  onRenameSubmit: (node: TreeNode, newName: string) => void;
  onMove: (node: TreeNode) => void;
  onCreateSubfolder: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

interface FileTreeNodeProps {
  node: TreeNode;
  level?: number;
  actions: FolderActions;
  onFileDrop: (filename: string, targetPath: string) => void;
  onFolderDrop: (srcPath: string, targetPath: string) => void;
}

// Helper to extract all folder paths for the move dropdown
const getAllFolderPaths = (nodes: TreeNode[]): string[] => {
  let paths: string[] = [];
  nodes.forEach((node) => {
    if (node.type === "folder") {
      paths.push(node.path);
      paths = paths.concat(getAllFolderPaths(node.children));
    }
  });
  return paths;
};

const buildFileTree = (
  documents: AnalyzedDocument[],
  customFolders: string[],
  existingDocuments: SavedDocument[] = []
): TreeNode[] => {
  const root: TreeNode[] = [];

  // ... existing helper ...

  // Helper to get or create folder node (No change needed)
  const getOrCreateFolder = (
    parentChildren: TreeNode[],
    name: string,
    fullPath: string
  ): TreeNode => {
    let node = parentChildren.find(
      (n) => n.name === name && n.type === "folder"
    );
    if (!node) {
      node = {
        id: `folder-${fullPath}`,
        name: name,
        type: "folder",
        children: [],
        path: fullPath,
        hasDuplicates: false,
      };
      parentChildren.push(node);
    }
    return node;
  };

  // 1. Process Custom Folders (No change needed)
  customFolders.forEach((folderPath) => {
    // ... existing implementation
    const parts = folderPath
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folderNode = getOrCreateFolder(currentLevel, part, currentPath);
      currentLevel = folderNode.children;
    });
  });

  // 2. Process NEW Documents
  documents.forEach((doc) => {
    // ... existing implementation
    const parts = doc.suggested_path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folderNode = getOrCreateFolder(currentLevel, part, currentPath);
      currentLevel = folderNode.children;
    });

    // Add file node
    const hasDupes =
      doc.possible_duplicates && doc.possible_duplicates.length > 0;
    currentLevel.push({
      id: `file-${doc.filename}`,
      name: doc.filename,
      type: "file",
      children: [],
      doc: doc,
      path: currentPath ? `${currentPath}/${doc.filename}` : doc.filename,
      hasDuplicates: hasDupes,
      isExisting: false, // Clearly mark as NEW
    });
  });

  // 3. Process EXISTING Documents
  existingDocuments.forEach((savedDoc) => {
    const doc = savedDoc.analysis;
    // Ensure we respect any path differences if saved differently?
    // For now, assume savedDoc.analysis.suggested_path is the truth.
    const parts = doc.suggested_path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folderNode = getOrCreateFolder(currentLevel, part, currentPath);
      currentLevel = folderNode.children;
    });

    currentLevel.push({
      id: `existing-file-${savedDoc.id || doc.filename}-${Math.random()}`, // Ensure unique ID
      name: doc.filename,
      type: "file",
      children: [],
      doc: doc,
      path: currentPath ? `${currentPath}/${doc.filename}` : doc.filename,
      hasDuplicates: false, // Already in repo, assume okay? Or check against new? For now false.
      isExisting: true,
    });
  });

  // ... existing duplicate propagation and sort ...
  // 4. Recursive Dup Check for Folders
  const propagateDuplicates = (nodes: TreeNode[]): boolean => {
    let anyChildHasDuplicates = false;
    nodes.forEach((node) => {
      if (node.type === "file") {
        if (node.hasDuplicates) anyChildHasDuplicates = true;
      } else {
        const childResult = propagateDuplicates(node.children);
        if (childResult) {
          node.hasDuplicates = true;
          anyChildHasDuplicates = true;
        }
      }
    });
    return anyChildHasDuplicates;
  };
  propagateDuplicates(root);

  // Recursive sort
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
};

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level = 0,
  actions,
  onFileDrop,
  onFolderDrop,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const indentSize = 1.5; // rem per level
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    const data =
      node.type === "file" ? `FILE::${node.name}` : `FOLDER::${node.path}`;
    e.dataTransfer.setData("text/plain", data);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();

    // Set opacity to make drag image look ghostly
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === "folder") {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (node.type === "folder" && !isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (node.type !== "folder") return;

    const data = e.dataTransfer.getData("text/plain");

    if (data.startsWith("FILE::")) {
      const filename = data.replace("FILE::", "");
      onFileDrop(filename, node.path);
    } else if (data.startsWith("FOLDER::")) {
      const srcPath = data.replace("FOLDER::", "");
      // Prevent dropping folder into itself or its children
      if (srcPath !== node.path && !node.path.startsWith(srcPath + "/")) {
        onFolderDrop(srcPath, node.path);
      }
    }
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue.trim() !== node.name) {
      actions.onRenameSubmit(node, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setRenameValue(node.name);
      setIsRenaming(false);
    }
  };

  if (node.type === "folder") {
    return (
      <div
        draggable={!isRenaming}
        onDragStart={(e) => !isRenaming && handleDragStart(e, node)}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="select-none"
      >
        <div
          className={`flex items-center py-2 pr-2 rounded group relative transition-colors ${
            isDragOver
              ? "bg-gem-blue/30 ring-2 ring-inset ring-gem-blue"
              : "hover:bg-gem-mist/20"
          }`}
          style={{ paddingLeft: `${level * indentSize}rem` }}
        >
          <div
            role="button"
            tabIndex={0}
            className="flex items-center flex-grow cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-gem-blue rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (!isRenaming) setIsOpen(!isOpen);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                if (!isRenaming) setIsOpen(!isOpen);
              }
            }}
          >
            <span className="mr-1 text-gem-offwhite/50 w-4 h-4 flex items-center justify-center">
              {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </span>
            <FolderIcon
              className={`w-5 h-5 mr-2 transition-colors ${
                isDragOver
                  ? "text-gem-blue"
                  : node.hasDuplicates
                    ? "text-orange-400"
                    : "text-gem-blue group-hover:text-blue-400"
              }`}
            />

            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-sm text-gem-offwhite bg-white border border-gem-blue rounded px-1 py-0.5 outline-none w-32 sm:w-48"
              />
            ) : (
              <span
                className={`font-medium text-sm truncate max-w-[150px] sm:max-w-xs ${node.hasDuplicates ? "text-orange-700/80" : "text-gem-offwhite"}`}
                title={`${node.name} (Double-click to rename)`}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(node.name);
                  setIsRenaming(true);
                }}
              >
                {node.name}
              </span>
            )}

            {!isRenaming && (
              <span className="ml-2 text-[10px] text-gem-offwhite/40 bg-gem-mist/30 px-1.5 rounded-full">
                {node.children.length}
              </span>
            )}
            {node.hasDuplicates && !isRenaming && (
              <span
                className="ml-2 w-2 h-2 rounded-full bg-orange-500"
                title="Contains potential duplicates"
              ></span>
            )}
          </div>

          {/* Folder Actions */}
          {!isRenaming && (
            <div className="hidden group-hover:flex items-center space-x-1 ml-2 bg-gem-slate/80 backdrop-blur-sm rounded px-1 absolute right-2 z-10 shadow-sm border border-gem-mist/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onCreateSubfolder(node);
                }}
                className="p-1 text-gem-offwhite/60 hover:text-green-600 rounded transition-colors"
                title="New Subfolder"
              >
                <FolderPlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(node.name);
                  setIsRenaming(true);
                }}
                className="p-1 text-gem-offwhite/60 hover:text-gem-blue rounded transition-colors"
                title="Rename Folder"
              >
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onMove(node);
                }}
                className="p-1 text-gem-offwhite/60 hover:text-orange-500 rounded transition-colors"
                title="Move Folder"
              >
                <FolderMoveIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onDelete(node);
                }}
                className="p-1 text-gem-offwhite/60 hover:text-red-500 rounded transition-colors"
                title="Delete Folder"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="border-l border-gem-mist/10 ml-2">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                actions={actions}
                onFileDrop={onFileDrop}
                onFolderDrop={onFolderDrop}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    const duplicateReason =
      node.doc?.possible_duplicates?.[0]?.reason || "Duplicate detected";
    const duplicateScore =
      node.doc?.possible_duplicates?.[0]?.confidence_score || 0;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onDragEnd={handleDragEnd}
        className="flex items-center py-2 pr-2 hover:bg-gem-mist/20 rounded text-gem-offwhite group cursor-grab active:cursor-grabbing"
        style={{ paddingLeft: `${level * indentSize}rem` }}
      >
        <div className="w-5 flex justify-center mr-1"></div>{" "}
        {/* Spacer for chevron alignment */}
        <DocumentTextIcon className="w-4 h-4 text-gem-teal mr-2 opacity-80 group-hover:opacity-100" />
        <div className="flex flex-col min-w-0 flex-grow mr-2">
          <div className="flex items-center flex-wrap">
            <span
              className="text-sm truncate max-w-[150px] sm:max-w-[200px]"
              title={node.name}
            >
              {node.name}
            </span>

            {!node.isExisting && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border border-green-200">
                New
              </span>
            )}

            {node.doc?.detected_version && (
              <span
                className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-sm font-mono whitespace-nowrap"
                title={`Detected Version: ${node.doc.detected_version}`}
              >
                {node.doc.detected_version}
              </span>
            )}
          </div>
        </div>
        {node.hasDuplicates && (
          <span
            className="ml-auto px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 cursor-help"
            title={`Potential Duplicate (${duplicateScore}%): ${duplicateReason}`}
          >
            Duplicate
          </span>
        )}
      </div>
    );
  }
};

const OrganizationResultView: React.FC<OrganizationResultViewProps> = ({
  result,
  existingDocuments = [],
  uploadedFiles,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [editableDocs, setEditableDocs] = useState<AnalyzedDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [folderModal, setFolderModal] = useState<{
    isOpen: boolean;
    type: "create" | "rename" | "move";
    targetNode: TreeNode | null;
    value: string;
    parentPath?: string;
  }>({
    isOpen: false,
    type: "create",
    targetNode: null,
    value: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
  });

  const [editForm, setEditForm] = useState<AnalyzedDocument | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");

  const [previewDoc, setPreviewDoc] = useState<AnalyzedDocument | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const [bulkEditModal, setBulkEditModal] = useState({
    isOpen: false,
    path: "",
    addKeywords: "",
    version: "",
  });

  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    doc: AnalyzedDocument | null;
  }>({
    isOpen: false,
    doc: null,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result) {
      setEditableDocs(JSON.parse(JSON.stringify(result.documents)));
    } else {
      setEditableDocs([]); // Reset if result is null (or handle if we just want to show existing)
    }
  }, [result]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return editableDocs;
    const lowerQuery = searchQuery.toLowerCase();
    return editableDocs.filter(
      (doc) =>
        doc.filename.toLowerCase().includes(lowerQuery) ||
        doc.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
    );
  }, [editableDocs, searchQuery]);

  const fileTree = useMemo(() => {
    const foldersToInclude = searchQuery.trim() ? [] : customFolders;
    return buildFileTree(filteredDocs, foldersToInclude, existingDocuments);
  }, [filteredDocs, customFolders, searchQuery, existingDocuments]);

  const allFolderPaths = useMemo(() => getAllFolderPaths(fileTree), [fileTree]);

  // ...

  useEffect(() => {
    if (folderModal.isOpen) {
      // Focus logic needs to wait for render
      setTimeout(() => {
        const input = document.getElementById("folder-modal-input");
        if (input) input.focus();
      }, 100);
    }
  }, [folderModal.isOpen]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const closePreview = useCallback(() => {
    setPreviewDoc(null);
    setPreviewFile(null);
    setPreviewText(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Accessiblity for Preview Modal
  useEffect(() => {
    if (previewDoc) {
      lastActiveElement.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closePreview();
          return;
        }
        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0] as HTMLElement;
          const last = focusable[focusable.length - 1] as HTMLElement;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        lastActiveElement.current?.focus();
      };
    }
  }, [previewDoc, closePreview]);

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            ...result,
            documents: editableDocs,
            customFolders: customFolders,
          },
          null,
          2
        )
      );
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "organization_analysis.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSave = () => {
    onSave(editableDocs);
  };

  // --- Bulk Selection ---

  const toggleSelectDoc = (filename: string) => {
    const newSet = new Set(selectedDocs);
    if (newSet.has(filename)) {
      newSet.delete(filename);
    } else {
      newSet.add(filename);
    }
    setSelectedDocs(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocs.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocs.map((d) => d.filename)));
    }
  };

  const handleBulkEditSubmit = () => {
    const { path, addKeywords, version } = bulkEditModal;
    const keywordsToAdd = addKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    const updatedDocs = editableDocs.map((doc) => {
      if (selectedDocs.has(doc.filename)) {
        let newKeywords = [...doc.keywords];
        if (keywordsToAdd.length > 0) {
          newKeywords = Array.from(new Set([...newKeywords, ...keywordsToAdd]));
        }

        return {
          ...doc,
          suggested_path: path.trim() || doc.suggested_path,
          detected_version: version.trim() || doc.detected_version,
          keywords: newKeywords,
        };
      }
      return doc;
    });

    setEditableDocs(updatedDocs);
    setBulkEditModal({ isOpen: false, path: "", addKeywords: "", version: "" });
    setSelectedDocs(new Set()); // clear selection after edit
  };

  // --- Folder Operations ---

  const openCreateRootFolder = () => {
    setFolderModal({
      isOpen: true,
      type: "create",
      targetNode: null,
      value: "",
      parentPath: "",
    });
  };

  const executeRename = (node: TreeNode, newName: string) => {
    const oldPath = node.path;
    const parts = oldPath.split("/");
    parts.pop(); // Remove old name
    const newPath =
      parts.length > 0 ? `${parts.join("/")}/${newName}` : newName;

    updatePaths(oldPath, newPath);
  };

  const executeDelete = (node: TreeNode) => {
    // "Deleting" a folder means moving its contents to its parent.
    const path = node.path;
    const parts = path.split("/");
    parts.pop(); // Remove folder name
    const parentPath = parts.join("/");

    // Use updatePaths to reparent everything to parentPath
    updatePaths(path, parentPath);

    // Also ensure the folder itself is removed from customFolders if it was explicitly there
    setCustomFolders((prev) => prev.filter((f) => f !== path));
  };

  const folderActions: FolderActions = {
    onCreateSubfolder: (node) => {
      setFolderModal({
        isOpen: true,
        type: "create",
        targetNode: node,
        value: "",
        parentPath: node.path,
      });
    },
    onRename: (node) => {
      setFolderModal({
        isOpen: true,
        type: "rename",
        targetNode: node,
        value: node.name,
      });
    },
    onRenameSubmit: (node, newName) => {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Rename",
        message: `Are you sure you want to rename "${node.name}" to "${newName}"? This will update paths for all contained documents.`,
        action: () => executeRename(node, newName),
      });
    },
    onMove: (node) => {
      // Determine current parent path
      const parts = node.path.split("/");
      parts.pop();
      const parentPath = parts.join("/");

      setFolderModal({
        isOpen: true,
        type: "move",
        targetNode: node,
        value: parentPath,
      });
    },
    onDelete: (node) => {
      setConfirmModal({
        isOpen: true,
        title: "Confirm Delete Folder",
        message: `Are you sure you want to delete "${node.name}"? Any files inside will be moved to its parent folder.`,
        action: () => executeDelete(node),
      });
    },
  };

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, targetNode, value, parentPath } = folderModal;
    const trimmedValue = value.trim();

    if (!trimmedValue && type !== "move") return; // Move can be to root (empty string)

    if (type === "create") {
      const newPath = parentPath
        ? `${parentPath}/${trimmedValue}`
        : trimmedValue;
      if (!customFolders.includes(newPath)) {
        setCustomFolders([...customFolders, newPath]);
      }
      setFolderModal({ ...folderModal, isOpen: false });
    } else if (type === "rename" && targetNode) {
      setFolderModal({ ...folderModal, isOpen: false });
      setConfirmModal({
        isOpen: true,
        title: "Confirm Rename",
        message: `Are you sure you want to rename "${targetNode.name}" to "${trimmedValue}"?`,
        action: () => executeRename(targetNode, trimmedValue),
      });
    } else if (type === "move" && targetNode) {
      const oldPath = targetNode.path;
      const newParent = trimmedValue.replace(/\/$/, ""); // Remove trailing slash

      // Prevent moving into itself (pre-check)
      if (newParent === oldPath || newParent.startsWith(oldPath + "/")) {
        alert("Cannot move a folder into itself or its children.");
        return;
      }

      setFolderModal({ ...folderModal, isOpen: false });
      setConfirmModal({
        isOpen: true,
        title: "Confirm Move",
        message: `Are you sure you want to move "${targetNode.name}" to "${newParent || "Root"}"?`,
        action: () => {
          const newPath = newParent
            ? `${newParent}/${targetNode.name}`
            : targetNode.name;
          updatePaths(oldPath, newPath);
        },
      });
    }
  };

  const updatePaths = (oldPrefix: string, newPrefix: string) => {
    // Update Documents
    const updatedDocs = editableDocs.map((doc) => {
      if (doc.suggested_path === oldPrefix) {
        return { ...doc, suggested_path: newPrefix };
      }
      if (doc.suggested_path.startsWith(oldPrefix + "/")) {
        const suffix = doc.suggested_path.substring(oldPrefix.length);
        let result = newPrefix + suffix;
        // Clean leading slash if newPrefix was empty (moved to root)
        if (result.startsWith("/")) result = result.substring(1);
        return { ...doc, suggested_path: result };
      }
      return doc;
    });
    setEditableDocs(updatedDocs);

    // Update Custom Folders
    const updatedFolders = customFolders
      .map((folder) => {
        if (folder === oldPrefix) return newPrefix;
        if (folder.startsWith(oldPrefix + "/")) {
          const suffix = folder.substring(oldPrefix.length);
          let result = newPrefix + suffix;
          if (result.startsWith("/")) result = result.substring(1);
          return result;
        }
        return folder;
      })
      .filter((f) => f !== ""); // Remove empty paths if any

    // Ensure the new folder itself is tracked if it was a custom folder or became one
    if (newPrefix && !updatedFolders.includes(newPrefix)) {
      updatedFolders.push(newPrefix);
    }

    setCustomFolders([...new Set(updatedFolders)]); // Dedup
  };

  const handleFileDrop = (filename: string, targetPath: string) => {
    setEditableDocs((prev) =>
      prev.map((doc) => {
        if (doc.filename === filename) {
          if (doc.suggested_path === targetPath) return doc;
          return { ...doc, suggested_path: targetPath };
        }
        return doc;
      })
    );
  };

  const handleFolderDrop = (srcPath: string, destPath: string) => {
    const folderName = srcPath.split("/").pop() || "";
    const newPath = destPath ? `${destPath}/${folderName}` : folderName;

    if (newPath === srcPath) return;

    updatePaths(srcPath, newPath);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const type = e.dataTransfer.getData("text/plain").startsWith("FILE::")
      ? "file"
      : e.dataTransfer.getData("text/plain").startsWith("FOLDER::")
        ? "folder"
        : null;
    const data = e.dataTransfer.getData("text/plain");

    if (type === "file") {
      const filename = data.replace("FILE::", "");
      handleFileDrop(filename, "");
    } else if (type === "folder") {
      const srcPath = data.replace("FOLDER::", "");
      const folderName = srcPath.split("/").pop() || "";
      // Move to root
      updatePaths(srcPath, folderName);
    }
  };

  // --- Document Editing ---

  const startEdit = (doc: AnalyzedDocument) => {
    const index = editableDocs.indexOf(doc);
    if (index !== -1) {
      setEditingIndex(index);
      setEditForm({ ...editableDocs[index] });
      setNewTag("");
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
    setNewTag("");
  };

  const confirmEdit = () => {
    if (editForm && editingIndex !== null) {
      const updatedDocs = [...editableDocs];
      updatedDocs[editingIndex] = editForm;
      setEditableDocs(updatedDocs);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const addTag = () => {
    if (editForm && newTag.trim()) {
      setEditForm({
        ...editForm,
        keywords: [...editForm.keywords, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        keywords: editForm.keywords.filter((t) => t !== tagToRemove),
      });
    }
  };

  // --- Preview ---

  const handlePreview = async (doc: AnalyzedDocument) => {
    const file = uploadedFiles.find((f) => f.name === doc.filename);
    if (!file) {
      setPreviewDoc(doc);
      setPreviewFile(null);
      return;
    }
    setPreviewDoc(doc);
    setPreviewFile(file);

    // Robust check for PDF and Images including extension check
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
    const isText =
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      /\.(txt|md|json|csv)$/i.test(file.name);

    if (isPdf || isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPreviewText(null);
    } else if (isText) {
      try {
        const text = await file.text();
        setPreviewText(text);
        setPreviewUrl(null);
      } catch (e) {
        console.error("Failed to read text file", e);
        setPreviewText("Error reading file content.");
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
      setPreviewText(null);
    }
  };

  if (!result) return null;

  return (
    <div className="flex flex-col h-full bg-gem-onyx overflow-hidden relative">
      {/* Datalist for folder paths */}
      <datalist id="folder-paths-list">
        {allFolderPaths.map((path) => (
          <option key={path} value={path} />
        ))}
      </datalist>

      <header className="flex-shrink-0 bg-gem-onyx border-b border-gem-mist p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gem-offwhite">
              Document Organization
            </h1>
            <p className="text-gem-offwhite/60 text-sm mt-1">
              Review, edit, and confirm the document taxonomy.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center px-4 py-2 border border-gem-mist hover:bg-gem-mist/20 rounded-lg text-gem-offwhite transition-colors text-sm font-medium"
              title="Download analysis as JSON"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors text-sm font-medium"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save & Commit
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Card */}
          <div className="bg-gem-slate rounded-xl p-6 shadow-sm border border-gem-mist/50">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🧠</span>
              <h2 className="text-lg font-semibold text-gem-offwhite">
                Analysis Summary
              </h2>
            </div>
            <p className="text-gem-offwhite leading-relaxed mb-4">
              {result.batch_summary}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gem-mist rounded-xl leading-5 bg-gem-slate shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gem-blue sm:text-sm transition-all text-gem-offwhite"
              placeholder="Filter documents by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Hierarchy Column */}
            <div className="lg:col-span-1 bg-gem-slate rounded-xl shadow-sm border border-gem-mist/50 flex flex-col h-[600px]">
              <div className="p-4 border-b border-gem-mist/50 bg-gem-mist/10 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gem-offwhite flex items-center">
                    <FolderIcon className="w-5 h-5 text-gem-blue mr-2" />
                    Structure Preview
                  </h2>
                  <p className="text-xs text-gem-offwhite/50 mt-1">
                    Interactive Directory Tree
                  </p>
                </div>
                <button
                  onClick={openCreateRootFolder}
                  className="p-2 bg-white hover:bg-gem-mist border border-gem-mist/50 rounded-lg shadow-sm text-gem-blue transition-colors"
                  title="Create New Root Folder"
                >
                  <PlusIcon />
                </button>
              </div>
              <div
                className="flex-grow overflow-y-auto p-2 custom-scrollbar transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleRootDrop}
              >
                {fileTree.length > 0 ? (
                  fileTree.map((node) => (
                    <FileTreeNode
                      key={node.id}
                      node={node}
                      actions={folderActions}
                      onFileDrop={handleFileDrop}
                      onFolderDrop={handleFolderDrop}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-gem-offwhite/50 text-sm h-full flex items-center justify-center border-2 border-dashed border-gem-mist/20 rounded">
                    {searchQuery
                      ? "No matching files in structure."
                      : "Drag files here to organize"}
                  </div>
                )}
              </div>
            </div>

            {/* Details & Metadata Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Detailed List */}
              <div className="bg-gem-slate rounded-xl shadow-sm border border-gem-mist/50 overflow-hidden">
                <div className="p-4 border-b border-gem-mist/50 bg-gem-mist/10 flex justify-between items-center">
                  <h2 className="font-bold text-gem-offwhite flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gem-teal mr-2" />
                    Review & Edit Documents
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gem-blue/10 text-gem-blue px-2 py-1 rounded-full font-medium">
                      {filteredDocs.length}{" "}
                      {filteredDocs.length === 1 ? "File" : "Files"}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-sm text-gem-offwhite">
                    <thead className="bg-gem-mist/20 text-xs font-semibold text-gem-offwhite/70 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-4 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              filteredDocs.length > 0 &&
                              selectedDocs.size === filteredDocs.length
                            }
                            onChange={toggleSelectAll}
                            className="rounded text-gem-blue focus:ring-gem-blue"
                          />
                        </th>
                        <th className="px-4 py-3">File Info</th>
                        <th className="px-4 py-3">Organization</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gem-mist/30">
                      {filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => {
                          // Find the actual index in the master list for editing state
                          const masterIndex = editableDocs.indexOf(doc);
                          const isEditing = editingIndex === masterIndex;

                          return isEditing && editForm ? (
                            // EDIT MODE ROW
                            <tr key={masterIndex} className="bg-blue-50/50">
                              <td className="px-4 py-4 align-top w-8">
                                <input
                                  type="checkbox"
                                  disabled
                                  className="opacity-50"
                                />
                              </td>
                              <td className="px-4 py-4 align-top w-1/3">
                                <div className="mb-2">
                                  <label
                                    htmlFor={`filename-${masterIndex}`}
                                    className="block text-xs font-bold text-gem-offwhite/60 mb-1"
                                  >
                                    Filename
                                  </label>
                                  <input
                                    id={`filename-${masterIndex}`}
                                    type="text"
                                    value={editForm.filename}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        filename: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white border border-gem-mist rounded px-2 py-1 text-sm focus:ring-2 focus:ring-gem-blue outline-none"
                                  />
                                </div>
                                <div className="mb-2">
                                  <label
                                    htmlFor={`version-${masterIndex}`}
                                    className="block text-xs font-bold text-gem-offwhite/60 mb-1"
                                  >
                                    Version
                                  </label>
                                  <input
                                    id={`version-${masterIndex}`}
                                    type="text"
                                    value={editForm.detected_version || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        detected_version: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white border border-gem-mist rounded px-2 py-1 text-xs focus:ring-2 focus:ring-gem-blue outline-none"
                                    placeholder="e.g. v1.0"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`keywords-${masterIndex}`}
                                    className="block text-xs font-bold text-gem-offwhite/60 mb-1"
                                  >
                                    Keywords
                                  </label>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {editForm.keywords.map((kw, k) => (
                                      <span
                                        key={k}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-gem-mist text-xs"
                                      >
                                        {kw}
                                        <button
                                          onClick={() => removeTag(kw)}
                                          className="ml-1 text-gem-offwhite/40 hover:text-red-500"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex gap-1">
                                    <input
                                      id={`keywords-${masterIndex}`}
                                      type="text"
                                      value={newTag}
                                      onChange={(e) =>
                                        setNewTag(e.target.value)
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(), addTag())
                                      }
                                      placeholder="New tag..."
                                      className="flex-grow bg-white border border-gem-mist rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-gem-blue"
                                    />
                                    <button
                                      onClick={addTag}
                                      type="button"
                                      className="px-2 py-1 bg-gem-mist hover:bg-gem-mist/80 rounded text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="mb-2">
                                  <label
                                    htmlFor={`folder-path-${masterIndex}`}
                                    className="block text-xs font-bold text-gem-offwhite/60 mb-1"
                                  >
                                    Folder Path
                                  </label>
                                  <input
                                    id={`folder-path-${masterIndex}`}
                                    type="text"
                                    value={editForm.suggested_path}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        suggested_path: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white border border-gem-mist rounded px-2 py-1 text-sm font-mono focus:ring-2 focus:ring-gem-blue outline-none"
                                    list="folder-paths-list"
                                  />
                                </div>
                                {editForm.possible_duplicates &&
                                  editForm.possible_duplicates.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                      {editForm.possible_duplicates.map(
                                        (dup, i) => (
                                          <div
                                            key={i}
                                            className="p-2 bg-red-50 border border-red-100 rounded text-xs text-red-800"
                                          >
                                            <div className="flex justify-between font-bold">
                                              <span>
                                                ⚠ Match found:{" "}
                                                {dup.existing_document}
                                              </span>
                                              <span>
                                                {dup.confidence_score}%
                                              </span>
                                            </div>
                                            <div className="text-red-700/80 mt-1">
                                              {dup.reason}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </td>
                              <td className="px-4 py-4 align-top text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={confirmEdit}
                                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    title="Save Changes"
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                                    title="Cancel"
                                  >
                                    <XMarkIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            // VIEW MODE ROW
                            <tr
                              key={masterIndex}
                              className={`hover:bg-gem-mist/5 transition-colors group ${selectedDocs.has(doc.filename) ? "bg-gem-blue/5" : ""}`}
                            >
                              <td className="px-4 py-3 align-top w-8">
                                <input
                                  type="checkbox"
                                  checked={selectedDocs.has(doc.filename)}
                                  onChange={() => toggleSelectDoc(doc.filename)}
                                  className="rounded text-gem-blue focus:ring-gem-blue cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 align-top max-w-[200px]">
                                <div className="flex items-center">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="font-medium text-gem-blue truncate mr-2 cursor-pointer focus:outline-none focus:underline"
                                    title={doc.filename}
                                    onClick={() => handlePreview(doc)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        handlePreview(doc);
                                      }
                                    }}
                                  >
                                    {doc.filename}
                                  </div>
                                  {!doc.possible_duplicates?.length && (
                                    <span className="flex-shrink-0 text-[10px] bg-green-100 text-green-700 px-1.5 rounded-sm font-bold uppercase tracking-wider border border-green-200">
                                      New
                                    </span>
                                  )}
                                </div>
                                {doc.detected_version && (
                                  <span
                                    className="inline-block mt-0.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-sm font-mono"
                                    title="Detected Version"
                                  >
                                    {doc.detected_version}
                                  </span>
                                )}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {doc.keywords.slice(0, 3).map((kw, k) => (
                                    <span
                                      key={k}
                                      className="inline-block px-2 py-0.5 rounded-md bg-gem-mist/30 text-gem-offwhite/80 text-[10px] border border-gem-mist/30"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                  {doc.keywords.length > 3 && (
                                    <span className="text-[10px] text-gem-offwhite/40 px-1 py-0.5">
                                      +{doc.keywords.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="text-gem-offwhite/80 text-xs font-mono bg-gem-mist/20 px-2 py-1 rounded inline-block mb-1">
                                  /{doc.suggested_path}
                                </div>
                                {doc.possible_duplicates &&
                                  doc.possible_duplicates.length > 0 && (
                                    <div className="mt-1 space-y-2">
                                      {doc.possible_duplicates.map((dup, i) => (
                                        <div
                                          key={i}
                                          className={`text-[10px] px-2 py-1.5 rounded border flex flex-col gap-1 ${
                                            dup.confidence_score > 80
                                              ? "bg-red-50 border-red-200 text-red-800"
                                              : "bg-orange-50 border-orange-200 text-orange-800"
                                          }`}
                                          title={dup.reason}
                                        >
                                          <div className="flex justify-between items-center w-full">
                                            <span className="font-bold flex items-center">
                                              ⚠ {dup.confidence_score}% Match
                                            </span>
                                            <span
                                              className="truncate max-w-[120px] ml-1 font-medium opacity-80"
                                              title={dup.existing_document}
                                            >
                                              {dup.existing_document}
                                            </span>
                                          </div>
                                          <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${dup.confidence_score > 85 ? "bg-red-600" : "bg-orange-500"}`}
                                              style={{
                                                width: `${dup.confidence_score}%`,
                                              }}
                                            />
                                          </div>
                                          <div className="text-[9px] opacity-90 leading-tight">
                                            {dup.reason}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </td>
                              <td className="px-4 py-3 align-top text-right">
                                <div className="flex justify-end space-x-1">
                                  {(doc.possible_duplicates.length > 0 ||
                                    doc.detected_version) && (
                                    <button
                                      onClick={() =>
                                        setHistoryModal({ isOpen: true, doc })
                                      }
                                      className="p-1.5 text-gem-offwhite/40 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                      title="View Version History"
                                    >
                                      <HistoryIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handlePreview(doc)}
                                    className="p-1.5 text-gem-offwhite/40 hover:text-gem-blue hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Preview Content"
                                  >
                                    <EyeIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => startEdit(doc)}
                                    className="p-1.5 text-gem-offwhite/40 hover:text-gem-blue hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Edit Document Info"
                                  >
                                    <EditIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-gem-offwhite/50"
                          >
                            No documents match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hierarchy Changes */}
                <div className="bg-gem-slate rounded-xl shadow-sm border border-gem-mist/50 overflow-hidden">
                  <div className="p-3 border-b border-gem-mist/50 bg-gem-mist/10">
                    <h3 className="font-bold text-sm text-gem-offwhite">
                      System Logic
                    </h3>
                  </div>
                  <div className="p-4 text-sm text-gem-offwhite/80 leading-relaxed h-full bg-gem-onyx/30">
                    {result.proposed_hierarchy_changes ||
                      "No structural changes recommended."}
                  </div>
                </div>

                {/* Archive Recommendations */}
                <div className="bg-gem-slate rounded-xl shadow-sm border border-gem-mist/50 overflow-hidden">
                  <div className="p-3 border-b border-gem-mist/50 bg-red-50/50">
                    <h3 className="font-bold text-sm text-red-700 flex items-center">
                      <TrashIcon />
                      <span className="ml-2">Clean-up Suggestions</span>
                    </h3>
                  </div>
                  <div className="p-4">
                    {result.archive_recommendations &&
                    result.archive_recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {result.archive_recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center text-sm p-2 bg-red-50 rounded border border-red-100"
                          >
                            <span className="truncate text-red-900 font-medium">
                              {rec}
                            </span>
                            <button className="text-xs text-red-600 hover:text-red-800 font-bold px-2">
                              ARCHIVE
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6 text-gem-offwhite/40 text-sm">
                        <div className="text-2xl mb-2">✨</div>
                        No outdated files detected.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Action Bar */}
      {selectedDocs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-gem-mist rounded-full py-3 px-6 z-40 flex items-center space-x-4 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold text-gem-offwhite">
            {selectedDocs.size} Selected
          </span>
          <div className="h-4 w-px bg-gem-mist"></div>
          <button
            onClick={() =>
              setBulkEditModal({
                isOpen: true,
                path: "",
                addKeywords: "",
                version: "",
              })
            }
            className="text-sm font-medium text-gem-blue hover:text-blue-700 flex items-center"
          >
            <EditIcon className="w-4 h-4 mr-1.5" /> Bulk Edit
          </button>
          <button
            onClick={() => setSelectedDocs(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Folder Management Modal */}
      {folderModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm focus:outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape")
              setFolderModal({ ...folderModal, isOpen: false });
          }}
          onClick={() => setFolderModal({ ...folderModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {folderModal.type === "create"
                  ? "Create New Folder"
                  : folderModal.type === "rename"
                    ? "Rename Folder"
                    : "Move Folder"}
              </h3>
              <button
                onClick={() =>
                  setFolderModal({ ...folderModal, isOpen: false })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFolderSubmit} className="p-4">
              <div className="mb-4">
                <label
                  htmlFor="folder-modal-input"
                  className="block text-xs font-bold text-gray-500 uppercase mb-2"
                >
                  {folderModal.type === "move"
                    ? "Destination Folder"
                    : "Folder Name"}
                </label>

                {folderModal.type === "move" ? (
                  <select
                    id="folder-modal-input"
                    value={folderModal.value}
                    onChange={(e) =>
                      setFolderModal({ ...folderModal, value: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-gem-blue outline-none bg-white"
                  >
                    <option value="">(Root)</option>
                    {allFolderPaths
                      // Don't show the folder itself or its children as destination
                      .filter(
                        (p) =>
                          folderModal.targetNode &&
                          p !== folderModal.targetNode.path &&
                          !p.startsWith(folderModal.targetNode.path + "/")
                      )
                      .sort()
                      .map((path) => (
                        <option key={path} value={path}>
                          {path}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    id="folder-modal-input"
                    ref={folderInputRef}
                    type="text"
                    value={folderModal.value}
                    onChange={(e) =>
                      setFolderModal({ ...folderModal, value: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-gem-blue outline-none"
                    placeholder="Enter name..."
                  />
                )}

                {folderModal.type === "move" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Select the new parent folder for &quot;
                    {folderModal.targetNode?.name}&quot;.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFolderModal({ ...folderModal, isOpen: false })
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gem-blue hover:bg-blue-600 rounded-lg shadow transition-colors"
                >
                  {folderModal.type === "create"
                    ? "Create"
                    : folderModal.type === "move"
                      ? "Move"
                      : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.isOpen && historyModal.doc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm focus:outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape")
              setHistoryModal({ isOpen: false, doc: null });
          }}
          onClick={() => setHistoryModal({ isOpen: false, doc: null })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden cursor-default"
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center">
                <HistoryIcon className="w-5 h-5 mr-2 text-purple-500" />
                Version History
              </h3>
              <button
                onClick={() => setHistoryModal({ isOpen: false, doc: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-purple-200 ml-3 space-y-8">
                {/* Current Node */}
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-purple-500 ring-4 ring-white"></span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">
                      {historyModal.doc.filename}
                    </span>
                    <span className="text-xs font-mono text-purple-600 mt-1 bg-purple-50 inline-block px-1.5 py-0.5 rounded w-max">
                      {historyModal.doc.detected_version || "Latest Detected"}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Currently being organized. This is considered the primary
                      version.
                    </p>
                  </div>
                </div>

                {/* Duplicates / Previous Nodes */}
                {historyModal.doc.possible_duplicates.map((dup, idx) => (
                  <div key={idx} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-gray-300 ring-4 ring-white"></span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600">
                        {dup.existing_document}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Existing Document
                      </span>
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-xs text-gray-600">
                        <div className="font-medium mb-1">
                          Reason for match ({dup.confidence_score}%):
                        </div>
                        {dup.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setHistoryModal({ isOpen: false, doc: null })}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm focus:outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape")
              setBulkEditModal({ ...bulkEditModal, isOpen: false });
          }}
          onClick={() => setBulkEditModal({ ...bulkEditModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden cursor-default"
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center">
                <EditIcon className="w-5 h-5 mr-2 text-gem-blue" />
                Bulk Edit ({selectedDocs.size} Items)
              </h3>
              <button
                onClick={() =>
                  setBulkEditModal({
                    isOpen: false,
                    path: "",
                    addKeywords: "",
                    version: "",
                  })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="bulk-path"
                  className="block text-xs font-bold text-gray-500 uppercase mb-2"
                >
                  Set Folder Path (Overwrite)
                </label>
                <input
                  id="bulk-path"
                  type="text"
                  value={bulkEditModal.path}
                  onChange={(e) =>
                    setBulkEditModal({ ...bulkEditModal, path: e.target.value })
                  }
                  list="folder-paths-list"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gem-blue outline-none"
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div>
                <label
                  htmlFor="bulk-keywords"
                  className="block text-xs font-bold text-gray-500 uppercase mb-2"
                >
                  Add Keywords (Comma separated)
                </label>
                <input
                  id="bulk-keywords"
                  type="text"
                  value={bulkEditModal.addKeywords}
                  onChange={(e) =>
                    setBulkEditModal({
                      ...bulkEditModal,
                      addKeywords: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gem-blue outline-none"
                  placeholder="e.g. Protocol, urgent, review"
                />
              </div>
              <div>
                <label
                  htmlFor="bulk-version"
                  className="block text-xs font-bold text-gray-500 uppercase mb-2"
                >
                  Set Version (Overwrite)
                </label>
                <input
                  id="bulk-version"
                  type="text"
                  value={bulkEditModal.version}
                  onChange={(e) =>
                    setBulkEditModal({
                      ...bulkEditModal,
                      version: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gem-blue outline-none"
                  placeholder="Leave empty to keep existing"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() =>
                  setBulkEditModal({
                    isOpen: false,
                    path: "",
                    addKeywords: "",
                    version: "",
                  })
                }
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEditSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-gem-blue hover:bg-blue-600 rounded-lg shadow transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm focus:outline-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape")
              setConfirmModal({ ...confirmModal, isOpen: false });
          }}
          onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">{confirmModal.title}</h3>
            </div>
            <div className="p-4 text-sm text-gray-600 leading-relaxed">
              {confirmModal.message}
            </div>
            <div className="flex justify-end gap-2 p-4 bg-gray-50">
              <button
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-gem-blue hover:bg-blue-600 rounded-lg shadow transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm focus:outline-none"
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          onClick={closePreview}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePreview();
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden outline-none cursor-default"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
            tabIndex={-1}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3
                  id="preview-modal-title"
                  className="text-lg font-bold text-gray-800"
                >
                  {previewDoc.filename}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  /{previewDoc.suggested_path}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gem-blue"
                aria-label="Close preview"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-grow bg-gray-100 overflow-auto flex items-center justify-center relative">
              {previewUrl ? (
                previewFile?.type === "application/pdf" ||
                previewDoc.filename.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : previewText !== null ? (
                <pre className="w-full h-full p-4 overflow-auto text-sm font-mono whitespace-pre-wrap bg-white text-gray-800">
                  {previewText}
                </pre>
              ) : (
                <div className="text-center p-8 max-w-md">
                  <div className="text-6xl mb-4">📄</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">
                    Preview Unavailable
                  </h4>
                  <p className="text-gray-500 mb-6">
                    This file type ({previewFile?.type || "unknown"}) cannot be
                    previewed directly in the browser. Please rely on the AI
                    summary below.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left">
                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">
                      AI Summary
                    </h5>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {previewDoc.short_summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with summary (always visible if not covering full preview) */}
            {(previewUrl || previewText) && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">
                  AI Summary
                </h4>
                <p className="text-sm text-gray-700">
                  {previewDoc.short_summary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationResultView;
