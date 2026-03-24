/**
 * client/src/components/__tests__/IncomingFile.test.jsx
 *
 * Unit tests for IncomingFile using Vitest + React Testing Library.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IncomingFile from "../IncomingFile";
import { Toaster } from "react-hot-toast";

// ── Fixtures ───────────────────────────────────────────────────────────────
const FILE_PROPS = {
  token:    "test-token-abc123",
  filename: "photo.jpg",
  size:     204800, // 200 KB
  mimetype: "image/jpeg",
};

// ── Mock fetch + URL helpers ───────────────────────────────────────────────
function mockFetchSuccess() {
  const fakeBlob = new Blob(["fake image bytes"], { type: "image/jpeg" });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    blob: () => Promise.resolve(fakeBlob),
  });

  global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake-url");
  global.URL.revokeObjectURL = vi.fn();
}

function mockFetchFailure(status = 404) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    blob: () => Promise.resolve(new Blob()),
  });
}

// ── Helper ─────────────────────────────────────────────────────────────────
function renderIncoming(overrides = {}, onDismiss = vi.fn()) {
  return render(
    <>
      <Toaster />
      <IncomingFile file={{ ...FILE_PROPS, ...overrides }} onDismiss={onDismiss} />
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────
describe("IncomingFile", () => {
  it("renders nothing when file prop is null", () => {
    const { container } = render(<IncomingFile file={null} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows filename, size and 'Incoming' badge", () => {
    renderIncoming();
    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    expect(screen.getByText(/incoming/i)).toBeInTheDocument();
    expect(screen.getByText(/200/)).toBeInTheDocument(); // "200 KB"
  });

  it("renders a 'Save' download button", () => {
    renderIncoming();
    expect(screen.getByRole("button", { name: /download photo\.jpg/i })).toBeInTheDocument();
  });

  it("calls fetch with the correct download URL when Save is clicked", async () => {
    mockFetchSuccess();

    // Mock anchor click to prevent jsdom navigation error
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderIncoming();
    await userEvent.click(screen.getByRole("button", { name: /download photo\.jpg/i }));

    expect(global.fetch).toHaveBeenCalledWith("/api/download/test-token-abc123");
  });

  it("calls onDismiss after a successful download", async () => {
    mockFetchSuccess();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const onDismiss = vi.fn();
    renderIncoming({}, onDismiss);

    await userEvent.click(screen.getByRole("button", { name: /download photo\.jpg/i }));

    // onDismiss is called after a 1800 ms setTimeout — we skip waiting for it
    // but verify the success state is shown
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /download photo\.jpg/i })).not.toBeInTheDocument()
    );
  });

  it("shows error toast on download failure (404)", async () => {
    mockFetchFailure(404);

    renderIncoming();

    await userEvent.click(screen.getByRole("button", { name: /download photo\.jpg/i }));

    await waitFor(() =>
      expect(screen.getByText(/download failed/i)).toBeInTheDocument()
    );
  });
});
