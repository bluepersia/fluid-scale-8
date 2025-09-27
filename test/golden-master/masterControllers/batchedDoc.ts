import { BatchedDoc } from "../../../../FluidScaleB3/test/index.types";
import {
  DocumentClone,
  RuleClone,
} from "../../../src/parse/cloner/cloner.types";
import { RuleBatch } from "../../../src/parse/index.types";

function getMediaRuleByAbsIndex(
  batchedDoc: BatchedDoc,
  absIndex: number
): RuleBatch | undefined {
  let index = 0;
  for (const sheet of batchedDoc.styleSheets) {
    for (const batch of sheet.batches) {
      if (batch.isMediaQuery) {
        if (index === absIndex) return batch;
        index++;
      }
    }
  }
}

export { getMediaRuleByAbsIndex };
