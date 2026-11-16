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
