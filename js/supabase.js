// Conexión pública con Supabase

const SUPABASE_URL = "https://vmrkkwyepdqlxdzqwnjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2qTm0yt2RjfqB8dD7r1hLQ_flcVjLwZ";

const clienteSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
