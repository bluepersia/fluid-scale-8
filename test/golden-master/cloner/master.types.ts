import { DocumentClone } from "../../../src/cloner.types";
import { Master } from "../index.types";

type ClonerModule = {
  docClone: DocumentClone;
};

type ClonerMaster = Master & ClonerModule;

export { ClonerMaster };
