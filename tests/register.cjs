process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "commonjs",
  moduleResolution: "node",
  jsx: "react-jsx",
});

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");
