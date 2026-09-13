import type { PersonOut, Tag } from '../../lib/types';

interface Props {
  /** The display name; when absent, renders a muted "Unknown". */
  name?: string;
  /** The person record backing this slot, for its tag markers. */
  person?: PersonOut;
  /** The chart's tag lookup. */
  tags: Record<string, Tag>;
}

/**
 * Markers for a person's tidbits, keyed to the legend on the page. The cards
 * show at most two — the first two listed on the person, so the order in their
 * file decides which — and the rest wait in the biography panel.
 */
const MAX_MARKERS = 2;

export default function CoupleName({ name, person, tags }: Props) {
  const all = (person?.tags ?? []).flatMap((t) => {
    const tag = tags[t.tag];
    return tag ? [{ ...tag, note: t.note }] : [];
  });
  const shown = all.slice(0, MAX_MARKERS);
  const extra = Math.max(0, all.length - MAX_MARKERS);

  return (
    <>
      {name ?? <span class="font-normal italic text-ink-faint">Unknown</span>}
      {shown.length > 0 && (
        <>
          {' '}
          {shown.map((m) => (
            <span
              key={m.label}
              class="tag-dot"
              data-shape={m.shape}
              style={`--tag:${m.color}`}
              title={m.note ? `${m.label} — ${m.note}` : m.label}
            />
          ))}
        </>
      )}
      {extra > 0 && (
        <>
          {' '}
          <span class="tag-more">+{extra}</span>
        </>
      )}
    </>
  );
}
