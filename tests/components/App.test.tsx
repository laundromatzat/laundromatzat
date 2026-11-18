import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import App from "@/App";

/** App renders <ScrollRestoration>, which only works under a data router. */
function renderApp(children: React.ReactNode) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <App />,
        children: [
          { index: true, element: children },
          { path: "other", element: <p>Another page</p> },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );

  return {
    router,
    ...render(
      <HelmetProvider>
        <RouterProvider router={router} />
      </HelmetProvider>,
    ),
  };
}

async function settleFrames() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => setTimeout(resolve, 20));
}

describe("App focus management", () => {
  it("focuses main on navigation so a screen reader announces the new page", async () => {
    const { container } = renderApp(<p>Page body</p>);
    const main = container.querySelector("main");

    await waitFor(() => expect(document.activeElement).toBe(main));
  });

  it("leaves focus alone while a modal dialog is open", async () => {
    // The player changes the URL on every paging step; stealing focus back to
    // <main> each time would drop the visitor behind the overlay.
    const { container } = renderApp(
      <div role="dialog" aria-modal="true" aria-label="Player" tabIndex={-1}>
        <button type="button">Close</button>
      </div>,
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    dialog.focus();
    await settleFrames();

    expect(document.activeElement).toBe(dialog);
  });

  it("leaves focus alone when only the query string changes", async () => {
    // Every filter pick rewrites the query string. Treating that as a new page
    // threw focus from the checkbox just ticked to <main>, so a keyboard user
    // lost their place in the list after each pick and a screen reader
    // announced the page afresh.
    const { container, router } = renderApp(
      <label>
        <input type="checkbox" /> 2020
      </label>,
    );
    await waitFor(() => expect(document.activeElement).toBe(container.querySelector("main")));

    const box = container.querySelector("input") as HTMLInputElement;
    box.focus();
    await router.navigate("/?year=2020", { replace: true });
    await settleFrames();

    expect(document.activeElement).toBe(box);
  });

  it("still moves focus when the page itself changes", async () => {
    const { container, router } = renderApp(<button type="button">Somewhere</button>);
    (container.querySelector("button") as HTMLButtonElement).focus();

    await router.navigate("/other");

    await waitFor(() => expect(document.activeElement).toBe(container.querySelector("main")));
  });
});
