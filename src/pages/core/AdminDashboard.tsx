import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import PageMetadata from "@/components/PageMetadata";
import { getApiUrl } from "@/utils/api";
import { Check, Trash2, Shield, User as UserIcon } from "lucide-react";
import Container from "@/components/Container";

interface AdminUser {
  id: number;
  username: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-white">Loading...</div>;
  if (!user || user.role !== "admin")
    return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <Container className="py-8 pt-24 text-white">
      <PageMetadata
        title="Admin Dashboard"
        description="Manage users and approvals."
        path="/admin"
      />

      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50">
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
          <tbody className="divide-y divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/30 transition">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UserIcon size={16} />
                  </div>
                  <span className="font-medium">{u.username}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-zinc-700 text-zinc-300"
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
                <td className="p-4 text-zinc-500 text-sm">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-2">
                  {!u.is_approved && (
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-md text-sm transition"
                    >
                      Approve
                    </button>
                  )}
                  {u.role !== "admin" && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-300 p-1.5 rounded-md transition"
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
          <div className="p-8 text-center text-zinc-500">No users found.</div>
        )}
      </div>
    </Container>
  );
}
