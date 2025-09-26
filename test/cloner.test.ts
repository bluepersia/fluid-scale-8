import { test, expect, beforeAll, afterAll, describe } from "vitest";
import {
  initPlaywrightPages,
  JSDOMDocs,
  teardownPlaywrightPages,
} from "./setup";
import { PlaywrightPage } from "./index.types";
import { collection } from "./golden-master/cloner/collection";
import cloneDocumentAssertionMaster from "./golden-master/cloner/gold-sight";
import { AssertionBlueprint } from "gold-sight";
import { cloneDocument, handleShorthand } from "../src/parse/cloner/cloner";
import {
  normalizeSelector,
  normalizeZero,
} from "../../FluidScaleB3/src/parse/cloner/cloner";

describe("playwright", () => {
  let playwrightPages: PlaywrightPage[];
  beforeAll(async () => {
    playwrightPages = await initPlaywrightPages();
  });

  afterAll(async () => {
    await teardownPlaywrightPages(playwrightPages);
  });

  describe("cloneDocument", () => {
    test.each(collection)("should clone the document", async (master) => {
      const { index } = master;

      const page = playwrightPages[index].page;
      const queue: [number, AssertionBlueprint][] = await page.evaluate(
        (master) => {
          (window as any).assertionMaster1.master = master;
          (window as any).cloneDocument(document);

          const queue = (window as any).getQueue("cloneDocument");

          return Array.from(queue.entries());
        },
        master
      );

      cloneDocumentAssertionMaster.setQueueFromArray(queue);
      cloneDocumentAssertionMaster.assertQueue({ masterIndex: index });
    });
  });
});
describe("jsdom", () => {
  test.each(JSDOMDocs)("should clone the document", async ({ doc, index }) => {
    cloneDocumentAssertionMaster.master = collection[index];

    cloneDocument(doc);

    cloneDocumentAssertionMaster.assertQueue();
  });
});

describe("handle shorthand", () => {
  test("should handle single shorthand", () => {
    expect(handleShorthand("margin", "5px")).toEqual({
      "margin-top": "5px",
      "margin-right": "5px",
      "margin-bottom": "5px",
      "margin-left": "5px",
    });
  });
  test("should handle dual shorthand", () => {
    expect(handleShorthand("margin", "0px 5px")).toEqual({
      "margin-top": "0px",
      "margin-right": "5px",
      "margin-bottom": "0px",
      "margin-left": "5px",
    });
  });
  test("should handle triple shorthand", () => {
    expect(handleShorthand("margin", "0px 5px 10px")).toEqual({
      "margin-top": "0px",
      "margin-right": "5px",
      "margin-bottom": "10px",
      "margin-left": "5px",
    });
  });
  test("should handle quadruple shorthand", () => {
    expect(handleShorthand("margin", "0px 5px 10px 15px")).toEqual({
      "margin-top": "0px",
      "margin-right": "5px",
      "margin-bottom": "10px",
      "margin-left": "15px",
    });
  });
});

describe("normalize zero", () => {
  test("should normalize zero", () => {
    expect(normalizeZero("0")).toBe("0px");
    expect(normalizeZero("0px")).toBe("0px");
    expect(normalizeZero("0.0")).toBe("0px");
    expect(normalizeZero("0 5px")).toBe("0px 5px");
    expect(normalizeZero("0px 5px")).toBe("0px 5px");
  });

  test("should normalize zero in depth 1", () => {
    expect(normalizeZero("min(2rem, 0)")).toBe("min(2rem, 0px)");
    expect(normalizeZero("5rem 0.0 3rem")).toBe("5rem 0px 3rem");
    expect(normalizeZero("min(4rem, 0) min(3rem, 2rem)")).toBe(
      "min(4rem, 0px) min(3rem, 2rem)"
    );
  });

  test("should normalize zero in depth 2", () => {
    expect(normalizeZero("min(2rem, max(2rem, 0)) min(3rem, 2rem)")).toBe(
      "min(2rem, max(2rem, 0px)) min(3rem, 2rem)"
    );
  });

  test("should not normalize non-zero", () => {
    expect(normalizeZero("1")).toBe("1");
    expect(normalizeZero("1px")).toBe("1px");
    expect(normalizeZero("1.0")).toBe("1.0");
  });
});

describe("normalize selector", () => {
  test("should normalize selector", () => {
    expect(normalizeSelector("*::before")).toBe("::before");
    expect(normalizeSelector("*::after")).toBe("::after");
    expect(normalizeSelector("*::before,\n*::after")).toBe("::before, ::after");
  });
});
