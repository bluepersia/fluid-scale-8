import { getQueue } from "gold-sight";
import assertionMaster1 from "../../test/golden-master/gold-sight";
import { wrapAll as wrapAllCloneDoc } from "../../test/golden-master/gold-sight";

wrapAllCloneDoc();

import { cloneDocument } from "../../src/cloner";

export { getQueue, assertionMaster1, cloneDocument };
