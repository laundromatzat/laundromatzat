import React, { useEffect, useMemo, useState } from "react";
import PageMetadata from "../components/PageMetadata";
import { useAuth } from "../context/AuthContext";

interface LinkItem {
  id: number;
  title: string;
  url: string;
  description: string;
  tags: string[];
  image_url?: string;
}

const SKELETON_COUNT = 6;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesFilters = (
  link: LinkItem,
  query: string,
  filterTags: string[]
): boolean => {
  const hasQuery = query.trim().length > 0;
  const hasTags = filterTags.length > 0;

  if (!hasQuery && !hasTags) return true;

  if (hasQuery) {
    const haystack = normalize(`${link.title} ${link.description} ${link.url}`);
    if (!haystack.includes(normalize(query))) return false;
  }

  if (hasTags) {
    const linkTags = link.tags.map((t) => t.toLowerCase());
    const requiredTags = filterTags.map((t) => t.toLowerCase());
    if (!requiredTags.every((t) => linkTags.includes(t))) return false;
  }

  return true;
};

// Simple Modal Component for Add/Edit
const LinkModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<LinkItem, "id">) => void;
  initialData?: LinkItem | null;
}) => {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    tags: "",
    image_url: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        url: initialData.url,
        description: initialData.description || "",
        tags: initialData.tags.join(", "),
        image_url: initialData.image_url || "",
      });
    } else {
      setFormData({
        title: "",
        url: "",
        description: "",
        tags: "",
        image_url: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold text-white">
          {initialData ? "Edit Link" : "Add New Link"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              title: formData.title,
              url: formData.url,
              description: formData.description,
              tags: formData.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              image_url: formData.image_url,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="link-title"
              className="block text-sm font-medium text-zinc-400"
            >
              Title
            </label>
            <input
              id="link-title"
              required
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="link-url"
              className="block text-sm font-medium text-zinc-400"
            >
              URL
            </label>
            <input
              id="link-url"
              required
              type="url"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="link-desc"
              className="block text-sm font-medium text-zinc-400"
            >
              Description
            </label>
            <textarea
              id="link-desc"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="link-tags"
              className="block text-sm font-medium text-zinc-400"
            >
              Tags (comma separated)
            </label>
            <input
              id="link-tags"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="link-image"
              className="block text-sm font-medium text-zinc-400"
            >
              Image URL (optional)
            </label>
            <input
              id="link-image"
              type="url"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              value={formData.image_url}
              onChange={(e) =>
                setFormData({ ...formData, image_url: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function LinksPage(): React.ReactNode {
  const { token } = useAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [filters, setFilters] = useState<{ query: string; tags: string[] }>({
    query: "",
    tags: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const fetchLinks = React.useCallback(async () => {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await fetch("http://localhost:4000/api/links", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch links");
      const data = await res.json();
      setLinks(data);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [token]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCreate = async (data: Omit<LinkItem, "id">) => {
    try {
      const res = await fetch("http://localhost:4000/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        fetchLinks();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (data: Omit<LinkItem, "id">) => {
    if (!editingLink) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/links/${editingLink.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        fetchLinks();
        setIsModalOpen(false);
        setEditingLink(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/links/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchLinks();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (link: LinkItem) => {
    setEditingLink(link);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingLink(null);
    setIsModalOpen(true);
  };

  // --- Filtering & Display Logic ---
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((link) => link.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [links]);

  const filteredLinks = useMemo(
    () =>
      links.filter((link) => matchesFilters(link, filters.query, filters.tags)),
    [links, filters]
  );

  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const clearFilters = () => setFilters({ query: "", tags: [] });

  const skeletonPlaceholders = Array.from({ length: SKELETON_COUNT }).map(
    (_, i) => (
      <div key={i} className="h-48 rounded-2xl bg-zinc-200 animate-pulse" />
    )
  );

  return (
    <div className="space-y-space-5 pt-24 pb-20">
      <PageMetadata
        title="Links"
        description="Your curated collection of bookmarks and resources."
        path="/links"
      />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-aura-text-primary">
            My Links
          </h1>
          <p className="text-aura-text-secondary mt-1">
            Build and manage your private library of inspiration.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium shadow-md hover:bg-indigo-500 transition active:scale-95"
        >
          + Add New Link
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-brand-surface-highlight/60 bg-brand-secondary/40 space-y-4">
        <div>
          <label
            htmlFor="search-links"
            className="text-xs font-semibold uppercase tracking-widest text-aura-text-secondary mb-1 block"
          >
            Search
          </label>
          <input
            id="search-links"
            type="search"
            placeholder="Search bookmarks..."
            className="w-full px-4 py-2 rounded-lg border border-brand-surface-highlight/60 bg-brand-primary/70 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={filters.query}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, query: e.target.value }))
            }
          />
        </div>
        {availableTags.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-aura-text-secondary mb-2 block">
              Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    filters.tags.includes(tag)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
        {(filters.query || filters.tags.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {status === "loading" ? (
          skeletonPlaceholders
        ) : filteredLinks.length > 0 ? (
          filteredLinks.map((link, idx) => {
            // Fallback image logic
            const bgIndex = (idx % 3) + 1;
            const fallbackImage = `/assets/links/bg-${bgIndex}.png`;
            const displayImage = link.image_url || fallbackImage;

            return (
              <div
                key={link.id}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Background Image */}
                <img
                  src={displayImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 hover:text-indigo-300 transition-colors">
                      {link.title}
                    </h3>
                  </a>
                  <p className="text-zinc-300 text-sm line-clamp-2 mb-3">
                    {link.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {link.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase font-bold text-white/80 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions (Edit/Delete) - Only visible on hover/focus-within for cleaner look, or always visible? 
                      Let's stick to visible but subtle. */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(link)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-white/10 text-white rounded hover:bg-white/20 backdrop-blur-md transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-red-500/20 text-red-200 rounded hover:bg-red-500/40 backdrop-blur-md transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-zinc-500">
            {links.length === 0
              ? "You haven't added any links yet. Create your first one!"
              : "No links match your filters."}
          </div>
        )}
      </div>

      <LinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingLink ? handleUpdate : handleCreate}
        initialData={editingLink}
      />
    </div>
  );
}

export default LinksPage;
