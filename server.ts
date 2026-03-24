import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("tasks.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    alarmEnabled INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY startTime ASC").all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { title, description, startTime, endTime, category, alarmEnabled } = req.body;
    const info = db.prepare(
      "INSERT INTO tasks (title, description, startTime, endTime, category, alarmEnabled) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(title, description, startTime, endTime, category || 'general', alarmEnabled ? 1 : 0);
    
    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
    res.json(newTask);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { completed, title, description, startTime, endTime, category, alarmEnabled } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];

    if (completed !== undefined) {
      updates.push("completed = ?");
      values.push(completed ? 1 : 0);
    }
    if (alarmEnabled !== undefined) {
      updates.push("alarmEnabled = ?");
      values.push(alarmEnabled ? 1 : 0);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (startTime !== undefined) {
      updates.push("startTime = ?");
      values.push(startTime);
    }
    if (endTime !== undefined) {
      updates.push("endTime = ?");
      values.push(endTime);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }

    if (updates.length > 0) {
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values, id);
    }

    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json(updatedTask);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // AI Suggestion Endpoint
  app.post("/api/ai/suggest", async (req, res) => {
    const { prompt, currentTasks } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given the current tasks: ${JSON.stringify(currentTasks)}. 
        User request: ${prompt}. 
        Suggest a daily schedule in JSON format. 
        Each task should have: title, description, startTime (HH:mm), endTime (HH:mm), category.
        Ensure tasks don't overlap significantly.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                category: { type: Type.STRING },
                alarmEnabled: { type: Type.BOOLEAN }
              },
              required: ["title", "startTime", "endTime"]
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      res.json(suggestions);
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
