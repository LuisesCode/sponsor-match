/**
 * SponsorMatch — legt die Demo-Nutzer für supabase/seed.sql an.
 *
 * profiles.user_id verweist NOT NULL auf auth.users — Seed-Profile ohne
 * Login-Nutzer sind FK-bedingt nicht möglich, und direkte Inserts in
 * auth.users sind tabu. Dieses Skript nutzt daher die Admin-API
 * (Service-Role-Key); der Signup-Trigger erzeugt die profiles-Zeilen
 * mit deterministischen Slugs, auf die sich seed.sql bezieht.
 *
 * Aufruf:
 *   SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed-demo-users.mjs
 * (NEXT_PUBLIC_SUPABASE_URL wird aus .env.local gelesen, falls nicht gesetzt.)
 * Danach: supabase/seed.sql ausführen (SQL-Editor oder MCP execute_sql).
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function envFromDotenv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}

const url = envFromDotenv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = envFromDotenv("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden benötigt.");
  process.exit(1);
}

/** [E-Mail-Suffix, Rolle, Anzeigename] — Slug entsteht via public.slugify(). */
const DEMO_USERS = [
  ["mara-falke", "sponsee", "Mara Falke"],
  ["sv-blauweiss-hamburg", "sponsee", "SV Blauweiss Hamburg"],
  ["jonas-kraxler", "sponsee", "Jonas Kraxler"],
  ["fitmitanna", "sponsee", "FitMitAnna"],
  ["ec-eisbaeren-tirol", "sponsee", "EC Eisbaeren Tirol"],
  ["alpenquell-gmbh", "sponsor", "AlpenQuell GmbH"],
  ["velotech-bikes", "sponsor", "VeloTech Bikes"],
  ["finanzhanse-ag", "sponsor", "FinanzHanse AG"],
  ["gipfelkleidung-ag", "sponsor", "GipfelKleidung AG"],
];

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

for (const [suffix, role, displayName] of DEMO_USERS) {
  const email = `sm-demo+${suffix}@example.com`;
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: "SmDemo!2026",
    email_confirm: true,
    user_metadata: { role, display_name: displayName },
  });
  if (error) {
    // "already registered" ist beim erneuten Ausführen okay.
    if (/already|exists/i.test(error.message)) {
      console.log(`⏭  ${email} existiert bereits`);
    } else {
      console.error(`✖  ${email}: ${error.message}`);
      process.exitCode = 1;
    }
  } else {
    console.log(`✔  ${email} angelegt (${displayName})`);
  }
}

console.log("Fertig. Jetzt supabase/seed.sql ausführen.");
