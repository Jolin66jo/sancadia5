import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppErrorBoundary from "@/components/AppErrorBoundary";

function BrokenScreen(): never {
  throw new Error("render failed");
}

describe("AppErrorBoundary", () => {
  const preventWindowError = (event: ErrorEvent) => event.preventDefault();

  beforeEach(() => {
    window.addEventListener("error", preventWindowError);
  });

  afterEach(() => {
    window.removeEventListener("error", preventWindowError);
    vi.restoreAllMocks();
  });

  it("shows a recovery screen and allows navigation back into the app", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={["/broken"]}>
        <AppErrorBoundary>
          <Routes>
            <Route path="/broken" element={<BrokenScreen />} />
            <Route path="/games" element={<h1>Choose a game</h1>} />
          </Routes>
        </AppErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "This screen couldn't load" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Back to games" }));
    expect(screen.getByRole("heading", { name: "Choose a game" })).toBeTruthy();
  });
});
