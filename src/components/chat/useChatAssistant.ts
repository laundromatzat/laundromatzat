import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useLoading } from "@/context/LoadingContext";
import type { ChatMessage, Project } from "@/types";
import type { SearchOptions } from "@/utils/projectSearch";
import { searchProjects } from "@/utils/projectSearch";
import { isChatResetPayload } from "@/utils/chatReset";
import {
  createChatSession,
  type ChatSessionLike,
} from "@/services/geminiClient";
import {
  trackChatClear,
  trackChatClose,
  trackChatError,
  trackChatOpen,
  trackChatReset,
} from "@/lib/analytics";

export interface UseChatAssistantParams {
  onSearch: (projects: Project[]) => void;
  onReset?: () => void;
}

export interface UseChatAssistantResult {
  isOpen: boolean;
  messages: ChatMessage[];
  userInput: string;
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  toggleChat: () => void;
  handleInputChange: (value: string) => void;
  handleSendMessage: () => Promise<void>;
  clearChat: () => void;
}

const INITIAL_AI_MESSAGE: ChatMessage = {
  id: "initial",
  sender: "ai",
  text: "Hello! How can I help you explore this creative portfolio?",
};

const ERROR_MESSAGE: ChatMessage = {
  id: "error",
  sender: "ai",
  text: "Sorry, I am unable to connect right now.",
};

const AI_RESET_RESPONSE = "Filters cleared—back to featured selections.";
const AI_PROJECTS_RESPONSE = "I've updated the grid with your search results.";

const STORAGE_KEY = "chat-assistant/messages";

const loadPersistedMessages = (): ChatMessage[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as ChatMessage[];
    }
  } catch (error) {
    console.warn("Failed to parse stored chat messages.", error);
  }

  return [];
};

const sanitizeJsonFence = (fullText: string): string => {
  return fullText
    .trim()
    .replace(/^```json\n?/, "")
    .replace(/```$/, "");
};

const parseJsonSafely = (
  candidate: string,
  logOnError = false
): unknown | null => {
  try {
    return JSON.parse(candidate);
  } catch (error) {
    if (logOnError) {
      console.error("Error parsing JSON from assistant payload:", error);
    }
    return null;
  }
};

const extractAssistantPayload = (fullText: string): unknown | null => {
  const sanitized = sanitizeJsonFence(fullText);
  const direct = parseJsonSafely(sanitized);
  if (direct) {
    return direct;
  }

  const fenceMatch = fullText.match(/```(?:json)?\s*\n([\s\S]*?)\n```/i);
  if (fenceMatch?.[1]) {
    const fenced = parseJsonSafely(fenceMatch[1], true);
    if (fenced) {
      return fenced;
    }
  }

  const looseMatch = fullText.match(
    /({[\s\S]*"name"\s*:\s*"searchProjects"[\s\S]*})/
  );
  if (looseMatch?.[1]) {
    const loose = parseJsonSafely(looseMatch[1], true);
    if (loose) {
      return loose;
    }
  }

  return null;
};

export function useChatAssistant({
  onSearch,
  onReset,
}: UseChatAssistantParams): UseChatAssistantResult {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadPersistedMessages()
  );
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<ChatSessionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef(messages);
  const persistMessages = useCallback((nextMessages: ChatMessage[]): void => {
    if (typeof window === "undefined") {
      return;
    }

    if (nextMessages.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMessages));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  const [sessionNonce, setSessionNonce] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      chatRef.current = null;
      persistMessages(messagesRef.current);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const chatSession = await createChatSession();
        if (cancelled) {
          return;
        }
        chatRef.current = chatSession;
        setMessages((prev) => (prev.length > 0 ? prev : [INITIAL_AI_MESSAGE]));
      } catch (error) {
        if (cancelled) {
          return;
        }
        setMessages((prev) => (prev.length > 0 ? prev : [ERROR_MESSAGE]));
        trackChatError("createSession", error);
        console.warn(
          "Chat session could not be initialized. Check your API key.",
          error
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, persistMessages, sessionNonce]);

  useEffect(() => {
    messagesRef.current = messages;
    persistMessages(messages);
  }, [messages, persistMessages]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        trackChatOpen();
      } else {
        trackChatClose();
      }
      return next;
    });
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setUserInput(value);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isLoading || !chatRef.current) {
      return;
    }

    const aiMessageId = `${Date.now() + 1}`;
    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      sender: "user",
      text: userInput,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: aiMessageId, sender: "ai", text: "" },
    ]);
    setUserInput("");
    setIsLoading(true);
    setGlobalLoading(true);

    try {
      const stream = chatRef.current.sendMessageStream(userMessage.text);
      let fullText = "";

      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId
              ? { ...message, text: fullText }
              : message
          )
        );
      }

      const payload = extractAssistantPayload(fullText);
      if (payload && typeof payload === "object") {
        if (isChatResetPayload(payload)) {
          onReset?.();
          trackChatReset("payload");
          setMessages((prev) =>
            prev.map((message) =>
              message.id === aiMessageId
                ? { ...message, text: AI_RESET_RESPONSE }
                : message
            )
          );
          return;
        }

        const candidate = payload as Record<string, unknown>;
        if (
          candidate.name === "searchProjects" &&
          typeof candidate.arguments === "object" &&
          candidate.arguments
        ) {
          const args = candidate.arguments as Record<string, unknown>;
          const query = typeof args.query === "string" ? args.query : "";
          const opts = (args.opts ?? {}) as SearchOptions;
          const results = searchProjects(query, opts);
          onSearch(results);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === aiMessageId
                ? {
                    ...message,
                    text: `Found ${results.length} project${results.length === 1 ? "" : "s"} for “${query}”${
                      opts?.type ? ` (type: ${opts.type})` : ""
                    }.`,
                  }
                : message
            )
          );
          return;
        }

        if (Array.isArray((candidate as { projects?: unknown }).projects)) {
          const projects = (candidate as { projects: Project[] }).projects;
          onSearch(projects);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === aiMessageId
                ? { ...message, text: AI_PROJECTS_RESPONSE }
                : message
            )
          );
          return;
        }
      }
    } catch (error) {
      trackChatError("sendMessage", error);
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                text: "Sorry, something went wrong. Please try again.",
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
      setGlobalLoading(false);
    }
  }, [userInput, isLoading, onSearch, onReset, setGlobalLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setUserInput("");
    setIsLoading(false);
    chatRef.current = null;
    setSessionNonce((prev) => prev + 1);
    persistMessages([]);
    trackChatClear();
  }, [persistMessages]);

  return {
    isOpen,
    messages,
    userInput,
    isLoading,
    messagesEndRef,
    toggleChat,
    handleInputChange,
    handleSendMessage,
    clearChat,
  };
}

export default useChatAssistant;
