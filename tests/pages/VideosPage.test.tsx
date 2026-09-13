import { describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import VideosPage from "@/pages/VideosPage";
import { VIDEOS } from "@/constants";
import {
  collectFilterTags,
  collectLocations,
  collectPeople,
} from "@/utils/videoFilters";

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

    expect(cardCount()).toBe(VIDEOS.filter((v) => v.year === year).length);
    expect(screen.getByRole("combobox", { name: /year/i })).toHaveValue(String(year));
  });

  it("filters by each of the four axes", async () => {
    const user = userEvent.setup();

    const year = VIDEOS[0].year;
    const cases = [
      {
        label: /year/i,
        facet: {
          value: String(year),
          count: VIDEOS.filter((v) => v.year === year).length,
        },
      },
      // Someone on every video is a legitimate option but not a test of
      // narrowing, so pick a person who is on some of it.
      {
        label: /people/i,
        facet: collectPeople(VIDEOS).find((f) => f.count < VIDEOS.length)!,
      },
      { label: /location/i, facet: collectLocations(VIDEOS)[0] },
      { label: /tag/i, facet: collectFilterTags(VIDEOS)[0] },
    ];

    for (const { label, facet } of cases) {
      const router = renderPage();
      await user.selectOptions(screen.getByRole("combobox", { name: label }), facet.value);
      await waitFor(() => expect(cardCount()).toBe(facet.count));
      expect(router.state.location.search).not.toBe("");
      cleanup();
    }
  });

  it("returns to the whole library when an axis is set back to any", async () => {
    const user = userEvent.setup();
    const year = VIDEOS[0].year;
    renderPage(`/?year=${year}`);

    await user.selectOptions(screen.getByRole("combobox", { name: /year/i }), "");

    await waitFor(() => expect(cardCount()).toBe(VIDEOS.length));
  });

  it("offers every person, including the ones on most of the library", () => {
    // The regression this guards: the people most worth filtering by were the
    // ones a "too common to be useful" rule threw away.
    renderPage();
    const options = within(screen.getByRole("combobox", { name: /people/i }))
      .getAllByRole("option")
      .map((o) => o.textContent ?? "");

    expect(options.some((o) => o.startsWith("Stephen"))).toBe(true);
    expect(options.some((o) => o.startsWith("Michael"))).toBe(true);
  });

  it("offers every tag, down to the ones on a single video", () => {
    renderPage();
    const options = within(screen.getByRole("combobox", { name: /tag/i })).getAllByRole(
      "option",
    );
    // One option per tag, plus the "Any tag" row.
    expect(options).toHaveLength(collectFilterTags(VIDEOS).length + 1);
  });

  it("keeps the four axes out of the way on a phone, behind one control", async () => {
    const user = userEvent.setup();
    renderPage();

    const toggle = screen.getByRole("button", { name: /^filters/i });
    const panel = document.getElementById(toggle.getAttribute("aria-controls")!)!;

    // Hidden at phone width, laid out as a row once there is room for it.
    expect(panel.className).toContain("hidden");
    expect(panel.className).toContain("md:grid");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
    expect(panel.className).not.toContain("hidden");
  });

  it("badges the collapsed control with how many axes are narrowing", () => {
    renderPage(`/?year=${VIDEOS[0].year}&tag=beach`);
    expect(screen.getByRole("button", { name: /^filters/i }).textContent).toContain("2");
  });

  it("does not badge the collapsed control for the search box beside it", () => {
    renderPage("/?q=maui");
    expect(screen.getByRole("button", { name: /^filters/i }).textContent).toBe("Filters");
  });

  it("keeps every filter control at a comfortable touch target", () => {
    renderPage();
    // Same 44px the player's controls use; these are tapped on a phone too.
    for (const control of [
      ...screen.getAllByRole("combobox"),
      screen.getByRole("searchbox"),
      screen.getByRole("button", { name: /^filters/i }),
    ]) {
      expect(control.className).toContain("min-h-[2.75rem]");
    }
  });

  it("shows a filter the list no longer carries, rather than reading empty", () => {
    // Michael moved from the tag list to the People list. A link shared before
    // that still narrows the grid, so the control has to admit it.
    renderPage("/?tag=Michael");

    expect(screen.getByRole("combobox", { name: /tag/i })).toHaveValue("Michael");
    expect(cardCount()).toBe(VIDEOS.filter((v) => v.tags?.includes("Michael")).length);
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
    const router = renderPage(
      `/?q=maui&year=${VIDEOS[0].year}&person=Stephen&location=Maui&tag=beach`,
    );

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
