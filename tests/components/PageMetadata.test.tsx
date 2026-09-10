import { describe, expect, it, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import PageMetadata from "@/components/PageMetadata";
import { renderWithProviders } from "../utils/testUtils";

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("content") ?? null;
}

describe("PageMetadata", () => {
  beforeEach(() => {
    document.head.querySelectorAll("meta, link, title").forEach((el) => el.remove());
  });

  it("emits the image tags link unfurlers need", async () => {
    renderWithProviders(
      <PageMetadata
        title="Drift Away"
        description="A road film."
        path="/vids/drift-away"
        type="video.other"
        image="https://example.com/thumb.webp"
        imageAlt="Drift Away"
        videoUrl="https://example.com/video.m4v"
      />,
    );

    await waitFor(() => {
      expect(metaContent('meta[property="og:image"]')).toBe(
        "https://example.com/thumb.webp",
      );
    });

    expect(metaContent('meta[property="og:image:alt"]')).toBe("Drift Away");
    expect(metaContent('meta[name="twitter:image"]')).toBe(
      "https://example.com/thumb.webp",
    );
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(metaContent('meta[property="og:type"]')).toBe("video.other");
    expect(metaContent('meta[property="og:video"]')).toBe(
      "https://example.com/video.m4v",
    );
  });

  it("omits the image tags when there is no image", async () => {
    renderWithProviders(<PageMetadata title="Music Videos" path="/" />);

    await waitFor(() => {
      expect(metaContent('meta[property="og:title"]')).toBe(
        "Music Videos · Laundromatzat",
      );
    });

    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:video"]')).toBeNull();
  });

  it("removes prerendered tags so they cannot go stale", async () => {
    const stale = document.createElement("meta");
    stale.setAttribute("property", "og:image");
    stale.setAttribute("content", "https://example.com/stale.webp");
    stale.setAttribute("data-prerendered", "");
    document.head.appendChild(stale);

    renderWithProviders(
      <PageMetadata title="Drift Away" path="/vids/drift-away" image="https://example.com/fresh.webp" />,
    );

    await waitFor(() => {
      expect(document.head.querySelector("[data-prerendered]")).toBeNull();
    });

    expect(metaContent('meta[property="og:image"]')).toBe(
      "https://example.com/fresh.webp",
    );
  });
});
