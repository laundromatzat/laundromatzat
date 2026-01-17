import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import PageMetadata from "@/components/PageMetadata";
import { getApiUrl } from "@/utils/api";
import {
  Check,
  Trash2,
  Shield,
  User as UserIcon,
  Activity,
  Users,
  Clock,
  Zap,
  TrendingUp,
  Server,
  Cpu,
  Database,
} from "lucide-react";
import Container from "@/components/Container";
import DevTaskManager from "./DevTaskManager";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminUser {
  id: number;
  username: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

interface ServerStats {
  totalUsers: number;
  pendingApprovals: number;
  activeUsers: number;
  uptime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

interface AIUsageStats {
  total: {
    tokens: number;
    cost: number;
  };
  byUser: Array<{ username: string; tokens: number; cost: number }>;
  byTool: Array<{ tool_name: string; tokens: number; cost: number }>;
  byModel: Array<{ model_name: string; tokens: number; cost: number }>;
  recent: Array<{ date: string; tokens: number; cost: number }>;
}

export default function MissionControl() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [aiUsage, setAIUsage] = useState<AIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "ai-usage" | "tasks"
  >("tasks"); // Default to tasks tab since other endpoints may not exist yet

  const fetchData = useCallback(async () => {
    try {
      // Fetch users (required)
      const usersRes = await fetch(getApiUrl("/api/admin/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!usersRes.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await usersRes.json();
      setUsers(usersData);

      // Try to fetch stats (optional - endpoints may not exist yet)
      try {
        const statsRes = await fetch(getApiUrl("/api/admin/stats"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.log("Stats endpoint not available yet");
      }

      // Try to fetch AI usage (optional - endpoint may not exist yet)
      try {
        const aiUsageRes = await fetch(getApiUrl("/api/admin/ai-usage"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (aiUsageRes.ok) {
          const aiUsageData = await aiUsageRes.json();
          setAIUsage(aiUsageData);
        }
      } catch (err) {
        console.log("AI usage endpoint not available yet");
      }
    } catch (err) {
      setError("Failed to load Mission Control data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${id}/approve`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, is_approved: true } : u))
        );
        fetchData(); // Refresh stats
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        fetchData(); // Refresh stats
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/10 to-zinc-900 text-white">
        <Container className="py-8 pt-24">
          <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-lg" />
              ))}
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>

            {/* AI Usage Summary Skeleton */}
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-red-900/20 to-zinc-900">
        <div className="text-center text-red-500">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-zinc-400 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/10 to-zinc-900 text-white">
      <Container className="py-8 pt-24">
        <PageMetadata
          title="Mission Control"
          description="Admin dashboard for managing users, monitoring server health, and tracking AI usage."
          path="/admin"
        />

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mission Control
            </h1>
            <p className="text-zinc-400 text-sm">
              System monitoring and administration
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "Users", icon: Users },
            { id: "ai-usage", label: "AI Usage", icon: Zap },
            { id: "tasks", label: "Dev Tasks", icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-zinc-500">TOTAL</span>
                </div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-zinc-400">Total Users</div>
              </div>

              <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-amber-400" />
                  <span className="text-xs text-zinc-500">PENDING</span>
                </div>
                <div className="text-3xl font-bold">
                  {stats.pendingApprovals}
                </div>
                <div className="text-sm text-zinc-400">Pending Approvals</div>
              </div>

              <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Server className="w-8 h-8 text-green-400" />
                  <span className="text-xs text-zinc-500">UPTIME</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatUptime(stats.uptime)}
                </div>
                <div className="text-sm text-zinc-400">Server Uptime</div>
              </div>

              <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Cpu className="w-8 h-8 text-purple-400" />
                  <span className="text-xs text-zinc-500">MEMORY</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatBytes(stats.memory.heapUsed)}
                </div>
                <div className="text-sm text-zinc-400">
                  / {formatBytes(stats.memory.heapTotal)}
                </div>
              </div>
            </div>

            {/* AI Usage Summary */}
            {aiUsage && (
              <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  AI Usage Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">
                      Total Tokens
                    </div>
                    <div className="text-3xl font-bold text-purple-400">
                      {aiUsage.total.tokens.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">
                      Estimated Cost
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      ${aiUsage.total.cost.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="p-4 font-medium text-zinc-400">User</th>
                  <th className="p-4 font-medium text-zinc-400">Role</th>
                  <th className="p-4 font-medium text-zinc-400">Status</th>
                  <th className="p-4 font-medium text-zinc-400">Joined</th>
                  <th className="p-4 font-medium text-zinc-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-700/30 transition-colors"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <UserIcon size={20} />
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-zinc-700/50 text-zinc-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_approved ? (
                        <span className="text-green-400 flex items-center gap-1 text-sm">
                          <Check size={14} /> Approved
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 text-sm bg-amber-400/10 px-2 py-1 rounded-full w-fit">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!u.is_approved && (
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-green-500/50"
                        >
                          Approve
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 p-2 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/30"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No users found.
              </div>
            )}
          </div>
        )}

        {/* AI Usage Tab */}
        {activeTab === "ai-usage" && aiUsage && (
          <div className="space-y-6">
            {/* By Tool */}
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">
                Usage by Tool
              </h3>
              <div className="space-y-3">
                {aiUsage.byTool.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No AI usage data yet. Start using AI tools to see statistics
                    here.
                  </p>
                ) : (
                  aiUsage.byTool.map((tool) => (
                    <div
                      key={tool.tool_name}
                      className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
                    >
                      <span className="font-medium">{tool.tool_name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-400">
                          {tool.tokens.toLocaleString()} tokens
                        </span>
                        <span className="text-green-400 font-semibold">
                          ${tool.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* By User */}
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">
                Usage by User (Top 10)
              </h3>
              <div className="space-y-3">
                {aiUsage.byUser.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No user data available.
                  </p>
                ) : (
                  aiUsage.byUser.map((user) => (
                    <div
                      key={user.username}
                      className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
                    >
                      <span className="font-medium">{user.username}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-400">
                          {user.tokens.toLocaleString()} tokens
                        </span>
                        <span className="text-green-400 font-semibold">
                          ${user.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* By Model */}
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-purple-400">
                Usage by Model
              </h3>
              <div className="space-y-3">
                {aiUsage.byModel.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No model data available.
                  </p>
                ) : (
                  aiUsage.byModel.map((model) => (
                    <div
                      key={model.model_name}
                      className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
                    >
                      <span className="font-medium">{model.model_name}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-zinc-400">
                          {model.tokens.toLocaleString()} tokens
                        </span>
                        <span className="text-green-400 font-semibold">
                          ${model.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
            <DevTaskManager />
          </div>
        )}
      </Container>
    </div>
  );
}
