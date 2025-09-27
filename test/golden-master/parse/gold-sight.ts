import { expect } from "vitest";
import AssertionMaster, { AssertionChain } from "gold-sight";
import * as docCloneController from "../masterControllers/docClone";
import * as batchedDocController from "../masterControllers/batchedDoc";
import {
  initDoc,
  parseCSS,
  parseStyleSheets,
  processStyleSheet,
  wrap as parseWrap,
  batchStyleSheet,
  batchRule,
  batchStyleRule,
  batchMediaRule,
} from "../../../src/parse/parse";
import {
  parseStyleSheet,
  processRuleBatch,
  processRule,
  processSelectors,
  processSelector,
  processProperty,
  processNextBatch,
  processNextRule,
  wrap as patcherWrap,
} from "../../../src/parse/patcher/index";
import {
  processFluidRange,
  insertFluidRange,
  wrap as fluidRangeWrap,
} from "../../../src/parse/patcher/fluidRange";

import {
  toEqualDefined,
  makeVitestMsg,
  toMatchObjectDefined,
} from "../../utils";
import { ParseMaster } from "./master.types";
import {
  BatchState,
  BatchStyleSheetCtx,
  CSSParseResult,
  DocStateResult,
  FluidData,
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
} from "../../../src/parse/index.types";
import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "../../../src/parse/cloner/cloner.types";

type State = {
  master?: ParseMaster;
  sheetIndex: number;
  absStyleRuleIndex: number;
  absMediaRuleIndex: number;
};

const parseCSSAssertions: AssertionChain<State, DocumentClone, CSSParseResult> =
  {
    "should parse the document": (state, args, result) => {
      const msg = makeVitestMsg(state, "parseCSS");

      expect(result.fluidData, msg).toEqual(state.master?.fluidData);
      expect(result.breakpoints, msg).toEqual(state.master?.breakpoints);
    },
  };

const initDocAssertions: AssertionChain<
  State,
  DocumentClone,
  { breakpoints: number[]; globalBaselineWidth: number }
> = {
  "should init the document": (state, args, result) => {
    const msg = makeVitestMsg(state, "initDoc");

    expect(result.breakpoints, msg).toEqual(state.master?.breakpoints);
    expect(result.globalBaselineWidth, msg).toEqual(
      state.master?.globalBaselineWidth
    );
  },
};

const processStyleSheetAssertions: AssertionChain<
  State,
  [StyleSheetClone, ProcessStyleSheetCtx],
  DocStateResult
> = {
  "should process the style sheet": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result.newFluidData,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const batchStyleSheetAssertions: AssertionChain<
  State,
  [StyleSheetClone, BatchStyleSheetCtx],
  RuleBatch[]
> = {
  "should batch the style sheet": (state, args, result) => {
    toEqualDefined(
      result,
      state.master!.batchedDoc.styleSheets[state.sheetIndex - 1].batches,
      makeVitestMsg(state, {
        sheetIndex: state.sheetIndex - 1,
      })
    );
  },
};

function getLastBatch(batchState: BatchState): RuleBatch {
  return batchState.ruleBatches[batchState.ruleBatches.length - 1];
}

function getLastRule(batch: RuleBatch): StyleRuleClone {
  return batch.rules[batch.rules.length - 1];
}

const batchRuleAssertions: AssertionChain<
  State,
  [RuleClone, BatchState, number],
  BatchState
> = {
  "should batch the style rule": (state, args, result) => {
    const type = args[0].type;
    const lastBatch = getLastBatch(result);
    const lastRule = getLastRule(lastBatch);
    if (type === 1) {
      toEqualDefined(
        lastRule,
        docCloneController.getStyleRuleByAbsIndex(
          state.master!.input,
          state.absStyleRuleIndex
        ),
        makeVitestMsg(state, {
          absStyleRuleIndex: state.absStyleRuleIndex,
        })
      );

      toEqualDefined(
        lastRule,
        result.currentRuleBatch!.rules[
          result.currentRuleBatch!.rules.length - 1
        ]
      );
    }
  },
  "should batch the media rule": (state, args, result) => {
    const type = args[0].type;
    const lastBatch = result.ruleBatches[result.ruleBatches.length - 1];

    if (type === 4) {
      if (args[1] === result) return;
      toEqualDefined(
        lastBatch,
        batchedDocController.getMediaRuleByAbsIndex(
          state.master!.batchedDoc,
          state.absMediaRuleIndex
        ),
        makeVitestMsg(state, {
          absMediaRuleIndex: state.absMediaRuleIndex,
        })
      );

      expect(result.currentRuleBatch).toBeNull();
    }
  },
};

const batchStyleRuleAssertions: AssertionChain<
  State,
  [StyleRuleClone, BatchState, number],
  BatchState
> = {
  "should batch the style rule": (state, args, result) => {
    const lastBatch = getLastBatch(result);
    const lastRule = getLastRule(lastBatch);
    toEqualDefined(
      lastRule,
      docCloneController.getStyleRuleByAbsIndex(
        state.master!.input,
        state.absStyleRuleIndex
      ),
      makeVitestMsg(state, {
        absStyleRuleIndex: state.absStyleRuleIndex,
      })
    );
  },
};

const batchMediaRuleAssertions: AssertionChain<
  State,
  [MediaRuleClone, BatchState],
  BatchState
> = {
  "should batch the media rule": (state, args, result) => {
    const lastBatch = getLastBatch(result);

    if (args[1] === result) return;
    toEqualDefined(
      lastBatch,
      batchedDocController.getMediaRuleByAbsIndex(
        state.master!.batchedDoc,
        state.absMediaRuleIndex
      ),
      makeVitestMsg(state, {
        absMediaRuleIndex: state.absMediaRuleIndex,
      })
    );

    expect(result.currentRuleBatch).toBeNull();
  },
};

const parseStyleSheetsAssertions: AssertionChain<
  State,
  [StyleSheetClone[], ParseStyleSheetsCtx],
  DocStateResult
> = {
  "should parse the style sheets": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const parseStyleSheetAssertions: AssertionChain<
  State,
  [RuleBatch[], ParseContext],
  DocStateResult
> = {
  "should parse the style sheet": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result.newFluidData,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processRuleBatchAssertions: AssertionChain<
  State,
  [RuleBatch, ProcessRuleBatchCtx],
  DocStateResult
> = {
  "should process the rule batch": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result.newFluidData,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processRuleAssertions: AssertionChain<
  State,
  [StyleRuleClone, ProcessRuleCtx],
  DocStateResult
> = {
  "should process the rule": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result.newFluidData,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processSelectorsAssertions: AssertionChain<
  State,
  [string[], StyleRuleClone, SelectorsCtx],
  FluidData
> = {
  "should process the selectors": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processSelectorAssertions: AssertionChain<
  State,
  [string, StyleRuleClone, SelectorCtx],
  FluidData
> = {
  "should process the selector": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processNextBatchAssertions: AssertionChain<
  State,
  [RuleBatch, ProcessNextBatchCtx],
  FluidData
> = {
  "should process the next batch": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processPropertyAssertions: AssertionChain<
  State,
  [string, PropertyCtx],
  FluidData
> = {
  "should process the property": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processNextRuleAssertions: AssertionChain<
  State,
  [StyleRuleClone, ProcessNextRuleCtx],
  FluidData
> = {
  "should process the next rule": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const processFluidRangeAssertions: AssertionChain<
  State,
  [string, ProcessFluidRangeCtx],
  FluidData
> = {
  "should process the fluid range": (state, args, result) => {
    toMatchObjectDefined(
      state.master!.fluidData,
      result,
      makeVitestMsg(state, "fluidData")
    );
  },
};

const insertFluidRangeAssertions: AssertionChain<
  State,
  [string, string, InsertFluidRangeCtx],
  FluidData
> = {
  "should insert the fluid range": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const defaultAssertions = {
  parseCSS: parseCSSAssertions,
  initDoc: initDocAssertions,
  processStyleSheet: processStyleSheetAssertions,
  batchStyleSheet: batchStyleSheetAssertions,
  batchRule: batchRuleAssertions,
  batchStyleRule: batchStyleRuleAssertions,
  batchMediaRule: batchMediaRuleAssertions,
  parseStyleSheets: parseStyleSheetsAssertions,
  parseStyleSheet: parseStyleSheetAssertions,
  processRuleBatch: processRuleBatchAssertions,
  processRule: processRuleAssertions,
  processSelectors: processSelectorsAssertions,
  processSelector: processSelectorAssertions,
  processProperty: processPropertyAssertions,
  processNextBatch: processNextBatchAssertions,
  processNextRule: processNextRuleAssertions,
  processFluidRange: processFluidRangeAssertions,
  insertFluidRange: insertFluidRangeAssertions,
};

class ParseCSSAssertionMaster extends AssertionMaster<State, ParseMaster> {
  constructor() {
    super(defaultAssertions, "parseCSS");
  }

  newState(): State {
    return {
      sheetIndex: 0,
      absStyleRuleIndex: 0,
      absMediaRuleIndex: 0,
    };
  }

  parseCSS = this.wrapTopFn(parseCSS, "parseCSS");

  initDoc = this.wrapFn(initDoc, "initDoc");

  processStyleSheet = this.wrapFn(processStyleSheet, "processStyleSheet", {
    post: (state) => {
      state.sheetIndex++;
    },
  });

  batchStyleSheet = this.wrapFn(batchStyleSheet, "batchStyleSheet");

  batchRule = this.wrapFn(batchRule, "batchRule");

  batchStyleRule = this.wrapFn(batchStyleRule, "batchStyleRule", {
    post: (state) => {
      state.absStyleRuleIndex++;
    },
  });

  batchMediaRule = this.wrapFn(batchMediaRule, "batchMediaRule", {
    post: (state, args, result) => {
      if (args[1] === result) return;
      state.absMediaRuleIndex++;
    },
  });

  parseStyleSheets = this.wrapFn(parseStyleSheets, "parseStyleSheets");

  parseStyleSheet = this.wrapFn(parseStyleSheet, "parseStyleSheet");

  processRuleBatch = this.wrapFn(processRuleBatch, "processRuleBatch");

  processRule = this.wrapFn(processRule, "processRule");

  processSelectors = this.wrapFn(processSelectors, "processSelectors");

  processSelector = this.wrapFn(processSelector, "processSelector");

  processProperty = this.wrapFn(processProperty, "processProperty");

  processNextBatch = this.wrapFn(processNextBatch, "processNextBatch");

  processNextRule = this.wrapFn(processNextRule, "processNextRule");

  processFluidRange = this.wrapFn(processFluidRange, "processFluidRange");

  insertFluidRange = this.wrapFn(insertFluidRange, "insertFluidRange");
}

const parseCSSAssertionMaster = new ParseCSSAssertionMaster();

function wrapAll() {
  parseWrap(
    parseCSSAssertionMaster.parseCSS,
    parseCSSAssertionMaster.initDoc,
    parseCSSAssertionMaster.processStyleSheet,
    parseCSSAssertionMaster.batchStyleSheet,
    parseCSSAssertionMaster.batchRule,
    parseCSSAssertionMaster.batchStyleRule,
    parseCSSAssertionMaster.batchMediaRule,
    parseCSSAssertionMaster.parseStyleSheets
  );

  patcherWrap(
    parseCSSAssertionMaster.parseStyleSheet,
    parseCSSAssertionMaster.processRuleBatch,
    parseCSSAssertionMaster.processRule,
    parseCSSAssertionMaster.processSelectors,
    parseCSSAssertionMaster.processSelector,
    parseCSSAssertionMaster.processProperty,
    parseCSSAssertionMaster.processNextBatch,
    parseCSSAssertionMaster.processNextRule
  );

  fluidRangeWrap(
    parseCSSAssertionMaster.processFluidRange,
    parseCSSAssertionMaster.insertFluidRange
  );
}

export default parseCSSAssertionMaster;
export { wrapAll };
