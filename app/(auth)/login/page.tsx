import type { Metadata } from "next";

import { sanitizeNextPath } from "@/lib/validation/auth";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Anmelden — SponsorMatch",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = sanitizeNextPath(
    typeof params.next === "string" ? params.next : undefined,
    "/dashboard"
  );
  const verifyError = params.error === "verifizierung";

  return <LoginForm next={next} verifyError={verifyError} />;
}
