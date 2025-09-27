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
  ParseContext,
  ParseStyleSheetsCtx,
  ProcessStyleSheetCtx,
  RuleBatch,
} from "./index.types";
import { FluidData } from "../index.types";
import { parseStyleSheet } from "./patcher";

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
  if (mediaRule.cssRules.length <= 0) return batchState;

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

function splitSelectors(selector: string) {
  return selector.split(",").map((selector) => selector.trim());
}

/* -- TEST WRAPPING -- */

function wrap(
  parseCSSWrapped: (docClone: DocumentClone) => CSSParseResult,
  initDocWrapped: (docClone: DocumentClone) => {
    breakpoints: number[];
    globalBaselineWidth: number;
  },
  processStyleSheetWrapped: (
    styleSheet: StyleSheetClone,
    ctx: ProcessStyleSheetCtx
  ) => DocStateResult,
  batchStyleSheetWrapped: (
    styleSheet: StyleSheetClone,
    ctx: BatchStyleSheetCtx
  ) => RuleBatch[],
  batchRuleWrapped: (
    rule: RuleClone,
    batchState: BatchState,
    globalBaselineWidth: number
  ) => BatchState,
  batchStyleRuleWrapped: (
    styleRule: StyleRuleClone,
    batchState: BatchState,
    globalBaselineWidth: number
  ) => BatchState,
  batchMediaRuleWrapped: (
    mediaRule: MediaRuleClone,
    batchState: BatchState
  ) => BatchState,
  parseStyleSheetsWrapped: (
    styleSheets: StyleSheetClone[],
    ctx: ParseStyleSheetsCtx
  ) => FluidData
) {
  parseCSS = parseCSSWrapped;
  initDoc = initDocWrapped;
  processStyleSheet = processStyleSheetWrapped;
  batchStyleSheet = batchStyleSheetWrapped;
  batchRule = batchRuleWrapped;
  batchStyleRule = batchStyleRuleWrapped;
  batchMediaRule = batchMediaRuleWrapped;
  parseStyleSheets = parseStyleSheetsWrapped;
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
  toMainCtx,
  splitSelectors,
};
