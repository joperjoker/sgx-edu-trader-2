import fs from "node:fs";
import path from "node:path";

const cfgPath = path.join(process.env.USERPROFILE, ".config", "configstore", "firebase-tools.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const token = cfg.tokens.access_token;
const projectId = "sgx-edu-trader-2-sg";

console.log("Calling identityPlatform:initializeAuth for", projectId);
const res = await fetch(`https://identitytoolkit.googleapis.com/v2/projects/${projectId}/identityPlatform:initializeAuth`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Goog-User-Project": projectId
  }
});

console.log("initializeAuth HTTP Status:", res.status);
const txt = await res.text();
console.log("Response:", txt);
