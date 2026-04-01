function createSpy(impl = () => undefined) {
  const calls = [];

  const fn = (...args) => {
    calls.push(args);
    return impl(...args);
  };

  fn.calls = calls;
  return fn;
}

function createAsyncSpy(impl = async () => undefined) {
  const calls = [];

  const fn = async (...args) => {
    calls.push(args);
    return impl(...args);
  };

  fn.calls = calls;
  return fn;
}

module.exports = {
  createSpy,
  createAsyncSpy,
};
