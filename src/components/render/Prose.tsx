import type { ProseBlock, ProseInline } from '../../lib/types';

interface Props {
  blocks: ProseBlock[];
  /**
   * When set, a citation click calls this instead of letting the browser do
   * its native same-page hash-jump — how the popup scrolls its own source
   * list into view instead of jumping the page behind it. Omitted on the
   * static pages, where the plain `href="#src-id"` is exactly right.
   */
  onCiteClick?: (sourceId: string) => void;
}

function Inline({ nodes, onCiteClick }: { nodes: ProseInline[]; onCiteClick?: (id: string) => void }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'text') return n.text;
        if (n.type === 'bold') {
          return (
            <strong key={i}>
              <Inline nodes={n.children} onCiteClick={onCiteClick} />
            </strong>
          );
        }
        if (n.type === 'italic') {
          return (
            <em key={i}>
              <Inline nodes={n.children} onCiteClick={onCiteClick} />
            </em>
          );
        }
        if (n.type === 'unverified') {
          return (
            <span
              key={i}
              class="unverified-prose"
              title="Not verified against an original record — rests only on an online tree or unconfirmed family notes"
            >
              <Inline nodes={n.children} onCiteClick={onCiteClick} />
            </span>
          );
        }
        return (
          <sup class="cite" key={i}>
            <a
              href={`#src-${n.sourceId}`}
              data-source={n.sourceId}
              onClick={
                onCiteClick &&
                ((e: MouseEvent) => {
                  e.preventDefault();
                  onCiteClick(n.sourceId);
                })
              }
            >
              {n.index + 1}
            </a>
          </sup>
        );
      })}
    </>
  );
}

/**
 * Renders a person's biography prose as real Preact elements — the data
 * behind it (`PersonOut.bioBlocks`) holds no HTML, so this is what stands in
 * for the old `dangerouslySetInnerHTML` div. Citations and bold/italic runs
 * are ordinary JSX with ordinary props, same as the rest of the render tree.
 */
export default function Prose({ blocks, onCiteClick }: Props) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'paragraph') {
          return (
            <p key={i}>
              <Inline nodes={b.children} onCiteClick={onCiteClick} />
            </p>
          );
        }
        if (b.type === 'heading') {
          const Heading = (`h${Math.min(Math.max(b.depth, 1), 6)}`) as 'h1';
          return (
            <Heading key={i}>
              <Inline nodes={b.children} onCiteClick={onCiteClick} />
            </Heading>
          );
        }
        const List = b.ordered ? 'ol' : 'ul';
        return (
          <List key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline nodes={item} onCiteClick={onCiteClick} />
              </li>
            ))}
          </List>
        );
      })}
    </>
  );
}
