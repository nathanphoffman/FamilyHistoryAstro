import { Fragment } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import BioPopup from '../popup/BioPopup';
import CoupleBox from './CoupleBox';
import RootBox from './RootBox';
import type { ChartData, Panel } from '../../lib/types';

interface Props {
  chart: ChartData;
}

/**
 * Narrow the boxes as generations double in width so a row keeps fitting.
 * Past eight boxes there is no width that stays readable, so the row scrolls.
 */
function boxWidth(count: number): number {
  if (count <= 2) return 240;
  if (count <= 4) return 215;
  if (count <= 8) return 155;
  return 135;
}

/** Every panel id reachable below this one, so collapsing it takes them too. */
function descendantsOf(panelsById: Record<string, Panel>, id: string, acc: Set<string>): void {
  const panel = panelsById[id];
  if (!panel) return;
  for (const childId of panel.children) {
    acc.add(childId);
    descendantsOf(panelsById, childId, acc);
  }
}

/**
 * The whole interactive ancestry chart — panels, boxes, expand/collapse, and
 * the biography popup — as one island. The header above it (title, spouses
 * line, legend) stays plain static markup in the page; only the part that
 * actually needs clicking lives here.
 */
export default function Chart({ chart }: Props) {
  const panelsById = useMemo(
    () => Object.fromEntries(chart.panels.map((p) => [p.id, p])),
    [chart.panels],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRefs = useRef(new Map<string, HTMLElement>());
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingScroll = useRef<{ id: string; action: 'expand' | 'collapse' } | null>(null);

  const openBio = useCallback((href: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpenUrl(href);
  }, []);

  const closeBio = useCallback(() => {
    setOpenUrl(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  const navigateBio = useCallback((personId: string) => {
    setOpenUrl(`/people/${personId}.html`);
  }, []);

  // Expanding shows a panel; collapsing takes its descendants with it, so the
  // page can't be left showing a section whose route in has gone.
  const toggle = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          const gone = new Set<string>();
          descendantsOf(panelsById, id, gone);
          gone.forEach((g) => next.delete(g));
          pendingScroll.current = { id, action: 'collapse' };
        } else {
          next.add(id);
          pendingScroll.current = { id, action: 'expand' };
        }
        return next;
      });
    },
    [panelsById],
  );

  // Runs once the toggled panel has actually (un)mounted, so the scroll
  // target exists.
  useEffect(() => {
    const pending = pendingScroll.current;
    if (!pending) return;
    pendingScroll.current = null;
    if (pending.action === 'expand') {
      panelRefs.current.get(pending.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      buttonRefs.current.get(pending.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [expanded]);

  return (
    <>
      {chart.panels.map((panel, index) => {
        const shown = index === 0 || expanded.has(panel.id);
        if (!shown) return null;

        return (
          <section
            key={panel.id}
            class="panel"
            id={panel.id}
            ref={(el: HTMLElement | null) => {
              if (el) panelRefs.current.set(panel.id, el);
              else panelRefs.current.delete(panel.id);
            }}
          >
            {index === 0 ? (
              <RootBox chart={chart} onOpenBio={openBio} />
            ) : (
              <header class="mx-0 mt-12 mb-7 border-t border-t-line-dim pt-[26px] text-center">
                <p class="m-0 text-[.72rem] uppercase tracking-[1.5px] text-ink-faint">{panel.subtitle}</p>
                <h2 class="mx-0 mt-0.5 mb-2 text-[1.45rem]">{panel.title}</h2>
                <button class="panel-collapse" type="button" onClick={() => toggle(panel.id)}>
                  Collapse
                </button>
              </header>
            )}

            {panel.generations.map((generation) => (
              <Fragment key={generation.depth}>
                <div class="mb-2.5 text-center text-[.75rem] uppercase tracking-[1.5px] text-ink-faint">
                  Generation {generation.depth} — {generation.label}
                </div>
                <div class="mb-10 overflow-x-auto pb-1.5 [scrollbar-width:thin] max-[700px]:mb-[30px]">
                  <div
                    class={`generation${generation.nodes.length > 4 ? ' dense' : ''}`}
                    style={`--box-width:${boxWidth(generation.nodes.length)}px; --box-gap:${
                      generation.nodes.length > 4 ? 10 : 20
                    }px;`}
                  >
                    {generation.nodes.map((node) => (
                      <CoupleBox
                        key={node.id}
                        node={node}
                        chart={chart}
                        onOpenBio={openBio}
                        expanded={node.expandsTo ? expanded.has(node.expandsTo) : false}
                        onToggleExpand={toggle}
                        buttonRef={
                          node.expandsTo
                            ? (el: HTMLButtonElement | null) => {
                                if (el) buttonRefs.current.set(node.expandsTo!, el);
                                else buttonRefs.current.delete(node.expandsTo!);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </section>
        );
      })}

      <BioPopup url={openUrl} onClose={closeBio} onNavigate={navigateBio} />
    </>
  );
}
