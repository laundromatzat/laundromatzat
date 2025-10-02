
import React, { useState } from 'react';
import { organizeData, reorganizeWithInstruction, OrganizedData } from '../services/intelligentIdeasService';
import { LightbulbIcon } from '../components/icons/LightbulbIcon';
import { ListTodoIcon } from '../components/icons/ListTodoIcon';
import { BookmarkCheckIcon } from '../components/icons/BookmarkCheckIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Trash2Icon } from '../components/icons/Trash2Icon';
import { RefreshCwIcon } from '../components/icons/RefreshCwIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { ChevronUpIcon } from '../components/icons/ChevronUpIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';

const IntelligentIdeasBoardPage = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedData, setOrganizedData] = useState<OrganizedData | null>(null);
  const [allInputs, setAllInputs] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState('content');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const processInput = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    if (inputMode === 'instruction') {
      if (!organizedData) {
        alert("Please add some content first before giving organizational instructions.");
        setIsProcessing(false);
        return;
      }

      try {
        const reorganized = await reorganizeWithInstruction(inputText, organizedData, allInputs);
        setOrganizedData(reorganized);
        setInputText('');
      } catch (error) {
        console.error('Error applying instruction:', error);
        alert("Sorry, there was an error applying your instruction. Please try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const newInputs = [...allInputs, inputText];
    setAllInputs(newInputs);

    try {
      const organized = await organizeData(newInputs);
      setOrganizedData(organized);
      setInputText('');
    } catch (error) {
      console.error("Error processing input:", error);
      alert("Sorry, there was an error organizing your thoughts. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      processInput();
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear everything? This cannot be undone.')) {
      setAllInputs([]);
      setOrganizedData(null);
      setInputText('');
      setExpandedCategories({});
    }
  };

  const reprocess = async () => {
    if (allInputs.length === 0) return;
    
    setIsProcessing(true);
    try {
      const organized = await organizeData(allInputs);
      setOrganizedData(organized);
    } catch (error) {
      console.error("Error reprocessing:", error);
      alert("Sorry, there was an error reorganizing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemCompletion = (categoryId: string, itemId: string) => {
    setOrganizedData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            categories: prev.categories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        items: cat.items.map(item => 
                            item.id === itemId ? { ...item, completed: !item.completed } : item
                        )
                    };
                }
                return cat;
            })
        }
    });
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setOrganizedData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            categories: prev.categories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        items: cat.items.filter(item => item.id !== itemId)
                    };
                }
                return cat;
            }).filter(cat => cat.items.length > 0)
        }
    });
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'todos': return <ListTodoIcon className="h-5 w-5" />;
      case 'ideas': return <LightbulbIcon className="h-5 w-5" />;
      case 'facts': return <BookmarkCheckIcon className="h-5 w-5" />;
      default: return <SparklesIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActiveItems = (items: any[]) => items.filter(item => !item.completed);
  const getCompletedItems = (items: any[]) => items.filter(item => item.completed);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      color: '#1f2937'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <SparklesIcon className="h-8 w-8 text-white" />
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '700', 
              margin: '0',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Intelligent Ideas Board
            </h1>
          </div>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: '0', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Drop your thoughts here—stream of consciousness, random ideas, tasks, anything. 
            I'll organize it all intelligently.
          </p>
        </header>

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setInputMode('content')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: inputMode === 'content' ? '#667eea' : '#f3f4f6',
                color: inputMode === 'content' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SparklesIcon className="h-4 w-4" />
              Add Content
            </button>
            <button
              onClick={() => setInputMode('instruction')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: inputMode === 'instruction' ? '#667eea' : '#f3f4f6',
                color: inputMode === 'instruction' ? 'white' : '#6b7280',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SettingsIcon className="h-4 w-4" />
              Give Instruction
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={inputMode === 'content' 
              ? "Just start typing... anything that's on your mind. Ideas, tasks, things to remember. I'll figure out how it all fits together."
              : "Give an instruction on how to reorganize your data. Examples: 'Split work items into separate categories by project', 'Group all urgent tasks together', 'Organize ideas by theme'"
            }
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '16px',
              border: `2px solid ${inputMode === 'instruction' ? '#f59e0b' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '16px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
              marginBottom: '16px',
              backgroundColor: inputMode === 'instruction' ? '#fffbeb' : 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = inputMode === 'instruction' ? '#f59e0b' : '#667eea'}
            onBlur={(e) => e.target.style.borderColor = inputMode === 'instruction' ? '#f59e0b' : '#e5e7eb'}
          />
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Press <kbd style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>Ctrl+Enter</kbd> to {inputMode === 'content' ? 'add' : 'apply'}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {organizedData && (
                <>
                  <button
                    onClick={reprocess}
                    disabled={isProcessing}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: '2px solid #667eea',
                      backgroundColor: 'white',
                      color: '#667eea',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Reorganize
                  </button>
                  <button
                    onClick={clearAll}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: '2px solid #ef4444',
                      backgroundColor: 'white',
                      color: '#ef4444',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
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
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: inputMode === 'instruction' 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: (isProcessing || !inputText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !inputText.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
              >
                {isProcessing ? 'Processing...' : (inputMode === 'content' ? 'Add & Organize' : 'Apply Instruction')}
              </button>
            </div>
          </div>
        </div>

        {organizedData && (
          <div>
            {organizedData.summary && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderLeft: '4px solid #667eea'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#667eea', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Overview
                </div>
                <div style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6' }}>
                  {organizedData.summary}
                </div>
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px' 
            }}>
              {organizedData.categories.map((category, catIndex) => {
                const activeItems = getActiveItems(category.items);
                const completedItems = getCompletedItems(category.items);
                const isExpanded = expandedCategories[category.id];

                return (
                  <div 
                    key={category.id || catIndex}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ color: '#667eea' }}>
                        {getTypeIcon(category.type)}
                      </div>
                      <h3 style={{ 
                        margin: '0', 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {category.name}
                      </h3>
                      <div style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        padding: '4px 10px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {activeItems.length}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeItems.map((item, itemIndex) => (
                        <div 
                          key={item.id || itemIndex}
                          style={{
                            padding: '14px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '10px',
                            borderLeft: `3px solid ${getPriorityColor(item.priority)}`,
                            transition: 'background-color 0.2s',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <button
                              onClick={() => toggleItemCompletion(category.id, item.id)}
                              style={{
                                minWidth: '20px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                border: '2px solid #d1d5db',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                marginTop: '2px'
                              }}
                            >
                            </button>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontSize: '15px', 
                                color: '#1f2937',
                                marginBottom: item.dueDate || item.relatedInputs ? '8px' : '0',
                                lineHeight: '1.5'
                              }}>
                                {item.content}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {item.dueDate && (
                                  <div style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    📅 {formatDate(item.dueDate)}
                                  </div>
                                )}
                                
                                {item.priority && (
                                  <div style={{
                                    fontSize: '11px',
                                    color: getPriorityColor(item.priority),
                                    textTransform: 'uppercase',
                                    fontWeight: '600',
                                    letterSpacing: '0.5px',
                                    padding: '2px 8px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px'
                                  }}>
                                    {item.priority}
                                  </div>
                                )}
                                
                                {item.relatedInputs && item.relatedInputs.length > 0 && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    fontStyle: 'italic'
                                  }}>
                                    From inputs: {item.relatedInputs.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteItem(category.id, item.id)}
                              style={{
                                minWidth: '24px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                marginTop: '2px'
                              }}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {completedItems.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <button
                          onClick={() => toggleCategoryExpanded(category.id)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px dashed #d1d5db',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                          {completedItems.length} Completed
                        </button>

                        {isExpanded && (
                          <div style={{ 
                            marginTop: '12px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #e5e7eb'
                          }}>
                            {completedItems.map((item, itemIndex) => (
                              <div 
                                key={item.id || `completed-${itemIndex}`}
                                style={{
                                  padding: '14px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '10px',
                                  borderLeft: '3px solid #d1d5db',
                                  opacity: 0.6,
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                  <button
                                    onClick={() => toggleItemCompletion(category.id, item.id)}
                                    style={{
                                      minWidth: '20px',
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '6px',
                                      border: '2px solid #10b981',
                                      backgroundColor: '#10b981',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s',
                                      marginTop: '2px'
                                    }}
                                  >
                                    <CheckIcon className="h-4 w-4 text-white" strokeWidth={3} />
                                  </button>
                                  
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontSize: '15px', 
                                      color: '#1f2937',
                                      lineHeight: '1.5',
                                      textDecoration: 'line-through'
                                    }}>
                                      {item.content}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => deleteItem(category.id, item.id)}
                                    style={{
                                      minWidth: '24px',
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#9ca3af',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s',
                                      marginTop: '2px'
                                    }}
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
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <SparklesIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
              Your organized board will appear here
            </h3>
            <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
              Start by typing any thought, idea, or task above. I'll automatically organize everything into categories, extract to-dos, and keep track of what's important.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentIdeasBoardPage;
