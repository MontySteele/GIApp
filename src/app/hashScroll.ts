export function scrollToHashTarget(hash: string, doc: Document = document): boolean {
  const rawId = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!rawId) return false;

  const id = decodeURIComponent(rawId);
  const target = doc.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
