import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "../../../src/cloner.types";

function getSheetByIndex(
  docClone: DocumentClone,
  index: number
): StyleSheetClone {
  return docClone.styleSheets[index];
}

function getRulesByAbsIndex(
  docClone: DocumentClone,
  absIndex: number
): RuleClone[] {
  let index = 0;
  for (const sheet of docClone.styleSheets) {
    if (index === absIndex) return sheet.cssRules;
    index++;
    for (const rule of sheet.cssRules) {
      if (rule.type === 4) {
        if (index === absIndex) return (rule as MediaRuleClone).cssRules;
        index++;
      }
    }
  }
  return [];
}

function getRuleByAbsIndex(
  docClone: DocumentClone,
  absIndex: number
): RuleClone | undefined {
  let index = 0;
  for (const sheet of docClone.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (index === absIndex) return rule;
      index++;
      if (rule.type === 4) {
        for (const subrule of (rule as MediaRuleClone).cssRules) {
          if (index === absIndex) return subrule;
          index++;
        }
      }
    }
  }
}

function getStyleRuleByAbsIndex(
  docClone: DocumentClone,
  absIndex: number
): StyleRuleClone | undefined {
  let index = 0;
  for (const sheet of docClone.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (rule.type === 1) {
        if (index === absIndex) return rule as StyleRuleClone;
        index++;
        continue;
      }

      if (rule.type === 4) {
        for (const subrule of (rule as MediaRuleClone).cssRules) {
          if (index === absIndex) return subrule as StyleRuleClone;
          index++;
        }
      }
    }
  }
}

function getMediaRuleByAbsIndex(
  docClone: DocumentClone,
  absIndex: number
): MediaRuleClone | undefined {
  let index = 0;
  for (const sheet of docClone.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (rule.type === 4) {
        if (index === absIndex) return rule as MediaRuleClone;
        index++;
      }
    }
  }
}

export {
  getSheetByIndex,
  getRulesByAbsIndex,
  getRuleByAbsIndex,
  getStyleRuleByAbsIndex,
  getMediaRuleByAbsIndex,
};
