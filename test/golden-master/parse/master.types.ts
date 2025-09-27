import { FluidData } from "../../../src/index.types";
import { DocumentClone } from "../../../src/parse/cloner/cloner.types";
import { Master } from "../index.types";

type ParseModule = {
  fluidData: FluidData;
  breakpoints: number[];
  globalBaselineWidth: number;
  imput: DocumentClone;
};

type ParseMaster = Master & ParseModule;

export { ParseMaster };
