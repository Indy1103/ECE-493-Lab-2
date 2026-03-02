import { strict as assert } from "node:assert";

import { mapLoginErrorState } from "../../../src/business/login/login-error-state.js";

assert.equal(mapLoginErrorState(401).status, "INVALID_CREDENTIALS");
assert.equal(mapLoginErrorState(429).status, "THROTTLED");
assert.equal(mapLoginErrorState(503).status, "UNAVAILABLE");
