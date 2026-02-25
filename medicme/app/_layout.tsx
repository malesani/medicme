// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { getDb } from "../db";

export default function RootLayout() {
  useEffect(() => {
    // Inicializa DB al arranque
    getDb().catch((e) => console.error("DB init error:", e));
  }, []);

  return <Stack />;
}