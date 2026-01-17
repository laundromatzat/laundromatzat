// src/services/websocketService.ts
import type { WSAgentMessage } from "../../types/devTaskTypes";
import { API_BASE_URL } from "../utils/api";

type WSEventHandler = (message: WSAgentMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private eventHandlers: Map<string, Set<WSEventHandler>> = new Map();
  private userId: number | null = null;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(userId: number): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    // Construct WebSocket URL from API_BASE_URL
    // Convert http:// to ws:// and https:// to wss://
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      // Authenticate
      if (this.userId) {
        this.send({ type: "auth", userId: this.userId });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSAgentMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.isConnecting = false;
      this.ws = null;

      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        setTimeout(() => {
          if (this.userId) {
            this.connect(this.userId);
          }
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.isConnecting = false;
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    this.userId = null;
  }

  /**
   * Send a message to the server
   */
  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WSAgentMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Also notify wildcard handlers
    const wildcardHandlers = this.eventHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: string, handler: WSEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: WSEventHandler): () => void {
    return this.on("*", handler);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
