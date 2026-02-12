import React, { useState, useEffect } from "react";
import { useLoading } from "@/context/LoadingContext";
import {
  organizeData,
  reorganizeWithInstruction,
  type Item,
  type OrganizedData,
} from "@/services/intelligentIdeasService";
import { LightbulbIcon } from "@/components/icons/LightbulbIcon";
import { ListTodoIcon } from "@/components/icons/ListTodoIcon";
import { BookmarkCheckIcon } from "@/components/icons/BookmarkCheckIcon";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { Trash2Icon } from "@/components/icons/Trash2Icon";
import { RefreshCwIcon } from "@/components/icons/RefreshCwIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { ChevronUpIcon } from "@/components/icons/ChevronUpIcon";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import {
  loadBoards,
  clearBoards,
  persistBoard,
} from "@/services/intelligentIdeasStorage";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";

const IntelligentIdeasBoardPage = () => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedData, setOrganizedData] = useState<OrganizedData | null>(
    null,
  );
  const [allInputs, setAllInputs] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState("content");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const { setIsLoading: setGlobalLoading } = useLoading();

  // Load history on mount
  useEffect(() => {
    loadBoards()
      .then((boards) => {
        if (boards.length > 0) {
          // Restore the most recent board
          const latest = boards[0];
          setAllInputs(latest.inputs);
          setOrganizedData(latest.organizedData);
        }
      })
      .catch(console.error);
  }, []);

  const processInput = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    if (inputMode === "instruction") {
      if (!organizedData) {
        alert(
          "Please add some content first before giving organizational instructions.",
        );
        setIsProcessing(false);
        return;
      }

      setGlobalLoading(true);
      try {
        const reorganized = await reorganizeWithInstruction(
          inputText,
          organizedData,
          allInputs,
        );
        setOrganizedData(reorganized);
        setInputText("");
      } catch (error) {
        console.error("Error applying instruction:", error);
        alert(
          "Sorry, there was an error applying your instruction. Please try again.",
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
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Error processing input:", error);
      alert(
        "Sorry, there was an error organizing your thoughts. Please try again.",
      );
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const clearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear everything? This cannot be undone.",
      )
    ) {
      setAllInputs([]);
      setOrganizedData(null);
      setInputText("");
      setExpandedCategories({});
      clearBoards().catch(console.error);
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
                  : item,
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
    <div className="min-h-screen bg-aura-bg p-5 md:p-10 font-sans text-aura-text-primary">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <SparklesIcon className="h-8 w-8 text-aura-accent" />
            <h1 className="text-4xl font-bold m-0 text-white bg-clip-text text-transparent bg-gradient-to-r from-aura-accent to-purple-400 drop-shadow-sm">
              Intelligent Ideas Board
            </h1>
          </div>
          <p className="text-base text-aura-text-secondary m-0 max-w-[600px] mx-auto">
            Drop your thoughts here—stream of consciousness, random ideas,
            tasks, anything. I’ll organize it all intelligently.
          </p>
        </header>

        <AuraCard variant="elevated" padding="lg" className="mb-8">
          <div className="mb-4 flex gap-2">
            <AuraButton
              size="sm"
              variant={inputMode === "content" ? "accent" : "ghost"}
              onClick={() => setInputMode("content")}
              icon={<SparklesIcon className="h-4 w-4" />}
            >
              Add Content
            </AuraButton>
            <AuraButton
              size="sm"
              variant={inputMode === "instruction" ? "accent" : "ghost"}
              onClick={() => setInputMode("instruction")}
              icon={<SettingsIcon className="h-4 w-4" />}
            >
              Give Instruction
            </AuraButton>
          </div>

          <AuraInput
            type="textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                processInput();
              }
            }}
            placeholder={
              inputMode === "content"
                ? "Just start typing... anything that's on your mind. Ideas, tasks, things to remember. I’ll figure out how it all fits together."
                : "Give an instruction on how to reorganize your data. Examples: 'Split work items into separate categories by project', 'Group all urgent tasks together', 'Organize ideas by theme'"
            }
            className={`min-h-[120px] mb-4 ${
              inputMode === "instruction"
                ? "border-aura-accent/50 bg-aura-accent/5"
                : ""
            }`}
          />

          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="text-sm text-aura-text-secondary">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-aura-surface-elevated rounded text-xs font-mono border border-aura-border">
                Ctrl+Enter
              </kbd>{" "}
              to {inputMode === "content" ? "add" : "apply"}
            </div>
            <div className="flex gap-3">
              {organizedData && (
                <>
                  <AuraButton
                    variant="secondary"
                    onClick={reprocess}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    icon={<RefreshCwIcon className="h-4 w-4" />}
                  >
                    Reorganize
                  </AuraButton>
                  <AuraButton
                    variant="danger"
                    onClick={clearAll}
                    icon={<Trash2Icon className="h-4 w-4" />}
                  >
                    Clear All
                  </AuraButton>
                </>
              )}
              <AuraButton
                variant={inputMode === "instruction" ? "accent" : "primary"}
                onClick={processInput}
                disabled={isProcessing || !inputText.trim()}
                isLoading={isProcessing}
                className="shadow-lg"
              >
                {inputMode === "content"
                  ? "Add & Organize"
                  : "Apply Instruction"}
              </AuraButton>
            </div>
          </div>
        </AuraCard>

        {organizedData && (
          <div>
            {organizedData.summary && (
              <AuraCard
                variant="glass"
                padding="md"
                className="mb-6 border-l-4 border-l-aura-accent"
              >
                <div className="text-sm font-semibold text-aura-accent mb-2 uppercase tracking-wide">
                  Overview
                </div>
                <div className="text-base text-aura-text-primary leading-relaxed">
                  {organizedData.summary}
                </div>
              </AuraCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {organizedData.categories.map((category, catIndex) => {
                const activeItems = getActiveItems(category.items);
                const completedItems = getCompletedItems(category.items);
                const isExpanded = expandedCategories[category.id];

                return (
                  <AuraCard
                    key={category.id || catIndex}
                    variant="elevated"
                    padding="md"
                    className="h-fit"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="text-aura-accent">
                        {getTypeIcon(category.type)}
                      </div>
                      <h3 className="m-0 text-lg font-semibold text-aura-text-primary">
                        {category.name}
                      </h3>
                      <div className="ml-auto text-xs px-2.5 py-1 bg-aura-surface-elevated rounded-xl text-aura-text-secondary font-medium">
                        {activeItems.length}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {activeItems.map((item, itemIndex) => (
                        <div
                          key={item.id || itemIndex}
                          className={`p-3.5 bg-aura-bg/50 rounded-lg border-l-[3px] transition-colors duration-200 relative border-${getPriorityColorName(item.priority)}-500`}
                        >
                          <div className="flex gap-2.5 items-start">
                            <button
                              onClick={() =>
                                toggleItemCompletion(category.id, item.id)
                              }
                              className="min-w-[20px] w-5 h-5 rounded-md border-2 border-aura-border bg-aura-surface cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:border-aura-accent"
                            ></button>

                            <div className="flex-1">
                              <div
                                className={`text-[15px] text-aura-text-primary leading-normal ${
                                  item.dueDate || item.relatedInputs
                                    ? "mb-2"
                                    : "mb-0"
                                }`}
                              >
                                {item.content}
                              </div>

                              <div className="flex gap-3 flex-wrap items-center">
                                {item.dueDate && (
                                  <div className="text-[13px] text-aura-text-secondary flex items-center gap-1 px-2 py-0.5 bg-aura-surface rounded-md font-medium">
                                    📅 {formatDate(item.dueDate)}
                                  </div>
                                )}

                                {item.priority && (
                                  <div
                                    className={`text-[11px] uppercase font-semibold tracking-wider px-2 py-0.5 bg-aura-surface rounded-md text-${getPriorityColorName(item.priority)}-500`}
                                  >
                                    {item.priority}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteItem(category.id, item.id)}
                              className="min-w-[24px] w-6 h-6 rounded-md border-none bg-transparent text-aura-text-secondary cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:text-red-500 hover:bg-red-500/10"
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
                          className="w-full p-2.5 rounded-lg border border-dashed border-aura-border bg-transparent text-aura-text-secondary text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-aura-surface-elevated hover:text-aura-text-primary"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                          {completedItems.length} Completed
                        </button>

                        {isExpanded && (
                          <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-aura-border">
                            {completedItems.map((item, itemIndex) => (
                              <div
                                key={item.id || `completed-${itemIndex}`}
                                className="p-3.5 bg-aura-bg/30 rounded-lg border-l-[3px] border-aura-border opacity-60 relative"
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
                                    <div className="text-[15px] text-aura-text-primary leading-normal line-through">
                                      {item.content}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      deleteItem(category.id, item.id)
                                    }
                                    className="min-w-[24px] w-6 h-6 rounded-md border-none bg-transparent text-aura-text-secondary cursor-pointer flex items-center justify-center transition-all mt-0.5 hover:text-red-500 hover:bg-red-500/10"
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
                  </AuraCard>
                );
              })}
            </div>
          </div>
        )}

        {!organizedData && !isProcessing && (
          <AuraCard
            variant="glass"
            padding="lg"
            className="text-center p-[60px_40px]"
          >
            <SparklesIcon className="h-12 w-12 text-aura-accent mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-aura-text-primary mb-3">
              Your organized board will appear here
            </h3>
            <p className="text-base text-aura-text-secondary max-w-[500px] mx-auto">
              Start by typing any thought, idea, or task above. I’ll
              automatically organize everything into categories, extract to-dos,
              and keep track of what’s important.
            </p>
          </AuraCard>
        )}
      </div>
    </div>
  );
};

export default IntelligentIdeasBoardPage;
