#!/usr/bin/env node
/**
 * Check fine-tune job status
 * Usage:  OPENAI_API_KEY=sk-... node web/scripts/check-finetune.js <job_id>
 */

const https = require("https");
const jobId = process.argv[2];
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY || !jobId) {
  console.error("Usage: OPENAI_API_KEY=sk-... node check-finetune.js <job_id>");
  process.exit(1);
}

const opts = {
  hostname: "api.openai.com",
  path: `/v1/fine_tuning/jobs/${jobId}`,
  method: "GET",
  headers: { Authorization: `Bearer ${API_KEY}` },
};

const req = https.request(opts, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    const job = JSON.parse(data);
    console.log(`\nJob ID:   ${job.id}`);
    console.log(`Status:   ${job.status}`);
    console.log(`Model:    ${job.model}`);
    if (job.fine_tuned_model) {
      console.log(`\n🎉  Fine-tuned model ready!`);
      console.log(`   Model ID: ${job.fine_tuned_model}`);
      console.log(`\n   Add to Vercel env vars:`);
      console.log(`   OPENAI_FINETUNE_MODEL = ${job.fine_tuned_model}`);
    } else if (job.status === "failed") {
      console.log(`\n❌  Job failed:`, job.error);
    } else {
      console.log(`\n⏳  Still training. Check again in a few minutes.`);
      console.log(`   Trained tokens: ${job.trained_tokens ?? "pending"}`);
    }
  });
});
req.on("error", (e) => console.error(e));
req.end();
