let expect;
if (process.env.NODE_ENV !== "browser") {
  (async () => {
    expect = (await import("vitest")).expect;
  })();
}

function toEqualDefined(result: any, expected: any, path?: string) {
  expect(result, path).toBeDefined();
  expect(expected, path).toBeDefined();
  expect(result, path).toEqual(expected);
}

function toMatchObjectDefined(result: any, expected: any, path?: string) {
  expect(result, path).toBeDefined();
  expect(expected, path).toBeDefined();
  expect(result, path).toMatchObject(expected);
}

function makeVitestMsg(state: any, path?: Record<string, any> | string) {
  if (!path) return `masterIndex: ${state.master.index}`;

  return JSON.stringify({
    masterIndex: state.master.index,
    ...(typeof path === "object" ? path : { path }),
  });
}

export { toEqualDefined, toMatchObjectDefined, makeVitestMsg };
