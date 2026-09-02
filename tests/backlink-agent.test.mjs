import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildRequest, validateBrief, validateModelOutput } from "../scripts/backlink-agent.mjs";

const validBrief = {
  site: {
    name: "Example Materials Co.",
    website: "https://example.test",
    description: "A manufacturer of PVA material formats for industrial textile applications.",
    verifiedFacts: ["The company manufactures the material formats stated in this brief."],
    targetMarkets: ["international B2B buyers"],
    preferredLanguages: ["English"],
  },
  campaign: {
    goal: "Find credible editorial resource opportunities.",
    topics: ["PVA yarn"],
    excludedDomains: ["example.test"],
    maxProspects: 2,
  },
};

test("buildRequest uses the documented compatible endpoint without embedding credentials", () => {
  const brief = validateBrief(validBrief);
  const request = buildRequest(brief, {
    DASHSCOPE_API_KEY: "not-serialized",
    DASHSCOPE_BASE_URL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    QWEN_MODEL: "qwen3.8-flash",
  });

  assert.equal(request.endpoint, "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/responses");
  assert.equal(request.body.model, "qwen3.8-flash");
  assert.equal(JSON.stringify(request.body).includes("not-serialized"), false);
  assert.equal(request.body.store, false);
  assert.deepEqual(request.body.tools, [{ type: "web_search" }, { type: "web_extractor" }]);
});

test("brief validation rejects an invalid prospect limit", () => {
  assert.throws(
    () => validateBrief({ ...validBrief, campaign: { ...validBrief.campaign, maxProspects: 99 } }),
    /maxProspects/
  );
});

test("model output retains evidence and marks every draft for review", () => {
  const output = validateModelOutput(
    {
      campaignSummary: "One relevant resource prospect was found.",
      prospects: [
        {
          name: "Example Textile Resource",
          url: "https://resource.example.test/pva",
          opportunityType: "editorial_resource",
          relevance: "Its guide covers PVA material selection for textile production.",
          evidence: [{ url: "https://resource.example.test/pva", note: "The guide names PVA yarn as a material category." }],
          qualitySignals: ["A topic-specific educational guide is publicly available."],
          outreachAngle: "Offer a fact-checked technical clarification for the guide.",
          draftSubject: "A technical note for your PVA materials guide",
          draftEmail: "Hello, I noticed your PVA materials guide and can offer a fact-checked technical note if useful.",
          nextStep: "Verify the editorial contact and the current contribution policy.",
          score: 82.4,
        },
      ],
    },
    2
  );

  assert.equal(output.prospects[0].domain, "resource.example.test");
  assert.equal(output.prospects[0].status, "review_required");
  assert.equal(output.prospects[0].score, 82);
});

test("dry run validates and writes a plan without a model call", async () => {
  const directory = await mkdtemp(join(tmpdir(), "backlink-agent-"));
  const input = join(directory, "brief.json");
  const output = join(directory, "plan.json");
  await writeFile(input, JSON.stringify(validBrief), "utf8");

  try {
    const script = resolve("scripts/backlink-agent.mjs");
    const run = spawnSync(process.execPath, [script, "--dry-run", "--input", input, "--out", output], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const plan = JSON.parse(await readFile(output, "utf8"));
    assert.equal(plan.dryRun, true);
    assert.equal(plan.request.sendsOutreach, false);
    assert.equal(plan.request.endpoint, "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/responses");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
