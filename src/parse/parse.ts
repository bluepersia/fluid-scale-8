import { splitBySpaces } from "../utils";
import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./cloner/cloner.types";
import {
  BatchState,
  BatchStyleSheetCtx,
  CSSParseResult,
  DocStateResult,
  InsertFluidRangeCtx,
  ParseContext,
  ParseStyleSheetsCtx,
  ProcessFluidRangeCtx,
  ProcessNextBatchCtx,
  ProcessNextRuleCtx,
  ProcessRuleBatchCtx,
  ProcessRuleCtx,
  ProcessStyleSheetCtx,
  PropertyCtx,
  RuleBatch,
  SelectorCtx,
  SelectorsCtx,
} from "./index.types";
import { FluidData, FluidValue, FluidValueSingle } from "../index.types";

function parseCSS(docClone: DocumentClone): CSSParseResult {
  const { breakpoints, globalBaselineWidth } = initDoc(docClone);

  const fluidData = parseStyleSheets(docClone.styleSheets, {
    breakpoints,
    globalBaselineWidth,
  });

  return { breakpoints, fluidData };
}

function initDoc(docClone: DocumentClone): {
  breakpoints: number[];
  globalBaselineWidth: number;
} {
  const breakpointsSet = new Set<number>();
  let globalBaselineWidth = 375;

  for (const sheet of docClone.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (rule.type === 4) {
        const mediaRuleClone = rule as MediaRuleClone;
        breakpointsSet.add(mediaRuleClone.minWidth);
        if (mediaRuleClone.cssRules.length <= 0)
          globalBaselineWidth = mediaRuleClone.minWidth;
      }
    }
  }

  return { breakpoints: Array.from(breakpointsSet), globalBaselineWidth };
}

function toMainCtx(ctx: any): ParseContext {
  return ctx as ParseContext;
}

function parseStyleSheets(
  styleSheets: StyleSheetClone[],
  ctx: ParseStyleSheetsCtx
) {
  let fluidData: FluidData = {};
  let orderID = 0;

  for (const styleSheet of styleSheets) {
    const { newFluidData, newOrderID } = processStyleSheet(
      styleSheet,
      toMainCtx({
        ...ctx,
        orderID,
        fluidData,
      })
    );
    fluidData = newFluidData;
    orderID = newOrderID;
  }
  return fluidData;
}

function processStyleSheet(
  styleSheet: StyleSheetClone,
  ctx: ProcessStyleSheetCtx
): DocStateResult {
  const ruleBatches = batchStyleSheet(styleSheet, toMainCtx(ctx));
  return parseStyleSheet(ruleBatches, toMainCtx(ctx));
}

function batchStyleSheet(styleSheet: StyleSheetClone, ctx: BatchStyleSheetCtx) {
  let batchState: BatchState = {
    ruleBatches: [],
    currentRuleBatch: null,
  };

  for (const rule of styleSheet.cssRules) {
    batchState = batchRule(rule, batchState, ctx.globalBaselineWidth);
  }
  return batchState.ruleBatches;
}

function batchRule(
  rule: RuleClone,
  batchState: BatchState,
  globalBaselineWidth: number
): BatchState {
  if (rule.type === 1) {
    return batchStyleRule(
      rule as StyleRuleClone,
      batchState,
      globalBaselineWidth
    );
  } else if (rule.type === 4) {
    return batchMediaRule(rule as MediaRuleClone, batchState);
  }
  return batchState;
}

function batchStyleRule(
  styleRule: StyleRuleClone,
  batchState: BatchState,
  globalBaselineWidth: number
): BatchState {
  const newBatchState = {
    ...batchState,
    ruleBatches: [...batchState.ruleBatches],
  };

  if (newBatchState.currentRuleBatch === null) {
    newBatchState.currentRuleBatch = {
      rules: [],
      width: globalBaselineWidth,
      isMediaQuery: false,
    };
    newBatchState.ruleBatches.push(newBatchState.currentRuleBatch);
  } else {
    newBatchState.currentRuleBatch = { ...newBatchState.currentRuleBatch };
  }
  newBatchState.ruleBatches[newBatchState.ruleBatches.length - 1] =
    newBatchState.currentRuleBatch;
  newBatchState.currentRuleBatch.rules = [
    ...newBatchState.currentRuleBatch.rules,
  ];
  newBatchState.currentRuleBatch.rules.push(styleRule);

  return newBatchState;
}

function batchMediaRule(
  mediaRule: MediaRuleClone,
  batchState: BatchState
): BatchState {
  const newBatchState = {
    ...batchState,
    ruleBatches: [...batchState.ruleBatches],
  };
  newBatchState.currentRuleBatch = null;
  newBatchState.ruleBatches.push({
    rules: mediaRule.cssRules,
    width: mediaRule.minWidth,
    isMediaQuery: true,
  });
  return newBatchState;
}

function parseStyleSheet(ruleBatches: RuleBatch[], ctx: ParseContext) {
  let { fluidData, orderID } = ctx;
  for (const [batchIndex, ruleBatch] of ruleBatches.entries()) {
    const { newFluidData, newOrderID } = processRuleBatch(ruleBatch, {
      ...ctx,
      batchIndex,
    });
    fluidData = newFluidData;
    orderID = newOrderID;
  }
  return { newFluidData: fluidData, newOrderID: orderID };
}

function processRuleBatch(ruleBatch: RuleBatch, ctx: ProcessRuleBatchCtx) {
  let { fluidData, orderID } = ctx;
  for (const rule of ruleBatch.rules) {
    const { newFluidData, newOrderID } = processRule(rule, toMainCtx(ctx));
    fluidData = newFluidData;
    orderID = newOrderID;
  }
  return { newFluidData: fluidData, newOrderID: orderID };
}

function processRule(
  rule: StyleRuleClone,
  ctx: ProcessRuleCtx
): DocStateResult {
  let { orderID, fluidData } = ctx;
  const selectors = splitSelectors(rule.selectorText);
  fluidData = processSelectors(selectors, rule, ctx);
  orderID++;

  return { newOrderID: orderID, newFluidData: fluidData };
}

function splitSelectors(selector: string) {
  return selector.split(",").map((selector) => selector.trim());
}

function processSelectors(
  selectors: string[],
  rule: StyleRuleClone,
  ctx: SelectorsCtx
): FluidData {
  let { fluidData } = ctx;
  for (const selector of selectors) {
    fluidData = processSelector(selector, rule, ctx);
  }
  return fluidData;
}

function processSelector(
  selector: string,
  rule: StyleRuleClone,
  ctx: SelectorCtx
) {
  let { fluidData } = ctx;
  for (const [property, minValue] of Object.entries(rule.style)) {
    fluidData = processProperty(
      property,
      toMainCtx({
        ...ctx,
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
}

function processProperty(property: string, ctx: PropertyCtx): FluidData {
  const { batchIndex, ruleBatches } = ctx;
  let { fluidData } = ctx;

  for (
    let nextIndex = batchIndex + 1;
    nextIndex < ruleBatches.length;
    nextIndex++
  ) {
    const nextBatch = ruleBatches[nextIndex];
    fluidData = processNextBatch(nextBatch, toMainCtx({ ...ctx, property }));
  }
  return fluidData;
}

function processNextBatch(
  nextBatch: RuleBatch,
  ctx: ProcessNextBatchCtx
): FluidData {
  let { fluidData } = ctx;

  if (!nextBatch.isMediaQuery) return fluidData;

  for (const nextRule of nextBatch.rules) {
    const newFluidData = processNextRule(nextRule, toMainCtx(ctx));

    if (newFluidData === fluidData) continue;
    else break;
  }

  return fluidData;
}

function processNextRule(
  nextRule: StyleRuleClone,
  ctx: ProcessNextRuleCtx
): FluidData {
  const { selector, property } = ctx;

  let { fluidData } = ctx;

  if (!splitSelectors(nextRule.selectorText).includes(selector))
    return fluidData;

  if (!nextRule.style[property]) return fluidData;

  const maxValue = nextRule.style[property];

  fluidData = processFluidRange(maxValue, toMainCtx(ctx));

  return fluidData;
}

function processFluidRange(
  maxValue: string,
  ctx: ProcessFluidRangeCtx
): FluidData {
  const { selector, isDynamic } = ctx;

  const baseSelector = isDynamic
    ? stripDynamicPseudos(stripClassModifiers(selector))
    : selector;

  const selectorParts = splitSelectors(baseSelector);
  const anchor = selectorParts[selectorParts.length - 1];

  return insertFluidRange(maxValue, anchor, toMainCtx(ctx));
}

function insertFluidRange(
  maxValue: string,
  anchor: string,
  ctx: InsertFluidRangeCtx
): FluidData {
  const { property, orderID, selector, breakpoints } = ctx;
  const { minValue, batch, nextBatch } = ctx;
  let { fluidData } = ctx;

  const anchorData = { ...(fluidData[anchor] || {}) };
  const selectorData = { ...(anchorData[selector] || {}) };
  const propertyData = {
    ...(selectorData[property] || {
      metaData: {
        orderID,
        property,
      },
      ranges: [],
    }),
  };

  propertyData.ranges = [...propertyData.ranges];
  propertyData.ranges.push({
    minValue: parseFluidValue2D(minValue),
    maxValue: parseFluidValue2D(maxValue),
    minBpIndex: breakpoints.indexOf(batch.width),
    maxBpIndex: breakpoints.indexOf(nextBatch.width),
  });

  return { ...fluidData, [anchor]: anchorData };
}

function parseFluidValue2D(value: string): FluidValue[][] {
  let depth = 0;
  let currentValue = "";
  let values: FluidValue[][] = [];
  for (const char of value) {
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    } else if (char === "," && depth === 0) {
      values.push(parseFluidValue1D(currentValue));
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  values.push(parseFluidValue1D(currentValue));
  return values;
}

function parseFluidValue1D(value: string): FluidValue[] {
  const values: string[] = splitBySpaces(value);
  return values.map(parseFluidValue);
}

function parseFluidValue(strValue: string): FluidValue {
  const value = parseFloat(strValue);

  // Match any alphabetic characters after the number
  const match = strValue.match(/[a-z%]+$/i);
  const unit = match?.[0] || "px";

  return {
    value,
    unit,
  } as FluidValueSingle;
}

function hasDynamicPseudo(selectorText: string): boolean {
  return /:(hover|focus|active|visited|disabled|checked|focus-visible|focus-within)/.test(
    selectorText
  );
}

function stripClassModifiers(selectorText: string): string {
  return (
    selectorText
      // remove BEM modifiers (--something)
      .replace(/--[a-zA-Z0-9_-]+/g, "")
      // collapse chained classes: keep the first .class, drop the following .others
      .replace(/(\.[a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9_-]+)+/g, "$1")
      .trim()
  );
}

function stripDynamicPseudos(selectorText: string): string {
  return selectorText
    .replace(
      /:(hover|focus|active|visited|disabled|checked|focus-visible|focus-within)/g,
      ""
    )
    .trim();
}
