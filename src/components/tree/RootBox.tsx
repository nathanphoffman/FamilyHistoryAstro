import type { ChartData } from '../../lib/types';
import { isPlainClick } from '../popup/dom';
import { prefetchBioData } from '../popup/useBioData';
import CoupleName from './CoupleName';

interface Props {
  chart: ChartData;
  onOpenBio: (href: string, trigger: HTMLElement) => void;
}

/** The chart's single top box — the root person, not a couple. */
export default function RootBox({ chart, onOpenBio }: Props) {
  const href = `/people/${chart.root.id}.html`;

  return (
    <div class="mb-9 flex justify-center">
      <div class="couple border-[3px] flex-[0_0_220px]">
        <a
          class="couple-body flex flex-1 cursor-pointer flex-col justify-center border-none bg-transparent px-4 py-3 text-center text-inherit no-underline focus-visible:outline-none"
          href={href}
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            onOpenBio(href, e.currentTarget as HTMLElement);
          }}
          onMouseEnter={() => prefetchBioData(href)}
          onFocus={() => prefetchBioData(href)}
        >
          <div class="font-bold">
            <CoupleName name={chart.root.name} person={chart.people[chart.root.id]} tags={chart.tags} />
          </div>
          <div class="text-[.82rem] text-ink-soft">{chart.root.dates}</div>
        </a>
      </div>
    </div>
  );
}
