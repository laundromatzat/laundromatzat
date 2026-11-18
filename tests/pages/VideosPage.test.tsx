import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import VideosPage from "@/pages/VideosPage";
import { VIDEOS } from "@/constants";
import { collectPeople, collectYears } from "@/utils/videoFilters";

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

  /** Open one axis's list and return it. */
  async function openAxis(user: ReturnType<typeof userEvent.setup>, axis: RegExp) {
    const button = screen.getByRole("button", { name: axis });
    await user.click(button);
    const list = document.getElementById(button.getAttribute("aria-controls")!);
    if (!list) throw new Error("list did not open");
    return { button, list };
  }

  const countFor = (years: number[]) => VIDEOS.filter((v) => years.includes(v.year)).length;

  it("restores several picks per axis from the URL on arrival", async () => {
    const user = userEvent.setup();
    const [a, b] = collectYears(VIDEOS).map((f) => Number(f.value));
    renderPage(`/?year=${a}&year=${b}`);

    expect(cardCount()).toBe(countFor([a, b]));

    const { list } = await openAxis(user, /^Year/);
    expect(within(list).getByRole("checkbox", { name: String(a) })).toBeChecked();
    expect(within(list).getByRole("checkbox", { name: String(b) })).toBeChecked();
  });

  it("shows videos from either of two years, not only from both", async () => {
    const user = userEvent.setup();
    const [a, b] = collectYears(VIDEOS).map((f) => Number(f.value));
    const router = renderPage();

    const { list } = await openAxis(user, /^Year/);
    await user.click(within(list).getByRole("checkbox", { name: String(a) }));
    await user.click(within(list).getByRole("checkbox", { name: String(b) }));

    await waitFor(() => expect(cardCount()).toBe(countFor([a, b])));
    expect(new URLSearchParams(router.state.location.search).getAll("year")).toEqual([
      String(a),
      String(b),
    ]);
    // The list stays open between picks, since picking several is the point.
    expect(within(list).getByRole("checkbox", { name: String(a) })).toBeChecked();
  });

  it("shows videos with either of two people", async () => {
    const user = userEvent.setup();
    renderPage();

    const { list } = await openAxis(user, /^People/);
    await user.click(within(list).getByRole("checkbox", { name: "Emily" }));
    await user.click(within(list).getByRole("checkbox", { name: "Eli" }));

    const either = VIDEOS.filter((v) =>
      (v.tags ?? []).some((t) => t === "Emily" || t === "Eli"),
    ).length;
    await waitFor(() => expect(cardCount()).toBe(either));
  });

  it("unpicks a value on a second click", async () => {
    const user = userEvent.setup();
    const [a] = collectYears(VIDEOS).map((f) => Number(f.value));
    renderPage(`/?year=${a}`);

    const { list } = await openAxis(user, /^Year/);
    await user.click(within(list).getByRole("checkbox", { name: String(a) }));

    await waitFor(() => expect(cardCount()).toBe(VIDEOS.length));
  });

  it("sums up the picks on the button once the list closes", async () => {
    const [a, b] = collectYears(VIDEOS).map((f) => Number(f.value));
    renderPage(`/?year=${a}&year=${b}`);
    expect(screen.getByRole("button", { name: /^Year/ })).toHaveTextContent(`${a}, ${b}`);
  });

  it("files locations under regions, with the state or country spelled out", async () => {
    const user = userEvent.setup();
    renderPage();

    const { list } = await openAxis(user, /^Location/);
    const headings = within(list)
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-label"));
    expect(headings).toEqual([
      "United States",
      "West",
      "Southwest",
      "East",
      "Canada",
      "Mexico",
      "Europe",
    ]);

    const west = within(list).getByRole("group", { name: "West" });
    expect(within(west).getByRole("checkbox", { name: "Big Island, HI" })).toBeInTheDocument();
    expect(within(west).getByRole("checkbox", { name: "Maui, HI" })).toBeInTheDocument();

    const europe = within(list).getByRole("group", { name: "Europe" });
    expect(within(europe).getByRole("checkbox", { name: "Madrid, Spain" })).toBeInTheDocument();
  });

  it("leaves out a region with nothing in it yet", async () => {
    // Midwest is in the data for when a video arrives there; until then a
    // heading over an empty list would only be in the way.
    const user = userEvent.setup();
    renderPage();
    const { list } = await openAxis(user, /^Location/);
    expect(within(list).queryByRole("group", { name: "Midwest" })).toBeNull();
  });

  it("lists a place in two regions under both, picked as one", async () => {
    const user = userEvent.setup();
    renderPage();

    const { list } = await openAxis(user, /^Location/);
    const both = within(list).getAllByRole("checkbox", {
      name: "Seattle, WA and Vancouver, BC",
    });
    expect(both).toHaveLength(2);

    await user.click(both[0]);

    await waitFor(() => expect(both[1]).toBeChecked());
    expect(cardCount()).toBe(VIDEOS.filter((v) => v.location === "Seattle and Vancouver").length);
  });

  it("narrows to a location picked from inside a region", async () => {
    const user = userEvent.setup();
    renderPage();

    const { list } = await openAxis(user, /^Location/);
    await user.click(within(list).getByRole("checkbox", { name: "Maui, HI" }));
    await user.click(within(list).getByRole("checkbox", { name: "Madrid, Spain" }));

    const expected = VIDEOS.filter((v) => v.location === "Maui" || v.location === "Madrid").length;
    await waitFor(() => expect(cardCount()).toBe(expected));
  });

  it("closes a list with Escape and hands focus back to its button", async () => {
    const user = userEvent.setup();
    renderPage();

    const { button, list } = await openAxis(user, /^Year/);
    within(list).getAllByRole("checkbox")[0].focus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "false"));
    expect(button).toHaveFocus();
  });

  it("closes a list on a click elsewhere, and keeps only one open at a time", async () => {
    const user = userEvent.setup();
    renderPage();

    const year = await openAxis(user, /^Year/);
    const people = await openAxis(user, /^People/);

    expect(year.button).toHaveAttribute("aria-expanded", "false");
    expect(people.button).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByText(/videos, newest first/));
    await waitFor(() => expect(people.button).toHaveAttribute("aria-expanded", "false"));
  });

  it("clears one axis from inside its list without touching the others", async () => {
    const user = userEvent.setup();
    const [a, b] = collectYears(VIDEOS).map((f) => Number(f.value));
    const router = renderPage(`/?year=${a}&year=${b}&person=Stephen`);

    const { list } = await openAxis(user, /^Year/);
    await user.click(within(list).getByRole("button", { name: /clear year/i }));

    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).getAll("year")).toEqual([]),
    );
    expect(new URLSearchParams(router.state.location.search).get("person")).toBe("Stephen");
  });

  it("offers every person, including the ones on most of the library", async () => {
    // The regression this guards: the people most worth filtering by were the
    // ones a "too common to be useful" rule threw away.
    const user = userEvent.setup();
    renderPage();
    const { list } = await openAxis(user, /^People/);

    expect(within(list).getByRole("checkbox", { name: "Stephen" })).toBeInTheDocument();
    expect(within(list).getByRole("checkbox", { name: "Michael" })).toBeInTheDocument();
    expect(within(list).getAllByRole("checkbox")).toHaveLength(collectPeople(VIDEOS).length);
  });

  it("has no tag filter any more", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /^Tag/ })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("keeps the axes out of the way on a phone, behind one control", async () => {
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

  it("badges the collapsed control with how many picks are narrowing", () => {
    const [a, b] = collectYears(VIDEOS).map((f) => f.value);
    renderPage(`/?year=${a}&year=${b}&person=Eli`);
    expect(screen.getByRole("button", { name: /^filters/i }).textContent).toContain("3");
  });

  it("does not badge the collapsed control for the search box beside it", () => {
    renderPage("/?q=maui");
    expect(screen.getByRole("button", { name: /^filters/i }).textContent).toBe("Filters");
  });

  it("keeps every filter control, and every option, at a comfortable touch target", async () => {
    // Same 44px the player's controls use; these are tapped on a phone too.
    const user = userEvent.setup();
    renderPage();

    const { list } = await openAxis(user, /^Location/);
    const controls = [
      screen.getByRole("searchbox"),
      screen.getByRole("button", { name: /^filters/i }),
      screen.getByRole("button", { name: /^Year/ }),
      screen.getByRole("button", { name: /^People/ }),
      screen.getByRole("button", { name: /^Location/ }),
      ...within(list)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")!),
    ];
    for (const control of controls) {
      expect(control.className).toContain("min-h-[2.75rem]");
    }
  });

  it("never lets one control's style silently override another's", async () => {
    // The regression this guards: CONTROL carried `w-full`, and the Filters
    // button appended `w-auto` to undo it. Both are width utilities with equal
    // specificity, so the winner is whichever Tailwind emits last -- and it
    // emits `.w-full` after `.w-auto`. The button took the whole row and sat on
    // top of the search box. jsdom has no layout and the e2e suite serves the
    // dev server, whose incrementally-built stylesheet can order the two rules
    // the other way, so neither would catch it: the class strings are the
    // evidence.
    const user = userEvent.setup();
    renderPage(`/?year=${VIDEOS[0].year}`);

    /** Utilities from one group, ignoring breakpoint variants, which cannot collide. */
    const sameGroup = (className: string, group: string) =>
      className
        .split(/\s+/)
        .filter((name) => name && !name.includes(":") && name.startsWith(group));

    const { list } = await openAxis(user, /^Location/);
    const headings = [...list.querySelectorAll("p")];
    const controls = [
      screen.getByRole("searchbox"),
      screen.getByRole("button", { name: /^filters/i }),
      screen.getByRole("button", { name: /^Year/ }),
      screen.getByRole("button", { name: /^People/ }),
      screen.getByRole("button", { name: /^Location/ }),
      ...within(list)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")!),
      ...headings,
    ];

    for (const control of controls) {
      for (const group of ["w-", "px-", "pl-", "pr-", "border-aura-"]) {
        expect(sameGroup(control.className, group).length).toBeLessThanOrEqual(1);
      }
      // An axis shorthand plus a side utility is the same collision by another name.
      const classes = control.className.split(/\s+/);
      const hasPx = classes.some((c) => c.startsWith("px-"));
      const hasSide = classes.some((c) => c.startsWith("pl-") || c.startsWith("pr-"));
      expect(hasPx && hasSide).toBe(false);
    }
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
      `/?q=maui&year=${VIDEOS[0].year}&year=2019&person=Stephen&person=Eli&location=Maui`,
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
