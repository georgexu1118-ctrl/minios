// BOM-free Vercel env setter (avoids PowerShell UTF-16 pipe encoding)
const { spawn } = require("child_process");
const [,, name, value] = process.argv;
if (!name || !value) { console.error("Usage: node set_env.js NAME VALUE"); process.exit(1); }
const proc = spawn("vercel", ["env", "add", name, "production"], {
  cwd: __dirname + "/web",
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});
proc.stdin.write(Buffer.from(value + "\n", "utf8"));
proc.stdin.end();
proc.on("close", code => process.exit(code ?? 0));
