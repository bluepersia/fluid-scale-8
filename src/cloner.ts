/**
 * CSS Document Cloner Module
 *
 * This module provides functionality to clone CSS documents and stylesheets into a
 * simplified, testable format that can be used outside of the browser environment.
 *
 * The primary purpose is to extract and normalize "fluid" CSS properties - properties
 * that can scale responsively (like font-size, padding, margins, etc.) - from browser
 * CSS documents and convert them into plain JavaScript objects for testing and analysis.
 *
 * Key Features:
 * - Extracts only fluid/scalable CSS properties (defined in FLUID_PROPERTY_NAMES)
 * - Handles CSS shorthand properties by expanding them to individual properties
 * - Processes media queries with min-width breakpoints
 * - Normalizes selectors and property values for consistency
 * - Filters out inaccessible stylesheets (cross-origin, etc.)
 *
 * @module cloner
 * @version 1.0.0
 */

import {
  DocumentClone,
  MediaRuleClone,
  RuleClone,
  StyleRuleClone,
  StyleSheetClone,
} from "./cloner.types";
import { FLUID_PROPERTY_NAMES, SHORTHAND_PROPERTIES } from "./const";
import { splitBySpaces } from "./utils";

/**
 * Clones a DOM Document's stylesheets into a simplified, testable format.
 *
 * This is the main entry point for the cloning process. It extracts all accessible
 * stylesheets from the document and converts them into a plain JavaScript object
 * structure that can be tested outside of the browser environment.
 *
 * @param document - The DOM Document to clone stylesheets from
 * @returns A DocumentClone object containing all cloned stylesheets
 *
 * @example
 * ```typescript
 * const docClone = cloneDocument(document);
 * console.log(docClone.styleSheets.length); // Number of accessible stylesheets
 * ```
 */
let cloneDocument = (document: Document): DocumentClone => {
  const docClone: DocumentClone = {
    styleSheets: cloneStyleSheets(
      getAccessibleStyleSheets(document.styleSheets)
    ),
  };

  return docClone;
};

/**
 * Filters a StyleSheetList to return only accessible stylesheets.
 *
 * Some stylesheets may be inaccessible due to CORS restrictions or other security
 * policies. This function safely attempts to access each stylesheet's cssRules
 * property and filters out any that throw errors.
 *
 * @param sheets - The StyleSheetList from the document
 * @returns Array of accessible CSSStyleSheet objects
 *
 * @example
 * ```typescript
 * const accessible = getAccessibleStyleSheets(document.styleSheets);
 * // Only returns stylesheets that can be safely read
 * ```
 */
function getAccessibleStyleSheets(sheets: StyleSheetList): CSSStyleSheet[] {
  return Array.from(sheets).filter((sheet) => {
    try {
      // Attempt to access cssRules - this will throw for inaccessible sheets
      const rules = sheet.cssRules;
      return rules ? true : false;
    } catch (error) {
      // Sheet is inaccessible (likely due to CORS), skip it
      return false;
    }
  });
}

/**
 * Clones an array of CSSStyleSheet objects into StyleSheetClone objects.
 *
 * @param sheets - Array of CSSStyleSheet objects to clone
 * @returns Array of StyleSheetClone objects
 */
let cloneStyleSheets = (sheets: CSSStyleSheet[]): StyleSheetClone[] => {
  return Array.from(sheets).map(cloneStyleSheet);
};

/**
 * Clones a single CSSStyleSheet into a StyleSheetClone object.
 *
 * Extracts and clones all CSS rules from the stylesheet, filtering out
 * any rules that don't contain fluid properties or aren't supported rule types.
 *
 * @param sheet - The CSSStyleSheet to clone
 * @returns A StyleSheetClone object containing cloned rules
 */
let cloneStyleSheet = (sheet: CSSStyleSheet): StyleSheetClone => {
  const styleSheetClone: StyleSheetClone = {
    cssRules: cloneRules(sheet.cssRules),
  };

  return styleSheetClone;
};

/**
 * Clones a CSSRuleList into an array of RuleClone objects.
 *
 * Iterates through all rules in the list and attempts to clone each one.
 * Only successfully cloned rules (those that contain fluid properties or are
 * supported media queries) are included in the result.
 *
 * @param rules - The CSSRuleList to clone
 * @returns Array of RuleClone objects (may be empty if no rules are cloneable)
 */
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

/**
 * Clones a single CSS rule based on its type.
 *
 * Currently supports:
 * - Type 1: Style rules (e.g., `.class { property: value; }`)
 * - Type 4: Media rules (e.g., `@media (min-width: 768px) { ... }`)
 *
 * Other rule types are ignored and return null.
 *
 * @param rule - The CSSRule to clone
 * @returns A RuleClone object or null if the rule type is not supported
 */
let cloneRule = (rule: CSSRule): RuleClone | null => {
  if (rule.type === 1) {
    // CSSStyleRule - regular CSS rule with selector and declarations
    return cloneStyleRule(rule as CSSStyleRule);
  } else if (rule.type === 4) {
    // CSSMediaRule - @media query rule
    return cloneMediaRule(rule as CSSMediaRule);
  }
  // Unsupported rule type (import, font-face, keyframes, etc.)
  return null;
};

/**
 * Clones a CSSStyleRule into a StyleRuleClone object.
 *
 * Extracts fluid properties from the rule's style declarations and normalizes
 * the selector text. If no fluid properties are found, returns null.
 *
 * @param rule - The CSSStyleRule to clone
 * @returns A StyleRuleClone object or null if no fluid properties are found
 *
 * @example
 * ```typescript
 * // For a rule like: .container { padding: 20px; color: red; }
 * // Only the padding property would be extracted (color is not a fluid property)
 * const cloned = cloneStyleRule(rule);
 * // cloned.style = { "padding-top": "20px", "padding-right": "20px", ... }
 * ```
 */
let cloneStyleRule = (rule: CSSStyleRule): StyleRuleClone | null => {
  const style: Record<string, string> | null = makeStyle(rule);
  if (!style) return null; // No fluid properties found

  const styleRuleClone: StyleRuleClone = {
    type: 1,
    selectorText: normalizeSelector(rule.selectorText),
    style,
    specialProps: {}, // Reserved for future use
  };

  return styleRuleClone;
};

/**
 * Extracts fluid CSS properties from a CSSStyleRule's style declarations.
 *
 * Iterates through all style properties and extracts only those that are
 * considered "fluid" (scalable/responsive). Handles shorthand properties by
 * expanding them into their individual longhand properties.
 *
 * @param rule - The CSSStyleRule to extract properties from
 * @returns Object mapping property names to values, or null if no fluid properties found
 *
 * @example
 * ```typescript
 * // For a rule with: { padding: "10px 20px", color: "red", font-size: "16px" }
 * // Returns: { "padding-top": "10px", "padding-bottom": "10px",
 * //           "padding-left": "20px", "padding-right": "20px", "font-size": "16px" }
 * ```
 */
let makeStyle = (rule: CSSStyleRule): Record<string, string> | null => {
  const style: Record<string, string> = {};

  for (let i = 0; i < rule.style.length; i++) {
    const property = rule.style[i];

    // Only process properties that are considered "fluid" (scalable)
    if (FLUID_PROPERTY_NAMES.has(property)) {
      // Handle shorthand properties (padding, margin, etc.)
      if (SHORTHAND_PROPERTIES[property]) {
        // Skip shorthand processing in browser environment to avoid issues
        if (typeof process === "undefined") continue;

        const shorthandValue = rule.style.getPropertyValue(property);
        if (!shorthandValue) continue;

        // Expand shorthand into individual properties
        const shorthandStyle = handleShorthand(property, shorthandValue);
        for (const key in shorthandStyle) {
          style[key] = normalizeZero(shorthandStyle[key]);
        }
        continue;
      }

      // Handle regular (non-shorthand) properties
      style[property] = normalizeZero(rule.style.getPropertyValue(property));
    }
  }

  // Return null if no fluid properties were found
  return Object.keys(style).length <= 0 ? null : style;
};

/**
 * Clones a CSSMediaRule into a MediaRuleClone object.
 *
 * Only processes media queries that contain a min-width condition in pixels.
 * Other types of media queries (max-width, orientation, etc.) are ignored.
 *
 * The cloning process:
 * 1. Extracts the min-width value from the media query text
 * 2. If found, clones all CSS rules within the media query
 * 3. Returns a simplified MediaRuleClone object
 *
 * @param rule - The CSSMediaRule to clone
 * @returns A MediaRuleClone object or null if no min-width condition is found
 *
 * @example
 * ```typescript
 * // For: @media (min-width: 768px) { .container { padding: 20px; } }
 * // Returns: { type: 4, minWidth: 768, cssRules: [...] }
 *
 * // For: @media (max-width: 600px) { ... }
 * // Returns: null (not supported)
 * ```
 */
let cloneMediaRule = (rule: CSSMediaRule): MediaRuleClone | null => {
  // Extract min-width value from media query text
  // Regex matches patterns like: (min-width: 768px)
  const match = rule.media.mediaText.match(/\(min-width:\s*(\d+)px\)/);

  if (match) {
    const mediaRuleClone: MediaRuleClone = {
      type: 4, // CSSRule.MEDIA_RULE
      minWidth: Number(match[1]), // Extract the pixel value
      cssRules: cloneRules(rule.cssRules), // Clone nested rules
    };
    return mediaRuleClone;
  }

  // Media query doesn't contain min-width in pixels, ignore it
  return null;
};

/**
 * Expands a CSS shorthand property into its individual longhand properties.
 *
 * CSS shorthand properties like `padding: 10px 20px` represent multiple individual
 * properties. This function uses predefined mapping tables to expand them correctly
 * based on the number of values provided.
 *
 * The expansion follows CSS shorthand rules:
 * - 1 value: applies to all sides (top, right, bottom, left)
 * - 2 values: first applies to top/bottom, second to left/right
 * - 3 values: top, left/right, bottom
 * - 4 values: top, right, bottom, left (clockwise)
 *
 * @param property - The shorthand property name (e.g., "padding", "margin")
 * @param value - The shorthand value (e.g., "10px 20px")
 * @returns Object mapping longhand property names to their values
 *
 * @example
 * ```typescript
 * handleShorthand("padding", "10px 20px");
 * // Returns: {
 * //   "padding-top": "10px",
 * //   "padding-bottom": "10px",
 * //   "padding-left": "20px",
 * //   "padding-right": "20px"
 * // }
 * ```
 */
function handleShorthand(
  property: string,
  value: string
): Record<string, string> {
  // Split the value by spaces, respecting function parentheses
  const splitValues = splitBySpaces(value);

  const explicitStyle: Record<string, string> = {};

  // Get the mapping configuration for this property and value count
  const mapForLength = SHORTHAND_PROPERTIES[property].get(splitValues.length);

  // Apply each value to its corresponding longhand properties
  for (let i = 0; i < splitValues.length; i++) {
    const properties = mapForLength?.get(i);
    if (properties) {
      const currentValue = splitValues[i];
      // Apply this value to all properties mapped to this position
      for (const longhandProperty of properties) {
        explicitStyle[longhandProperty] = currentValue;
      }
    }
  }

  return explicitStyle;
}

/**
 * Normalizes zero values in CSS property values to use 'px' units for consistency.
 *
 * Converts bare zero values (like "0", "0.0") to "0px" while preserving zeros
 * that already have units or are part of larger numbers. This ensures consistent
 * formatting across all cloned CSS properties.
 *
 * @param input - The CSS property value to normalize
 * @returns The normalized value with zero values converted to "0px"
 *
 * @example
 * ```typescript
 * normalizeZero("0");        // Returns: "0px"
 * normalizeZero("0 10px");   // Returns: "0px 10px"
 * normalizeZero("10px");     // Returns: "10px" (unchanged)
 * normalizeZero("0em");      // Returns: "0em" (unchanged, already has unit)
 * ```
 */
function normalizeZero(input: string): string {
  return input.replace(
    // Complex regex to match standalone zeros without units
    // Negative lookbehind: not preceded by digit or decimal
    // Match: one or more zeros, optionally followed by decimal zeros
    // Negative lookahead: not followed by digit, decimal, or existing unit
    /(?<![\d.])0+(?:\.0+)?(?![\d.])(?!(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)\b)/g,
    "0px"
  );
}

/**
 * Normalizes CSS selector text for consistency across different browsers and contexts.
 *
 * Performs several normalization steps:
 * 1. Simplifies universal pseudo-elements (*::before → ::before)
 * 2. Standardizes comma spacing in selector lists
 * 3. Collapses multiple whitespace characters to single spaces
 * 4. Trims leading and trailing whitespace
 *
 * @param selector - The CSS selector text to normalize
 * @returns The normalized selector string
 *
 * @example
 * ```typescript
 * normalizeSelector("*::before,   .class    .nested");
 * // Returns: "::before, .class .nested"
 *
 * normalizeSelector(".a,\n.b\t\t.c");
 * // Returns: ".a, .b .c"
 * ```
 */
function normalizeSelector(selector: string): string {
  return (
    selector
      // Simplify universal pseudo-elements: *::before → ::before
      .replace(/\*::(before|after)\b/g, "::$1")
      // Normalize comma spacing: "," → ", "
      .replace(/\s*,\s*/g, ", ")
      // Collapse multiple whitespace to single space
      .replace(/\s+/g, " ")
      // Remove leading/trailing whitespace
      .trim()
  );
}

/* -- TEST UTILITIES -- */

/**
 * Test utility function that allows wrapping/mocking of all cloner functions.
 *
 * This function enables dependency injection for testing purposes by allowing
 * external code to replace the internal cloner functions with mock implementations.
 * This is particularly useful for unit testing individual functions in isolation.
 *
 * @param cloneDocumentWrapped - Mock implementation for cloneDocument
 * @param cloneStyleSheetsWrapped - Mock implementation for cloneStyleSheets
 * @param cloneStyleSheetWrapped - Mock implementation for cloneStyleSheet
 * @param cloneRulesWrapped - Mock implementation for cloneRules
 * @param cloneRuleWrapped - Mock implementation for cloneRule
 * @param cloneStyleRuleWrapped - Mock implementation for cloneStyleRule
 * @param makeStyleWrapped - Mock implementation for makeStyle
 * @param cloneMediaRuleWrapped - Mock implementation for cloneMediaRule
 *
 * @internal This function is intended for testing purposes only
 */
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
  // Replace all internal function references with wrapped versions
  cloneDocument = cloneDocumentWrapped;
  cloneStyleSheets = cloneStyleSheetsWrapped;
  cloneStyleSheet = cloneStyleSheetWrapped;
  cloneRules = cloneRulesWrapped;
  cloneRule = cloneRuleWrapped;
  cloneStyleRule = cloneStyleRuleWrapped;
  makeStyle = makeStyleWrapped;
  cloneMediaRule = cloneMediaRuleWrapped;
}

// Export all public functions for external use
export {
  cloneDocument, // Main entry point - clones entire document
  cloneStyleSheets, // Clones array of stylesheets
  cloneStyleSheet, // Clones single stylesheet
  cloneRules, // Clones array of CSS rules
  cloneRule, // Clones single CSS rule
  cloneStyleRule, // Clones style rule (selector + declarations)
  makeStyle, // Extracts fluid properties from style rule
  cloneMediaRule, // Clones media query rule
  handleShorthand, // Expands CSS shorthand properties
  wrap, // Test utility for dependency injection
};
