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

**Рекомендации для вас** is followed by 21 genre and theme rows, including
**Исэкай**, **Детектив и загадки**, and **Экшен** in that starting order.
Once the profile has sufficient viewing or feedback across three distinct
franchises, recurring genre preferences can move rows up. The ranking uses
the same weighted signals and local model as the main recommendations,
with a correction for genres that are common throughout the catalogue.
With an authenticated YummyAnime account and the optional integration
enabled, the first recommendation view can use its favourites and up to
120 recent viewing entries with the local Lampa history. A numbered
episode shared by both sources contributes once when the match is clear.
Browsing works from local signals if the account feeds are unavailable.
The account histories are read through the installed YummyAnime plugin
using the [lists and viewing endpoints](https://api.yani.tv/).

Mark genres under **Настройки подбора → Любимые жанры** or from the **OK**
menu on a card inside the genre row. Marked genres come first and are saved
locally. Directly named genres in positive or negative reviews also change
the order. For example, **Мне нравится детектив** raises that genre and
**Не люблю спорт** lowers it.

The order is recomputed when recommendations refresh and stays fixed while
the viewer browses. A row uses only entries tagged for that
category. The remote's **←** and **→** move within a row and the next batch
loads near its end. **↑** and **↓** move between rows. From the first row,
**↑** returns to the tabs. Each shelf avoids repeating a catalogue franchise.
A focused card scrolls its full title into view. Rows are built as the viewer
approaches them, and genre shelves also work with an empty history.

Choose **Как «…»** in the Anime section, or search for a title prefixed with
**как**. The selected anime supplies the reference for story, setting and
tag matching. Personal taste can reorder close matches.

The local recommendation model is a two-layer neural network with 96
hashed tag inputs and 12 hidden units. It trains in the Lampa runtime from
favourites, meaningful watch progress, confirmed rewatches, ratings and
topics recognized in written reviews. Unrated
catalogue examples supply a small neutral reference. The network uses a
bounded adjustment to the existing ranking, with a smaller influence for
requests anchored to a specific title. Model training and inference run
on the client. The published story index and optional YummyAnime signals
remain available.

Choose **Оставить отзыв** next to **В любимое** to write a review. The plugin
stores it locally for the active Lampa history, without a separate sign-in.
**Настройки подбора → Мои отзывы** opens saved reviews. Reviews can be
edited or deleted. The text is saved as entered. A local analyzer extracts
recognized preferences from positive and negative phrases and feeds those
signals into scoring and the local model.

Russian aliases are available in `anime-ru-title-3.json`. The build confirms
aliases already present in the open catalogue against the Russian language
field of the [AniDB title dump](https://anidb.net/api/anime-titles.xml.gz).
To rebuild that asset, run
`python build-ru-titles.py anime-catalog-3.json <titles.xml.gz> anime-ru-title-3.json`.
Other visible titles can be looked up in [Shikimori](https://shikimori.io/api/animes/11617).
Opening the description fetches Russian text from a verified Shikimori match,
then tries the corresponding Lampa card and optional YummyAnime match.
Untranslated titles keep their source name, and missing Russian descriptions
show a status in the card.

The Anime layout follows the horizontal shelves and compact feature
banner in the [DanielFadeeev Lampa theme](https://github.com/DanielFadeeev/lampa).
It uses scoped styling and works independently of that theme.
