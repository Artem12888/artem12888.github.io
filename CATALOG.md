# Anime Taste catalogue

`anime-catalog-3.json` is a machine-readable derivative of
[cedya77 Anime Offline Database 2026-46](https://github.com/cedya77/anime-offline-database/releases/tag/2026-46),
the continuation of Manami. It uses the upstream
[ODbL 1.0 and DbCL 1.0 terms](https://github.com/cedya77/anime-offline-database/blob/2026-46/LICENSE).
The version 2 catalogue remains available for older installations.

The build keeps Japanese TV, ONA and OVA anime. AniDB membership or a Japanese
production tag supplies catalogue evidence. Movies, standalone specials and
entries described only as anime-influenced are outside the catalogue.
The open database supplies cross-site IDs, aliases and tags. The matching
[Kitsu entry](https://kitsu.docs.apiary.io/) supplies a second source for
format, release year and age rating. A conflict such as an explicit tag in the
open database and a verified Kitsu TV entry with a non-R18 rating can be resolved
without discarding that entry. Unresolved titles are hidden by default and can
be shown from the plugin's recommendation settings. Entries classified as
hentai or independently marked R18 remain hidden. Ratings are the labels of
the source catalogue.

The separate story index stores IDs and nearest-neighbour scores computed
with [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small).
It uses available Kitsu synopses and catalogue tags, with tags alone for
entries with no accessible synopsis. No synopsis text is distributed in the
index. Displaying a synopsis on the detail screen can make a separate Kitsu
request. The plugin uses its local tag scoring when the index cannot load.
The continuation field uses directed Kitsu sequel links when available or
unambiguous numbered seasons linked by the upstream catalogue. An unresolved
order is left blank.

Run `refresh-catalog.ps1 -Cache <directory> -Model <onnx> -Tokenizer <json>`
to fetch the latest open release and rebuild both release assets. The model
files are `onnx/model_qint8_avx512_vnni.onnx` and `tokenizer.json` from
[the pinned model revision](https://huggingface.co/intfloat/multilingual-e5-small/tree/614241f622f53c4eeff9890bdc4f31cfecc418b3).
The Python build requires `numpy`, `onnxruntime` and `tokenizers`. Source
response caches stay on the build machine. The refresh script prepares the
files for publication. Viewing, matching decisions and feedback stay in
Lampa storage on the client. YummyAnime is an optional additional source.

When the installed YummyAnime plugin has an authenticated profile, Anime
Taste can use its favourites and the registered plugin's recommendation
endpoint. Suggested titles are matched against the local catalogue. A weak
match stays below the autonomous recommendations. The user can disable the
integration under **Настройки подбора → Дополнение YummyAnime**.
[YummyAnime API documentation](https://api.yani.tv/).

Run `node build-catalog-parts.cjs` after refreshing the v3 catalogue.
The generated `anime-assets-v32/catalog-*.js` files provide a script-loading
fallback on TV builds where the catalogue JSON cannot be fetched with XHR.
The plugin also uses a jsDelivr mirror of the same repository. After a
successful download it keeps the full catalogue in IndexedDB on the device.
A cache under seven days old is used immediately. After that a refresh is
attempted and the saved catalogue remains usable if the download fails.

Open **Аниме** from Lampa's main menu. The plugin handles the native Anime
category route and presents its recommendations, search, favourites and
history in that section. Posters use the host's `card` template and
navigation stays within the Lampa activity stack. Builds without a native
Anime entry receive an **Аниме** entry for the same section.

The main recommendation shelf can be scrolled with the remote. **Показать
ещё** appends the next available results and focuses the first new card.
Use **↑** and **↓** to move between rows. Focusing a card scrolls its
poster and full title into view.
The first results use the strongest candidates and the published story
neighbours. Further requests rank more catalogue candidates in batches
until the eligible matches are exhausted. Each shelf avoids repeating a
catalogue franchise. Confirmed continuations appear in a separate shelf
on the general page.

Choose **Как «…»** in the Anime section, or search for a title prefixed with
**как**. The selected anime supplies the reference for story, setting and
tag matching. Personal taste can reorder close matches, and the general
continuation shelf is excluded from this view.

The local recommendation model is a two-layer neural network with 96
hashed tag inputs and 12 hidden units. It trains in the Lampa runtime from
favourites, meaningful watch progress and explicit feedback. Unrated
catalogue examples supply a small neutral reference. The network uses a
bounded adjustment to the existing ranking, with a smaller influence for
requests anchored to a specific title. Model training and inference run
on the client. The published story index and optional YummyAnime signals
remain available.

The Anime layout follows the horizontal shelves and compact feature
banner in the [DanielFadeeev Lampa theme](https://github.com/DanielFadeeev/lampa).
It uses scoped styling and works independently of that theme.
