import { useState, useEffect } from "react";
import type {
  AgentExecution,
  AgentExecutionLog,
} from "../../types/devTaskTypes";
import { getExecutionLogs } from "../../src/services/aiAgentApiService";
import { websocketService } from "../../src/services/websocketService";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  GitBranch,
  GitCommit,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface AgentExecutionPanelProps {
  execution: AgentExecution;
  onCancel?: () => void;
}

const AgentExecutionPanel = ({
  execution,
  onCancel,
}: AgentExecutionPanelProps) => {
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveExecution, setLiveExecution] = useState(execution);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const fetchedLogs = await getExecutionLogs(execution.id);
        setLogs(fetchedLogs.reverse()); // Show oldest first
      } catch (error) {
        console.error("Failed to load logs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    // Subscribe to real-time updates
    const unsubscribe = websocketService.on("agent:log", (message) => {
      if (message.executionId === execution.id && message.log) {
        setLogs((prev) => [message.log!, ...prev]);
      }
    });

    const unsubscribeStatus = websocketService.on(
      "agent:status_change",
      (message) => {
        if (message.executionId === execution.id) {
          setLiveExecution((prev) => ({ ...prev, status: message.status! }));
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [execution.id]);

  const getStatusIcon = () => {
    switch (liveExecution.status) {
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (liveExecution.status) {
      case "running":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getLogIcon = (logType: string) => {
    switch (logType) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "progress":
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getCIStatusBadge = () => {
    if (!liveExecution.github_actions_status) return null;

    const statusColors = {
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      running:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      success:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      failure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[liveExecution.github_actions_status]}`}
      >
        CI: {liveExecution.github_actions_status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Agent Execution
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Execution #{liveExecution.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
          >
            {liveExecution.status}
          </span>
          {getCIStatusBadge()}
        </div>
      </div>

      {/* GitHub Info */}
      {(liveExecution.github_branch || liveExecution.github_commit_sha) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            GitHub Integration
          </h4>
          <div className="space-y-2">
            {liveExecution.github_branch && (
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Branch:{" "}
                  <code className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                    {liveExecution.github_branch}
                  </code>
                </span>
              </div>
            )}
            {liveExecution.github_commit_sha && (
              <div className="flex items-center gap-2 text-sm">
                <GitCommit className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Commit:{" "}
                  <code className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                    {liveExecution.github_commit_sha.substring(0, 7)}
                  </code>
                </span>
                <a
                  href={`https://github.com/laundromatzat/laundromatzat/commit/${liveExecution.github_commit_sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            {liveExecution.github_actions_url && (
              <a
                href={liveExecution.github_actions_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
              >
                View GitHub Actions Run
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {liveExecution.error_message && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                Execution Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400">
                {liveExecution.error_message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Section */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Execution Logs
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No logs yet
            </p>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatTimestamp(log.created_at)}
                  </span>
                  <div className="flex-shrink-0 mt-0.5">
                    {getLogIcon(log.log_type)}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(liveExecution.status === "running" ||
        liveExecution.status === "pending") &&
        onCancel && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel Execution
            </button>
          </div>
        )}
    </div>
  );
};

export default AgentExecutionPanel;
