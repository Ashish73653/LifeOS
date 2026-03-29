"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiKey } from "../lib/ApiKeyContext";
import Icon from "./Icon";
import { toast } from "../lib/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type NotionTitleItem = {
  plain_text: string;
};

type NotionProperty = {
  type?: string;
  title?: NotionTitleItem[];
};

interface NotionPage {
  id: string;
  url: string;
  last_edited_time: string;
  properties?: Record<string, NotionProperty>;
}

interface NotionSearchResponse {
  ok?: boolean;
  data?: {
    results?: NotionPage[];
  };
  error?: {
    message?: string;
  };
}

export default function NotionSearch() {
  const { notionKey } = useApiKey();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!notionKey) {
      toast("Please connect Notion in Settings first.", "error");
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const r = await fetch(`${API}/api/integrations/notion/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, notionKey }),
      });
      const data = (await r.json()) as NotionSearchResponse;
      
      if (data.ok) {
        setResults(data.data?.results ?? []);
      } else {
        toast(data.error?.message || "Failed to fetch Notion", "error");
      }
    } catch {
      toast("Error fetching from Notion", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!notionKey) return null;

  return (
    <div className="glass" style={{ padding: "1.25rem", marginTop: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name="dashboard" size={18} style={{ color: "var(--z-text)" }} />
        <span className="label" style={{ color: "var(--z-text)" }}>Notion Knowledge Base</span>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your Notion workspace..."
          style={{ flex: 1, padding: "0.5rem 0.75rem" }}
        />
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? <Icon name="refresh" className="anim-spin" size={16} /> : <Icon name="dashboard" size={16} />}
          Search
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && !loading && results.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "1rem", textAlign: "center", color: "var(--z-text-muted)", fontSize: "0.875rem" }}>
            No pages found
          </motion.div>
        )}
        
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((page) => {
              // Extremely rough extraction of Notion title property
              let title = "Untitled";
              if (page.properties) {
                const titleProp = Object.values(page.properties).find((p) => p.type === "title");
                if (titleProp?.title && titleProp.title.length > 0) {
                  title = titleProp.title[0].plain_text;
                }
              }
              
              return (
                <a
                  key={page.id}
                  href={page.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass glass-hover"
                  style={{
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textDecoration: "none",
                    color: "inherit"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name="dashboard" size={16} style={{ color: "var(--z-text-muted)" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{title}</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--z-text-muted)" }}>
                    {new Date(page.last_edited_time).toLocaleDateString()}
                  </span>
                </a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
