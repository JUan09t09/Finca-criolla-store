import { createClient } from "@supabase/supabase-js";

// Estos dos datos son públicos por diseño (Supabase los llama
// "publishable key" / URL del proyecto) — es seguro que estén en el código
// que corre en el navegador. NUNCA pongas aquí la "secret key".
const supabaseUrl = "https://urezbiiatwgifzkybtgk.supabase.co";
const supabaseKey = "sb_publishable_9sfDX0lKo5JexR8NCFCSWw_e3mUKYDi";

export const supabase = createClient(supabaseUrl, supabaseKey);
