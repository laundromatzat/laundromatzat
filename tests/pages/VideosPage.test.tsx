import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import VideosPage from "@/pages/VideosPage";
import { VIDEOS } from "@/constants";
import { collectFilterTags } from "@/utils/videoFilters";

function renderPage(initialEntry = "/") {
  const router = createMemoryRouter(
    [
      { path: "/", element: <VideosPage /> },
      { path: "/vids/:slug", element: <VideosPage /> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  );
  return router;
}

function cardCount() {
  return within(screen.getByTestId("project-grid")).getAllByRole("listitem").length;
}

describe("VideosPage filtering", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  });

  it("shows the whole library by default", () => {
    renderPage();
    expect(cardCount()).toBe(VIDEOS.length);
    expect(screen.getByText(`${VIDEOS.length} videos, newest first`)).toBeInTheDocument();
  });

  it("narrows as you type, and says how much is left", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole("searchbox", { name: /search/i }), "maui");

    await waitFor(() => expect(cardCount()).toBeLessThan(VIDEOS.length));
    expect(screen.getByText(new RegExp(`of ${VIDEOS.length} videos`))).toBeInTheDocument();
  });

  it("puts the filter in the URL so a narrowed view can be shared", async () => {
    const user = userEvent.setup();
    const router = renderPage();

    await user.type(screen.getByRole("searchbox", { name: /search/i }), "maui");

    await waitFor(() =>
      expect(router.state.location.search).toContain("q=maui"),
    );
  });

  it("restores filters from the URL on arrival", () => {
    const year = VIDEOS[0].year;
    renderPage(`/?year=${year}`);

    const expected = VIDEOS.filter((v) => v.year === year).length;
    expect(cardCount()).toBe(expected);
    expect(
      screen.getByRole("button", { name: String(year), pressed: true }),
    ).toBeInTheDocument();
  });

  it("toggles a year chip off when pressed again", async () => {
    const user = userEvent.setup();
    const year = VIDEOS[0].year;
    renderPage(`/?year=${year}`);

    await user.click(screen.getByRole("button", { name: String(year), pressed: true }));

    await waitFor(() => expect(cardCount()).toBe(VIDEOS.length));
  });

  it("filters by a tag chip", async () => {
    const user = userEvent.setup();
    const facet = collectFilterTags(VIDEOS)[0];
    renderPage();

    await user.click(screen.getByRole("button", { name: new RegExp(`^${facet.tag}`) }));

    await waitFor(() => expect(cardCount()).toBe(facet.count));
  });

  it("offers no chip for a tag that would filter to everything or to one card", () => {
    renderPage();
    const group = screen.getByRole("group", { name: /filter by tag/i });
    const labels = within(group)
      .getAllByRole("button")
      .map((b) => b.textContent ?? "");

    expect(labels.some((l) => l.startsWith("video"))).toBe(false);
    expect(labels.some((l) => l.startsWith("Michael"))).toBe(false);
  });

  it("keeps every filter control at a comfortable touch target", () => {
    renderPage();
    // Same 44px the player's controls use; these are tapped on a phone too.
    for (const group of [/filter by year/i, /filter by tag/i]) {
      for (const chip of within(screen.getByRole("group", { name: group })).getAllByRole(
        "button",
      )) {
        expect(chip.className).toContain("min-h-[2.75rem]");
      }
    }
    expect(screen.getByRole("searchbox").className).toContain("min-h-[2.75rem]");
  });

  it("collapses a long tag row behind a toggle, and expands it again", async () => {
    const user = userEvent.setup();
    const total = collectFilterTags(VIDEOS).length;
    renderPage();

    const group = () => screen.getByRole("group", { name: /filter by tag/i });
    const chips = () => within(group()).getAllByRole("button").length;

    if (total <= 10) {
      // Nothing to collapse at this library size.
      expect(within(group()).queryByRole("button", { name: /show all/i })).toBeNull();
      return;
    }

    const collapsed = chips();
    expect(collapsed).toBeLessThan(total + 1);

    await user.click(within(group()).getByRole("button", { name: /show all/i }));
    await waitFor(() => expect(chips()).toBeGreaterThan(collapsed));

    await user.click(within(group()).getByRole("button", { name: /show fewer/i }));
    await waitFor(() => expect(chips()).toBe(collapsed));
  });

  it("keeps a selected tag visible even when it sits past the cut", async () => {
    const facets = collectFilterTags(VIDEOS);
    if (facets.length <= 10) return;

    const hidden = facets[facets.length - 1];
    renderPage(`/?tag=${encodeURIComponent(hidden.tag)}`);

    expect(
      screen.getByRole("button", { name: new RegExp(`^${hidden.tag}`), pressed: true }),
    ).toBeInTheDocument();
  });

  it("explains an empty result and offers a way out", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByRole("searchbox", { name: /search/i }),
      "zzzznothingmatchesthis",
    );

    expect(await screen.findByText(/nothing matches that/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /clear filters/i })[0]);
    await waitFor(() => expect(cardCount()).toBe(VIDEOS.length));
  });

  it("clears every filter at once", async () => {
    const user = userEvent.setup();
    const router = renderPage(`/?q=maui&year=${VIDEOS[0].year}`);

    await user.click(screen.getAllByRole("button", { name: /clear filters/i })[0]);

    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(cardCount()).toBe(VIDEOS.length);
  });

  it("still opens a deep-linked video the filters would exclude", async () => {
    // A shared link has to work whatever the recipient's filters say.
    const target = VIDEOS.find((v) => v.year !== VIDEOS[0].year) ?? VIDEOS[0];
    const slug = target.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

    renderPage(`/vids/${slug}?year=1900`);

    expect(await screen.findByRole("dialog")).toHaveAccessibleName(target.title);
  });

  it("carries the filters along when opening a video", async () => {
    const user = userEvent.setup();
    const router = renderPage("/?q=a");

    // The card itself carries the handler; the <li> around it does not, and a
    // click on an ancestor never reaches a descendant's listener.
    await user.click(
      within(screen.getByTestId("project-grid")).getAllByRole("button")[0],
    );

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/vids\//));
    expect(router.state.location.search).toContain("q=a");
  });
});
