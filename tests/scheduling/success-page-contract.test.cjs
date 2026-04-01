const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const successPagePath = path.resolve(
  __dirname,
  "..",
  "..",
  "app",
  "scheduling",
  "payment",
  "success",
  "page.tsx"
);

test("payment success page stays display-only and backend-driven", () => {
  const source = fs.readFileSync(successPagePath, "utf8");

  assert.match(source, /\/api\/scheduling\/payment\/status\?attemptId=/);
  assert.doesNotMatch(source, /\/api\/scheduling\/book/);
  assert.doesNotMatch(source, /payment\/verify/);
  assert.doesNotMatch(source, /pendingBooking/);
  assert.doesNotMatch(source, /sessionStorage/);
});
