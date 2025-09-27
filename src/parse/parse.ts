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

let parseCSS = (docClone: DocumentClone): CSSParseResult => {
  const { breakpoints, globalBaselineWidth } = initDoc(docClone);

  const fluidData = parseStyleSheets(docClone.styleSheets, {
    breakpoints,
    globalBaselineWidth,
  });

  return { breakpoints, fluidData };
};

let initDoc = (
  docClone: DocumentClone
): {
  breakpoints: number[];
  globalBaselineWidth: number;
} => {
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
};

function toMainCtx(ctx: any): ParseContext {
  return ctx as ParseContext;
}

let parseStyleSheets = (
  styleSheets: StyleSheetClone[],
  ctx: ParseStyleSheetsCtx
) => {
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
};

let processStyleSheet = (
  styleSheet: StyleSheetClone,
  ctx: ProcessStyleSheetCtx
): DocStateResult => {
  const ruleBatches = batchStyleSheet(styleSheet, toMainCtx(ctx));
  return parseStyleSheet(ruleBatches, toMainCtx(ctx));
};

let batchStyleSheet = (
  styleSheet: StyleSheetClone,
  ctx: BatchStyleSheetCtx
) => {
  let batchState: BatchState = {
    ruleBatches: [],
    currentRuleBatch: null,
  };

  for (const rule of styleSheet.cssRules) {
    batchState = batchRule(rule, batchState, ctx.globalBaselineWidth);
  }
  return batchState.ruleBatches;
};

let batchRule = (
  rule: RuleClone,
  batchState: BatchState,
  globalBaselineWidth: number
): BatchState => {
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
};

let batchStyleRule = (
  styleRule: StyleRuleClone,
  batchState: BatchState,
  globalBaselineWidth: number
): BatchState => {
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
};

let batchMediaRule = (
  mediaRule: MediaRuleClone,
  batchState: BatchState
): BatchState => {
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
};

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

function splitSelectors(selector: string) {
  return selector.split(",").map((selector) => selector.trim());
}

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

let processFluidRange = (
  maxValue: string,
  ctx: ProcessFluidRangeCtx
): FluidData => {
  const { selector, isDynamic } = ctx;

  const baseSelector = isDynamic
    ? stripDynamicPseudos(stripClassModifiers(selector))
    : selector;

  const selectorParts = splitSelectors(baseSelector);
  const anchor = selectorParts[selectorParts.length - 1];

  return insertFluidRange(maxValue, anchor, toMainCtx(ctx));
};

let insertFluidRange = (
  maxValue: string,
  anchor: string,
  ctx: InsertFluidRangeCtx
): FluidData => {
  const { property, orderID, selector, breakpoints } = ctx;
  const { minValue, batch, nextBatch } = ctx;
  let { fluidData } = ctx;

  const newFluidData = { ...fluidData };
  newFluidData[anchor] = { ...(newFluidData[anchor] || {}) };
  newFluidData[anchor][selector] = {
    ...(newFluidData[anchor][selector] || {}),
  };
  newFluidData[anchor][selector][property] = {
    ...(newFluidData[anchor][selector][property] || {
      metaData: {
        orderID,
        property,
      },
      ranges: [],
    }),
  };

  const newRanges = (newFluidData[anchor][selector][property].ranges = [
    ...newFluidData[anchor][selector][property].ranges,
  ]);
  newRanges.push({
    minValue: parseFluidValue2D(minValue),
    maxValue: parseFluidValue2D(maxValue),
    minBpIndex: breakpoints.indexOf(batch.width),
    maxBpIndex: breakpoints.indexOf(nextBatch.width),
  });

  return newFluidData;
};

let parseFluidValue2D = (value: string): FluidValue[][] => {
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
};

let parseFluidValue1D = (value: string): FluidValue[] => {
  const values: string[] = splitBySpaces(value);
  return values.map(parseFluidValue);
};

let parseFluidValue = (strValue: string): FluidValue => {
  const value = parseFloat(strValue);

  // Match any alphabetic characters after the number
  const match = strValue.match(/[a-z%]+$/i);
  const unit = match?.[0] || "px";

  return {
    value,
    unit,
  } as FluidValueSingle;
};

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

/* -- TEST WRAPPING -- */

function wrap(
  parseCSSWrapped: (docClone: DocumentClone) => CSSParseResult,
  initDocWrapped: (docClone: DocumentClone) => {
    breakpoints: number[];
    globalBaselineWidth: number;
  },
  parseStyleSheetsWrapped: (
    styleSheets: StyleSheetClone[],
    ctx: ParseStyleSheetsCtx
  ) => FluidData,
  processStyleSheetWrapped: (
    styleSheet: StyleSheetClone,
    ctx: ProcessStyleSheetCtx
  ) => DocStateResult,
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
  ) => FluidData,
  processFluidRangeWrapped: (
    maxValue: string,
    ctx: ProcessFluidRangeCtx
  ) => FluidData,
  insertFluidRangeWrapped: (
    maxValue: string,
    anchor: string,
    ctx: InsertFluidRangeCtx
  ) => FluidData
) {
  parseCSS = parseCSSWrapped;
  initDoc = initDocWrapped;
  parseStyleSheets = parseStyleSheetsWrapped;
  processStyleSheet = processStyleSheetWrapped;
  parseStyleSheet = parseStyleSheetWrapped;
  processRuleBatch = processRuleBatchWrapped;
  processRule = processRuleWrapped;
  processSelectors = processSelectorsWrapped;
  processSelector = processSelectorWrapped;
  processProperty = processPropertyWrapped;
  processNextBatch = processNextBatchWrapped;
  processNextRule = processNextRuleWrapped;
  processFluidRange = processFluidRangeWrapped;
  insertFluidRange = insertFluidRangeWrapped;
}

export {
  wrap,
  parseCSS,
  initDoc,
  parseStyleSheets,
  processStyleSheet,
  batchStyleSheet,
  batchRule,
  batchStyleRule,
  batchMediaRule,
  parseStyleSheet,
  processRuleBatch,
  processRule,
  processSelectors,
  processSelector,
  processProperty,
  processNextBatch,
  processNextRule,
  processFluidRange,
  insertFluidRange,
};
