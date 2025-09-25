import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./cloner.types";
import { FLUID_PROPERTY_NAMES, SHORTHAND_PROPERTIES } from "./const";

function cloneDocument(document: Document): DocumentClone {
  const docClone: DocumentClone = {
    styleSheets: cloneStyleSheets(
      getAccessibleStyleSheets(document.styleSheets)
    ),
  };

  return docClone;
}

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

function cloneStyleSheets(sheets: CSSStyleSheet[]): StyleSheetClone[] {
  return Array.from(sheets).map(cloneStyleSheet);
}

function cloneStyleSheet(sheet: CSSStyleSheet): StyleSheetClone {
  const styleSheetClone: StyleSheetClone = {
    cssRules: cloneRules(sheet.cssRules),
  };

  return styleSheetClone;
}

function cloneRules(rules: CSSRuleList): RuleClone[] {
  const rulesClone: RuleClone[] = [];
  for (const rule of Array.from(rules)) {
    const ruleClone = cloneRule(rule);
    if (ruleClone) {
      rulesClone.push(ruleClone);
    }
  }
  return rulesClone;
}

function cloneRule(rule: CSSRule): RuleClone | null {
  if (rule.type === 1) {
    return cloneStyleRule(rule as CSSStyleRule);
  } else if (rule.type === 4) {
    return cloneMediaRule(rule as CSSMediaRule);
  }
  return null;
}

function cloneStyleRule(rule: CSSStyleRule): StyleRuleClone | null {
  const style: Record<string, string> = {};

  for (const property in rule.style) {
    if (FLUID_PROPERTY_NAMES.has(property)) {
      if (SHORTHAND_PROPERTIES[property]) {
        if (process === undefined) continue;
      }
      style[property] = rule.style[property];
    }
  }
  if (Object.keys(style).length <= 0) return null;

  const styleRuleClone: StyleRuleClone = {
    type: 1,
    selectorText: rule.selectorText,
    style,
    special: {},
  };

  return styleRuleClone;
}

function cloneMediaRule(rule: CSSMediaRule): MediaRuleClone | null {
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
}

export { cloneDocument };
