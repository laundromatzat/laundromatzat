import React from "react";
import { Trash2, Eye } from "lucide-react";

interface AccountItemCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  type:
    | "palette"
    | "backgroundRemoval"
    | "woodCarving"
    | "pinPals"
    | "neuroaesthetic"
    | "mediscribe"
    | "publicHealth"
    | "paystub";
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
}

export default function AccountItemCard({
  item,
  type,
  onDelete,
  onView,
}: AccountItemCardProps) {
  const getImageUrl = () => {
    switch (type) {
      case "palette":
        return item.image_data_url;
      case "backgroundRemoval":
        return item.result_image_data_url;
      case "woodCarving": {
        const selected = item.selected_variation_json
          ? JSON.parse(item.selected_variation_json)
          : null;
        return selected?.imageUrl;
      }
      case "pinPals":
        return item.design_url;
      case "neuroaesthetic":
        return item.design_url;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "palette":
        return item.file_name;
      case "backgroundRemoval":
        return item.file_name;
      case "woodCarving":
        return item.description;
      case "pinPals":
        return item.style || "Pin Design";
      case "neuroaesthetic":
        return item.prompt || "Neuroaesthetic Design";
      case "mediscribe":
        return `MediScribe Note`;
      case "publicHealth":
        return "Public Health Document";
      case "paystub":
        return "Paystub Analysis";
      default:
        return "Item";
    }
  };

  const getSubtitle = () => {
    const date = new Date(item.created_at);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const imageUrl = getImageUrl();
  const title = getTitle();
  const subtitle = getSubtitle();

  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-aura-accent/50 transition-all group">
      {/* Image Preview */}
      {imageUrl && !imageError ? (
        <div className="aspect-video bg-black/20 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {onView && (
              <button
                onClick={() => onView(item.id)}
                className="bg-aura-accent text-white p-2 rounded-lg hover:bg-aura-accent/80 transition"
                aria-label="View item"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                aria-label="Delete item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-medium truncate mb-1">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>

        {/* Type-specific metadata */}
        {type === "palette" && item.palette_json && (
          <div className="flex gap-1 mt-3">
            {JSON.parse(item.palette_json)
              .slice(0, 5)
              .map((color: { hex: string }, i: number) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded border border-white/20"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
              ))}
          </div>
        )}

        {type === "woodCarving" && item.blueprint_json && (
          <div className="mt-2">
            <span className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded">
              Blueprint Complete
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
