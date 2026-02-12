import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Upload,
  FileText,
  Activity,
  DollarSign,
  Palette,
  Sparkles,
  ImageIcon,
  Scissors,
  Hammer,
  Search,
  Download,
} from "lucide-react";
import AccountItemCard from "@/components/AccountItemCard";
import { Helmet } from "@dr.pogodin/react-helmet";
import { getApiUrl } from "@/utils/api";
import { getAvatarUrl } from "@/utils/avatar";

interface DashboardItem {
  id: number;
  tags: string[];
  // Add other properties as needed
  [key: string]: unknown;
}

interface DashboardData {
  paychecks: unknown[];
  mediscribe: DashboardItem[];
  publicHealth: unknown[];
  pinPals: unknown[];
  neuroaesthetic: unknown[];
  colorPalettes: unknown[];
  backgroundRemoval: unknown[];
  woodCarving: unknown[];
  nylonFabric: unknown[];
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "mediscribe"
    | "publicHealth"
    | "paystubs"
    | "pinPals"
    | "neuroaesthetic"
    | "colorPalette"
    | "backgroundRemoval"
    | "woodCarving"
    | "nylonFabric"
  >("overview");
  const [data, setData] = useState<DashboardData>({
    paychecks: [],
    mediscribe: [],
    publicHealth: [],
    pinPals: [],
    neuroaesthetic: [],
    colorPalettes: [],
    backgroundRemoval: [],
    nylonFabric: [],
    woodCarving: [],
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_picture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatarUrl(user.profile_picture || null);
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.welcome) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [
        paychecksRes,
        mediscribeRes,
        publicHealthRes,
        pinPalsRes,
        neuroRes,
        colorPalettesRes,
        bgRemovalRes,
        woodCarvingRes,
        nylonFabricRes,
      ] = await Promise.all([
        fetch(getApiUrl("/paychecks"), { headers }),
        fetch(getApiUrl("/api/mediscribe/examples"), { headers }),
        fetch(getApiUrl("/api/public-health/docs"), { headers }),
        fetch(getApiUrl("/api/pin-pals/gallery"), { headers }),
        fetch(getApiUrl("/api/neuroaesthetic/history"), { headers }),
        fetch(getApiUrl("/api/color-palettes"), { headers }),
        fetch(getApiUrl("/api/background-removal/jobs"), { headers }),
        fetch(getApiUrl("/api/wood-carving/projects"), { headers }),
        fetch(getApiUrl("/api/nylon-fabric-designs"), { headers }),
      ]);

      const paychecks = await paychecksRes.json();
      const mediscribe = await mediscribeRes.json();
      const publicHealth = await publicHealthRes.json();
      const pinPals = await pinPalsRes.json();
      const neuroaesthetic = await neuroRes.json();
      const colorPalettes = await colorPalettesRes.json();
      const bgRemoval = await bgRemovalRes.json();
      const woodCarving = await woodCarvingRes.json();
      const nylonFabric = await nylonFabricRes.json();

      setData({
        paychecks: Array.isArray(paychecks) ? paychecks : [],
        mediscribe: mediscribe.examples || [],
        publicHealth: Array.isArray(publicHealth) ? publicHealth : [],
        pinPals: pinPals.pins || [],
        neuroaesthetic: neuroaesthetic.history || [],
        colorPalettes: colorPalettes.palettes || [],
        backgroundRemoval: bgRemoval.jobs || [],
        woodCarving: woodCarving.projects || [],
        nylonFabric: nylonFabric.designs || [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(getApiUrl("/api/auth/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password: password || undefined }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated successfully");
        // Update context
        login(token!, data.user);
      } else {
        setMessage(data.error || "Update failed");
      }
    } catch {
      setMessage("Update failed");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(getApiUrl("/api/auth/upload-avatar"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.profile_picture);
        if (user && token) {
          const updatedUser = {
            ...user,
            profile_picture: data.profile_picture,
          };
          login(token, updatedUser);
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile & Dashboard | Laudromatzat</title>
      </Helmet>

      {/* Welcome Toast */}
      {showWelcome && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <span className="bg-emerald-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              New
            </span>
            <span className="font-medium">Welcome back, {user?.username}!</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12 pt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* User Info & Avatar */}
          <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div
              className="relative inline-block mb-4 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-aura-accent/20 mx-auto">
                {avatarUrl ? (
                  <img
                    src={getAvatarUrl(user?.profile_picture) || ""}
                    alt={user?.username || "User avatar"}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-white/40" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
            <h2 className="text-2xl font-serif text-aura-text-primary mb-2">
              {user?.username}
            </h2>
            <p className="text-sm text-gray-400">
              Member since {new Date().getFullYear()}
            </p>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-medium text-aura-text-primary mb-6">
              Edit Profile
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="username-input"
                  className="block text-sm font-medium mb-1 text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-aura-accent text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="password-input"
                  className="block text-sm font-medium mb-1 text-gray-300"
                >
                  New Password (leave blank to keep current)
                </label>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-aura-accent text-white"
                  placeholder="••••••••"
                />
              </div>
              <button className="bg-aura-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50">
                Save Changes
              </button>
              {message && (
                <p className="text-sm text-aura-accent mt-2">{message}</p>
              )}
            </form>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div>
          <div className="flex space-x-4 border-b border-white/10 mb-6 overflow-x-auto">
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "overview" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "mediscribe" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("mediscribe")}
            >
              MediScribe AI ({data.mediscribe.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "publicHealth" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("publicHealth")}
            >
              Public Health Docs ({data.publicHealth.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "paystubs" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("paystubs")}
            >
              Paystubs ({data.paychecks.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "pinPals" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("pinPals")}
            >
              Pin Pals ({data.pinPals.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "neuroaesthetic" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("neuroaesthetic")}
            >
              Neuroaesthetic ({data.neuroaesthetic.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "colorPalette" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("colorPalette")}
            >
              Color Palettes ({data.colorPalettes.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "backgroundRemoval" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("backgroundRemoval")}
            >
              Background Removal ({data.backgroundRemoval.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "woodCarving" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("woodCarving")}
            >
              Wood Carving ({data.woodCarving.length})
            </button>
            <button
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap ${activeTab === "nylonFabric" ? "text-aura-accent border-b-2 border-aura-accent" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("nylonFabric")}
            >
              Nylon Fabric ({data.nylonFabric.length})
            </button>
          </div>

          <div className="min-h-[300px]">
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                Loading dashboard data...
              </div>
            ) : activeTab === "overview" ? (
              <>
                {/* Export All Button */}
                <div className="mb-6 flex justify-end">
                  <button
                    onClick={() => {
                      const allData = {
                        colorPalettes: data.colorPalettes,
                        backgroundRemoval: data.backgroundRemoval,
                        woodCarving: data.woodCarving,
                        pinPals: data.pinPals,
                        neuroaesthetic: data.neuroaesthetic,
                        mediscribe: data.mediscribe,
                        publicHealth: data.publicHealth,
                        paychecks: data.paychecks,
                        exportedAt: new Date().toISOString(),
                      };
                      const blob = new Blob(
                        [JSON.stringify(allData, null, 2)],
                        {
                          type: "application/json",
                        },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `laundromatzat-data-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-aura-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
                  >
                    <Download className="w-4 h-4" />
                    Export All Data
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-emerald-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.mediscribe.length}
                    </h4>
                    <p className="text-sm text-gray-400">MediScribe Notes</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Activity className="w-10 h-10 text-blue-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.publicHealth.length}
                    </h4>
                    <p className="text-sm text-gray-400">Public Health Docs</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <DollarSign className="w-10 h-10 text-yellow-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.paychecks.length}
                    </h4>
                    <p className="text-sm text-gray-400">Paystubs Analyzed</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Palette className="w-10 h-10 text-pink-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.pinPals.length}
                    </h4>
                    <p className="text-sm text-gray-400">Pin Pals Created</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-10 h-10 text-purple-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.neuroaesthetic.length}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Neuroaesthetic Designs
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <ImageIcon className="w-10 h-10 text-indigo-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.colorPalettes.length}
                    </h4>
                    <p className="text-sm text-gray-400">Color Palettes</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Scissors className="w-10 h-10 text-teal-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.backgroundRemoval.length}
                    </h4>
                    <p className="text-sm text-gray-400">Backgrounds Removed</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Hammer className="w-10 h-10 text-amber-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.woodCarving.length}
                    </h4>
                    <p className="text-sm text-gray-400">Carving Projects</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-10 h-10 text-purple-400 mb-3" />
                    <h4 className="text-2xl font-bold text-white">
                      {data.nylonFabric.length}
                    </h4>
                    <p className="text-sm text-gray-400">Fabric Designs</p>
                  </div>
                </div>
              </>
            ) : activeTab === "mediscribe" ? (
              <div className="space-y-4">
                {data.mediscribe.map((item: DashboardItem) => (
                  <div
                    key={item.id}
                    className="bg-white/5 p-4 rounded-lg border border-white/10"
                  >
                    <p className="text-white line-clamp-2">
                      {item.rewritten as string}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {item.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {data.mediscribe.length === 0 && (
                  <p className="text-gray-400">No MediScribe examples found.</p>
                )}
              </div>
            ) : activeTab === "colorPalette" ? (
              <div>
                {/* Header with Search and Export */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search palettes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(data.colorPalettes, null, 2)],
                        {
                          type: "application/json",
                        },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `color-palettes-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-aura-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                {/* Gallery Grid */}
                {data.colorPalettes.filter((p) =>
                  searchQuery
                    ? p.file_name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    : true,
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.colorPalettes
                      .filter((p) =>
                        searchQuery
                          ? p.file_name
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          : true,
                      )
                      .map((palette) => (
                        <AccountItemCard
                          key={palette.id}
                          item={palette}
                          type="palette"
                          onDelete={async (id) => {
                            const token = localStorage.getItem("token");
                            await fetch(
                              getApiUrl(`/api/color-palettes/${id}`),
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            fetchDashboardData();
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">
                    {searchQuery
                      ? "No palettes match your search."
                      : "No color palettes yet. Create one from the Color Palette Generator tool!"}
                  </p>
                )}
              </div>
            ) : activeTab === "backgroundRemoval" ? (
              <div>
                {/* Header with Search and Export */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(data.backgroundRemoval, null, 2)],
                        {
                          type: "application/json",
                        },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `background-removal-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-aura-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                {/* Gallery Grid */}
                {data.backgroundRemoval.filter((j) =>
                  searchQuery
                    ? j.file_name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    : true,
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.backgroundRemoval
                      .filter((j) =>
                        searchQuery
                          ? j.file_name
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          : true,
                      )
                      .map((job) => (
                        <AccountItemCard
                          key={job.id}
                          item={job}
                          type="backgroundRemoval"
                          onDelete={async (id) => {
                            const token = localStorage.getItem("token");
                            await fetch(
                              getApiUrl(`/api/background-removal/jobs/${id}`),
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            fetchDashboardData();
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">
                    {searchQuery
                      ? "No jobs match your search."
                      : "No background removal jobs yet. Create one from the Background Removal tool!"}
                  </p>
                )}
              </div>
            ) : activeTab === "woodCarving" ? (
              <div>
                {/* Header with Search and Export */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(data.woodCarving, null, 2)],
                        {
                          type: "application/json",
                        },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `wood-carving-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-aura-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                {/* Gallery Grid */}
                {data.woodCarving.filter((p) =>
                  searchQuery
                    ? p.description
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    : true,
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.woodCarving
                      .filter((p) =>
                        searchQuery
                          ? p.description
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          : true,
                      )
                      .map((project) => (
                        <AccountItemCard
                          key={project.id}
                          item={project}
                          type="woodCarving"
                          onDelete={async (id) => {
                            const token = localStorage.getItem("token");
                            await fetch(
                              getApiUrl(`/api/wood-carving/projects/${id}`),
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            fetchDashboardData();
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">
                    {searchQuery
                      ? "No projects match your search."
                      : "No wood carving projects yet. Create one from the Wood Carving Visualizer tool!"}
                  </p>
                )}
              </div>
            ) : activeTab === "nylonFabric" ? (
              <div>
                {/* Header with Search and Export */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search designs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(data.nylonFabric, null, 2)],
                        {
                          type: "application/json",
                        },
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `nylon-fabric-${Date.now()}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-aura-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                {/* Gallery Grid */}
                {data.nylonFabric.filter((d) =>
                  searchQuery
                    ? d.design_name
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      d.prompts?.instruction_image_prompt
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    : true,
                ).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.nylonFabric
                      .filter((d) =>
                        searchQuery
                          ? d.design_name
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            d.prompts?.instruction_image_prompt
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          : true,
                      )
                      .map((design) => (
                        <AccountItemCard
                          key={design.id}
                          item={{
                            ...design,
                            file_name: design.design_name,
                            image_data_url: design.instruction_image_url,
                          }}
                          type="palette"
                          onDelete={async (id) => {
                            const token = localStorage.getItem("token");
                            await fetch(
                              getApiUrl(`/api/nylon-fabric-designs/${id}`),
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            fetchDashboardData();
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">
                    {searchQuery
                      ? "No designs match your search."
                      : "No nylon fabric designs yet. Create one from the Nylon Fabric Designer tool!"}
                  </p>
                )}
              </div>
            ) : activeTab === "pinPals" || activeTab === "neuroaesthetic" ? (
              <p className="text-gray-400">
                View your{" "}
                {activeTab === "pinPals" ? "Pin Pals" : "Neuroaesthetic"}{" "}
                creations directly from the tool page.
              </p>
            ) : (
              <p className="text-gray-400">
                List view for {activeTab} coming soon...
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
