import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../../canonical.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const expected = JSON.parse(fs.readFileSync(path.join(directory, "expected", "synthetic-result.json"), "utf8"));
const actual = JSON.parse(fs.readFileSync(path.join(directory, "output", "synthetic-result.json"), "utf8"));

assert.equal(canonicalJson(actual), canonicalJson(expected));
process.stdout.write("Synthetic pilot output matches the deterministic fixture.\n");
