# Record images

Drop scans here — census pages, death certificates, marriage registers.

Reference one from `src/data/sources.json` with a leading slash:

```json
"sams_death_cert_1913": {
  "title": "Death certificate, Harriet Eliza Sams, 1913",
  "image": "/img/sams_death_cert_1913.jpg"
}
```

The biography modal then shows a thumbnail under that citation, linking to the
full-size image. Any source without an `image` key simply renders as text.

Held here now:

- `lewis_obit_1944_death` — George W. Lewis death notice, 8 Jan 1944
- `lewis_obit_1944_burial` — George W. Lewis burial notice, 11 Jan 1944
- `sams_death_cert_1913` — Harriet Eliza Sams death certificate
- `census_1950_york` — 1950 census, Urie J. Wallick household, York
- `lewis_obit_1955` — James H. Lewis obituary, 18 Jul 1955
- `stovall_death_cert_1965` — Alice Louise Stovall's Pennsylvania death certificate
- `census_1900_holston` — Lewis household, Holston District, 1900
- `census_1920_glade_spring` — James H. Lewis's own household, 1920
- `census_1910_stony_creek` — the doubtful "J H Lewis" entry; image confirms it's a different man (James Herbert Lewis, 1884–1936), kept as a documented near-miss
- `wwi_draft_james_lewis` — WWI draft card; introduced a third, conflicting birth date (17 Jan 1883) rather than settling the dispute
- `census_1870_smith` / `census_1900_smith` / `marriage_1886_smith_hall` — the William Smith paternity-candidate records
- `ss5_numident_alice` / `ss5_numident_alice_2` — SS-5 index pages for Dora Jane Lewis and Samuel Lewis, both naming Alice's maiden name as Smith
- `wash_co_va_marriage_1905` — the 1905 Lewis/Stovall register itself, found via
  Ancestry's copy of the same Library of Virginia collection (FamilySearch
  restricts it to affiliate-library access, but Ancestry hosts it openly).
  Confirms the facts already on file: James's parents "G W & Harriet", Alice's
  parents blank father & "Maggie".
- `marriage_1871_kidd_rouse` — Noah Kidd & Margaret (Rouse) Lewis, 1871; also
  gives Noah's own parents (Lewis & Elizabeth Kade) and his name's true spelling
- `ashe_co_nc_marriage_1852` — Philip Lewis & Margaret Rouse, George W. Lewis's parents
- `census_1860_washington_lewis` — proves the family was in Washington Co. VA
  five months before George's birth, disproving the Bible's 1865 Charleston
  arrival story; also flags a likely Rouse-family lead next door
- `lewis_death_cert_walter_1955` — Walter A. Lewis's TN death certificate,
  mother "Harriet Sims" (=Sams)
- `numident_lewis_children` — Walter's SS-5 index record only (matches his
  death cert on birth date/place; no sibling could be confidently matched)
- `census_1870_carrier_berry` — Jane (Carrier) Sams as a widow in her mother
  and stepfather's household, Sullivan Co. TN
- `delayed_birth_bettie_lewis_1949` — Bettie Jane Lewis's delayed birth
  certificate, names her mother's maiden name as "Harriett Booher"
- `wash_co_va_marriage_1863` — Quincy A. Stovall & Mary E. Lester, 1863; names
  Mary's parents (Wm C. & Ann Lester) for the first time and gives Quincy's
  parents as James & Ann Stovall, contradicting the family tree's Archelaus
  Stovall & Mary T. Sandifer
- `csa_51st_va_stovall` — Quincy A. Stovall's Confederate service record, 51st
  VA Infantry; enlisted 1861, captured 1864, POW at Elmira until 1865; residence
  Glade Spring, Washington Co. ties it to our man over a same-named lookalike
- `csa_63rd_tn_service` — Hiram Sams's Confederate service record, 63rd TN
  Infantry; enlistment card gives rank "Fifer" and a differing muster date, an
  ordinary discrepancy between cards from different rolls
- `census_1850_sullivan_tn` — Hiram, 19, in his father Obediah's household,
  Sullivan Co. TN, already working as a farmer
- `census_1880_booher` — corrects an earlier index-only read: Jane (Carrier)
  Sams is herself the widowed head of this household, not a step-mother in
  someone else's; her stepson Jacob H. Booher and daughter Elizabeth Samms are
  both in it
- `wash_co_va_marriage_1889_booher` — Jane's third marriage, to the widower
  James L. Booher, 1889; new find, not documented anywhere before this search
- `va_births_1859_virginia_lewis` — birth register for Virginia E. Lewis, 17
  Jul 1859, Upper District, Washington Co. VA; found via FamilySearch's public
  tree profile for Philip Lewis (GF3K-P43), which carries genuinely attached
  record sources despite being a user-submitted tree; first primary-record
  naming of Philip Lewis and Margaret Rouse's eldest daughter
- `census_1870_washington_lewis` — 1870 census, Washington Co. VA; Margaret
  Lewis head of household, no husband recorded, with children Virginia (10),
  George (8), America (6) and Missouri (3); narrows Philip Lewis's death to
  before Oct 1870 and gives primary-record backing, for the first time, to
  three daughters previously known only from the family's Ancestry tree

Still wanted, in the order they are worth chasing:

1. `wash_co_va_marriage_1882` — George W. Lewis & Harriet Eliza Sams's own
   marriage. Genuinely not found despite an exhaustive search of both
   FamilySearch and Ancestry, including hand-paging the entire 1882 Washington
   Co. VA register. The marriage is well corroborated elsewhere (1900 census,
   Walter's 1955 death cert), so it happened — the register entry itself may
   simply not survive, or was never formally returned to the clerk.
2. `wash_co_va_marriage_1894` — Maggie Stovall & William Marshall Roark's own marriage
3. `wash_co_va_bastardy` — bastardy investigation papers. Not a scan but an
   archive visit, and still the best shot at Alice's father.
4. `census_1880_sullivan_harriet` / `census_1880_ingram` — Harriet as a niece
   in 1880, and the Ike Ingram story (`census_1880_booher` is now found — see above)
5. Hiram Sams & Jane Carrier's own marriage, Sullivan Co. TN, c.1854–55 — searched
   on both Ancestry and FamilySearch by name and by county, no hit. May not survive.
6. `sams_deeds_1807_1856` — Obediah Sams's fifty years of Sullivan Co. TN land
   deeds; not attempted here, would need county deed-book images rather than an
   indexed database
