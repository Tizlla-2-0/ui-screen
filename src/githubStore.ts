import type { Store } from "./types";

const OWNER = import.meta.env.VITE_GITHUB_OWNER || "Tizlla-2-0";
const REPO = import.meta.env.VITE_GITHUB_REPO || "ui-screen";
const PATH = "data/store.json";
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";

type ContentResponse = {
  sha: string;
  content: string;
  encoding: string;
};

function apiHeaders(withAuth: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (withAuth && TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

function contentsUrl(): string {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
}

/** Load store.json from the GitHub repo (works for public repos without a token). */
export async function loadStoreFromGitHub(): Promise<{
  store: Store;
  sha: string;
}> {
  const res = await fetch(contentsUrl(), { headers: apiHeaders(Boolean(TOKEN)) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to load data (${res.status}): ${body}`);
  }
  const data = (await res.json()) as ContentResponse;
  const decoded = decodeBase64Utf8(data.content.replace(/\n/g, ""));
  const store = JSON.parse(decoded) as Store;
  if (!store || !Array.isArray(store.screens)) {
    return { store: { screens: [] }, sha: data.sha };
  }
  return { store, sha: data.sha };
}

/** Persist store.json back to the GitHub repo (requires VITE_GITHUB_TOKEN). */
export async function saveStoreToGitHub(
  store: Store,
  sha: string,
): Promise<string> {
  if (!TOKEN) {
    throw new Error(
      "Missing VITE_GITHUB_TOKEN — cannot save. Add a fine-grained PAT with Contents access to this repo.",
    );
  }
  const content = encodeBase64Utf8(`${JSON.stringify(store, null, 2)}\n`);
  const res = await fetch(contentsUrl(), {
    method: "PUT",
    headers: {
      ...apiHeaders(true),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore: update screen data (${new Date().toISOString()})`,
      content,
      sha,
      branch: "main",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to save data (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { content: { sha: string } };
  return data.content.sha;
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
