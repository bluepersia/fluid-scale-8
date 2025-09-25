type DocumentClone = {
  styleSheets: StyleSheetClone[];
};

type StyleSheetClone = {
  cssRules: RuleClone[];
};

type RuleClone = {
  type: 1 | 4;
};

type StyleRuleClone = RuleClone & {
  type: 1;
  selectorText: string;
  style: Record<string, string>;
  special: Record<string, string>;
};

type MediaRuleClone = RuleClone & {
  type: 4;
  minWidth: number;
  cssRules: RuleClone[];
};

export {
  DocumentClone,
  StyleSheetClone,
  RuleClone,
  StyleRuleClone,
  MediaRuleClone,
};
