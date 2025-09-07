import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini"; // you can change to gpt-4o

// Homepage form
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>FloridayCreations Etsy Helper</title></head>
      <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; line-height:1.5;">
        <h1>FloridayCreations Etsy Helper</h1>
        <form method="POST" action="/generate">
          <label>Canva Image Link:</label><br/>
          <input type="text" name="imageUrl" style="width:100%; padding:8px;" /><br/><br/>

          <label>File Type (PNG/SVG/etc):</label><br/>
          <input type="text" name="fileType" /><br/><br/>

          <label>Number of Files in Download:</label><br/>
          <input type="text" name="fileCount" /><br/><br/>

          <button type="submit" style="padding:10px 16px; font-size:16px;">Generate Etsy Listing</button>
        </form>
      </body>
    </html>
  `);
});

// Generate Etsy listing
app.post("/generate", async (req, res) => {
  const { imageUrl, fileType, fileCount } = req.body;

  const prompt = `
You are Etsy Description Creator. Based on the product image link, file type, and file count provided, generate:

1. Etsy Title (max 140 characters, optimized, no redundancy).
2. Etsy Description (SEO-optimized, engaging, following Laura’s brand voice, ending with "©FloridayCreations aka Laura").
3. 13 Etsy SEO Tags (comma-separated, under 20 chars, no repeats, optimized).

Image: ${imageUrl}
File Type: ${fileType}
Number of Files: ${fileCount}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "Error generating output";

    // Try to parse JSON if the model sends JSON, otherwise just print
    let title = "";
    let description = "";
    let tags = "";
    try {
      const parsed = JSON.parse(output);
      title = parsed.title || "";
      description = parsed.description || "";
      tags = parsed.tagsCsv || "";
    } catch {
      // fallback to raw text
      description = output;
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; line-height:1.5;">
          <h2>Generated Etsy Listing</h2>
          ${title ? `<h3>Title</h3><p>${title}</p>` : ""}
          ${description ? `<h3>Description</h3><pre style="white-space: pre-wrap;">${description}</pre>` : ""}
          ${tags ? `<h3>Tags</h3><p>${tags}</p>` : ""}
          <br/>
          <a href="/">⬅ Back</a>
        </body>
      </html>
    `);
  } catch (e) {
    res.send(`
      <html>
        <body>
          <h2>Error</h2>
          <pre>${e.message}</pre>
          <a href="/">⬅ Back</a>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
