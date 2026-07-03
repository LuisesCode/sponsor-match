import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  avatarExtension,
  displayNameSchema,
  validateAvatar,
} from "@/lib/validation/profile";

function fakeFile(size: number, type: string): File {
  return new File([new Uint8Array(size)], "avatar", { type });
}

describe("displayNameSchema", () => {
  it("trimmt und akzeptiert 2–80 Zeichen", () => {
    expect(displayNameSchema.parse("  Lena  ")).toBe("Lena");
    expect(displayNameSchema.safeParse("L").success).toBe(false);
    expect(displayNameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });
});

describe("validateAvatar", () => {
  it("akzeptiert Bilder bis 2 MB", () => {
    expect(validateAvatar(fakeFile(1024, "image/png"))).toBeNull();
    expect(validateAvatar(fakeFile(AVATAR_MAX_BYTES, "image/webp"))).toBeNull();
  });

  it("leere Datei = kein Upload gewählt", () => {
    expect(validateAvatar(fakeFile(0, "application/octet-stream"))).toBeNull();
  });

  it("lehnt falschen Typ und Übergröße ab", () => {
    expect(validateAvatar(fakeFile(1024, "application/pdf"))).toMatch(/Bild/);
    expect(validateAvatar(fakeFile(AVATAR_MAX_BYTES + 1, "image/png"))).toMatch(/2 MB/);
  });
});

describe("avatarExtension", () => {
  it("bildet MIME-Typen auf Endungen ab", () => {
    expect(avatarExtension("image/png")).toBe("png");
    expect(avatarExtension("image/jpeg")).toBe("jpg");
    expect(avatarExtension("image/webp")).toBe("webp");
  });
});
