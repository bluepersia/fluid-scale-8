import { DocumentClone } from "../../../src/parse/cloner/cloner.types";
import { Master } from "../index.types";
import { FluidData } from "../../../src/index.types";

type ClonerModule = {
  docClone: DocumentClone;
};

type ClonerMaster = Master & ClonerModule;

export { ClonerMaster };
