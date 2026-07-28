import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini lazily if API key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "KayBiT_Html_Pdf", timestamp: new Date().toISOString() });
});

// Server-side Puppeteer PDF Generation endpoint (Vector high-fidelity PDF)
app.post("/api/generate-pdf", async (req, res) => {
  try {
    const { 
      html, 
      title = "KayBiT_Notes", 
      margin = "15mm", 
      displayHeaderFooter = true, 
      format = "A4",
      passwordProtection
    } = req.body;

    if (!html) {
      return res.status(400).json({ error: "HTML content is required" });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
        ],
      });
    } catch (launchErr: any) {
      console.error("Puppeteer launch error:", launchErr?.message || launchErr);
      return res.status(500).json({ 
        error: "Failed to launch headless browser for PDF rendering.",
        details: launchErr?.message 
      });
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

      const pdfBuffer = await page.pdf({
        format: format as any || "A4",
        printBackground: true,
        displayHeaderFooter: Boolean(displayHeaderFooter),
        headerTemplate: `<div style="font-size: 8px; font-family: system-ui, sans-serif; color: #64748b; width: 100%; text-align: right; padding-right: 20px;">
          <span>KayBiT Study Notes | ${title}</span>
        </div>`,
        footerTemplate: `<div style="font-size: 8px; font-family: system-ui, sans-serif; color: #64748b; width: 100%; text-align: center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
        margin: {
          top: margin,
          bottom: margin,
          left: margin,
          right: margin,
        },
      });

      await browser.close();

      let finalPdfBuffer: Buffer = Buffer.from(pdfBuffer);

      // Password protect PDF if enabled
      if (passwordProtection && passwordProtection.enabled && passwordProtection.password) {
        try {
          const encryptedBytes = await encryptPDF(
            pdfBuffer,
            passwordProtection.password,
            {
              ownerPassword: passwordProtection.password,
              algorithm: "AES-256"
            }
          );
          finalPdfBuffer = Buffer.from(encryptedBytes);
        } catch (encryptErr: any) {
          console.error("Error encrypting PDF with password:", encryptErr);
        }
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`);
      res.send(finalPdfBuffer);
    } catch (pdfErr: any) {
      if (browser) await browser.close();
      console.error("PDF generation rendering error:", pdfErr);
      res.status(500).json({ error: "Error compiling vector PDF.", details: pdfErr?.message });
    }
  } catch (err: any) {
    console.error("Server PDF generation error:", err);
    res.status(500).json({ error: "Internal server error during PDF generation", details: err?.message });
  }
});

// AI Summary & Study Guide Auto-Enhancer Endpoint
app.post("/api/ai-summarize", async (req, res) => {
  try {
    const { content, filename, language } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY isn't available
      return res.json({
        summary: `Study summary for ${filename || "document"}: Contains key programming constructs in ${language || "code"}. Focus on structural syntax, function declarations, and error handling patterns.`,
        keyTakeaways: [
          "Understand core control flows and modular definitions.",
          "Verify variable scopes and asynchronous operations.",
          "Review edge cases and memory/performance implications."
        ],
        flashcards: [
          { question: `What is the primary objective of ${filename || "this code"}?`, answer: "Demonstrates core algorithmic concepts and best software design patterns." },
          { question: "How are exceptions handled in this snippet?", answer: "Errors should be caught gracefully using structured try-catch or error-handling blocks." }
        ]
      });
    }

    const prompt = `Analyze the following programming notes or source code from file "${filename || "document"}" (Language: ${language || "Unknown"}):\n\n${content.slice(0, 8000)}\n\nProvide a structured study guide JSON response with:
1. "summary": A 2-3 sentence clear study summary explaining what this note covers.
2. "keyTakeaways": An array of 3 bullet points highlighting crucial formulas, concepts, or rules.
3. "flashcards": An array of 2 question-and-answer objects for student review.

Return strictly valid JSON with keys "summary", "keyTakeaways", and "flashcards". Do not include markdown ticks around JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text || "";
    try {
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedText);
      return res.json(parsed);
    } catch {
      return res.json({
        summary: responseText.slice(0, 300),
        keyTakeaways: ["Key programming concepts identified", "Study logic structure", "Code execution steps"],
        flashcards: []
      });
    }
  } catch (err: any) {
    console.error("AI Summary error:", err);
    res.status(500).json({ error: "Failed to generate AI summary", details: err?.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KayBiT_Html_Pdf] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
