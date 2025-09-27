import { FluidData } from "../../../../../src/index.types";
import { ParseMaster } from "../../../parse/master.types";
import { master } from "../../master";
import fluidData from "./fluidData";
import { docClone } from "../cloner/docClone";

const parseMaster: ParseMaster = {
  ...master,
  fluidData,
  breakpoints: [375, 600],
  globalBaselineWidth: 375,
  imput: docClone,
};

export { parseMaster };
