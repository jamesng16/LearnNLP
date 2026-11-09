"""Unit tests kiểm tra bộ chuẩn hóa văn bản tiếng Việt, dữ liệu mẫu và Web Backend API.

Hỗ trợ chạy bằng cả `pytest` lẫn `python -m unittest`.
"""

from __future__ import annotations

import json
import sys
import tempfile
import unicodedata
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "01_Foundations_Preprocessing"))
sys.path.insert(0, str(ROOT_DIR / "datasets"))
sys.path.insert(0, str(ROOT_DIR / "web"))

from app import handle_api_request  # noqa: E402
from download_datasets import generate_offline_samples  # noqa: E402
from vn_preprocessing import (  # noqa: E402
    clean_vietnamese_text,
    normalize_unicode,
    normalize_vietnamese_tone,
)


class TestVietnameseNLPFoundations(unittest.TestCase):
    def test_unicode_nfc_vs_nfd_normalization(self) -> None:
        raw_nfd = unicodedata.normalize("NFD", "Tiếng Việt xử lý ngôn ngữ tự nhiên")
        self.assertGreater(len(raw_nfd), len("Tiếng Việt xử lý ngôn ngữ tự nhiên"))

        dirty_text = raw_nfd + "\u200b\ufeff"
        normalized = normalize_unicode(dirty_text, form="NFC")
        self.assertEqual(normalized, "Tiếng Việt xử lý ngôn ngữ tự nhiên")
        self.assertTrue(unicodedata.is_normalized("NFC", normalized))

    def test_vietnamese_tone_normalization(self) -> None:
        sample_new = "Hoà bình, sức khoẻ, thuỷ lợi và quý giá"
        self.assertEqual(
            normalize_vietnamese_tone(sample_new, style="old"),
            "Hòa bình, sức khỏe, thủy lợi và quý giá",
        )

        sample_old = "Hòa bình, sức khỏe, thủy lợi"
        self.assertEqual(
            normalize_vietnamese_tone(sample_old, style="new"),
            "Hoà bình, sức khoẻ, thuỷ lợi",
        )

    def test_teencode_and_full_pipeline(self) -> None:
        raw = "GV dạy rất nhiệt tình, ko hiểu chỗ nào đều đc giải đáp vs thái độ hoà nhã."
        cleaned = clean_vietnamese_text(raw, tone_style="old", expand_teencode=True)
        self.assertEqual(
            cleaned,
            "giảng viên dạy rất nhiệt tình, không hiểu chỗ nào đều được giải đáp với thái độ hòa nhã.",
        )

    def test_offline_dataset_samples_generation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            created = generate_offline_samples(Path(tmp_dir))
            self.assertEqual(
                set(created.keys()),
                {"uit_vsfc", "phoner_covid19", "vietnews", "viquad"},
            )
            for path in created.values():
                self.assertTrue(path.exists())
                self.assertGreater(path.stat().st_size, 100)

    def test_all_notebooks_valid_json_structure(self) -> None:
        notebooks = list(ROOT_DIR.glob("**/*.ipynb"))
        self.assertEqual(len(notebooks), 8)
        for nb_path in notebooks:
            with open(nb_path, "r", encoding="utf-8") as f:
                nb_data = json.load(f)
            self.assertEqual(nb_data.get("nbformat"), 4)
            self.assertGreater(len(nb_data.get("cells", [])), 0)

    def test_web_api_endpoints(self) -> None:
        # 1. GET /api/status
        code, status = handle_api_request("/api/status", "GET", {})
        self.assertEqual(code, 200)
        self.assertEqual(status["stages"], 4)

        # 2. POST /api/preprocess
        code, prep = handle_api_request(
            "/api/preprocess",
            "POST",
            {"text": "GV\u200b dạy hoà nhã", "tone_style": "old", "expand_teencode": True},
        )
        self.assertEqual(code, 200)
        self.assertEqual(prep["cleaned_text"], "giảng viên dạy hòa nhã")

        # 3. POST /api/segment ("Học sinh học sinh học")
        code, seg = handle_api_request(
            "/api/segment", "POST", {"text": "Học sinh học sinh học"}
        )
        self.assertEqual(code, 200)
        self.assertEqual(seg["words"], ["Học_sinh", "học", "sinh_học"])

        # 4. POST /api/embedding
        code, emb = handle_api_request(
            "/api/embedding",
            "POST",
            {"target_word": "phobert", "sample_sentence": "Giảng viên dạy rất nhiệt tình."},
        )
        self.assertEqual(code, 200)
        self.assertEqual(emb["target_word"], "phobert")
        self.assertEqual(emb["sentiment_analysis"]["predicted_label"], "Positive")

        # 5. POST /api/tokenize-compare
        code, tok = handle_api_request(
            "/api/tokenize-compare",
            "POST",
            {"text": "Viện Nghiên cứu Trí tuệ Nhân tạo VinAI tại Hà Nội."},
        )
        self.assertEqual(code, 200)
        self.assertTrue(tok["phobert"]["requires_word_segmentation"])
        self.assertFalse(tok["vit5"]["requires_word_segmentation"])

        # 6. POST /api/rag-simulate
        code, rag = handle_api_request(
            "/api/rag-simulate",
            "POST",
            {
                "question": "PhoBERT cần tiền xử lý bằng công cụ tách từ nào?",
                "use_word_seg_bm25": True,
                "dense_weight": 0.6,
            },
        )
        self.assertEqual(code, 200)
        self.assertTrue(rag["is_relevant"])
        self.assertEqual(rag["top_document"]["id"], "viquad_002")

        # 7. POST /api/evaluate-exercise
        code, ex = handle_api_request(
            "/api/evaluate-exercise",
            "POST",
            {
                "stage_id": 1,
                "payload": {
                    "unicode_form": "NFC",
                    "tone_style": "old",
                    "word_segmentation": "vncorenlp_underscore",
                },
            },
        )
        self.assertEqual(code, 200)
        self.assertTrue(ex["passed"])


if __name__ == "__main__":
    unittest.main()
