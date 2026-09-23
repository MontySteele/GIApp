/**
 * Convert a display name to a GOOD-style PascalCase key,
 * e.g. "Gladiator's Finale" -> "GladiatorsFinale", "Hu Tao" -> "HuTao".
 */
export function toPascalCase(value: string): string {
  return value
    .replace(/['’]s\b/g, 's')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
