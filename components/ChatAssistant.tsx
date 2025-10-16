import React from 'react';
import { Project } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useChatAssistant } from './chat/useChatAssistant';

interface ChatAssistantProps {
  onSearch: (projects: Project[]) => void;
  onReset?: () => void;
}

function ChatAssistant({ onSearch, onReset }: ChatAssistantProps): React.ReactNode {
  const {
    isOpen,
    messages,
    userInput,
    isLoading,
    messagesEndRef,
    toggleChat,
    handleInputChange,
    handleSendMessage,
    clearChat,
  } = useChatAssistant({ onSearch, onReset });

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  return (
    <>
      <button
        onClick={toggleChat}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-16 h-16 rounded-full bg-brand-accent text-brand-primary flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 z-50 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        aria-label="Open chat assistant"
      >
        <ChatIcon className="w-8 h-8" />
      </button>

      {isOpen && (
        <div
          data-testid="chat-assistant-panel"
          className="fixed bottom-0 right-0 w-full h-full sm:w-full sm:max-w-sm sm:h-[70vh] sm:max-h-[600px] bg-brand-secondary rounded-lg shadow-2xl flex flex-col z-50 animate-slide-in-up"
        >
          <header className="flex items-center justify-between p-4 border-b border-brand-primary gap-2">
            <h3 className="text-lg font-bold text-brand-text">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="px-3 py-1 text-sm rounded-md border border-brand-primary text-brand-text hover:bg-brand-primary/50"
                disabled={isLoading}
              >
                Clear chat
              </button>
              <button
                onClick={toggleChat}
                className="text-brand-text-secondary hover:text-brand-text"
                aria-label="Close chat assistant"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-brand-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.sender === 'user' ? 'bg-brand-accent text-brand-primary' : 'bg-brand-primary text-brand-text'}`}>
                  <p className="text-sm">
                    {message.text}
                    {isLoading && message.id === lastMessageId ? (
                      <span className="inline-block w-2 h-4 bg-brand-text-secondary ml-1 animate-pulse" />
                    ) : null}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-brand-text-secondary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-brand-primary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-4 border-t border-brand-primary">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the projects..."
                className="flex-1 bg-brand-primary border border-transparent rounded-lg px-4 py-2 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
                disabled={isLoading}
              />
              <button onClick={handleSendMessage} disabled={isLoading} className="bg-brand-accent text-brand-primary p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;
