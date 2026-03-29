"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  notionKey: string;
  setNotionKey: (key: string) => void;
  spotifyClientId: string;
  setSpotifyClientId: (key: string) => void;
  spotifyToken: string;
  setSpotifyToken: (token: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState("");
  const [notionKey, setNotionKey] = useState("");
  const [spotifyClientId, setSpotifyClientId] = useState("");
  const [spotifyToken, setSpotifyToken] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey, setApiKey, 
      notionKey, setNotionKey, 
      spotifyClientId, setSpotifyClientId, 
      spotifyToken, setSpotifyToken, 
      isModalOpen, setIsModalOpen 
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}
