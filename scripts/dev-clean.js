const { rmSync } = require("fs");
const { resolve } = require("path");
const { spawn } = require("child_process");

const projectRoot = process.cwd();
const nextDir = resolve(projectRoot, ".next-dev");
const nextBin = require.resolve("next/dist/bin/next");
const forwardedArgs = process.argv.slice(2);

try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("[dev] cleared .next-dev before starting Next.js");
} catch (error) {
  console.warn("[dev] could not clear .next cache", error);
}

const child = spawn(process.execPath, [nextBin, "dev", ...forwardedArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
