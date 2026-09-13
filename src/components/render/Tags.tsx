import type { PersonTag, Tag } from '../../lib/types';

interface Props {
  /** The tags applied to this person, with their own notes. */
  personTags: PersonTag[];
  /** The chart's tag dictionary, for label, colour, and shape. */
  tags: Record<string, Tag>;
}

export default function Tags({ personTags, tags }: Props) {
  const markers = personTags.flatMap((t) => {
    const tag = tags[t.tag];
    return tag ? [{ ...tag, text: t.note ?? tag.label }] : [];
  });

  if (markers.length === 0) return null;

  return (
    <div class="mb-3 flex flex-wrap gap-[5px]">
      {markers.map((m, i) => (
        <span
          key={i}
          class="inline-flex items-center gap-[5px] rounded-xl bg-[#f1ece2] py-0.5 pr-[9px] pl-[7px] text-[.76rem] text-ink-soft"
        >
          <span class="tag-dot ml-0" data-shape={m.shape} style={`--tag:${m.color}`} />
          {m.text}
        </span>
      ))}
    </div>
  );
}
