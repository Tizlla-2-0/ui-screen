import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { getStorePath, loadStore, updateStore } from "./store.js";
import type { Priority, Status, SubTask, Screen } from "./types.js";

const PORT = Number(process.env.PORT) || 3001;

const STATUSES: Status[] = ["todo", "in_progress", "done"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];

function now(): string {
  return new Date().toISOString();
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUSES.includes(value as Status);
}

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority);
}

function findScreen(store: { screens: Screen[] }, id: string): Screen | undefined {
  return store.screens.find((s) => s.id === id);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, storePath: "data/store.json" });
});

app.get("/api/screens", async (_req, res) => {
  try {
    const store = await loadStore();
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load screens" });
  }
});

app.post("/api/screens", async (req, res) => {
  try {
    const { name, description, status, priority } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (status !== undefined && !isStatus(status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }
    if (priority !== undefined && !isPriority(priority)) {
      res.status(400).json({ error: "invalid priority" });
      return;
    }

    const timestamp = now();
    const screen: Screen = {
      id: randomUUID(),
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      status: isStatus(status) ? status : "todo",
      priority: isPriority(priority) ? priority : "medium",
      subTasks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await updateStore((store) => {
      store.screens.push(screen);
    });

    res.status(201).json(screen);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create screen" });
  }
});

app.patch("/api/screens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority } = req.body ?? {};

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      res.status(400).json({ error: "name must be a non-empty string" });
      return;
    }
    if (status !== undefined && !isStatus(status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }
    if (priority !== undefined && !isPriority(priority)) {
      res.status(400).json({ error: "invalid priority" });
      return;
    }

    let updated: Screen | undefined;
    await updateStore((store) => {
      const screen = findScreen(store, id);
      if (!screen) return;
      if (typeof name === "string") screen.name = name.trim();
      if (description !== undefined) {
        screen.description = typeof description === "string" ? description : "";
      }
      if (isStatus(status)) screen.status = status;
      if (isPriority(priority)) screen.priority = priority;
      screen.updatedAt = now();
      updated = screen;
    });

    if (!updated) {
      res.status(404).json({ error: "Screen not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update screen" });
  }
});

app.delete("/api/screens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let removed = false;
    await updateStore((store) => {
      const before = store.screens.length;
      store.screens = store.screens.filter((s) => s.id !== id);
      removed = store.screens.length < before;
    });

    if (!removed) {
      res.status(404).json({ error: "Screen not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete screen" });
  }
});

app.post("/api/screens/:screenId/subtasks", async (req, res) => {
  try {
    const { screenId } = req.params;
    const { title, status, notes } = req.body ?? {};
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    if (status !== undefined && !isStatus(status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }

    const timestamp = now();
    const subTask: SubTask = {
      id: randomUUID(),
      title: title.trim(),
      status: isStatus(status) ? status : "todo",
      notes: typeof notes === "string" ? notes : "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let created: SubTask | undefined;
    await updateStore((store) => {
      const screen = findScreen(store, screenId);
      if (!screen) return;
      screen.subTasks.push(subTask);
      screen.updatedAt = timestamp;
      created = subTask;
    });

    if (!created) {
      res.status(404).json({ error: "Screen not found" });
      return;
    }
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create sub-task" });
  }
});

app.patch("/api/screens/:screenId/subtasks/:subTaskId", async (req, res) => {
  try {
    const { screenId, subTaskId } = req.params;
    const { title, status, notes } = req.body ?? {};

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      res.status(400).json({ error: "title must be a non-empty string" });
      return;
    }
    if (status !== undefined && !isStatus(status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }

    let updated: SubTask | undefined;
    await updateStore((store) => {
      const screen = findScreen(store, screenId);
      if (!screen) return;
      const subTask = screen.subTasks.find((t) => t.id === subTaskId);
      if (!subTask) return;
      if (typeof title === "string") subTask.title = title.trim();
      if (isStatus(status)) subTask.status = status;
      if (notes !== undefined) {
        subTask.notes = typeof notes === "string" ? notes : "";
      }
      subTask.updatedAt = now();
      screen.updatedAt = subTask.updatedAt;
      updated = subTask;
    });

    if (!updated) {
      res.status(404).json({ error: "Sub-task not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update sub-task" });
  }
});

app.delete("/api/screens/:screenId/subtasks/:subTaskId", async (req, res) => {
  try {
    const { screenId, subTaskId } = req.params;
    let removed = false;
    await updateStore((store) => {
      const screen = findScreen(store, screenId);
      if (!screen) return;
      const before = screen.subTasks.length;
      screen.subTasks = screen.subTasks.filter((t) => t.id !== subTaskId);
      removed = screen.subTasks.length < before;
      if (removed) screen.updatedAt = now();
    });

    if (!removed) {
      res.status(404).json({ error: "Sub-task not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete sub-task" });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Store file: ${getStorePath()}`);
});
