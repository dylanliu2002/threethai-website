# Backlink outreach research assistant

This local tool uses Qwen to research **legitimate** editorial and resource-link
opportunities, score them against a campaign brief, and draft messages for
human review. It never sends email, fills web forms, publishes content, buys
links, or creates accounts.

## Before you run it

1. Revoke any API key that has been pasted into a chat or source file, then
   create a replacement in the Qwen/DashScope console.
2. Create an untracked `.env.local` file at the repository root. Do not commit
   it. Copy the Qwen variables shown in `.env.example` and supply the new key.
3. Review `scripts/backlink-agent.example.json`. Change only statements that
   you can substantiate publicly, campaign topics, markets, language, and
   excluded domains. Do not put unverified certification, capacity, customer,
   or performance claims in the brief.

The default endpoint is Qwen's international OpenAI-compatible endpoint and
the default model is `qwen3.8-flash`. The endpoint can be overridden for a
workspace-specific Qwen/DashScope endpoint through `DASHSCOPE_BASE_URL`.

## Commands

Validate the brief and verify the request configuration without using the
network or an API key:

```powershell
bun --env-file=.env.local scripts/backlink-agent.mjs --dry-run --input scripts/backlink-agent.example.json --out backlink-dry-run.json
```

Run one research pass and save a review queue:

```powershell
bun --env-file=.env.local scripts/backlink-agent.mjs --input scripts/backlink-agent.example.json --out backlink-review-queue.json
```

Run the non-network test suite:

```powershell
node --test tests/backlink-agent.test.mjs
```

## Input brief

The input must be JSON with these fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `site.name`, `site.website`, `site.description` | Yes | The company identity and public scope. |
| `site.verifiedFacts` | Yes | Facts the agent may use. Do not include assumptions. |
| `site.targetMarkets`, `site.preferredLanguages` | Yes | Market and communication constraints. |
| `site.contact` | No | Signature details for a draft only; the tool cannot send it. |
| `campaign.goal`, `campaign.topics` | Yes | Defines relevant opportunity types and search topics. |
| `campaign.excludedDomains` | No | Domains to avoid, including the company site. |
| `campaign.maxProspects` | No | 1–20; start with 5–8 for focused review. |
| `campaign.voice` | No | The desired tone for draft copy. |

## Output and review workflow

The output records the source URLs, public evidence, quality signals, a
relevance score, and one draft per prospect. Every prospect has
`status: "review_required"`.

Before making contact, a person must:

1. Open every evidence URL and verify that the opportunity still exists.
2. Confirm topical relevance, editorial standards, and the absence of a paid
   placement or reciprocal-link demand.
3. Verify the recipient and contribution/contact policy independently.
4. Edit the draft so every factual statement is accurate and appropriately
   personalized.
5. Send manually from an authorized business inbox; record opt-outs and do not
   continue follow-ups where they are unwelcome.

The tool treats web pages and snippets as untrusted sources so embedded prompt
instructions cannot alter its task. It also rejects model output that is not
valid JSON or lacks a traceable evidence URL.
