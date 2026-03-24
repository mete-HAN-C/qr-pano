/**
 * client/src/components/__tests__/FileTransferPanel.test.jsx
 *
 * Unit tests for FileTransferPanel using Vitest + React Testing Library.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileTransferPanel from "../FileTransferPanel";
import { Toaster } from "react-hot-toast";

// ── Helpers ────────────────────────────────────────────────────────────────
function renderPanel(props = {}) {
  return render(
    <>
      <Toaster />
      <FileTransferPanel isConnected={true} {...props} />
    </>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("FileTransferPanel", () => {
  it("renders without crashing and shows heading", () => {
    renderPanel();
    expect(screen.getByText("File Transfer")).toBeInTheDocument();
  });

  it("shows 'drop a file here' prompt in idle state", () => {
    renderPanel();
    expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
  });

  it("'Send File' button is disabled when no file is selected", () => {
    renderPanel();
    const btn = screen.getByRole("button", { name: /send file/i });
    expect(btn).toBeDisabled();
  });

  it("'Send File' button is disabled when not connected, even with a file", async () => {
    renderPanel({ isConnected: false });

    const input = screen.getByLabelText("File input");
    const testFile = new File(["hello"], "hello.txt", { type: "text/plain" });
    await userEvent.upload(input, testFile);

    const btn = screen.getByRole("button", { name: /send file/i });
    expect(btn).toBeDisabled();
  });

  it("shows file name and size after selecting a file", async () => {
    renderPanel();

    const input    = screen.getByLabelText("File input");
    const testFile = new File(["hello world"], "test-doc.txt", { type: "text/plain" });
    await userEvent.upload(input, testFile);

    expect(screen.getByText("test-doc.txt")).toBeInTheDocument();
    expect(screen.getByText(/text\/plain/i)).toBeInTheDocument();
  });

  it("shows 'Clear' button after selecting a file and it clears the selection", async () => {
    renderPanel();

    const input    = screen.getByLabelText("File input");
    const testFile = new File(["data"], "data.pdf", { type: "application/pdf" });
    await userEvent.upload(input, testFile);

    expect(screen.getByText("data.pdf")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: /clear/i });
    await userEvent.click(clearBtn);

    // After clearing, drop prompt should be visible again
    expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
  });

  it("enables 'Send File' button when connected and a file is selected", async () => {
    renderPanel({ isConnected: true });

    const input    = screen.getByLabelText("File input");
    const testFile = new File(["ping"], "ping.txt", { type: "text/plain" });
    await userEvent.upload(input, testFile);

    const btn = screen.getByRole("button", { name: /send file/i });
    expect(btn).not.toBeDisabled();
  });
});
