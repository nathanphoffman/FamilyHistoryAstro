import { resolveSources } from '../../lib/markdown';
import type { BioContext } from '../../lib/types';

interface Props {
  /** Citation ids, in the order they should be listed. */
  citations: string[];
  sources: BioContext['sources'];
}

/** Reliability values that read badly as a bare token get a spelled-out badge. */
const RELIABILITY_LABEL: Record<string, string> = {
  family_notes: 'unconfirmed family notes',
};

export default function Sources({ citations, sources }: Props) {
  const cited = resolveSources({ sources }, citations);

  if (cited.length === 0) return null;

  return (
    <div class="mt-[18px] border-t border-t-line pt-3">
      <h3 class="m-0 mb-2 text-[.7rem] uppercase tracking-[1.2px] text-ink-faint">Sources</h3>
      <ol class="m-0 pl-5 text-[.82rem] text-ink-soft">
        {cited.map((source) => (
          <li key={source.id} id={`src-${source.id}`} class="mb-2">
            <span class="reliability" data-r={source.reliability}>
              {RELIABILITY_LABEL[source.reliability] ?? source.reliability}
            </span>{' '}
            {source.title}
            {source.repository && (
              <>
                {' '}
                <span class="text-ink-faint">— {source.repository}</span>
              </>
            )}
            {source.note && (
              <>
                <br />
                <span class="text-ink-faint">{source.note}</span>
              </>
            )}
            {source.url && (
              <>
                <br />
                <a href={source.url} target="_blank" rel="noopener">
                  {source.url}
                </a>
              </>
            )}
            {source.image && (
              <a class="mt-[5px] block" href={source.image} target="_blank" rel="noopener">
                <img
                  src={source.image}
                  alt={`Scan: ${source.title}`}
                  loading="lazy"
                  class="max-h-[90px] rounded-[3px] border border-rule"
                />
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
