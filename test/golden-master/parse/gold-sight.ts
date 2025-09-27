import AssertionMaster, { AssertionChain } from "gold-sight";
import * as docCloneController from "../masterControllers/docClone";
import {
  initDoc,
  insertFluidRange,
  parseCSS,
  parseStyleSheet,
  parseStyleSheets,
  processFluidRange,
  processNextBatch,
  processNextRule,
  processProperty,
  processRule,
  processRuleBatch,
  processSelector,
  processSelectors,
  processStyleSheet,
  wrap,
} from "../../../src/parse/parse";
import { toEqualDefined, makeVitestMsg } from "../../utils";
import { ParseMaster } from "./master.types";
import {
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
  StyleRuleClone,
  StyleSheetClone,
} from "../../../src/parse/cloner/cloner.types";
import { expect } from "vitest";

type State = {
  master?: ParseMaster;
};

const parseCSSAssertions: AssertionChain<State, DocumentClone, CSSParseResult> =
  {
    "should parse the document": (state, args, result) => {
      expect(result.fluidData).toEqual(state.master?.fluidData);
      expect(result.breakpoints).toEqual(state.master?.breakpoints);
    },
  };

const initDocAssertions: AssertionChain<
  State,
  DocumentClone,
  { breakpoints: number[]; globalBaselineWidth: number }
> = {
  "should init the document": (state, args, result) => {
    expect(result.breakpoints).toEqual(state.master?.breakpoints);
    expect(result.globalBaselineWidth).toEqual(
      state.master?.globalBaselineWidth
    );
  },
};

const parseStyleSheetsAssertions: AssertionChain<
  State,
  [StyleSheetClone[], ParseStyleSheetsCtx],
  DocStateResult
> = {
  "should parse the style sheets": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processStyleSheetAssertions: AssertionChain<
  State,
  [StyleSheetClone, ProcessStyleSheetCtx],
  DocStateResult
> = {
  "should process the style sheet": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result.newFluidData);
  },
};

const parseStyleSheetAssertions: AssertionChain<
  State,
  [RuleBatch[], ParseContext],
  DocStateResult
> = {
  "should parse the style sheet": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result.newFluidData);
  },
};

const processRuleBatchAssertions: AssertionChain<
  State,
  [RuleBatch, ProcessRuleBatchCtx],
  DocStateResult
> = {
  "should process the rule batch": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result.newFluidData);
  },
};

const processRuleAssertions: AssertionChain<
  State,
  [StyleRuleClone, ProcessRuleCtx],
  DocStateResult
> = {
  "should process the rule": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result.newFluidData);
  },
};

const processSelectorsAssertions: AssertionChain<
  State,
  [string[], StyleRuleClone, SelectorsCtx],
  FluidData
> = {
  "should process the selectors": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processSelectorAssertions: AssertionChain<
  State,
  [string, StyleRuleClone, SelectorCtx],
  FluidData
> = {
  "should process the selector": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processNextBatchAssertions: AssertionChain<
  State,
  [RuleBatch, ProcessNextBatchCtx],
  FluidData
> = {
  "should process the next batch": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processPropertyAssertions: AssertionChain<
  State,
  [string, PropertyCtx],
  FluidData
> = {
  "should process the property": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processNextRuleAssertions: AssertionChain<
  State,
  [StyleRuleClone, ProcessNextRuleCtx],
  FluidData
> = {
  "should process the next rule": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
  },
};

const processFluidRangeAssertions: AssertionChain<
  State,
  [string, ProcessFluidRangeCtx],
  FluidData
> = {
  "should process the fluid range": (state, args, result) => {
    expect(state.master!.fluidData).toMatchObject(result);
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
  parseStyleSheets: parseStyleSheetsAssertions,
  processStyleSheet: processStyleSheetAssertions,
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
    return {};
  }

  parseCSS = this.wrapTopFn(parseCSS, "parseCSS");

  initDoc = this.wrapFn(initDoc, "initDoc");

  parseStyleSheets = this.wrapFn(parseStyleSheets, "parseStyleSheets");

  processStyleSheet = this.wrapFn(processStyleSheet, "processStyleSheet");

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
  wrap(
    parseCSSAssertionMaster.parseCSS,
    parseCSSAssertionMaster.initDoc,
    parseCSSAssertionMaster.parseStyleSheets,
    parseCSSAssertionMaster.processStyleSheet,
    parseCSSAssertionMaster.parseStyleSheet,
    parseCSSAssertionMaster.processRuleBatch,
    parseCSSAssertionMaster.processRule,
    parseCSSAssertionMaster.processSelectors,
    parseCSSAssertionMaster.processSelector,
    parseCSSAssertionMaster.processProperty,
    parseCSSAssertionMaster.processNextBatch,
    parseCSSAssertionMaster.processNextRule,
    parseCSSAssertionMaster.processFluidRange,
    parseCSSAssertionMaster.insertFluidRange
  );
}

export default parseCSSAssertionMaster;
export { wrapAll };
