import type { Confidence, PersonOut } from '../../lib/types';

interface Props {
  /** The couple's occupants; undefined slots are ignored. */
  people: (PersonOut | undefined)[];
  confidence: Confidence;
  placeholder: boolean;
}

export default function CoupleFlags({ people, confidence, placeholder }: Props) {
  // A person who is in the tree only because an unevidenced tree says so.
  const unverifiedPeople = people.filter((p) => p?.unverified);

  // Only flag softness where we have a documented reason for the doubt.
  const flag = !placeholder && confidence !== 'documented' ? confidence : null;

  return (
    <>
      {unverifiedPeople.length > 0 && (
        <span
          class="flag mt-1.5 inline-block text-[.68rem] uppercase tracking-[1px] text-unverified [.flag+&]:mt-0.5 [.flag+&]:block"
          title={unverifiedPeople.map((p) => `${p!.name} — ${p!.unverified}`).join('\n')}
        >
          unverified
        </span>
      )}
      {flag && (
        <span class="flag mt-1.5 inline-block text-[.68rem] uppercase tracking-[1px] text-accent [.flag+&]:mt-0.5 [.flag+&]:block">
          {flag}
        </span>
      )}
    </>
  );
}
