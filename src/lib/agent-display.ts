export function getAgentAvatarLabel(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) return "?";
  if (trimmed.toLowerCase() === "claude") return "Cl";

  return trimmed.charAt(0).toUpperCase();
}
