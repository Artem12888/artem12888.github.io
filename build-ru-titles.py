"""Confirm the language of published catalogue aliases against AniDB titles."""

import gzip
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

catalogue_path, dump_path, output_path = map(Path, sys.argv[1:])
catalogue = json.loads(catalogue_path.read_text(encoding="utf-8"))
language = "{http://www.w3.org/XML/1998/namespace}lang"
russian = {}
with gzip.open(dump_path, "rb") as dump:
    for _, anime in ET.iterparse(dump):
        if anime.tag == "anime":
            russian["d" + anime.attrib["aid"]] = [
                title.text for title in anime.findall("title")
                if title.get(language) == "ru" and title.text
            ]
            anime.clear()

verified = {}
for row in catalogue["data"]:
    declared = {title.casefold() for source_id in row[11] for title in russian.get(source_id, [])}
    matches = [alias for alias in row[7] if alias.casefold() in declared and re.search("[а-яё]{2}", alias, re.I)]
    if matches:
        verified[row[0]] = matches[0]

output_path.write_text(json.dumps(verified, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Russian title aliases: {len(verified)} / {len(catalogue['data'])}")
