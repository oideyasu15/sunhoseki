import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { inventoryStore } from "./server/store.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(process.cwd(), "public")));

// Lazy init Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==========================================
// 🔄 REALTIME MULTI-USER SYNC API (誰でも閲覧・更新可能)
// ==========================================

// Server-Sent Events (SSE) for Realtime Push to All Clients
app.get("/api/sync/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  inventoryStore.registerSSEClient(res);

  // Periodic heartbeat comment to maintain connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
});

// Fetch full synchronized state
app.get("/api/sync/state", (req, res) => {
  res.json(inventoryStore.getState());
});

// Get all products
app.get("/api/products", (req, res) => {
  res.json(inventoryStore.getProducts());
});

// Add / Update single product
app.post("/api/products", (req, res) => {
  const saved = inventoryStore.saveProduct(req.body);
  res.json({ success: true, product: saved });
});

app.put("/api/products/:id", (req, res) => {
  const productData = { ...req.body, id: req.params.id };
  const saved = inventoryStore.saveProduct(productData);
  res.json({ success: true, product: saved });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const deleted = inventoryStore.deleteProduct(req.params.id);
  res.json({ success: deleted });
});

// Batch import or replace products
app.post("/api/products/batch", (req, res) => {
  const products = Array.isArray(req.body) ? req.body : req.body.products;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: "Invalid products array format" });
  }
  const result = inventoryStore.batchReplaceProducts(products);
  res.json({ success: true, count: result.length, products: result });
});

// Add stock transaction & update product stock
app.post("/api/transactions", (req, res) => {
  try {
    const result = inventoryStore.addTransaction(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to record transaction" });
  }
});

// Clear transaction logs
app.delete("/api/transactions", (req, res) => {
  inventoryStore.clearTransactions();
  res.json({ success: true });
});

// Reset to default Sunhoseki sample products
app.post("/api/reset-sample", (req, res) => {
  const state = inventoryStore.resetToSample();
  res.json({ success: true, ...state });
});

// AI Product Description & Tags Generator (Sunhoseki style)
app.post("/api/gemini/generate-copy", async (req, res) => {
  try {
    const { name, category, price, features, imageBase64 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback if no API key configured
      return res.json({
        success: true,
        catchphrase: `大人気！${name}で毎日をもっとハッピーに♡`,
        description: `サン宝石ならではのプチプラ＆キュートな「${name}」！キラキラ可愛いデザインでプレゼントやお友達とのおそろいにもぴったりです♪`,
        suggestedTags: ["サン宝石", "プチプラ", "人気アイテム", category || "アクセサリー"],
        targetAudience: "小学生〜ティーン・ファンシー雑貨好き",
      });
    }

    const prompt = `あなたは「サン宝石（サンホ）」のファンシー雑貨・アクセサリーのプロのバイヤー兼商品プランナーです。
以下の商品情報をもとに、サン宝石のカタログやオンラインショップ風の魅力的な商品キャッチコピー、商品説明文、おすすめ検索タグ（3〜6個）、おすすめターゲット層を作成してください。

商品名: ${name || "未定"}
カテゴリー: ${category || "アクセサリー・雑貨"}
価格: ${price ? price + "円" : "未設定"}
特徴/メモ: ${features || "特になし"}

回答は必ず以下のJSON形式のみで出力してください（マークダウンや追加のテキストは含めないでください）：
{
  "catchphrase": "短く心惹かれるキュートなキャッチコピー（例: ぷにぷにほっぺが超キュート♡パステルカラーの限定チャーム）",
  "description": "サン宝石らしい明るくワクワクする100〜150文字程度の商品説明文",
  "suggestedTags": ["タグ1", "タグ2", "タグ3", "タグ4"],
  "targetAudience": "おすすめのターゲット層（例: 女子小学生・JS・プチプラアクセ好き）"
}`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg",
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Gemini copy generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate AI copy",
    });
  }
});

// AI Photo Inspection & Product Info Extraction
app.post("/api/gemini/analyze-photo", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        detectedName: "ほっぺちゃん スイーツチャーム",
        detectedCategory: "ほっぺちゃん",
        estimatedPrice: 280,
        colorTheme: "パステルピンク",
        suggestedTags: ["ほっぺちゃん", "スイーツ", "チャーム"],
        summary: "可愛いキャラクター・スイーツモチーフのアクセサリーです。",
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `この画像は「サン宝石」で取り扱う商材（ほっぺちゃん、ヘアアクセサリー、リング・ネックレス、文具、デコ・DIYパーツ、キッズコスメ、雑貨など）の写真です。
画像から商品を分析し、商品管理システムに入力するための推定情報をJSON形式で返してください。

JSON形式:
{
  "detectedName": "推測される商品名（例: キラキラリボン ヘアゴム2個セット）",
  "detectedCategory": "「ほっぺちゃん」「ヘアアクセサリー」「リング・ネックレス」「デコ・DIYパーツ」「文具・ステーショナリー」「コスメ・雑貨」「バッグ・ポーチ」の中から最適な1つ",
  "estimatedPrice": 推定販売価格の数値（例: 180, 250, 480などサン宝石らしいプチプラ価格）,
  "colorTheme": "主なカラーやデザイン特徴（例: パステルピンク / オーロララメ）",
  "suggestedTags": ["タグ1", "タグ2", "タグ3"],
  "summary": "画像から読み取れる商品の外観と特徴の要約（50字程度）"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Gemini image analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze photo",
    });
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
    console.log(`Sunhoseki Inventory Server running on http://localhost:${PORT}`);
  });
}

startServer();
