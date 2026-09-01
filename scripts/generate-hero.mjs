/**
 * Hero banner generation — deep navy spinning mill + PVA product forms.
 * API constraints (from error 1214): both dims 512–2880px, multiples of 32,
 * max pixels 2^22. The CLI whitelist is stale, so we call the SDK directly.
 *
 * Usage: node scripts/generate-hero.mjs <a|b> [size]
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const variant = process.argv[2] || "a";
const size = process.argv[3] || "2560x1120";

const PROMPTS = {
  a: `Cinematic wide interior of a modern textile ring spinning mill, deep navy blue color grading, long row of ring spinning frames receding into the right side, hundreds of white yarn bobbins spinning on spindles, fine white PVA filament yarn lines stretching between machines, soft clouds of white staple fiber floating in light beams, one cone of white water-soluble sewing thread in sharp focus in the foreground, dramatic dark navy blue atmosphere with warm amber gold accent lighting glinting on machine rails, moody industrial haze, shallow depth of field, darker empty space on the left third for text overlay, professional B2B manufacturing website hero photography, high quality, detailed, no text, no words, no logos, no watermarks`,
  b: `Ultra-wide cinematic view inside a dark navy blue yarn spinning factory, foreground close-up of glossy white PVA filament yarn strands running from a spinning machine like silk threads catching amber golden light, behind them tall creel racks filled with rows of white yarn cones fading into deep blue atmospheric mist, ring spinning machinery silhouettes on the right, deep indigo and midnight blue palette with subtle warm gold highlights, volumetric light rays through industrial haze, elegant premium industrial photography for a textile manufacturer website hero banner, dark moody lighting, left side darker for headline overlay, high quality, detailed, no text, no words, no logos, no watermarks`,
};

const prompt = PROMPTS[variant];
if (!prompt) {
  console.error("Unknown variant:", variant);
  process.exit(1);
}

const zai = await ZAI.create();
const response = await zai.images.generations.create({ prompt, size });
const base64 = response?.data?.[0]?.base64;
if (!base64) throw new Error("No image data returned");

const out = `/home/z/my-project/public/images/generated/hero-pva-spinning-${variant}.png`;
fs.writeFileSync(out, Buffer.from(base64, "base64"));
console.log("saved:", out, fs.statSync(out).size, "bytes,", size);
