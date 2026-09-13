import { formatDate } from '../../lib/format';
import type { BioContext, PersonOut } from '../../lib/types';

interface Props {
  person: PersonOut;
  /** Lookups for the spouses and unions this person references. */
  ctx: BioContext;
  /** The union already named above the pair, so it is not repeated here. */
  shownUnion?: string | null;
}

export default function OtherUnions({ person, ctx, shownUnion = null }: Props) {
  /** Marriages other than the one already shown at the top of the pair. */
  const otherUnions = person.unions
    .filter((id) => id !== shownUnion)
    .flatMap((id) => {
      const union = ctx.unions[id];
      if (!union) return [];
      const spouseId = union.spouses.find((s) => s !== person.id);
      const spouse = spouseId ? ctx.people[spouseId] ?? null : null;
      const when = [formatDate(union.date), union.place].filter(Boolean).join(', ');
      return [
        {
          id,
          verb: union.type === 'marriage' ? 'Married' : 'Partnered with',
          // Only the page's own subject links out, matching the header.
          link: spouse?.chartUrl && person.id === ctx.subjectId ? spouse.chartUrl : undefined,
          name: spouse ? spouse.name : 'unknown',
          when,
          note: union.note,
        },
      ];
    });

  if (otherUnions.length === 0) return null;

  return (
    <div class="facts m-0 mb-3.5 pt-2 text-[.87rem] [border-top:1px_dotted_var(--color-line-dim)]">
      {otherUnions.map((u) => (
        <div key={u.id} data-union={u.id}>
          <span class="label">{u.verb}:</span>{' '}
          {u.link ? (
            <a class="text-accent underline hover:no-underline" href={u.link}>
              {u.name}
            </a>
          ) : (
            u.name
          )}
          {u.when && (
            <>
              {' '}
              <span class="label">({u.when})</span>
            </>
          )}
          {u.note && <div class="mt-1 text-[.83rem] text-ink-soft">{u.note}</div>}
        </div>
      ))}
    </div>
  );
}
