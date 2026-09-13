import { formatDate } from '../../lib/format';
import type { EventOut, PersonOut } from '../../lib/types';

interface Props {
  person: PersonOut;
}

const UNVERIFIED_HINT =
  'Not verified against an original record — rests only on an online tree or unconfirmed family notes';

export default function VitalFacts({ person }: Props) {
  /** Born / Died / Buried lines that actually carry a date, place, or note. */
  const facts = (
    [
      ['Born', person.birth],
      ['Died', person.death],
      ['Buried', person.burial],
    ] as const
  ).flatMap(([label, event]) => {
    if (!event) return [];
    const parts = [formatDate(event.date), event.place].filter(Boolean).join(', ');
    if (!parts && !event.cause && !event.note) return [];
    const extra = [event.cause, event.note].filter(Boolean).join('; ');
    return [{ label, event: event as EventOut, parts, extra }];
  });

  return (
    <div class="facts m-0 mb-3.5 text-[.87rem] [.aka+&]:mt-2.5 [h2+&]:mt-2.5">
      {facts.map(({ label, event, parts, extra }) => (
        <div key={label}>
          <span class="label">{label}:</span>{' '}
          {event.unverified ? (
            <span class="unverified-fact" title={`${label} ${UNVERIFIED_HINT.toLowerCase()}`}>
              {parts}
            </span>
          ) : (
            parts
          )}
          {extra && (
            <>
              {' '}
              <span class="label">({extra})</span>
            </>
          )}
        </div>
      ))}
      {person.occupation && (
        <div>
          <span class="label">Occupation:</span> {person.occupation}
        </div>
      )}
    </div>
  );
}
