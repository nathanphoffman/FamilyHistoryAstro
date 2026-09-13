type Slot = 'F' | 'M';

export interface ParentLink {
  father: string | null;
  mother: string | null;
}

/** Depth beyond which a label stops being useful; also stops a parent loop. */
const MAX_STEPS = 12;

function label(path: Slot[]): string {
  const depth = path.length;
  const male = path[depth - 1] === 'F';

  if (depth === 1) return male ? 'Father' : 'Mother';

  const side = path[0] === 'F' ? 'Paternal' : 'Maternal';
  const base = male ? 'Grandfather' : 'Grandmother';

  if (depth === 2) return `${side} ${base}`;
  if (depth === 3) return `${side} Great-${base}`;
  return `${side} ${depth - 2}× Great-${base}`;
}

/**
 * Names how the target relates to the reference person — "Mother", "Maternal
 * Grandfather" and so on — by walking up from the reference. Returns null when
 * the target is not an ancestor of the reference, which is also the answer for
 * the reference person themselves.
 */
export function relationshipTo(
  referenceId: string,
  targetId: string,
  parentsOf: (id: string) => ParentLink | null,
): string | null {
  if (referenceId === targetId) return null;

  const queue: { id: string; path: Slot[] }[] = [{ id: referenceId, path: [] }];
  const seen = new Set<string>([referenceId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (path.length >= MAX_STEPS) continue;

    const parents = parentsOf(id);
    if (!parents) continue;

    const steps: [Slot, string | null][] = [['F', parents.father], ['M', parents.mother]];
    for (const [slot, parentId] of steps) {
      if (!parentId) continue;
      const next: Slot[] = [...path, slot];
      // Breadth-first, so the first route found is the shortest one.
      if (parentId === targetId) return label(next);
      if (seen.has(parentId)) continue;
      seen.add(parentId);
      queue.push({ id: parentId, path: next });
    }
  }

  return null;
}

/** "Colleen" -> "Colleen's", "Charles" -> "Charles'". */
export function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}
