import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gjtetfgujpcyhjenudnb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
    detectSessionInUrl: true,
    persistSession: true,
  },
});