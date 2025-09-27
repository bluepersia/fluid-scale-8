import { test, expect, describe } from "vitest";
import { collection } from "./golden-master/parse/collection";
import parseCSSAssertionMaster from "./golden-master/parse/gold-sight";
import { parseCSS } from "../src/parse/parse";
import { splitSelectors } from "../../FluidScaleB2/src/parse/patcher/patcher";
import {
  parseFluidValue,
  parseFluidValue1D,
  parseFluidValue2D,
} from "../../FluidScaleB2/src/parse/patcher/fluidValueParse";
describe("parseCSS", () => {
  test.each(collection)("should parse the document", async (master) => {
    parseCSSAssertionMaster.master = master;

    parseCSS(master.input);

    parseCSSAssertionMaster.assertQueue();
  });
});

describe("make fluid value", () => {
  const parseSingleFluidValueTests = [
    {
      value: "10px",
      expected: {
        value: 10,
        unit: "px",
      },
    },
    {
      value: "2.2rem",
      expected: {
        value: 2.2,
        unit: "rem",
      },
    },
  ];
  test.each(parseSingleFluidValueTests)(
    "should make a fluid value from single value",
    (testCase) => {
      const { value, expected } = testCase;

      const result = parseFluidValue(value);

      expect(result).toEqual(expected);
    }
  );

  const parse1DFluidValueArrayTests = [
    {
      value: "10px 20px",
      expected: [
        { value: 10, unit: "px" },
        { value: 20, unit: "px" },
      ],
    },
    {
      value: "2.2rem 3.3rem",
      expected: [
        { value: 2.2, unit: "rem" },
        { value: 3.3, unit: "rem" },
      ],
    },
  ];
  test.each(parse1DFluidValueArrayTests)(
    "should make a 1D fluid value array from 1D values",
    (testCase) => {
      const { value, expected } = testCase;
      const result = parseFluidValue1D(value);

      expect(result).toEqual(expected);
    }
  );

  const parse2DFluidValueArrayTests = [
    {
      value: "10px 20px, 30px 40px",
      expected: [
        [
          { value: 10, unit: "px" },
          { value: 20, unit: "px" },
        ],
        [
          { value: 30, unit: "px" },
          { value: 40, unit: "px" },
        ],
      ],
    },
    {
      value: "20px 3.3rem, 4.4px 5.5rem",
      expected: [
        [
          { value: 20, unit: "px" },
          { value: 3.3, unit: "rem" },
        ],
        [
          { value: 4.4, unit: "px" },
          { value: 5.5, unit: "rem" },
        ],
      ],
    },
  ];
  test.each(parse2DFluidValueArrayTests)(
    "should make a 2D fluid value array from 2D values",
    (testCase) => {
      const { value, expected } = testCase;
      const result = parseFluidValue2D(value);

      expect(result).toEqual(expected);
    }
  );
});

describe("splitSelectors", () => {
  const splitSelectorsTests = [
    {
      selectors: ".product-card__price--actual, .product-card__price--original",
      expected: [
        ".product-card__price--actual",
        ".product-card__price--original",
      ],
    },
    {
      selectors: ".product-card__price--actual",
      expected: [".product-card__price--actual"],
    },
  ];

  test.each(splitSelectorsTests)(
    "should split selectors",
    (propertyExpectations) => {
      const { selectors, expected } = propertyExpectations;

      const result = splitSelectors(selectors);

      expect(result).toEqual(expected);
    }
  );
});
