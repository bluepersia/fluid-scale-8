import { FluidValue, FluidValueSingle } from "../../index.types";
import { splitBySpaces } from "../../utils";
import {
  FluidData,
  InsertFluidRangeCtx,
  ProcessFluidRangeCtx,
} from "../index.types";
import { splitSelectors, toMainCtx } from "../parse";

let processFluidRange = (
  maxValue: string,
  ctx: ProcessFluidRangeCtx
): FluidData => {
  const { selector, isDynamic } = ctx;

  const baseSelector = isDynamic
    ? stripDynamicPseudos(stripClassModifiers(selector))
    : selector;

  const selectorParts = splitSelectors(baseSelector);
  const anchor = selectorParts[selectorParts.length - 1];

  return insertFluidRange(maxValue, anchor, toMainCtx(ctx));
};

function stripClassModifiers(selectorText: string): string {
  return (
    selectorText
      // remove BEM modifiers (--something)
      .replace(/--[a-zA-Z0-9_-]+/g, "")
      // collapse chained classes: keep the first .class, drop the following .others
      .replace(/(\.[a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9_-]+)+/g, "$1")
      .trim()
  );
}

function stripDynamicPseudos(selectorText: string): string {
  return selectorText
    .replace(
      /:(hover|focus|active|visited|disabled|checked|focus-visible|focus-within)/g,
      ""
    )
    .trim();
}

let insertFluidRange = (
  maxValue: string,
  anchor: string,
  ctx: InsertFluidRangeCtx
): FluidData => {
  const { property, orderID, selector, breakpoints } = ctx;
  const { minValue, batch, nextBatch } = ctx;
  let { fluidData } = ctx;

  const newFluidData = { ...fluidData };
  newFluidData[anchor] = { ...(newFluidData[anchor] || {}) };
  newFluidData[anchor][selector] = {
    ...(newFluidData[anchor][selector] || {}),
  };
  newFluidData[anchor][selector][property] = {
    ...(newFluidData[anchor][selector][property] || {
      metaData: {
        orderID,
        property,
      },
      ranges: [],
    }),
  };

  const newRanges = (newFluidData[anchor][selector][property].ranges = [
    ...newFluidData[anchor][selector][property].ranges,
  ]);
  newRanges.push({
    minValue: parseFluidValue2D(minValue),
    maxValue: parseFluidValue2D(maxValue),
    minBpIndex: breakpoints.indexOf(batch.width),
    maxBpIndex: breakpoints.indexOf(nextBatch.width),
  });

  return newFluidData;
};

let parseFluidValue2D = (value: string): FluidValue[][] => {
  let depth = 0;
  let currentValue = "";
  let values: FluidValue[][] = [];
  for (const char of value) {
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    } else if (char === "," && depth === 0) {
      values.push(parseFluidValue1D(currentValue));
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  values.push(parseFluidValue1D(currentValue));

  return values;
};

let parseFluidValue1D = (value: string): FluidValue[] => {
  const values: string[] = splitBySpaces(value);
  return values.map(parseFluidValue);
};

let parseFluidValue = (strValue: string): FluidValue => {
  const value = parseFloat(strValue);

  // Match any alphabetic characters after the number
  const match = strValue.match(/[a-z%]+$/i);
  const unit = match?.[0] || "px";

  return {
    value,
    unit,
  } as FluidValueSingle;
};

function wrap(
  processFluidRangeWrapped: (
    maxValue: string,
    ctx: ProcessFluidRangeCtx
  ) => FluidData,
  insertFluidRangeWrapped: (
    maxValue: string,
    anchor: string,
    ctx: InsertFluidRangeCtx
  ) => FluidData
) {
  processFluidRange = processFluidRangeWrapped;
  insertFluidRange = insertFluidRangeWrapped;
}

export {
  processFluidRange,
  insertFluidRange,
  parseFluidValue2D,
  parseFluidValue1D,
  parseFluidValue,
  wrap,
};
