import type { ChartData, CoupleNode } from '../../lib/types';
import { isPlainClick } from '../popup/dom';
import { prefetchBioData } from '../popup/useBioData';
import CoupleFlags from './CoupleFlags';
import CoupleName from './CoupleName';
import CoupleYears from './CoupleYears';
import PanelExpandButton from './PanelExpandButton';

interface Props {
  node: CoupleNode;
  chart: ChartData;
  /** Opens this box's pair page in the popup instead of navigating. */
  onOpenBio: (href: string, trigger: HTMLElement) => void;
  /** Whether this box's expandsTo panel is currently shown. */
  expanded: boolean;
  onToggleExpand: (panelId: string) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function CoupleBox({ node, chart, onOpenBio, expanded, onToggleExpand, buttonRef }: Props) {
  const father = node.father ? chart.people[node.father] : undefined;
  const mother = node.mother ? chart.people[node.mother] : undefined;

  // A person who is in the tree only because an unevidenced tree says so.
  const unverifiedPeople = [father, mother].filter((p) => p?.unverified);

  const names = `${father?.name ?? 'Unknown'} & ${mother?.name ?? 'Unknown'}`;
  const href = node.childOf ? `/pairs/${node.childOf}.html` : undefined;

  const classes = [
    'couple',
    node.placeholder && 'placeholder',
    node.expandsTo && 'expandable',
    unverifiedPeople.length > 0 && 'unverified',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={classes} data-confidence={node.confidence}>
      {node.placeholder || !node.childOf ? (
        <div
          class="couple-body flex flex-1 cursor-pointer flex-col justify-center border-none bg-transparent px-4 py-3 text-center text-inherit [.couple.placeholder_&]:cursor-default [.generation.dense_&]:p-2.5 [.generation.dense_&]:text-[.85rem]"
          aria-hidden="true"
        >
          <div class="font-bold">
            <span class="font-normal italic text-ink-faint">Unknown</span>
            {' & '}
            <span class="font-normal italic text-ink-faint">Unknown</span>
          </div>
        </div>
      ) : (
        <a
          class="couple-body flex flex-1 cursor-pointer flex-col justify-center border-none bg-transparent px-4 py-3 text-center text-inherit no-underline focus-visible:outline-none [.generation.dense_&]:p-2.5 [.generation.dense_&]:text-[.85rem]"
          href={href}
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            onOpenBio(href!, e.currentTarget as HTMLElement);
          }}
          onMouseEnter={() => prefetchBioData(href!)}
          onFocus={() => prefetchBioData(href!)}
        >
          <div class="font-bold">
            <CoupleName name={father?.name} person={father} tags={chart.tags} />
            {' & '}
            <CoupleName name={mother?.name} person={mother} tags={chart.tags} />
          </div>
          <CoupleYears people={[father, mother]} />
          <CoupleFlags people={[father, mother]} confidence={node.confidence} placeholder={node.placeholder} />
        </a>
      )}

      {node.expandsTo && (
        <PanelExpandButton
          target={node.expandsTo}
          names={names}
          expanded={expanded}
          onToggle={() => onToggleExpand(node.expandsTo!)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
}
