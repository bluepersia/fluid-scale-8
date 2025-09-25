import { test, expect, beforeAll, afterAll, describe } from "vitest";
import { initPlaywrightPages, teardownPlaywrightPages } from "./setup";
import { PlaywrightPage } from "./index.types";
import { collection } from "./golden-master/cloner/collection";
import cloneDocumentAssertionMaster from "./golden-master/gold-sight";
import { AssertionBlueprint } from "gold-sight";

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
      cloneDocumentAssertionMaster.assertQueue(index);
    });
  });
});
