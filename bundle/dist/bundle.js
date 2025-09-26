"use strict";
var FluidScale = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // bundle/src/bundle.ts
  var bundle_exports = {};
  __export(bundle_exports, {
    assertionMaster1: () => gold_sight_default,
    cloneDocument: () => cloneDocument,
    getQueue: () => getQueue
  });

  // ../GoldSight/dist/index.js
  var assertionQueues = {};
  var AssertionMaster = class {
    constructor(assertionChains, globalKey) {
      this.resetState = () => {
        this._state = { ...this.newState(), funcIndex: 0, master: this.master };
      };
      this.assertQueue = (options) => {
        const { assertionQueue, verifiedAssertions } = assertionQueues[this.globalKey];
        verifiedAssertions.clear();
        console.groupCollapsed(`\u2705 ${this.globalKey} - \u2728${options?.masterIndex ?? this.state.master.index}`);
        const queueIndexes = Array.from(assertionQueue.keys()).sort((a, b) => options?.sorting === "desc" ? a - b : b - a);
        for (const queueIndex of queueIndexes) {
          const { name, result, args, state } = assertionQueue.get(queueIndex);
          const assertions = this.assertionChains[name];
          for (const [key, assertion] of Object.entries(assertions)) {
            assertion(state, args, result);
            let count = verifiedAssertions.get(key) || 0;
            count++;
            verifiedAssertions.set(key, count);
          }
        }
        for (const [key, count] of verifiedAssertions.entries()) {
          console.log(`\u2705 ${key} - \u2728${count} times`);
        }
        console.groupEnd();
        this.reset();
      };
      this.assertionChains = assertionChains;
      this._globalKey = globalKey;
      assertionQueues[globalKey] = {
        assertionQueue: /* @__PURE__ */ new Map(),
        verifiedAssertions: /* @__PURE__ */ new Map()
      };
    }
    get globalKey() {
      return this._globalKey;
    }
    set master(master) {
      this._master = master;
    }
    get master() {
      return this._master;
    }
    get state() {
      return this._state;
    }
    wrapFn(fn, name, processors) {
      return ((...args) => {
        const convertedArgs = processors?.argsConverter ? processors.argsConverter(args) : args;
        if (processors?.pre)
          processors.pre(this.state, convertedArgs);
        const funcIndex = this.state.funcIndex;
        this.state.funcIndex++;
        const result = fn(...args);
        const assertionData = {
          state: this.state,
          result,
          name,
          args: convertedArgs,
          postOp: () => {
          }
        };
        if (processors?.post) {
          assertionData.postOp = (state, args2, result2) => {
            processors.post(state, args2, result2);
          };
        }
        assertionQueues[this.globalKey].assertionQueue.set(funcIndex, assertionData);
        return result;
      });
    }
    wrapAll() {
    }
    reset() {
      const { assertionQueue, verifiedAssertions } = assertionQueues[this.globalKey];
      assertionQueue.clear();
      verifiedAssertions.clear();
    }
    setQueue(queue) {
      assertionQueues[this.globalKey].assertionQueue = queue;
    }
    setQueueFromArray(queue) {
      assertionQueues[this.globalKey].assertionQueue = new Map(queue);
    }
    runPostOps() {
      const { assertionQueue } = assertionQueues[this.globalKey];
      const queueIndexes = Array.from(assertionQueue.keys()).sort((a, b) => a - b);
      for (const queueIndex of queueIndexes) {
        const value = assertionQueue.get(queueIndex);
        value.state = { ...value.state };
        if (value.postOp)
          value.postOp(this.state, value.args, value.result);
      }
    }
    wrapTopFn(fn, name, options) {
      return (...args) => {
        this.resetState();
        this.setQueue(/* @__PURE__ */ new Map());
        const wrappedFn = this.wrapFn(fn, name, options);
        const result = wrappedFn(...args);
        this.state.master = this.master;
        this.runPostOps();
        return result;
      };
    }
  };
  function getQueue(globalKey) {
    if (!assertionQueues[globalKey])
      throw Error(`Assertion queue for ${globalKey} not found`);
    return assertionQueues[globalKey].assertionQueue;
  }
  var dist_default = AssertionMaster;

  // test/golden-master/masterControllers/docClone.ts
  function getSheetByIndex(docClone, index) {
    return docClone.styleSheets[index];
  }
  function getRulesByAbsIndex(docClone, absIndex) {
    let index = 0;
    for (const sheet of docClone.styleSheets) {
      if (index === absIndex) return sheet.cssRules;
      index++;
      for (const rule of sheet.cssRules) {
        if (rule.type === 4) {
          if (index === absIndex) return rule.cssRules;
          index++;
        }
      }
    }
    return [];
  }
  function getRuleByAbsIndex(docClone, absIndex) {
    let index = 0;
    for (const sheet of docClone.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (index === absIndex) return rule;
        index++;
        if (rule.type === 4) {
          for (const subrule of rule.cssRules) {
            if (index === absIndex) return subrule;
            index++;
          }
        }
      }
    }
  }
  function getStyleRuleByAbsIndex(docClone, absIndex) {
    let index = 0;
    for (const sheet of docClone.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule.type === 1) {
          if (index === absIndex) return rule;
          index++;
          continue;
        }
        if (rule.type === 4) {
          for (const subrule of rule.cssRules) {
            if (index === absIndex) return subrule;
            index++;
          }
        }
      }
    }
  }
  function getMediaRuleByAbsIndex(docClone, absIndex) {
    let index = 0;
    for (const sheet of docClone.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule.type === 4) {
          if (index === absIndex) return rule;
          index++;
        }
      }
    }
  }

  // src/const.ts
  var FLUID_PROPERTY_NAMES = /* @__PURE__ */ new Set([
    "font-size",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "text-indent",
    "width",
    "min-width",
    "max-width",
    "height",
    "min-height",
    "max-height",
    "grid-template-columns",
    "grid-template-rows",
    "background-position-x",
    "background-position-y",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "border-radius",
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
    "gap",
    "column-gap",
    "row-gap",
    "--fluid-bg-size",
    "top",
    "left",
    "right",
    "bottom",
    "object-position"
  ]);
  var SHORTHAND_PROPERTIES = {
    padding: /* @__PURE__ */ new Map([
      [
        1,
        /* @__PURE__ */ new Map([
          [0, ["padding-top", "padding-right", "padding-bottom", "padding-left"]]
        ])
      ],
      [
        2,
        /* @__PURE__ */ new Map([
          [0, ["padding-top", "padding-bottom"]],
          [1, ["padding-right", "padding-left"]]
        ])
      ],
      [
        3,
        /* @__PURE__ */ new Map([
          [0, ["padding-top"]],
          [1, ["padding-right", "padding-left"]],
          [2, ["padding-bottom"]]
        ])
      ],
      [
        4,
        /* @__PURE__ */ new Map([
          [0, ["padding-top"]],
          [1, ["padding-right"]],
          [2, ["padding-bottom"]],
          [3, ["padding-left"]]
        ])
      ]
    ]),
    margin: /* @__PURE__ */ new Map([
      [
        1,
        /* @__PURE__ */ new Map([
          [0, ["margin-top", "margin-right", "margin-bottom", "margin-left"]]
        ])
      ],
      [
        2,
        /* @__PURE__ */ new Map([
          [0, ["margin-top", "margin-bottom"]],
          [1, ["margin-right", "margin-left"]]
        ])
      ],
      [
        3,
        /* @__PURE__ */ new Map([
          [0, ["margin-top"]],
          [1, ["margin-right", "margin-left"]],
          [2, ["margin-bottom"]]
        ])
      ],
      [
        4,
        /* @__PURE__ */ new Map([
          [0, ["margin-top"]],
          [1, ["margin-right"]],
          [2, ["margin-bottom"]],
          [3, ["margin-left"]]
        ])
      ]
    ]),
    border: /* @__PURE__ */ new Map([
      [
        1,
        /* @__PURE__ */ new Map([
          [0, ["border-top", "border-right", "border-bottom", "border-left"]]
        ])
      ],
      [
        2,
        /* @__PURE__ */ new Map([
          [0, ["border-top", "border-bottom"]],
          [1, ["border-right", "border-left"]]
        ])
      ],
      [
        3,
        /* @__PURE__ */ new Map([
          [0, ["border-top"]],
          [1, ["border-right", "border-left"]],
          [2, ["border-bottom"]]
        ])
      ],
      [
        4,
        /* @__PURE__ */ new Map([
          [0, ["border-top"]],
          [1, ["border-right"]],
          [2, ["border-bottom"]],
          [3, ["border-left"]]
        ])
      ]
    ]),
    "border-radius": /* @__PURE__ */ new Map([
      [
        1,
        /* @__PURE__ */ new Map([
          [
            0,
            [
              "border-top-left-radius",
              "border-top-right-radius",
              "border-bottom-right-radius",
              "border-bottom-left-radius"
            ]
          ]
        ])
      ],
      [
        2,
        /* @__PURE__ */ new Map([
          [0, ["border-top-left-radius", "border-bottom-right-radius"]],
          [1, ["border-top-right-radius", "border-bottom-left-radius"]]
        ])
      ],
      [
        3,
        /* @__PURE__ */ new Map([
          [0, ["border-top-left-radius"]],
          [1, ["border-top-right-radius", "border-bottom-left-radius"]],
          [2, ["border-bottom-right-radius"]]
        ])
      ],
      [
        4,
        /* @__PURE__ */ new Map([
          [0, ["border-top-left-radius"]],
          [1, ["border-top-right-radius"]],
          [2, ["border-bottom-right-radius"]],
          [3, ["border-bottom-left-radius"]]
        ])
      ]
    ]),
    gap: /* @__PURE__ */ new Map([[1, /* @__PURE__ */ new Map([[0, ["column-gap", "row-gap"]]])]]),
    "background-position": /* @__PURE__ */ new Map([
      [2, /* @__PURE__ */ new Map([[0, ["background-position-x", "background-position-y"]]])]
    ])
  };

  // src/utils.ts
  function splitBySpaces(value) {
    let depth = 0;
    let currentValue = "";
    const result = [];
    for (const char of value) {
      if (char === " ") {
        if (depth === 0) {
          result.push(currentValue);
          currentValue = "";
        } else {
          currentValue += char;
        }
      } else {
        if (char === "(") {
          depth++;
        } else if (char === ")") {
          depth--;
        }
        currentValue += char;
      }
    }
    if (currentValue) {
      result.push(currentValue);
    }
    return result;
  }

  // src/cloner.ts
  var cloneDocument = (document) => {
    const docClone = {
      styleSheets: cloneStyleSheets(
        getAccessibleStyleSheets(document.styleSheets)
      )
    };
    return docClone;
  };
  function getAccessibleStyleSheets(sheets) {
    return Array.from(sheets).filter((sheet) => {
      try {
        const rules = sheet.cssRules;
        return rules ? true : false;
      } catch (error) {
        return false;
      }
    });
  }
  var cloneStyleSheets = (sheets) => {
    return Array.from(sheets).map(cloneStyleSheet);
  };
  var cloneStyleSheet = (sheet) => {
    const styleSheetClone = {
      cssRules: cloneRules(sheet.cssRules)
    };
    return styleSheetClone;
  };
  var cloneRules = (rules) => {
    const rulesClone = [];
    for (const rule of Array.from(rules)) {
      const ruleClone = cloneRule(rule);
      if (ruleClone) {
        rulesClone.push(ruleClone);
      }
    }
    return rulesClone;
  };
  var cloneRule = (rule) => {
    if (rule.type === 1) {
      return cloneStyleRule(rule);
    } else if (rule.type === 4) {
      return cloneMediaRule(rule);
    }
    return null;
  };
  var cloneStyleRule = (rule) => {
    const style = makeStyle(rule);
    if (!style) return null;
    const styleRuleClone = {
      type: 1,
      selectorText: normalizeSelector(rule.selectorText),
      style,
      specialProps: {}
    };
    return styleRuleClone;
  };
  var makeStyle = (rule) => {
    const style = {};
    for (let i = 0; i < rule.style.length; i++) {
      const property = rule.style[i];
      if (FLUID_PROPERTY_NAMES.has(property)) {
        if (SHORTHAND_PROPERTIES[property]) {
          if (typeof process === void 0) continue;
          const shorthandValue = rule.style.getPropertyValue(property);
          if (!shorthandValue) continue;
          const shorthandStyle = handleShorthand(property, shorthandValue);
          for (const key in shorthandStyle) {
            style[key] = normalizeZero(shorthandStyle[key]);
          }
          continue;
        }
        style[property] = normalizeZero(rule.style.getPropertyValue(property));
      }
    }
    return Object.keys(style).length <= 0 ? null : style;
  };
  var cloneMediaRule = (rule) => {
    const match = rule.media.mediaText.match(/\(min-width:\s*(\d+)px\)/);
    if (match) {
      const mediaRuleClone = {
        type: 4,
        minWidth: Number(match[1]),
        cssRules: cloneRules(rule.cssRules)
      };
      return mediaRuleClone;
    }
    return null;
  };
  function handleShorthand(property, value) {
    const splitValues = splitBySpaces(value);
    const explicitStyle = {};
    const mapForLength = SHORTHAND_PROPERTIES[property].get(splitValues.length);
    for (let i = 0; i < splitValues.length; i++) {
      const properties = mapForLength?.get(i);
      if (properties) {
        const value2 = splitValues[i];
        for (const property2 of properties) {
          explicitStyle[property2] = value2;
        }
      }
    }
    return explicitStyle;
  }
  function normalizeZero(input) {
    return input.replace(
      /(?<![\d.])0+(?:\.0+)?(?![\d.])(?!(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)\b)/g,
      "0px"
    );
  }
  function normalizeSelector(selector) {
    return selector.replace(/\*::(before|after)\b/g, "::$1").replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();
  }
  function wrap(cloneDocumentWrapped, cloneStyleSheetsWrapped, cloneStyleSheetWrapped, cloneRulesWrapped, cloneRuleWrapped, cloneStyleRuleWrapped, makeStyleWrapped, cloneMediaRuleWrapped) {
    cloneDocument = cloneDocumentWrapped;
    cloneStyleSheets = cloneStyleSheetsWrapped;
    cloneStyleSheet = cloneStyleSheetWrapped;
    cloneRules = cloneRulesWrapped;
    cloneRule = cloneRuleWrapped;
    cloneStyleRule = cloneStyleRuleWrapped;
    makeStyle = makeStyleWrapped;
    cloneMediaRule = cloneMediaRuleWrapped;
  }

  // test/utils.ts
  var expect;
  if (true) {
    (async () => {
      expect = (await import("vitest")).expect;
    })();
  }
  function toEqualDefined(result, expected, path) {
    expect(result, path).toBeDefined();
    expect(expected, path).toBeDefined();
    expect(result, path).toEqual(expected);
  }
  function makeVitestMsg(state, path) {
    if (!path) return `masterIndex: ${state.master.index}`;
    return JSON.stringify({
      masterIndex: state.master.index,
      ...typeof path === "object" ? path : { path }
    });
  }

  // test/golden-master/gold-sight.ts
  var cloneDocumentAssertions = {
    "should clone the document": (state, args, result) => {
      toEqualDefined(
        result,
        state.master?.docClone,
        makeVitestMsg(state, "docClone")
      );
    }
  };
  var cloneStyleSheetsAssertions = {
    "should clone the style sheets": (state, args, result) => {
      toEqualDefined(
        result,
        state.master?.docClone.styleSheets,
        makeVitestMsg(state, "docClone.styleSheets")
      );
    }
  };
  var cloneStyleSheetAssertions = {
    "should clone the style sheet": (state, args, result) => {
      toEqualDefined(
        result,
        getSheetByIndex(
          state.master.docClone,
          state.sheetIndex
        ),
        makeVitestMsg(state, {
          sheetIndex: state.sheetIndex
        })
      );
    }
  };
  var cloneRulesAssertions = {
    "should clone the rules": (state, args, result) => {
      toEqualDefined(
        result,
        getRulesByAbsIndex(
          state.master.docClone,
          state.absRulesIndex
        ),
        makeVitestMsg(state, {
          absRulesIndex: state.absRulesIndex
        })
      );
    }
  };
  var cloneRuleAssertions = {
    "should clone the rule": (state, args, result) => {
      if (!result) return;
      toEqualDefined(
        result,
        getRuleByAbsIndex(
          state.master.docClone,
          state.absRuleIndex
        ),
        makeVitestMsg(state, {
          absRuleIndex: state.absRuleIndex
        })
      );
    }
  };
  var cloneStyleRuleAssertions = {
    "should clone the style rule": (state, args, result) => {
      if (!result) return;
      toEqualDefined(
        result,
        getStyleRuleByAbsIndex(
          state.master.docClone,
          state.absStyleRuleIndex
        ),
        makeVitestMsg(state, {
          absStyleRuleIndex: state.absStyleRuleIndex
        })
      );
    }
  };
  var makeStyleAssertions = {
    "should make the style": (state, args, result) => {
      if (!result) return;
      toEqualDefined(
        result,
        getStyleRuleByAbsIndex(
          state.master.docClone,
          state.absStyleRuleIndex - 1
        ).style,
        makeVitestMsg(state, {
          absStyleIndex: state.absStyleRuleIndex - 1
        })
      );
    }
  };
  var cloneMediaRuleAssertions = {
    "should clone the media rule": (state, args, result) => {
      if (!result) return;
      toEqualDefined(
        result,
        getMediaRuleByAbsIndex(
          state.master.docClone,
          state.absMediaRuleIndex
        ),
        makeVitestMsg(state, {
          absMediaRuleIndex: state.absMediaRuleIndex
        })
      );
    }
  };
  var defaultAssertions = {
    cloneDocument: cloneDocumentAssertions,
    cloneStyleSheets: cloneStyleSheetsAssertions,
    cloneStyleSheet: cloneStyleSheetAssertions,
    cloneRules: cloneRulesAssertions,
    cloneRule: cloneRuleAssertions,
    cloneStyleRule: cloneStyleRuleAssertions,
    makeStyle: makeStyleAssertions,
    cloneMediaRule: cloneMediaRuleAssertions
  };
  var CloneDocumentAssertionMaster = class extends dist_default {
    constructor() {
      super(defaultAssertions, "cloneDocument");
      this.cloneDocument = this.wrapTopFn(cloneDocument, "cloneDocument");
      this.cloneStyleSheets = this.wrapFn(cloneStyleSheets, "cloneStyleSheets");
      this.cloneStyleSheet = this.wrapFn(cloneStyleSheet, "cloneStyleSheet", {
        post: (state) => {
          state.sheetIndex++;
        }
      });
      this.cloneRules = this.wrapFn(cloneRules, "cloneRules", {
        post: (state) => {
          state.absRulesIndex++;
        }
      });
      this.cloneRule = this.wrapFn(cloneRule, "cloneRule", {
        post: (state, args, result) => {
          if (!result) return;
          state.absRuleIndex++;
        }
      });
      this.cloneStyleRule = this.wrapFn(cloneStyleRule, "cloneStyleRule", {
        post: (state, args, result) => {
          if (!result) return;
          state.absStyleRuleIndex++;
        }
      });
      this.makeStyle = this.wrapFn(makeStyle, "makeStyle");
      this.cloneMediaRule = this.wrapFn(cloneMediaRule, "cloneMediaRule", {
        post: (state, args, result) => {
          if (!result) return;
          state.absMediaRuleIndex++;
        }
      });
    }
    newState() {
      return {
        sheetIndex: 0,
        absRulesIndex: 0,
        absRuleIndex: 0,
        absStyleRuleIndex: 0,
        absMediaRuleIndex: 0
      };
    }
  };
  var cloneDocumentAssertionMaster = new CloneDocumentAssertionMaster();
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
  var gold_sight_default = cloneDocumentAssertionMaster;

  // bundle/src/bundle.ts
  wrapAll();
  return __toCommonJS(bundle_exports);
})();
