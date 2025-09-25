import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./cloner.types";
import { FLUID_PROPERTY_NAMES, SHORTHAND_PROPERTIES } from "./const";
import { splitBySpaces } from "./utils";

let cloneDocument = (document: Document): DocumentClone => {
  const docClone: DocumentClone = {
    styleSheets: cloneStyleSheets(
      getAccessibleStyleSheets(document.styleSheets)
    ),
  };

  return docClone;
};

function getAccessibleStyleSheets(sheets: StyleSheetList): CSSStyleSheet[] {
  return Array.from(sheets).filter((sheet) => {
    try {
      const rules = sheet.cssRules;
      return rules ? true : false;
    } catch (error) {
      return false;
    }
  });
}

let cloneStyleSheets = (sheets: CSSStyleSheet[]): StyleSheetClone[] => {
  return Array.from(sheets).map(cloneStyleSheet);
};

let cloneStyleSheet = (sheet: CSSStyleSheet): StyleSheetClone => {
  const styleSheetClone: StyleSheetClone = {
    cssRules: cloneRules(sheet.cssRules),
  };

  return styleSheetClone;
};

let cloneRules = (rules: CSSRuleList): RuleClone[] => {
  const rulesClone: RuleClone[] = [];
  for (const rule of Array.from(rules)) {
    const ruleClone = cloneRule(rule);
    if (ruleClone) {
      rulesClone.push(ruleClone);
    }
  }
  return rulesClone;
};

let cloneRule = (rule: CSSRule): RuleClone | null => {
  if (rule.type === 1) {
    return cloneStyleRule(rule as CSSStyleRule);
  } else if (rule.type === 4) {
    return cloneMediaRule(rule as CSSMediaRule);
  }
  return null;
};

let cloneStyleRule = (rule: CSSStyleRule): StyleRuleClone | null => {
  const style: Record<string, string> | null = makeStyle(rule);
  if (!style) return null;

  const styleRuleClone: StyleRuleClone = {
    type: 1,
    selectorText: normalizeSelector(rule.selectorText),
    style,
    specialProps: {},
  };

  return styleRuleClone;
};

let makeStyle = (rule: CSSStyleRule): Record<string, string> | null => {
  const style: Record<string, string> = {};
  for (let i = 0; i < rule.style.length; i++) {
    const property = rule.style[i];
    if (FLUID_PROPERTY_NAMES.has(property)) {
      if (SHORTHAND_PROPERTIES[property]) {
        if (typeof process === undefined) continue;

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

let cloneMediaRule = (rule: CSSMediaRule): MediaRuleClone | null => {
  // Regex explanation: matches (min-width: <number>px)
  const match = rule.media.mediaText.match(/\(min-width:\s*(\d+)px\)/);

  if (match) {
    const mediaRuleClone: MediaRuleClone = {
      type: 4,
      minWidth: Number(match[1]),
      cssRules: cloneRules(rule.cssRules),
    };
    return mediaRuleClone;
  }
  return null;
};

function handleShorthand(
  property: string,
  value: string
): Record<string, string> {
  const splitValues = splitBySpaces(value);

  const explicitStyle: Record<string, string> = {};

  const mapForLength = SHORTHAND_PROPERTIES[property].get(splitValues.length);
  for (let i = 0; i < splitValues.length; i++) {
    const properties = mapForLength?.get(i);
    if (properties) {
      const value = splitValues[i];
      for (const property of properties) {
        explicitStyle[property] = value;
      }
    }
  }

  return explicitStyle;
}

function normalizeZero(input: string): string {
  return input.replace(
    /(?<![\d.])0+(?:\.0+)?(?![\d.])(?!(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)\b)/g,
    "0px"
  );
}

function normalizeSelector(selector: string): string {
  return selector
    .replace(/\*::(before|after)\b/g, "::$1")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -- TEST WRAPPING -- */

function wrap(
  cloneDocumentWrapped: (document: Document) => DocumentClone,
  cloneStyleSheetsWrapped: (styleSheets: CSSStyleSheet[]) => StyleSheetClone[],
  cloneStyleSheetWrapped: (sheet: CSSStyleSheet) => StyleSheetClone,
  cloneRulesWrapped: (rules: CSSRuleList) => RuleClone[],
  cloneRuleWrapped: (rule: CSSRule) => RuleClone | null,
  cloneStyleRuleWrapped: (rule: CSSStyleRule) => StyleRuleClone | null,
  makeStyleWrapped: (rule: CSSStyleRule) => Record<string, string> | null,
  cloneMediaRuleWrapped: (rule: CSSMediaRule) => MediaRuleClone | null
) {
  cloneDocument = cloneDocumentWrapped;
  cloneStyleSheets = cloneStyleSheetsWrapped;
  cloneStyleSheet = cloneStyleSheetWrapped;
  cloneRules = cloneRulesWrapped;
  cloneRule = cloneRuleWrapped;
  cloneStyleRule = cloneStyleRuleWrapped;
  makeStyle = makeStyleWrapped;
  cloneMediaRule = cloneMediaRuleWrapped;
}

export {
  cloneDocument,
  cloneStyleSheets,
  cloneStyleSheet,
  cloneRules,
  cloneRule,
  cloneStyleRule,
  makeStyle,
  cloneMediaRule,
  handleShorthand,
  wrap,
};
