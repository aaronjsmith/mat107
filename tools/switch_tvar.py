# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "js" / "questions.js"
text = p.read_text(encoding="utf-8")
text2 = re.sub(r'\bt\(("q\.[^"]+")', r"tVar(\1", text)
text2 = re.sub(r'\bt\(("flash\.(?:recall|recognize)")', r"tVar(\1", text2)
p.write_text(text2, encoding="utf-8")
print("done", "tVar q count", text2.count('tVar("q.'))
