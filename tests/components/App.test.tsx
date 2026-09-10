import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import App from "@/App";

/** App renders <ScrollRestoration>, which only works under a data router. */
function renderApp(children: React.ReactNode) {
  const router = createMemoryRouter(
    [{ path: "/", element: <App />, children: [{ index: true, element: children }] }],
    { initialEntries: ["/"] },
  );

  return render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  );
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
});
