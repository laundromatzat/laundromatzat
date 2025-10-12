import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Project } from '../types';
import { ClientChatSession, createChatSession, searchProjects } from '../services/geminiService'; // Import the function and searchProjects
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChatAssistantProps {
  onSearch: (projects: Project[]) => void;
  onReset?: () => void;
}

function ChatAssistant({ onSearch, onReset }: ChatAssistantProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<ClientChatSession | null>(null); // Initialize chatRef to null
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    (async () => {
      try {
        const chatSession = await createChatSession();
        if (cancelled) return;
        chatRef.current = chatSession; // Assign the result of createChatSession
        setMessages([
          { id: 'initial', sender: 'ai', text: 'Hello! How can I help you explore this creative portfolio?' }
        ]);
      } catch (error) {
        if (cancelled) return;
        setMessages([{ id: 'error', sender: 'ai', text: 'Sorry, I am unable to connect right now.' }]);
        console.warn('Chat session could not be initialized.  Check your API key.', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading || !chatRef.current) return; // Ensure chatRef.current is not null

    const shouldReset = (payload: any): boolean => {
      if (!payload || typeof payload !== 'object') return false;
      const name = typeof payload.name === 'string' ? payload.name.toLowerCase() : '';
      const action = typeof payload.action === 'string' ? payload.action.toLowerCase() : '';
      if (name.includes('reset') || action.includes('reset')) return true;
      if (payload.reset === true || payload.type === 'reset') return true;
      return false;
    };

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

    try {
      if (chatRef.current) {
        const stream = chatRef.current.sendMessageStream(userInput);
        const respondWithReset = () => {
          if (onReset) {
            onReset();
          }
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: 'Filters cleared—back to featured selections.' }
                : msg,
            ),
          );
        };
        let fullText = '';
        for await (const chunk of stream) {
          fullText += chunk.text;
          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId ? { ...msg, text: fullText } : msg
          ));
        }

        // 1) Try direct JSON (function‑call style)
        try {
          const sanitizedText = fullText.trim().replace(/^```json\n?/, '').replace(/```$/, '');
          const obj = JSON.parse(sanitizedText);
          if (shouldReset(obj)) {
            respondWithReset();
            return;
          }
          if (obj?.name === 'searchProjects' && obj.arguments?.query !== undefined) {
            const q = obj.arguments.query as string;
            const opts = (obj.arguments.opts ?? {}) as import('../services/geminiService').SearchOptions;
            const results = searchProjects(q, opts);
            onSearch(results);
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: `Found ${results.length} project${results.length===1?'':'s'} for “${q}”${opts?.type?` (type: ${opts.type})`:''}.` }
                : msg
            ));
            return;
          }
        } catch {
          /* not a bare JSON object; fall through */
        }

        // 2) Fallback: tolerate ``` + (optional) json on next line
        let parsedObj: any | null = null;
        const fenceMatch = fullText.match(/```(?:json)?\s*\n([\s\S]*?)\n```/i);
        if (fenceMatch && fenceMatch[1]) {
          try {
            parsedObj = JSON.parse(fenceMatch[1]);
          } catch (e) {
            console.error("Error parsing fenced JSON:", e);
          }
        }
        // 3) Last‑ditch: extract any JSON block that contains a searchProjects call
        if (!parsedObj) {
          const looseMatch = fullText.match(/({[\s\S]*"name"\s*:\s*"searchProjects"[\s\S]*})/);
          if (looseMatch && looseMatch[1]) {
            try {
              parsedObj = JSON.parse(looseMatch[1]);
            } catch (e) {
              console.error("Error parsing loose JSON block:", e);
            }
          }
        }
        if (parsedObj) {
          if (shouldReset(parsedObj)) {
            respondWithReset();
            return;
          }
          if (parsedObj?.name === 'searchProjects' && parsedObj.arguments?.query !== undefined) {
            const q = parsedObj.arguments.query as string;
            const opts = (parsedObj.arguments.opts ?? {}) as import('../services/geminiService').SearchOptions;
            const results = searchProjects(q, opts);
            onSearch(results);
            setMessages(prev => prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: `Found ${results.length} project${results.length===1?'':'s'} for “${q}”${opts?.type?` (type: ${opts.type})`:''}.` }
                : msg
            ));
            return;
          }
          if (parsedObj.projects) {
            onSearch(parsedObj.projects);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, text: "I've updated the grid with your search results." }
                  : msg
              )
            );
            return;
          }
        }
        // Otherwise leave the AI text as‑is
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId ? { ...msg, text: 'Sorry, something went wrong. Please try again.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, onSearch, onReset]);

  const toggleChat = () => setIsOpen(!isOpen);

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
        <div className="fixed bottom-0 right-0 w-full h-full sm:w-full sm:max-w-sm sm:h-[70vh] sm:max-h-[600px] bg-brand-secondary rounded-lg shadow-2xl flex flex-col z-50 animate-slide-in-up">
          <header className="flex items-center justify-between p-4 border-b border-brand-primary">
            <h3 className="text-lg font-bold text-brand-text">AI Assistant</h3>
            <button onClick={toggleChat} className="text-brand-text-secondary hover:text-brand-text">
              <CloseIcon className="w-6 h-6" />
            </button>
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
                  <p className="text-sm">{message.text}{isLoading && message.id === messages[messages.length - 1].id && <span className="inline-block w-2 h-4 bg-brand-text-secondary ml-1 animate-pulse"></span>}</p>
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
                onChange={e => setUserInput(e.target.value)}
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