interface Props {
  /** Why this person's presence in the tree is unverified; falsy renders nothing. */
  reason?: string;
}

export default function UnverifiedNotice({ reason }: Props) {
  if (!reason) return null;
  return (
    <div class="mb-3.5 border-l-[3px] border-l-unverified bg-[#fbf2e0] px-3 py-2 text-[.85rem] text-ink-soft">
      <span class="mr-1 text-[.68rem] uppercase tracking-[1px] text-unverified">Unverified</span>
      {reason}
    </div>
  );
}
