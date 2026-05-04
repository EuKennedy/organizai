/**
 * Gera VAPID keypair para Web Push.
 * Rode 1x: `node scripts/generate-vapid.mjs`
 *
 * - PUBLIC vai pra `.env.local` como VITE_VAPID_PUBLIC_KEY
 * - PRIVATE vai pros secrets do Supabase Edge Function
 *   (`supabase secrets set VAPID_PRIVATE_KEY=...`)
 *
 * Nunca comita a private key — ela é o equivalente a uma senha.
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\n────────────  VAPID KEYS  ────────────\n");
console.log("VITE_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("\n──────────────────────────────────────\n");
console.log("→ Cola a PUBLIC em .env.local e em GitHub Actions secrets");
console.log("→ Cola a PRIVATE nos Edge Function secrets do Supabase:");
console.log("  supabase secrets set VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log(
  "  supabase secrets set VAPID_PUBLIC_KEY=" + keys.publicKey
);
console.log(
  "  supabase secrets set VAPID_SUBJECT=mailto:kennedy.rodrigues1104@gmail.com"
);
console.log("");
