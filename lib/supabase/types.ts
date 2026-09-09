// Este archivo tipifica el cliente de Supabase para que TypeScript
// entienda nuestras tablas. Es la alternativa a ejecutar `supabase gen types`.
// Se usa con createClient<Database>() en los archivos de cliente/servidor.

import type { Database } from "@/types";

// Re-exportar para comodidad
export type { Database };

// Helpers de tipos para las tablas
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Helpers para vistas
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
