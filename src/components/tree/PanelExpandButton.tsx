interface Props {
  /** Id of the panel this button reveals. */
  target: string;
  /** The couple's names, for the button's title text. */
  names: string;
  /** Whether that panel is currently shown. */
  expanded: boolean;
  onToggle: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function PanelExpandButton({ target, names, expanded, onToggle, buttonRef }: Props) {
  return (
    <button
      class="expand"
      type="button"
      aria-controls={target}
      aria-expanded={expanded}
      title={`Show the ancestors of ${names}`}
      onClick={onToggle}
      ref={buttonRef}
    >
      <svg class="chev" viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
        <path
          d="M3 6l5 5 5-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="expand-label when-closed">ancestors</span>
      <span class="expand-label when-open">hide</span>
    </button>
  );
}
