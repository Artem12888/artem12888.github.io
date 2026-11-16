"""Build a nearest-neighbour index. Published data contains IDs and scores only.

Usage: python build-story-index.py CATALOG KITSU_CACHE TOKENIZER ONNX DESTINATION
Dependencies: numpy, onnxruntime, tokenizers.
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
from onnxruntime import InferenceSession, SessionOptions
from tokenizers import Tokenizer

catalogue_file, synopsis_file, tokenizer_file, model_file, output_file = sys.argv[1:]
catalogue = json.loads(Path(catalogue_file).read_text(encoding="utf-8"))
descriptions = json.loads(Path(synopsis_file).read_text(encoding="utf-8"))
noise = re.compile(r"\[written by[^\]]+\]|\(source:[^\)]+\)", re.I)
rows = []
documents = []
verified = 0
for row in catalogue["data"]:
    if row[13] == 2:
        continue
    metadata = descriptions.get(str(row[5]), {})
    synopsis = noise.sub("", metadata.get("story", "")).strip()
    concepts = ", ".join(catalogue["tags"][position] for position in row[8][:90])
    if not synopsis and not concepts:
        continue
    verified += int(bool(synopsis))
    # A compact synopsis and catalogue concepts let sparse records participate.
    documents.append("query: " + synopsis[:640] + (". Themes and setting: " if synopsis else "")
                     + concepts[:560])
    rows.append((row[0], bool(synopsis)))

tokenizer = Tokenizer.from_file(tokenizer_file)
tokenizer.enable_truncation(max_length=100)
tokenizer.enable_padding(pad_id=1, pad_token="<pad>")
options = SessionOptions()
options.intra_op_num_threads = 6
options.inter_op_num_threads = 1
session = InferenceSession(model_file, sess_options=options, providers=["CPUExecutionProvider"])
inputs = {field.name: field.type for field in session.get_inputs()}
embeddings = []
for start in range(0, len(rows), 32):
    encoded = tokenizer.encode_batch(documents[start:start + 32])
    masks = np.array([sequence.attention_mask for sequence in encoded], dtype=np.int64)
    params = {
        "input_ids": np.array([sequence.ids for sequence in encoded]),
        "attention_mask": masks,
        "token_type_ids": np.zeros_like(masks),
    }
    params = {key: params[key].astype(np.int32 if value == "tensor(int32)" else np.int64)
              for key, value in inputs.items()}
    tokens = session.run(None, params)[0]
    mean = (tokens * masks[:, :, None]).sum(axis=1) / masks.sum(axis=1)[:, None]
    embeddings.append((mean / np.linalg.norm(mean, axis=1, keepdims=True)).astype(np.float32))
    if start % 1024 == 0:
        print(f"Encoded {min(start + 32, len(rows))}/{len(rows)}", flush=True)

matrix = np.concatenate(embeddings)
index = {}
for start in range(0, len(rows), 96):
    scores = matrix[start:start + 96] @ matrix.T
    for offset, scores_row in enumerate(scores):
        i = start + offset
        scores_row[i] = -1
        best = np.argpartition(-scores_row, 24)[:24]
        key, has_synopsis = rows[i]
        index[key] = [int(has_synopsis), [[rows[j][0], round(float(scores_row[j]) * 10000)]
                    for j in sorted(best, key=lambda number: (-scores_row[number], rows[number][0]))]]

index_file = Path(output_file)
index_file.write_text(json.dumps({"model": "intfloat/multilingual-e5-small", "updated": catalogue["updated"],
                                 "descriptions": verified, "entries": index}, separators=(",", ":")),
                      encoding="utf-8")
print(json.dumps({"entries": len(rows), "descriptions": verified, "bytes": index_file.stat().st_size}), flush=True)
