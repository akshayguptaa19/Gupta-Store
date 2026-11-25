import { supabaseAdmin } from "./src/lib/supabaseAdmin.js";

const { data, error } = await supabaseAdmin.storage.listBuckets();

if (error) {
  console.error("Storage connection failed:", error.message);
  process.exitCode = 1;
} else {
  console.log("Available buckets:", data.map((bucket) => bucket.name));
  console.log(
    "Gupta_Store bucket found:",
    data.some((bucket) => bucket.name === "Gupta_Store")
  );
}
