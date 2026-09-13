import { isPlainClick } from '../popup/dom';
import { resolveSources } from '../../lib/markdown';
import type { BioContext, Candidate } from '../../lib/types';

interface Props {
  /** People proposed for this slot but never drawn into the tree. */
  candidates: Candidate[];
  sources: BioContext['sources'];
  /** See `PersonBio`'s prop of the same name. */
  onOpenPerson?: (id: string) => void;
}

export default function Candidates({ candidates, sources, onOpenPerson }: Props) {
  if (candidates.length === 0) return null;

  return (
    <div class="mb-3.5 border-l-[3px] border-l-rule bg-note px-3.5 py-2.5">
      <h3 class="m-0 mb-2 text-[.68rem] uppercase tracking-[1.2px] text-ink-faint">
        Proposed — not established
      </h3>
      <ul class="m-0 list-none p-0">
        {candidates.map((c) => {
          const cited = resolveSources({ sources }, c.citations);
          return (
            <li key={c.name} class="[li+&]:mt-3 [li+&]:pt-2.5 [li+&]:[border-top:1px_dotted_#d9cfbe]">
              <span class="cand-status" data-s={c.status}>
                {c.status}
              </span>{' '}
              {c.person ? (
                <a
                  class="cursor-pointer border-none bg-transparent p-0 font-bold text-accent underline"
                  href={`/people/${c.person}.html`}
                  onClick={
                    onOpenPerson &&
                    ((e: MouseEvent) => {
                      if (!isPlainClick(e)) return;
                      e.preventDefault();
                      onOpenPerson(c.person!);
                    })
                  }
                >
                  {c.name}
                </a>
              ) : (
                <strong>{c.name}</strong>
              )}
              {c.note && <div class="mt-1 text-[.83rem] text-ink-soft">{c.note}</div>}
              {cited.length > 0 && (
                <ul class="m-0 list-none p-0 text-[.76rem] text-ink-faint">
                  {cited.map((s) => (
                    <li key={s.id} class="list-disc">
                      {s.title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
