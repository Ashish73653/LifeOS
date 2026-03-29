"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApiKey } from "../lib/ApiKeyContext";
import Icon from "./Icon";
import { toast } from "../lib/toast";

interface Props {
  onOpenMobileMenu: () => void;
}

export default function Topbar({ onOpenMobileMenu }: Props) {
  const { apiKey, setApiKey, isModalOpen, setIsModalOpen } = useApiKey();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    
    if (key && key.trim().length > 10) {
      setApiKey(key.trim());
      setIsModalOpen(false);
      toast("API Key set for this session ✅");
    } else if (key.trim() === "") {
      setApiKey("");
      setIsModalOpen(false);
      toast("Using default generated data");
    } else {
      toast("Invalid key provided", "error");
    }
  }

  function handleRemove() {
    setApiKey("");
    setIsModalOpen(false);
    toast("API Key removed from memory", "info");
  }

  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Mobile Menu Button - stays hidden on desktop via CSS */}
          <button
            className="mobile-menu-btn"
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
            style={{ position: "relative", top: 0, left: 0, display: "none" }}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>

        <button
          className={`btn ${apiKey ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setIsModalOpen(true)}
          title="On-Demand AI Key"
          style={{ padding: "0.5rem 0.75rem", borderRadius: "99px" }}
        >
          <Icon name="sparkles" size={16} />
          <span style={{ fontSize: "0.8125rem", display: "none", whiteSpace: "nowrap" }} className="md-show">
            {apiKey ? "AI Ready" : "Set API Key"}
          </span>
        </button>
      </header>

      {/* API Key Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mobile-overlay"
              onClick={() => setIsModalOpen(false)}
              style={{ zIndex: 100 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                maxWidth: 420,
                zIndex: 101,
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
                <Icon name="sparkles" size={24} className="gradient-text" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>AI On-Demand</h2>
              </div>
              <p style={{ color: "var(--z-text-sub)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Provide your Gemini API key to enable intelligent task extraction and analysis. This key is stored <strong>only in memory</strong> and will be cleared when you refresh the page.
              </p>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input
                  type="password"
                  name="key"
                  className="input"
                  placeholder="Paste your API key here..."
                  defaultValue={apiKey}
                  autoComplete="off"
                  autoFocus
                />

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                  {apiKey && (
                    <button type="button" className="btn btn-ghost" onClick={handleRemove}>
                      Clear Key
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {apiKey ? "Update Key" : "Set Memory Key"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
