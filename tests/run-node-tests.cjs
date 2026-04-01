const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname);

function collectTestFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.cjs")) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = collectTestFiles(rootDir).sort();

if (testFiles.length === 0) {
  console.error("No test files found under tests/.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--require", path.join(rootDir, "register.cjs"), "--test", ...testFiles],
  {
    stdio: "inherit",
    cwd: path.resolve(rootDir, ".."),
    env: process.env,
  }
);

process.exit(result.status ?? 1);
