// server/services/websocketService.js
const WebSocket = require("ws");

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws, req) => {
      console.log("WebSocket client connected");

      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid message format" })
          );
        }
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
        this.removeClient(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    // Heartbeat to detect broken connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on("close", () => {
      clearInterval(interval);
    });

    console.log("WebSocket server initialized");
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case "auth":
        // Authenticate the connection
        if (data.userId) {
          ws.userId = data.userId;
          this.addClient(data.userId, ws);
          ws.send(
            JSON.stringify({ type: "auth_success", userId: data.userId })
          );
        } else {
          ws.send(
            JSON.stringify({ type: "auth_error", message: "Invalid user ID" })
          );
        }
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      default:
        console.warn("Unknown message type:", data.type);
    }
  }

  addClient(userId, ws) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);
    console.log(
      `Client added for user ${userId}. Total connections: ${this.clients.get(userId).size}`
    );
  }

  removeClient(ws) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
        console.log(`Client removed for user ${ws.userId}`);
      }
    }
  }

  /**
   * Send a message to all connections for a specific user
   */
  sendToUser(userId, message) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const payload = JSON.stringify(message);
      userClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  /**
   * Send agent execution started event
   */
  notifyAgentStarted(userId, executionId, taskId) {
    this.sendToUser(userId, {
      type: "agent:started",
      executionId,
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent progress update
   */
  notifyAgentProgress(userId, executionId, progress) {
    this.sendToUser(userId, {
      type: "agent:progress",
      executionId,
      progress,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent question
   */
  notifyAgentQuestion(userId, executionId, questionId, question) {
    this.sendToUser(userId, {
      type: "agent:question",
      executionId,
      questionId,
      question,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent completion event
   */
  notifyAgentCompleted(userId, executionId, result) {
    this.sendToUser(userId, {
      type: "agent:completed",
      executionId,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent error event
   */
  notifyAgentError(userId, executionId, error) {
    this.sendToUser(userId, {
      type: "agent:error",
      executionId,
      error: error.message || error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent log event
   */
  notifyAgentLog(userId, executionId, log) {
    this.sendToUser(userId, {
      type: "agent:log",
      executionId,
      log,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send agent status change event
   */
  notifyAgentStatusChange(userId, executionId, status) {
    this.sendToUser(userId, {
      type: "agent:status_change",
      executionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new WebSocketService();
