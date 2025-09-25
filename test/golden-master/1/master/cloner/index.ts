import { ClonerMaster } from "../../../cloner/master.types";
import { master } from "../../master";
import { docClone } from "./docClone";

const clonerMaster: ClonerMaster = {
  ...master,
  docClone,
};

export { clonerMaster };
