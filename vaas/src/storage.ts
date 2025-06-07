import fs from "fs";
import path from "path";

// Simple JSON file persistence for saved aesthetics

const DATA_DIR = path.resolve(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "aesthetics.json");

export interface SavedEntry {
  name: string;
  embedding: string;
  created: string; // ISO timestamp
}

let cache: Record<string, SavedEntry> = {};

// Ensure directory exists and load on first import
function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(FILE_PATH)) {
    try {
      const raw = fs.readFileSync(FILE_PATH, "utf-8");
      cache = JSON.parse(raw);
    } catch {
      cache = {};
    }
  }
}

init();

function persist() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(cache, null, 2));
}

export function saveAesthetic(name: string, embedding: string): void {
  cache[name] = { name, embedding, created: new Date().toISOString() };
  persist();
}

export function getAesthetic(name: string): SavedEntry | undefined {
  return cache[name];
}

export function listAesthetics(): SavedEntry[] {
  return Object.values(cache);
}
