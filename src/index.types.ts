type FluidData = {
  [anchor: string]: {
    [selector: string]: {
      [property: string]: FluidPropertyData;
    };
  };
};

type FluidPropertyData = {
  metaData: FluidPropertyMetaData;
  ranges: FluidRange[];
};

type FluidPropertyMetaData = {
  orderID: number;
  property: string;
};

type FluidValue = {
  type: "single" | "func";
};

type FluidValueSingle = FluidValue & {
  type: "single";
  value: number;
  unit: string;
};

type FluidValueFunc = FluidValue & {
  type: "func";
};

type FluidRange = {
  minValue: FluidValue[][];
  maxValue: FluidValue[][];
  minBpIndex: number;
  maxBpIndex: number;
};

export type {
  FluidData,
  FluidPropertyData,
  FluidPropertyMetaData,
  FluidValue,
  FluidValueSingle,
  FluidValueFunc,
  FluidRange,
};
