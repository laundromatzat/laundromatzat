import React, { useState, useEffect } from "react";
import { useLoading } from "../context/LoadingContext";
import {
  organizeData,
  reorganizeWithInstruction,
  type Item,
  type OrganizedData,
} from "../services/intelligentIdeasService";
import { LightbulbIcon } from "../components/icons/LightbulbIcon";
import { ListTodoIcon } from "../components/icons/ListTodoIcon";
import { BookmarkCheckIcon } from "../components/icons/BookmarkCheckIcon";
import { SparklesIcon } from "../components/icons/SparklesIcon";
import { Trash2Icon } from "../components/icons/Trash2Icon";
import { RefreshCwIcon } from "../components/icons/RefreshCwIcon";
import { CheckIcon } from "../components/icons/CheckIcon";
import { ChevronDownIcon } from "../components/icons/ChevronDownIcon";
import { ChevronUpIcon } from "../components/icons/ChevronUpIcon";
import { SettingsIcon } from "../components/icons/SettingsIcon";
import { persistBoard, loadBoards } from "../services/intelligentIdeasStorage";

const IntelligentIdeasBoardPage = () => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedData, setOrganizedData] = useState<OrganizedData | null>(
    null
  );
  const [allInputs, setAllInputs] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState("content");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const { setIsLoading: setGlobalLoading } = useLoading();

  // Load history on mount (ready for history panel)
  useEffect(() => {
    loadBoards().catch(console.error);
  }, []);

  const processInput = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    if (inputMode === "instruction") {
      if (!organizedData) {
        alert(
          "Please add some content first before giving organizational instructions."
        );
        setIsProcessing(false);
        return;
      }

      setGlobalLoading(true);
      try {
        const reorganized = await reorganizeWithInstruction(
          inputText,
          organizedData,
          allInputs
        );
        setOrganizedData(reorganized);
        setInputText("");
      } catch (error) {
        console.error("Error applying instruction:", error);
        alert(
          "Sorry, there was an error applying your instruction. Please try again."
        );
      } finally {
        setIsProcessing(false);
        setGlobalLoading(false);
      }
      return;
    }

    const newInputs = [...allInputs, inputText];
    setAllInputs(newInputs);

    setGlobalLoading(true);
    try {
      const organized = await organizeData(newInputs);
      setOrganizedData(organized);
      setInputText("");

      // Save to storage after successful organization
      await persistBoard({
        id: `board-${Date.now()}`,
        inputs: newInputs,
        organizedData: organized,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error processing input:", error);
      alert(
        "Sorry, there was an error organizing your thoughts. Please try again."
      );
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      processInput();
    }
  };

  const clearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear everything? This cannot be undone."
      )
    ) {
      setAllInputs([]);
      setOrganizedData(null);
      setInputText("");
      setExpandedCategories({});
    }
  };

  const reprocess = async () => {
    if (allInputs.length === 0) return;

    setIsProcessing(true);
    setGlobalLoading(true);
    try {
      const organized = await organizeData(allInputs);
      setOrganizedData(organized);
    } catch (error) {
      console.error("Error reprocessing:", error);
      alert("Sorry, there was an error reorganizing. Please try again.");
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const toggleItemCompletion = (categoryId: string, itemId: string) => {
    setOrganizedData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map((cat) => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            };
          }
          return cat;
        }),
      };
    });
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setOrganizedData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories
          .map((cat) => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                items: cat.items.filter((item) => item.id !== itemId),
              };
            }
            return cat;
          })
          .filter((cat) => cat.items.length > 0),
      };
    });
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "todos":
        return <ListTodoIcon className="h-5 w-5" />;
      case "ideas":
        return <LightbulbIcon className="h-5 w-5" />;
      case "facts":
        return <BookmarkCheckIcon className="h-5 w-5" />;
      default:
        return <SparklesIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColorName = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "amber";
      case "low":
        return "emerald";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getActiveItems = (items: Item[]) =>
    items.filter((item) => !item.completed);
  const getCompletedItems = (items: Item[]) =>
    items.filter((item) => item.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-5 md:p-10 text-gray-800 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <SparklesIcon className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold m-0 text-white drop-shadow-sm">
              Intelligent Ideas Board
            </h1>
          </div>
          <p className="text-base text-white/90 m-0 max-w-[600px] mx-auto">
            Drop your thoughts here—stream of consciousness, random ideas,
            tasks, anything. I’ll organize it all intelligently.
          </p>
        </header>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}
        >
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setInputMode("content")}
              className={`px-4 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                inputMode === "content"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <SparklesIcon className="h-4 w-4" />
              Add Content
            </button>
            <button
              onClick={() => setInputMode("instruction")}
              className={`px-4 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                inputMode === "instruction"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              Give Instruction
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              inputMode === "content"
                ? "Just start typing... anything that's on your mind. Ideas, tasks, things to remember. I’ll figure out how it all fits together."
                : "Give an instruction on how to reorganize your data. Examples: 'Split work items into separate categories by project', 'Group all urgent tasks together', 'Organize ideas by theme'"
            }
            className={`w-full min-h-[120px] p-4 border-2 rounded-xl text-base font-inherit resize-y outline-none transition-colors duration-200 mb-4 ${
              inputMode === "instruction"
                ? "border-amber-500 bg-amber-50 focus:border-amber-500"
                : "border-gray-200 bg-white focus:border-indigo-500"
            }`}
          />

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Press{" "}
              <kbd
                style={{
                  padding: "2px 6px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                Ctrl+Enter
              </kbd>{" "}
              to {inputMode === "content" ? "add" : "apply"}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {organizedData && (
                <>
                  <button
                    onClick={reprocess}
                    disabled={isProcessing}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "2px solid #667eea",
                      backgroundColor: "white",
                      color: "#667eea",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      opacity: isProcessing ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Reorganize
                  </button>
                  <button
                    onClick={clearAll}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "2px solid #ef4444",
                      backgroundColor: "white",
                      color: "#ef4444",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Clear All
                  </button>
                </>
              )}
              <button
                onClick={processInput}
                disabled={isProcessing || !inputText.trim()}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    inputMode === "instruction"
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor:
                    isProcessing || !inputText.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: isProcessing || !inputText.trim() ? 0.6 : 1,
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                }}
              >
                {isProcessing
                  ? "Processing..."
                  : inputMode === "content"
                    ? "Add & Organize"
                    : "Apply Instruction"}
              </button>
            </div>
          </div>
        </div>

        {organizedData && (
          <div>
            {organizedData.summary && (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  marginBottom: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  borderLeft: "4px solid #667eea",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#667eea",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Overview
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#4b5563",
                    lineHeight: "1.6",
                  }}
                >
                  {organizedData.summary}
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "24px",
              }}
            >
              {organizedData.categories.map((category, catIndex) => {
                const activeItems = getActiveItems(category.items);
                const completedItems = getCompletedItems(category.items);
                const isExpanded = expandedCategories[category.id];

                return (
                  <div
                    key={category.id || catIndex}
                    className="bg-white rounded-2xl p-6 shadow-lg transition-transform hover:shadow-xl"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="text-indigo-500">
                        {getTypeIcon(category.type)}
                      </div>
                      <h3 className="m-0 text-lg font-semibold text-gray-800">
                        {category.name}
                      </h3>
                      <div className="ml-auto text-xs px-2.5 py-1 bg-gray-100 rounded-xl text-gray-500 font-medium">
                        {activeItems.length}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {activeItems.map((item, itemIndex) => (
                        <div
                          key={item.id || itemIndex}
                          className={`p-3.5 bg-gray-50 rounded-lg border-l-[3px] transition-colors duration-200 relative border-${getPriorityColorName(item.priority)}-500`}
                        >
                          <div className="flex gap-2.5 items-start">
                            <button
                              onClick={() =>
                                toggleItemCompletion(category.id, item.id)
                              }
                              className="min-w-[20px] w-5 h-5 rounded-md border-2 border-gray-300 bg-white cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:border-indigo-500"
                            ></button>

                            <div className="flex-1">
                              <div
                                className={`text-[15px] text-gray-800 leading-normal ${
                                  item.dueDate || item.relatedInputs
                                    ? "mb-2"
                                    : "mb-0"
                                }`}
                              >
                                {item.content}
                              </div>

                              <div className="flex gap-3 flex-wrap items-center">
                                {item.dueDate && (
                                  <div className="text-[13px] text-gray-500 flex items-center gap-1 px-2 py-0.5 bg-white rounded-md font-medium">
                                    📅 {formatDate(item.dueDate)}
                                  </div>
                                )}

                                {item.priority && (
                                  <div
                                    className={`text-[11px] uppercase font-semibold tracking-wider px-2 py-0.5 bg-white rounded-md text-${getPriorityColorName(item.priority)}-500`}
                                  >
                                    {item.priority}
                                  </div>
                                )}

                                {item.relatedInputs &&
                                  item.relatedInputs.length > 0 && (
                                    <div className="text-xs text-gray-400 italic">
                                      From inputs:{" "}
                                      {item.relatedInputs.join(", ")}
                                    </div>
                                  )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteItem(category.id, item.id)}
                              className="min-w-[24px] w-6 h-6 rounded-md border-none bg-transparent text-gray-400 cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {completedItems.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleCategoryExpanded(category.id)}
                          className="w-full p-2.5 rounded-lg border border-dashed border-gray-300 bg-transparent text-gray-500 text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-gray-50 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                          {completedItems.length} Completed
                        </button>

                        {isExpanded && (
                          <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-gray-200">
                            {completedItems.map((item, itemIndex) => (
                              <div
                                key={item.id || `completed-${itemIndex}`}
                                className="p-3.5 bg-gray-50 rounded-lg border-l-[3px] border-gray-300 opacity-60 relative"
                              >
                                <div className="flex gap-2.5 items-start">
                                  <button
                                    onClick={() =>
                                      toggleItemCompletion(category.id, item.id)
                                    }
                                    className="min-w-[20px] w-5 h-5 rounded-md border-2 border-emerald-500 bg-emerald-500 cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:opacity-90"
                                  >
                                    <CheckIcon
                                      className="h-4 w-4 text-white"
                                      strokeWidth={3}
                                    />
                                  </button>

                                  <div className="flex-1">
                                    <div className="text-[15px] text-gray-800 leading-normal line-through">
                                      {item.content}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      deleteItem(category.id, item.id)
                                    }
                                    className="min-w-[24px] w-6 h-6 rounded-md border-none bg-transparent text-gray-400 cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2Icon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!organizedData && !isProcessing && (
          <div className="bg-white/90 rounded-2xl p-[60px_40px] text-center shadow-lg">
            <SparklesIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              Your organized board will appear here
            </h3>
            <p className="text-base text-gray-500 max-w-[500px] mx-auto">
              Start by typing any thought, idea, or task above. I’ll
              automatically organize everything into categories, extract to-dos,
              and keep track of what’s important.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentIdeasBoardPage;
