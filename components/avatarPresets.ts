// A fixed set of friendly, cartoon-style avatars for people who don't
// want to upload a real photo. Generated on the fly by DiceBear's free,
// keyless SVG API — no image files to ship, no backend storage needed
// for these (we just store the preset key, e.g. "avatar-3").
//
// Docs: https://www.dicebear.com/styles/avataaars/

export interface AvatarPreset {
  key: string;
  seed: string;
}

export type AvatarKind = "preset" | "upload";

export interface AvatarValue {
  kind: AvatarKind;
  value: string;
}
export function resolveResumeUrl(url: string | undefined | null, apiOrigin = ""): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${apiOrigin}${url}`;
}
 
export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: "avatar-1", seed: "Sunny-Cloud" },
  { key: "avatar-2", seed: "Blue-Comet" },
  { key: "avatar-3", seed: "Coral-Fox" },
  { key: "avatar-4", seed: "Mint-Otter" },
  { key: "avatar-5", seed: "Amber-Owl" },
  { key: "avatar-6", seed: "Violet-Wolf" },
  { key: "avatar-7", seed: "Teal-Panda" },
  { key: "avatar-8", seed: "Rose-Falcon" },
  { key: "avatar-9", seed: "Slate-Tiger" },
  { key: "avatar-10", seed: "Gold-Lynx" },
  { key: "avatar-11", seed: "Sky-Whale" },
  { key: "avatar-12", seed: "Peach-Koala" },
];

export function avatarUrlForSeed(seed: string, size = 96): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&size=${size}&backgroundType=gradientLinear&backgroundColor=00A1E0,0070C0`;
}

export function presetKeyToUrl(key: string, size = 96): string {
  const found = AVATAR_PRESETS.find((a) => a.key === key);
  return avatarUrlForSeed(found ? found.seed : "Sunny-Cloud", size);
}

// Resolves whatever is stored in profile.avatar / tc_user.avatar into a
// displayable <img> src, whether it's a preset key or an uploaded file URL.
export function resolveAvatarSrc(
  avatar: AvatarValue | null | undefined,
  apiOrigin = "",
  size = 96
): string {
  if (!avatar || !avatar.value) return presetKeyToUrl("avatar-1", size);
  if (avatar.kind === "upload") {
    return avatar.value.startsWith("http") ? avatar.value : `${apiOrigin}${avatar.value}`;
  }
  return presetKeyToUrl(avatar.value, size);
}

