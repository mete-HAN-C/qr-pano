/**
 * server/__tests__/upload.test.js
 *
 * Integration tests for the QR-Pano file-transfer endpoints.
 * Uses Supertest to drive the Express app — no actual HTTP port is opened.
 *
 * Test cases:
 *  1. GET /api/info        — existing endpoint still works
 *  2. POST /api/upload     — stores file in RAM, returns token metadata
 *  3. GET /api/download/:token — serves the file with correct headers
 *  4. One-shot guarantee   — second download of the same token → 404
 *  5. Unknown token        — 404 for a completely random token
 *  6. Missing file field   — 400 when no file is sent
 */

const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const request = require("supertest");
const { app, httpServer, fileStore } = require("../index");

// ── Server lifecycle ─────────────────────────────────────────────────────────
// We need the httpServer to be listening so Socket.io initialises correctly,
// but we close it immediately after all tests finish.

beforeAll((done) => {
  httpServer.listen(0, "127.0.0.1", done); // port 0 → OS picks a free port
});

afterAll((done) => {
  fileStore.clear(); // clean up any residual RAM entries
  httpServer.close(done);
});

// ── Test file fixture ────────────────────────────────────────────────────────
const FIXTURE_CONTENT  = Buffer.from("Hello, QR-Pano! This is a test file. 🎉");
const FIXTURE_FILENAME = "test-fixture.txt";
const FIXTURE_MIMETYPE = "text/plain";

// ── 1. GET /api/info ─────────────────────────────────────────────────────────
describe("GET /api/info", () => {
  it("returns ip and port as JSON", async () => {
    const res = await request(app).get("/api/info");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ip");
    expect(res.body).toHaveProperty("port");
  });
});

// ── 2. POST /api/upload ──────────────────────────────────────────────────────
describe("POST /api/upload", () => {
  it("stores the file in RAM and returns token metadata", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", FIXTURE_CONTENT, {
        filename: FIXTURE_FILENAME,
        contentType: FIXTURE_MIMETYPE,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("filename", FIXTURE_FILENAME);
    expect(res.body).toHaveProperty("size", FIXTURE_CONTENT.length);
    expect(res.body).toHaveProperty("mimetype", FIXTURE_MIMETYPE);

    // Clean up the fileStore entry so other tests are not affected
    fileStore.delete(res.body.token);
  });

  it("returns 400 when no file field is provided", async () => {
    const res = await request(app)
      .post("/api/upload")
      .field("not_a_file", "some value"); // multipart but no 'file' field

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

// ── 3 + 4. GET /api/download/:token (success + one-shot) ─────────────────────
describe("GET /api/download/:token", () => {
  let uploadToken;

  // Upload once, then run download tests against that token
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", FIXTURE_CONTENT, {
        filename: FIXTURE_FILENAME,
        contentType: FIXTURE_MIMETYPE,
      });
    uploadToken = res.body.token;
  });

  it("serves the file with correct headers on the first request", async () => {
    const res = await request(app).get(`/api/download/${uploadToken}`);

    expect(res.status).toBe(200);

    // Content-Disposition must include 'attachment'
    expect(res.headers["content-disposition"]).toMatch(/attachment/i);

    // Cache-Control must prevent caching
    expect(res.headers["cache-control"]).toBe("no-store");

    // Body must be identical — for text/plain supertest gives us res.text
    expect(res.text).toBe(FIXTURE_CONTENT.toString());
  });

  it("returns 404 on the second request for the same token (one-shot guarantee)", async () => {
    // Token was already consumed in the previous test
    const res = await request(app).get(`/api/download/${uploadToken}`);
    expect(res.status).toBe(404);
  });
});

// ── 5. Unknown / random token ────────────────────────────────────────────────
describe("GET /api/download/:token — unknown token", () => {
  it("returns 404 for a token that was never uploaded", async () => {
    const res = await request(app).get("/api/download/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
