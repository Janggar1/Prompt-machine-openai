export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = await readBody(req);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY belum diset di Vercel Environment Variables."
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1";
    const {
      idea = "",
      engine = "General",
      language = "English",
      aspect = "1:1 square",
      tone = "",
      details = "",
      scene = "",
      negative = "",
      referenceNotes = "",
      imageDataUrl = ""
    } = body || {};

    if (!idea.trim()) {
      return res.status(400).json({ error: "Field idea wajib diisi." });
    }

    if (imageDataUrl && imageDataUrl.length > 7_000_000) {
      return res.status(413).json({ error: "Gambar terlalu besar. Kompres dulu gambarnya." });
    }

    const instruction = `
You are an elite image prompt engineer.

Goal:
Create a highly accurate, generator-ready image prompt from the user's idea and optional reference image.

Rules:
- Do not claim 100% accuracy.
- If a reference image is provided, analyze visual identity, color palette, outfit, composition, camera, lighting, and style.
- Preserve important character/object identity when the user asks for consistency.
- Make the prompt clear, visual, and ordered.
- Keep unsafe or explicit sexual content out. If sensual styling is requested, keep it non-explicit and adult-coded only.
- Avoid copyrighted character names unless the user provided them as reference; describe visual traits instead.
- Output in the requested language: ${language}.
- Target generator: ${engine}.
- Aspect ratio: ${aspect}.
- Style tone: ${tone}.

Return exactly this structure:

FINAL PROMPT:
[one complete polished prompt, detailed but not bloated]

NEGATIVE PROMPT:
[clean negative prompt relevant to the target generator]

REFERENCE LOCK:
[5-10 bullet points for details that must stay consistent]

GENERATOR TIPS:
[settings or wording tips for ${engine}; include aspect ratio and consistency tips]

SHORT VERSION:
[one compact prompt under 70 words]

VARIATIONS:
1. [variation with different camera/composition]
2. [variation with different lighting/mood]
3. [variation with different background]
`;

    const userText = `
USER IDEA:
${idea}

CHARACTER / OBJECT DETAILS:
${details || "(not provided)"}

BACKGROUND / CAMERA / LIGHTING:
${scene || "(not provided)"}

NEGATIVE REQUESTS:
${negative || "(not provided)"}

REFERENCE / CONSISTENCY NOTES:
${referenceNotes || "(not provided)"}
`;

    const content = [{ type: "input_text", text: userText }];

    if (imageDataUrl) {
      content.push({
        type: "input_image",
        image_url: imageDataUrl,
        detail: "high"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions: instruction,
        input: [
          {
            role: "user",
            content
          }
        ],
        max_output_tokens: 1500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API request failed."
      });
    }

    const prompt = extractText(data);

    return res.status(200).json({
      prompt,
      model
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Server error."
    });
  }
}

async function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function extractText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }

  return parts.join("\n").trim() || "Tidak ada output text dari model.";
}
