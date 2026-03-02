import { strict as assert } from "node:assert";

import { mapLoginSuccessState } from "../../../src/business/login/login.service.js";

const state = mapLoginSuccessState({
  state: "AUTHENTICATED",
  roleHomePath: "/editor/home",
  message: "Login successful."
});

assert.equal(state.status, "AUTHENTICATED");
assert.equal(state.roleHomePath, "/editor/home");
