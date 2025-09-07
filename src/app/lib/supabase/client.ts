// src/lib/supabase/server.ts
import { env } from "@/web/app/types/env";
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE
);
