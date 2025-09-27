import { StyleRuleClone } from "../cloner/cloner.types";
import {
  DocStateResult,
  FluidData,
  ParseContext,
  ProcessNextBatchCtx,
  ProcessNextRuleCtx,
  ProcessRuleBatchCtx,
  ProcessRuleCtx,
  PropertyCtx,
  RuleBatch,
  SelectorCtx,
  SelectorsCtx,
} from "../index.types";
import { splitSelectors, toMainCtx } from "../parse";
import { processFluidRange } from "./fluidRange";

let parseStyleSheet = (ruleBatches: RuleBatch[], ctx: ParseContext) => {
  let { fluidData, orderID } = ctx;
  for (const [batchIndex, ruleBatch] of ruleBatches.entries()) {
    const { newFluidData, newOrderID } = processRuleBatch(ruleBatch, {
      ...ctx,
      ruleBatches,
      batchIndex,
      fluidData,
      orderID,
    });
    fluidData = newFluidData;
    orderID = newOrderID;
  }
  return { newFluidData: fluidData, newOrderID: orderID };
};

let processRuleBatch = (batch: RuleBatch, ctx: ProcessRuleBatchCtx) => {
  let { fluidData, orderID } = ctx;
  for (const rule of batch.rules) {
    const { newFluidData, newOrderID } = processRule(
      rule,
      toMainCtx({ ...ctx, batch, fluidData, orderID })
    );
    fluidData = newFluidData;
    orderID = newOrderID;
  }
  return { newFluidData: fluidData, newOrderID: orderID };
};

let processRule = (
  rule: StyleRuleClone,
  ctx: ProcessRuleCtx
): DocStateResult => {
  let { orderID, fluidData } = ctx;
  const selectors = splitSelectors(rule.selectorText);
  fluidData = processSelectors(
    selectors,
    rule,
    toMainCtx({ ...ctx, fluidData, orderID })
  );
  orderID++;

  return { newOrderID: orderID, newFluidData: fluidData };
};

let processSelectors = (
  selectors: string[],
  rule: StyleRuleClone,
  ctx: SelectorsCtx
): FluidData => {
  let { fluidData } = ctx;
  for (const selector of selectors) {
    fluidData = processSelector(selector, rule, { ...ctx, fluidData });
  }
  return fluidData;
};

let processSelector = (
  selector: string,
  rule: StyleRuleClone,
  ctx: SelectorCtx
) => {
  let { fluidData } = ctx;
  for (const [property, minValue] of Object.entries(rule.style)) {
    fluidData = processProperty(
      property,
      toMainCtx({
        ...ctx,
        fluidData,
        minValue,
        rule,
        selector,
        isDynamic:
          hasDynamicPseudo(selector) ||
          rule.specialProps["--is-dynamic"] === "true",
      })
    );
  }
  return fluidData;
};

let processProperty = (property: string, ctx: PropertyCtx): FluidData => {
  const { batchIndex, ruleBatches } = ctx;
  let { fluidData } = ctx;

  for (
    let nextIndex = batchIndex + 1;
    nextIndex < ruleBatches.length;
    nextIndex++
  ) {
    const nextBatch = ruleBatches[nextIndex];
    const newFluidData = processNextBatch(
      nextBatch,
      toMainCtx({ ...ctx, property, fluidData })
    );

    if (fluidData !== newFluidData) {
      return newFluidData;
    }
  }
  return fluidData;
};

let processNextBatch = (
  nextBatch: RuleBatch,
  ctx: ProcessNextBatchCtx
): FluidData => {
  let { fluidData } = ctx;

  if (!nextBatch.isMediaQuery) return fluidData;

  for (const nextRule of nextBatch.rules) {
    const newFluidData = processNextRule(
      nextRule,
      toMainCtx({ ...ctx, nextBatch })
    );

    if (newFluidData !== fluidData) {
      return newFluidData;
    }
  }

  return fluidData;
};

let processNextRule = (
  nextRule: StyleRuleClone,
  ctx: ProcessNextRuleCtx
): FluidData => {
  const { selector, property } = ctx;

  let { fluidData } = ctx;

  if (!splitSelectors(nextRule.selectorText).includes(selector))
    return fluidData;

  if (!nextRule.style[property]) return fluidData;

  const maxValue = nextRule.style[property];

  fluidData = processFluidRange(maxValue, toMainCtx(ctx));

  return fluidData;
};

function hasDynamicPseudo(selectorText: string): boolean {
  return /:(hover|focus|active|visited|disabled|checked|focus-visible|focus-within)/.test(
    selectorText
  );
}

function wrap(
  parseStyleSheetWrapped: (
    ruleBatches: RuleBatch[],
    ctx: ParseContext
  ) => DocStateResult,
  processRuleBatchWrapped: (
    batch: RuleBatch,
    ctx: ProcessRuleBatchCtx
  ) => DocStateResult,
  processRuleWrapped: (
    rule: StyleRuleClone,
    ctx: ProcessRuleCtx
  ) => DocStateResult,
  processSelectorsWrapped: (
    selectors: string[],
    rule: StyleRuleClone,
    ctx: SelectorsCtx
  ) => FluidData,
  processSelectorWrapped: (
    selector: string,
    rule: StyleRuleClone,
    ctx: SelectorCtx
  ) => FluidData,
  processPropertyWrapped: (property: string, ctx: PropertyCtx) => FluidData,
  processNextBatchWrapped: (
    nextBatch: RuleBatch,
    ctx: ProcessNextBatchCtx
  ) => FluidData,
  processNextRuleWrapped: (
    nextRule: StyleRuleClone,
    ctx: ProcessNextRuleCtx
  ) => FluidData
) {
  parseStyleSheet = parseStyleSheetWrapped;
  processRuleBatch = processRuleBatchWrapped;
  processRule = processRuleWrapped;
  processSelectors = processSelectorsWrapped;
  processSelector = processSelectorWrapped;
  processProperty = processPropertyWrapped;
  processNextBatch = processNextBatchWrapped;
  processNextRule = processNextRuleWrapped;
}

export {
  wrap,
  parseStyleSheet,
  processRuleBatch,
  processRule,
  processSelectors,
  processSelector,
  processProperty,
  processNextBatch,
  processNextRule,
};
