#!/usr/bin/env node
/**
 * AAOS GPT-4o-mini Fine-tune Script
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node web/scripts/create-finetune.js
 *
 * Or on Windows PowerShell:
 *   $env:OPENAI_API_KEY = "sk-..."
 *   node web/scripts/create-finetune.js
 *
 * After the job finishes (~10–40 min), copy the model ID printed here
 * and add it to Vercel env vars:
 *   OPENAI_FINETUNE_MODEL = ft:gpt-4o-mini-2024-07-18:aaos:...
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("❌  Set OPENAI_API_KEY env var first.");
  process.exit(1);
}

const TRAINING_FILE = path.join(__dirname, "aaos-finetune-data.jsonl");

async function request(method, endpoint, body, isMultipart, boundary) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "api.openai.com",
      path: `/v1/${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...(isMultipart
          ? { "Content-Type": `multipart/form-data; boundary=${boundary}` }
          : { "Content-Type": "application/json" }),
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function uploadFile() {
  console.log("📤  Uploading training file…");
  const fileContent = fs.readFileSync(TRAINING_FILE);
  const boundary = "----FormBoundary" + Date.now().toString(16);
  const filename = path.basename(TRAINING_FILE);

  const preamble = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="purpose"`,
    "",
    "fine-tune",
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    "Content-Type: application/jsonl",
    "",
    "",
  ].join("\r\n");

  const epilogue = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(preamble, "utf8"),
    fileContent,
    Buffer.from(epilogue, "utf8"),
  ]);

  const result = await request("POST", "files", body, true, boundary);
  if (!result.id) {
    console.error("❌  Upload failed:", JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`✅  File uploaded: ${result.id}`);
  return result.id;
}

async function createFineTuneJob(fileId) {
  console.log("🚀  Creating fine-tune job…");
  const body = JSON.stringify({
    training_file: fileId,
    model: "gpt-4o-mini-2024-07-18",
    suffix: "aaos",
    hyperparameters: {
      n_epochs: 3,
    },
  });

  const result = await request("POST", "fine_tuning/jobs", body, false);
  if (!result.id) {
    console.error("❌  Fine-tune job creation failed:", JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(`\n✅  Fine-tune job created!`);
  console.log(`   Job ID:  ${result.id}`);
  console.log(`   Status:  ${result.status}`);
  console.log(`\n⏳  Training takes ~10–40 minutes.`);
  console.log(`\n📋  Check status:`);
  console.log(`   node web/scripts/check-finetune.js ${result.id}`);
  console.log(`\n   Or visit: https://platform.openai.com/finetune`);
  console.log(`\n💡  When done, set in Vercel Dashboard → Settings → Environment Variables:`);
  console.log(`   OPENAI_FINETUNE_MODEL = <the ft:gpt-4o-mini-... model ID shown on completion>`);
  return result.id;
}

(async () => {
  try {
    const fileId = await uploadFile();
    await createFineTuneJob(fileId);
  } catch (e) {
    console.error("❌  Error:", e.message);
    process.exit(1);
  }
})();
