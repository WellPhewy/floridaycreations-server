import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini"; // change if needed

// Homepage form
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>FloridayCreations Etsy Helper</title></head>
      <body style="font-family: sans-serif; max-width: 700px; margin: 40px auto;">
        <h1>FloridayCreations Etsy Helper</h1>
        <form method="POST" action="/generate">
          <label>Canva Image Link:</label><br/>
          <input type="text" name="imageUrl" style="width:100%; padding:8px;" /><br/><br/>

          <label>File Type (PNG/SVG/etc):</label><br/>
          <input type="text" name="fileType" /><br/><br/>

          <label>Number of Files in Download:</label><br/>
          <input type="text" name="fileCount" /><br/><br/>

          <button type="submit">Generate Etsy Listing</button>
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

1. **Etsy Title** (max 140 characters, optimized, no redundancy).
2. **Etsy Description** (SEO-optimized, engaging, formatted with Laura’s rules).
3. **13 Etsy SEO Tags** (comma-separated, under 20 chars, no repeats, optimized).

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

    res.send(`
      <html>
        <body style="font-family: sans-serif; max-width: 700px; margin: 40px auto;">
          <h2>Generated Etsy Listing</h2>
          <pre style="white-space: pre-wrap;">${output}</pre>
          <br/>
          <a href="/">⬅ Back</a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Etsy listing.");
  }
});

// Export for Vercel instead of app.listen
export default app;
