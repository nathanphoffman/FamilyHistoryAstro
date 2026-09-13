import { Fragment } from 'preact';
import { lifespanParts } from '../../lib/format';
import type { PersonOut } from '../../lib/types';

interface Props {
  /** The people whose spans to show, in order; undefined slots are skipped. */
  people: (PersonOut | undefined)[];
}

/**
 * A life span with each end drawn separately, so a date resting only on an
 * unevidenced tree can be marked without marking the other end with it.
 */
function span(person: PersonOut | undefined) {
  if (!person) return null;
  const { parts, separator } = lifespanParts(person.birth?.date, person.death?.date);
  if (parts.length === 0) return null;
  return {
    separator,
    parts: parts.map((part) => ({
      ...part,
      unverified: part.kind === 'birth' ? !!person.birth?.unverified : !!person.death?.unverified,
      title: `${part.kind === 'birth' ? 'Birth' : 'Death'} date not verified against an original record — from an online tree or unconfirmed family notes`,
    })),
  };
}

export default function CoupleYears({ people }: Props) {
  const spans = people.map(span).filter((s): s is NonNullable<typeof s> => s !== null);

  if (spans.length === 0) return null;

  return (
    <div class="text-[.82rem] text-ink-soft">
      {spans.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {s.parts.map((part, j) => (
            <Fragment key={j}>
              {j > 0 && s.separator}
              {part.unverified ? (
                <span class="unverified-fact" title={part.title}>
                  {part.text}
                </span>
              ) : (
                part.text
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
