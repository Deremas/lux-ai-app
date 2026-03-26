const { rmSync } = require("fs");
const { resolve } = require("path");
const { spawn } = require("child_process");

const projectRoot = process.cwd();
const nextDir = resolve(projectRoot, ".next");
const nextBin = require.resolve("next/dist/bin/next");
const forwardedArgs = process.argv.slice(2);

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[build] cleared .next before running Next.js build");
} catch (error) {
  console.warn("[build] could not clear .next cache", error);
}

const child = spawn(
  process.execPath,
  ["--max-old-space-size=4096", nextBin, "build", ...forwardedArgs],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
