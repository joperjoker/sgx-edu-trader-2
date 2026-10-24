import fs from "node:fs";
import path from "node:path";

const cfgPath = path.join(process.env.USERPROFILE, ".config", "configstore", "firebase-tools.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const token = cfg.tokens.access_token;
const localData = JSON.parse(fs.readFileSync(".data/firestore-local.json", "utf8"));
const stocks = localData.marketSnapshot?.quotes || localData.stocks || {};
const appSettings = localData.appSettings || {};

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") {
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFirestoreValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

const writes = [
  ...Object.entries(stocks).map(([ticker, doc]) => ({
    update: {
      name: `projects/sgx-edu-trader-2-sg/databases/(default)/documents/stocks/${ticker}`,
      fields: toFirestoreValue(doc).mapValue.fields
    }
  })),
  {
    update: {
      name: `projects/sgx-edu-trader-2-sg/databases/(default)/documents/classroom_settings/default`,
      fields: toFirestoreValue(appSettings).mapValue.fields
    }
  }
];

const res = await fetch(
  "https://firestore.googleapis.com/v1/projects/sgx-edu-trader-2-sg/databases/(default)/documents:commit",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ writes })
  }
);

console.log("Firestore Cloud Seed HTTP Status:", res.status);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
console.log(`✅ Seeded ${Object.keys(stocks).length} live SGX stocks into Cloud Firestore (asia-southeast1)!`);
