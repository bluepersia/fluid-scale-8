import { FluidData } from "../index.types";
import { StyleRuleClone } from "./cloner/cloner.types";

type CSSParseResult = {
  breakpoints: number[];
  fluidData: FluidData;
};

type DocStateResult = {
  newFluidData: FluidData;
  newOrderID: number;
};

type BatchState = {
  ruleBatches: RuleBatch[];
  currentRuleBatch: RuleBatch | null;
};

type RuleBatch = {
  rules: StyleRuleClone[];
  width: number;
  isMediaQuery: boolean;
};

type ParseContext = {
  breakpoints: number[];
  globalBaselineWidth: number;
  orderID: number;
  fluidData: FluidData;
  ruleBatches: RuleBatch[];
  batchIndex: number;
  minValue: string;
  rule: StyleRuleClone;
  selector: string;
  isDynamic: boolean;
  batch: RuleBatch;
  property: string;
  nextBatch: RuleBatch;
};

type ParseStyleSheetsCtx = Pick<
  ParseContext,
  "breakpoints" | "globalBaselineWidth"
>;

type ProcessStyleSheetCtx = Pick<ParseContext, "orderID" | "fluidData">;

type BatchStyleSheetCtx = Pick<ParseContext, "globalBaselineWidth">;

type ProcessRuleBatchCtx = Pick<
  ParseContext,
  "batchIndex" | "ruleBatches" | "orderID" | "fluidData"
>;
type ProcessRuleCtx = Pick<
  ParseContext,
  "batchIndex" | "ruleBatches" | "orderID" | "fluidData"
>;

type BatchOrientationCtx = Pick<
  ParseContext,
  "batchIndex" | "ruleBatches" | "fluidData"
>;

type SelectorCtx = BatchOrientationCtx;
type SelectorsCtx = BatchOrientationCtx;

type PropertyCtx = BatchOrientationCtx;

type ProcessNextBatchCtx = Pick<ParseContext, "fluidData">;

type ProcessNextRuleCtx = Pick<
  ParseContext,
  "selector" | "property" | "fluidData"
>;

type ProcessFluidRangeCtx = Pick<ParseContext, "selector" | "isDynamic">;

type InsertFluidRangeCtx = Pick<
  ParseContext,
  | "property"
  | "orderID"
  | "selector"
  | "breakpoints"
  | "minValue"
  | "batch"
  | "nextBatch"
  | "fluidData"
>;

export {
  CSSParseResult,
  FluidData,
  DocStateResult,
  BatchState,
  RuleBatch,
  ParseContext,
  SelectorsCtx,
  SelectorCtx,
  PropertyCtx,
  BatchStyleSheetCtx,
  ParseStyleSheetsCtx,
  ProcessStyleSheetCtx,
  ProcessRuleBatchCtx,
  ProcessRuleCtx,
  InsertFluidRangeCtx,
  ProcessFluidRangeCtx,
  ProcessNextRuleCtx,
  ProcessNextBatchCtx,
};
