// index.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini";

// ---------------- UI ----------------
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Floriday Server</title>
<style>
  body { font-family: system-ui, Arial, sans-serif; max-width: 760px; margin: 40px auto; }
  button { font-size: 18px; padding: 10px 16px; }
  pre { background:#f5f5f5; padding:12px; white-space: pre-wrap; word-break: break-word; }
  label { display:block; margin-top:12px; }
  input { width:100%; padding:8px; font-size:16px; }
</style>
</head>
<body>
  <h1>Floriday Server</h1>
  <p>Auto-pulling live GPT instructions from Google Docs.</p>

  <label>File name</label>
  <input id="fileName" value="Test File" />

  <label>File type</label>
  <input id="fileType" value="PNG" />

  <p><button id="btn">Run Test</button></p>
  <pre id="out"></pre>

<script>
async function run() {
  const payload = {
    fileName: document.getElementById('fileName').value,
    fileType: document.getElementById('fileType').value
  };
  const out = document.getElementById('out');
  out.textContent = 'Working...';
  try {
    const r = await fetch('/generate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await r.json();

    // Render clickable links if present
    let display = JSON.stringify(data, null, 2);
    if (data.links) {
      display += "\\n\\nLinks:\\n";
      if (data.links.make) display += '<a href="' + data.links.make + '" target="_blank">Make.com</a>\\n';
      if (data.links.alura) display += '<a href="' + data.links.alura + '" target="_blank">Alura.com</a>\\n';
      if (data.links.etsy) display += '<a href="' + data.links.etsy + '" target="_blank">Etsy.com</a>\\n';
      if (data.links.altTags) display += '<a href="' + data.links.altTags + '" target="_blank">ALT Tags GPT</a>\\n';
    }
    out.innerHTML = display;
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  }
}
document.getElementById('btn').addEventListener('click', run);
</script>
</body>
</html>`);
});

// ---------------- Health ----------------
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------------- Helpers ----------------
async function callOpenAI(prompt) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  };

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Generate the JSON now." }
    ],
    max_completion_tokens: 800
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(text);

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("Bad JSON from OpenAI: " + text.slice(0, 500)); }

  const raw = data?.choices?.[0]?.message?.content || "";
  let content;
  try { content = JSON.parse(raw); }
  catch { throw new Error("Assistant JSON parse failed: " + raw); }

  return content;
}

// ---------------- Generate ----------------
app.post("/generate", async (req, res) => {
  try {
    const { fileName = "", fileType = "" } = req.body || {};

    const prompt = `
Return ONLY strict JSON with fields:
title
description
tagsCsv
links

Rules:
- Title must include ${fileName} (${fileType}) and be under 140 chars.
- Description must follow Etsy best practices, brand voice, and end with "©FloridayCreations aka Laura".
- Generate 13 tags under 20 chars, no duplicates, no plurals.
- Always include "links" with:
  make: "https://us2.make.com/386900/scenarios/1180269"
  alura: "https://app.alura.io/optimization/listings"
  etsy: "https://www.etsy.com/your/shops/me/tools/listings"
  altTags: "https://chatgpt.com/g/g-p-679c41a9c14481919ab70670c632fd7f-etsy-alt-text-for-images/project"
`;

    const json = await callOpenAI(prompt);
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));