import React, { useEffect, useMemo, useState } from "react";
import PageMetadata from "@/components/PageMetadata";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import Container from "@/components/Container";
import {
  AuraButton,
  AuraCard,
  AuraInput,
  AuraModal,
  AuraBadge,
} from "@/components/aura";
import { Plus, Search, Trash2, Edit2, ExternalLink } from "lucide-react";

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

// Modal Component for Add/Edit
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

  const handleSubmit = () => {
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
  };

  return (
    <AuraModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Link" : "Add New Link"}
      size="md"
    >
      <div className="space-y-4">
        <AuraInput
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Design Inspiration"
          fullWidth
        />
        <AuraInput
          label="URL"
          inputType="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://example.com"
          fullWidth
        />
        <AuraInput
          label="Description"
          inputType="textarea"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="A brief description..."
          fullWidth
          rows={3}
        />
        <AuraInput
          label="Tags (comma separated)"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="design, resources, tools"
          fullWidth
        />
        <AuraInput
          label="Image URL (optional)"
          inputType="url"
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
          placeholder="https://example.com/image.jpg"
          fullWidth
        />
        <div className="flex justify-end gap-3 pt-4">
          <AuraButton onClick={onClose} variant="ghost">
            Cancel
          </AuraButton>
          <AuraButton onClick={handleSubmit} variant="primary">
            Save
          </AuraButton>
        </div>
      </div>
    </AuraModal>
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
      const res = await fetch(getApiUrl("/api/links"), {
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
      const res = await fetch(getApiUrl("/api/links"), {
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
      const res = await fetch(getApiUrl(`/api/links/${editingLink.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
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
      const res = await fetch(getApiUrl(`/api/links/${id}`), {
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
      <AuraCard
        key={i}
        className="h-48 animate-pulse bg-aura-surface-elevated"
      />
    )
  );

  return (
    <Container className="space-y-8 pt-8 pb-20">
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
        <AuraButton
          onClick={openCreateModal}
          variant="primary"
          icon={<Plus size={18} />}
        >
          Add New Link
        </AuraButton>
      </div>

      {/* Filters */}
      <AuraCard variant="bordered" padding="md" className="space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-aura-text-secondary mb-2 block">
            Search
          </span>
          <AuraInput
            placeholder="Search bookmarks..."
            prefixIcon={<Search size={16} />}
            value={filters.query}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, query: e.target.value }))
            }
            fullWidth
          />
        </div>
        {availableTags.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-aura-text-secondary mb-2 block">
              Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <AuraButton
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  variant={filters.tags.includes(tag) ? "accent" : "secondary"}
                  size="sm"
                  className="capitalize"
                >
                  #{tag}
                </AuraButton>
              ))}
            </div>
          </div>
        )}
        {(filters.query || filters.tags.length > 0) && (
          <AuraButton
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-aura-accent hover:underline px-0"
          >
            Clear all filters
          </AuraButton>
        )}
      </AuraCard>

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
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-aura-surface shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 block"
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
                    className="block group-hover:text-aura-accent transition-colors"
                  >
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 transition-colors">
                      {link.title}
                    </h3>
                  </a>
                  <p className="text-zinc-300 text-sm line-clamp-2 mb-3">
                    {link.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {link.tags.slice(0, 3).map((tag) => (
                      <AuraBadge
                        key={tag}
                        variant="neutral"
                        size="sm"
                        className="bg-white/10 text-white border-none backdrop-blur-sm"
                      >
                        {tag}
                      </AuraBadge>
                    ))}
                  </div>

                  {/* Actions (Edit/Delete) */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(link)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-white/10 text-white rounded hover:bg-white/20 backdrop-blur-md transition flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="flex-1 py-1.5 text-xs font-semibold bg-red-500/20 text-red-200 rounded hover:bg-red-500/40 backdrop-blur-md transition flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 text-xs font-semibold bg-indigo-500/20 text-indigo-200 rounded hover:bg-indigo-500/40 backdrop-blur-md transition flex items-center justify-center gap-1"
                    >
                      <ExternalLink size={12} /> Visit
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-aura-text-tertiary">
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
    </Container>
  );
}

export default LinksPage;
