"""
Einfacher JSON-Speicher fuer Favoriten, gespeicherte und abgelehnte Produkte.

Speichert lokal in data/store.json – keine externe Datenbank noetig.
"""
from __future__ import annotations

import json
import os
import tempfile
import threading
from pathlib import Path
from typing import Dict, List


def _resolve_data_dir() -> Path:
    # Per Umgebungsvariable übersteuerbar; faellt auf einen beschreibbaren
    # Ordner zurueck (wichtig für Container-Hosting wie Hugging Face).
    candidates = [
        os.environ.get("STORE_DIR"),
        str(Path(__file__).parent / "data"),
        str(Path(tempfile.gettempdir()) / "oms-data"),
    ]
    for c in candidates:
        if not c:
            continue
        try:
            p = Path(c)
            p.mkdir(parents=True, exist_ok=True)
            # Schreibbarkeit testen
            test = p / ".write_test"
            test.write_text("ok")
            test.unlink()
            return p
        except Exception:
            continue
    return Path(tempfile.gettempdir())


DATA_DIR = _resolve_data_dir()
STORE_FILE = DATA_DIR / "store.json"

_lock = threading.Lock()

_DEFAULT: Dict[str, List[dict]] = {"favorites": [], "saved": [], "rejected": []}


def _load() -> Dict[str, List[dict]]:
    if not STORE_FILE.exists():
        return {k: list(v) for k, v in _DEFAULT.items()}
    try:
        data = json.loads(STORE_FILE.read_text(encoding="utf-8"))
        for k in _DEFAULT:
            data.setdefault(k, [])
        return data
    except Exception:
        return {k: list(v) for k, v in _DEFAULT.items()}


def _save(data: Dict[str, List[dict]]) -> None:
    STORE_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_all() -> Dict[str, List[dict]]:
    with _lock:
        return _load()


VALID = set(_DEFAULT.keys())


def _id(product: dict) -> str:
    return product.get("link") or product.get("name", "")


def add(bucket: str, product: dict) -> Dict[str, List[dict]]:
    if bucket not in VALID:
        raise ValueError(f"unbekannter Bereich: {bucket}")
    with _lock:
        data = _load()
        pid = _id(product)
        # aus anderen Buckets entfernen (ein Produkt hat einen Status)
        for b in VALID:
            data[b] = [p for p in data[b] if _id(p) != pid]
        data[bucket].append(product)
        _save(data)
        return data


def remove(bucket: str, product_id: str) -> Dict[str, List[dict]]:
    if bucket not in VALID:
        raise ValueError(f"unbekannter Bereich: {bucket}")
    with _lock:
        data = _load()
        data[bucket] = [p for p in data[bucket] if _id(p) != product_id]
        _save(data)
        return data


def clear(bucket: str | None = None) -> Dict[str, List[dict]]:
    with _lock:
        data = _load()
        if bucket is None:
            data = {k: [] for k in VALID}
        elif bucket in VALID:
            data[bucket] = []
        _save(data)
        return data
