const Module = require("module");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");

function isProjectModule(filePath) {
  return (
    typeof filePath === "string" &&
    filePath.startsWith(repoRoot) &&
    !filePath.includes(`${path.sep}node_modules${path.sep}`)
  );
}

function clearProjectModuleCache() {
  for (const cacheKey of Object.keys(require.cache)) {
    if (isProjectModule(cacheKey)) {
      delete require.cache[cacheKey];
    }
  }
}

function loadFreshModule(targetSpecifier, mocks = {}) {
  clearProjectModuleCache();

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const targetPath = require.resolve(targetSpecifier, { paths: [repoRoot] });
    return require(targetPath);
  } finally {
    Module._load = originalLoad;
  }
}

module.exports = {
  clearProjectModuleCache,
  loadFreshModule,
};
