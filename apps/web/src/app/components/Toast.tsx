"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToast } from "../lib/toast";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const COLORS = {
  success: { bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.25)", text: "#6ee7b7", icon: "✓" },
  error: { bg: "rgba(251,113,133,0.14)", border: "rgba(251,113,133,0.25)", text: "#fda4af", icon: "✕" },
  info: { bg: "rgba(139,92,246,0.14)", border: "rgba(139,92,246,0.25)", text: "#a78bfa", icon: "ℹ" },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((message, type) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    });
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", flexDirection: "column-reverse", gap: 8, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const c = COLORS[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--z-radius-sm)",
                background: c.bg,
                border: `1px solid ${c.border}`,
                backdropFilter: "blur(16px)",
                fontSize: "0.875rem",
                color: c.text,
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                pointerEvents: "auto",
                minWidth: 220,
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                {c.icon}
              </span>
              {t.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
