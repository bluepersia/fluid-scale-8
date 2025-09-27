import AssertionMaster, { AssertionChain } from "gold-sight";
import * as docCloneController from "../masterControllers/docClone";
import {
  cloneDocument,
  cloneStyleSheets,
  cloneStyleSheet,
  cloneRules,
  cloneRule,
  cloneStyleRule,
  makeStyle,
  cloneMediaRule,
  wrap,
} from "../../../src/parse/cloner/cloner";
import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "../../../src/parse/cloner/cloner.types";
import { toEqualDefined, makeVitestMsg } from "../../utils";
import { ClonerMaster } from "./master.types";

type State = {
  sheetIndex: number;
  absRulesIndex: number;
  absRuleIndex: number;
  absStyleRuleIndex: number;
  absMediaRuleIndex: number;
  master?: ClonerMaster;
};

const cloneDocumentAssertions: AssertionChain<State, Document, DocumentClone> =
  {
    "should clone the document": (state, args, result) => {
      toEqualDefined(
        result,
        state.master?.docClone,
        makeVitestMsg(state, "docClone")
      );
    },
  };

const cloneStyleSheetsAssertions: AssertionChain<
  State,
  CSSStyleSheet[],
  StyleSheetClone[]
> = {
  "should clone the style sheets": (state, args, result) => {
    toEqualDefined(
      result,
      state.master?.docClone.styleSheets,
      makeVitestMsg(state, "docClone.styleSheets")
    );
  },
};

const cloneStyleSheetAssertions: AssertionChain<
  State,
  CSSStyleSheet,
  StyleSheetClone
> = {
  "should clone the style sheet": (state, args, result) => {
    toEqualDefined(
      result,
      docCloneController.getSheetByIndex(
        state.master!.docClone,
        state.sheetIndex
      ),
      makeVitestMsg(state, {
        sheetIndex: state.sheetIndex,
      })
    );
  },
};

const cloneRulesAssertions: AssertionChain<State, CSSRuleList, RuleClone[]> = {
  "should clone the rules": (state, args, result) => {
    toEqualDefined(
      result,
      docCloneController.getRulesByAbsIndex(
        state.master!.docClone,
        state.absRulesIndex
      ),
      makeVitestMsg(state, {
        absRulesIndex: state.absRulesIndex,
      })
    );
  },
};

const cloneRuleAssertions: AssertionChain<State, CSSRule, RuleClone> = {
  "should clone the rule": (state, args, result) => {
    if (!result) return;
    toEqualDefined(
      result,
      docCloneController.getRuleByAbsIndex(
        state.master!.docClone,
        state.absRuleIndex
      ),
      makeVitestMsg(state, {
        absRuleIndex: state.absRuleIndex,
      })
    );
  },
};

const cloneStyleRuleAssertions: AssertionChain<
  State,
  CSSStyleRule,
  StyleRuleClone
> = {
  "should clone the style rule": (state, args, result) => {
    if (!result) return;
    toEqualDefined(
      result,
      docCloneController.getStyleRuleByAbsIndex(
        state.master!.docClone,
        state.absStyleRuleIndex
      ),
      makeVitestMsg(state, {
        absStyleRuleIndex: state.absStyleRuleIndex,
      })
    );
  },
};

const makeStyleAssertions: AssertionChain<
  State,
  CSSStyleRule,
  Record<string, string>
> = {
  "should make the style": (state, args, result) => {
    if (!result) return;

    toEqualDefined(
      result,
      docCloneController.getStyleRuleByAbsIndex(
        state.master!.docClone,
        state.absStyleRuleIndex - 1
      )!.style,
      makeVitestMsg(state, {
        absStyleIndex: state.absStyleRuleIndex - 1,
      })
    );
  },
};

const cloneMediaRuleAssertions: AssertionChain<
  State,
  CSSMediaRule,
  MediaRuleClone
> = {
  "should clone the media rule": (state, args, result) => {
    if (!result) return;
    toEqualDefined(
      result,
      docCloneController.getMediaRuleByAbsIndex(
        state.master!.docClone,
        state.absMediaRuleIndex
      ),
      makeVitestMsg(state, {
        absMediaRuleIndex: state.absMediaRuleIndex,
      })
    );
  },
};

const defaultAssertions = {
  cloneDocument: cloneDocumentAssertions,
  cloneStyleSheets: cloneStyleSheetsAssertions,
  cloneStyleSheet: cloneStyleSheetAssertions,
  cloneRules: cloneRulesAssertions,
  cloneRule: cloneRuleAssertions,
  cloneStyleRule: cloneStyleRuleAssertions,
  makeStyle: makeStyleAssertions,
  cloneMediaRule: cloneMediaRuleAssertions,
};

class CloneDocumentAssertionMaster extends AssertionMaster<
  State,
  ClonerMaster
> {
  constructor() {
    super(defaultAssertions, "cloneDocument");
  }

  newState(): State {
    return {
      sheetIndex: 0,
      absRulesIndex: 0,
      absRuleIndex: 0,
      absStyleRuleIndex: 0,
      absMediaRuleIndex: 0,
    };
  }

  cloneDocument = this.wrapTopFn(cloneDocument, "cloneDocument");

  cloneStyleSheets = this.wrapFn(cloneStyleSheets, "cloneStyleSheets");

  cloneStyleSheet = this.wrapFn(cloneStyleSheet, "cloneStyleSheet", {
    post: (state) => {
      state.sheetIndex++;
    },
  });

  cloneRules = this.wrapFn(cloneRules, "cloneRules", {
    post: (state) => {
      state.absRulesIndex++;
    },
  });

  cloneRule = this.wrapFn(cloneRule, "cloneRule", {
    post: (state, args, result) => {
      if (!result) return;
      state.absRuleIndex++;
    },
  });

  cloneStyleRule = this.wrapFn(cloneStyleRule, "cloneStyleRule", {
    post: (state, args, result) => {
      if (!result) return;
      state.absStyleRuleIndex++;
    },
  });

  makeStyle = this.wrapFn(makeStyle, "makeStyle");

  cloneMediaRule = this.wrapFn(cloneMediaRule, "cloneMediaRule", {
    post: (state, args, result) => {
      if (!result) return;
      state.absMediaRuleIndex++;
    },
  });
}

const cloneDocumentAssertionMaster = new CloneDocumentAssertionMaster();

function wrapAll() {
  wrap(
    cloneDocumentAssertionMaster.cloneDocument,
    cloneDocumentAssertionMaster.cloneStyleSheets,
    cloneDocumentAssertionMaster.cloneStyleSheet,
    cloneDocumentAssertionMaster.cloneRules,
    cloneDocumentAssertionMaster.cloneRule,
    cloneDocumentAssertionMaster.cloneStyleRule,
    cloneDocumentAssertionMaster.makeStyle,
    cloneDocumentAssertionMaster.cloneMediaRule
  );
}

export default cloneDocumentAssertionMaster;
export { wrapAll };
