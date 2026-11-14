# Anime Taste catalogue

`anime-catalog-2.json` is a machine-readable derivative of the
[Manami anime-offline-database release 2026-27](https://github.com/manami-project/anime-offline-database/releases/tag/2026-27).
The upstream snapshot is dated 2026-07-04. The derivative uses the same
[ODbL 1.0 and DbCL 1.0 terms](https://github.com/manami-project/anime-offline-database/blob/2026-27/LICENSE).

The build retains Japanese anime TV, ONA and OVA entries, using AniDB membership
or an explicit Japanese production tag as catalogue evidence. It excludes
movies, standalone specials, explicitly adult entries, and animation marked
as anime-influenced. It retains selected aliases for name matching and compacts
tag and image references. The filters can omit anime with incomplete metadata.

Run `node build-catalog.cjs anime-offline-database-minified.json` with the
linked release asset to reproduce the catalogue. The catalogue is public.
Lampa saves the personalized viewing and favorite records in its own storage.

Kitsu is optional and supplies synopses by anime identifier at runtime when
available. No Kitsu synopsis is distributed with the catalogue.
