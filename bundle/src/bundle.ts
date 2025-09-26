import { getQueue } from "gold-sight";
import assertionMaster1 from "../../test/golden-master/cloner/gold-sight";
import { wrapAll as wrapAllCloneDoc } from "../../test/golden-master/cloner/gold-sight";

wrapAllCloneDoc();

import { cloneDocument } from "../../src/parse/cloner/cloner";

export { getQueue, assertionMaster1, cloneDocument };
