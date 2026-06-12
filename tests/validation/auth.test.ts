import { describe, expect, it } from "vitest";

import {
  loginSchema,
  registerSchema,
  sanitizeNextPath,
} from "@/lib/validation/auth";

const validRegistration = {
  role: "sponsee",
  displayName: "Lena Beispiel",
  email: "lena@example.com",
  password: "sicheres-passwort",
  acceptTerms: true,
};

describe("registerSchema", () => {
  it("akzeptiert eine gültige Registrierung", () => {
    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("normalisiert die E-Mail-Adresse (trim + lowercase)", () => {
    const result = registerSchema.parse({
      ...validRegistration,
      email: "  Lena@Example.COM  ",
    });
    expect(result.email).toBe("lena@example.com");
  });

  it("trimmt den Anzeigenamen", () => {
    const result = registerSchema.parse({
      ...validRegistration,
      displayName: "  Lena  ",
    });
    expect(result.displayName).toBe("Lena");
  });

  it.each(["admin", "", undefined, 42])(
    "lehnt unzulässige Rollen ab: %s",
    (role) => {
      const result = registerSchema.safeParse({ ...validRegistration, role });
      expect(result.success).toBe(false);
    }
  );

  it("lehnt zu kurze Passwörter ab", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: "kurz",
    });
    expect(result.success).toBe(false);
  });

  it("lehnt fehlende AGB-Zustimmung ab", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      acceptTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("lehnt ungültige E-Mail-Adressen ab", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      email: "keine-mail",
    });
    expect(result.success).toBe(false);
  });

  it("lehnt zu kurze Anzeigenamen ab", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      displayName: "L",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("akzeptiert gültige Anmeldedaten", () => {
    const result = loginSchema.safeParse({
      email: "lena@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("lehnt leeres Passwort ab", () => {
    const result = loginSchema.safeParse({
      email: "lena@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("sanitizeNextPath", () => {
  it("lässt app-interne Pfade durch", () => {
    expect(sanitizeNextPath("/deals/42", "/dashboard")).toBe("/deals/42");
  });

  it.each([
    "https://boese.example",
    "//boese.example",
    "/\\boese.example",
    "javascript:alert(1)",
    "",
    undefined,
    null,
    42,
  ])("fällt bei unzulässigen Zielen auf den Fallback zurück: %s", (raw) => {
    expect(sanitizeNextPath(raw, "/dashboard")).toBe("/dashboard");
  });
});
