"""Core NLP Engine cho nền tảng Web Học tập Thực hành Vietnamese NLP Mastery.

Kết nối trực tiếp với:
- `01_Foundations_Preprocessing/vn_preprocessing.py` (Chuẩn hóa Unicode NFC/NFD, Dấu thanh, Teencode)
- `datasets/samples/*.jsonl` (UIT-VSFC, PhoNER/VLSP, VietNews, UIT-ViQuAD 2.0)
- Các thuật toán Tách từ (Longest-Match + PyVi/Underthesea nếu có), Không gian Vector PhoW2V (Cosine Similarity & Vector Analogy),
  Subword Alignment của PhoBERT vs ViT5/Qwen, và Hybrid Agentic RAG (BM25 + Dense + LangGraph Trace).
"""

from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "01_Foundations_Preprocessing"))
sys.path.insert(0, str(REPO_ROOT / "datasets"))

from download_datasets import generate_offline_samples  # noqa: E402
from vn_preprocessing import (  # noqa: E402
    DEFAULT_TEENCODE_DICT,
    NEW_TO_OLD_TONE_MAP,
    ZERO_WIDTH_PATTERN,
    clean_vietnamese_text,
)

SAMPLES_DIR = REPO_ROOT / "datasets" / "samples"
if not (SAMPLES_DIR / "uit_vsfc_sample.jsonl").exists():
    generate_offline_samples(SAMPLES_DIR)

# Từ điển từ ghép Tiếng Việt chuẩn (kèm nhãn từ loại POS & thực thể NER) phục vụ Longest-Match
# khi môi trường chưa cài đặt JVM cho VnCoreNLP, đồng thời tự động dùng pyvi/underthesea nếu có.
COMPOUND_LEXICON: dict[str, str] = {
    "viện_nghiên_cứu": "N",
    "nghiên_cứu": "V",
    "trí_tuệ_nhân_tạo": "N",
    "trí_tuệ": "N",
    "nhân_tạo": "A",
    "xử_lý_ngôn_ngữ_tự_nhiên": "N",
    "xử_lý": "V",
    "ngôn_ngữ": "N",
    "tự_nhiên": "A",
    "học_sinh": "N",
    "sinh_học": "N",
    "sinh_viên": "N",
    "giảng_viên": "N",
    "bài_tập": "N",
    "thực_hành": "V",
    "lý_thuyết": "N",
    "công_nghệ_thông_tin": "N",
    "công_nghệ": "N",
    "thông_tin": "N",
    "mô_hình": "N",
    "ngôn_ngữ_lớn": "N",
    "học_sâu": "N",
    "máy_tính": "N",
    "phân_loại": "V",
    "văn_bản": "N",
    "tiếng_việt": "N",
    "nhiệt_tình": "A",
    "dễ_hiểu": "A",
    "thắc_mắc": "N",
    "giải_đáp": "V",
    "hòa_bình": "N",
    "hòa_nhã": "A",
    "sức_khỏe": "N",
    "thủy_lợi": "N",
    "quý_giá": "A",
    "ông_già": "N",
    "bàn_là": "N",
    "công_cụ": "N",
    "quần_áo": "N",
    "đại_học": "N",
    "quốc_gia": "N",
    "hà_nội": "Np",
    "hồ_chí_minh": "Np",
    "tp._hồ_chí_minh": "Np",
    "chợ_rẫy": "Np",
    "bệnh_viện": "N",
    "bệnh_nhân": "N",
    "điều_trị": "V",
    "công_bố": "V",
    "cải_thiện": "V",
    "đáng_kể": "R",
    "chính_xác": "A",
    "tách_từ": "V",
    "âm_tiết": "N",
    "khoảng_trắng": "N",
    "truy_xuất": "V",
    "ảo_giác": "N",
    "doanh_nghiệp": "N",
    "trợ_lý_ảo": "N",
    "tài_liệu": "N",
    "môn_học": "N",
    "cấu_hình": "N",
    "hiện_đại": "A",
    "tận_tâm": "A",
}

SINGLE_POS_MAP: dict[str, str] = {
    "viện": "N",
    "vinai": "Np",
    "phobert": "Np",
    "vit5": "Np",
    "qwen": "Np",
    "sailor2": "Np",
    "tại": "E",
    "ở": "E",
    "với": "E",
    "cho": "E",
    "của": "E",
    "trong": "E",
    "vừa": "R",
    "đang": "R",
    "rất": "R",
    "hơi": "R",
    "luôn": "R",
    "không": "R",
    "chưa": "R",
    "được": "V",
    "dạy": "V",
    "học": "V",
    "đi": "V",
    "làm": "V",
    "giảng": "V",
    "nhanh": "A",
    "chậm": "A",
    "yếu": "A",
    "tốt": "A",
    "hay": "A",
    "phẳng": "A",
    "quá": "R",
    "và": "C",
    "nhưng": "C",
    "hoặc": "C",
}

# Không gian Vector 2D & Đa chiều chuẩn hóa (PhoW2V / BGE-M3 Semantic Space)
# Gồm 4 cụm ngữ nghĩa rõ rệt để minh họa trực quan trên Canvas 2D và tính Cosine Similarity
EMBEDDING_SPACE: list[dict[str, Any]] = [
    # Cụm 1: Giáo dục & UIT-VSFC (Góc phần tư thứ nhất: x > 0, y > 0)
    {"word": "giảng_viên", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.68, "y": 0.62, "vec": [0.85, 0.78, 0.15, 0.20, 0.10]},
    {"word": "sinh_viên", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.58, "y": 0.72, "vec": [0.80, 0.84, 0.18, 0.12, 0.08]},
    {"word": "học_sinh", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.52, "y": 0.78, "vec": [0.76, 0.88, 0.12, 0.10, 0.05]},
    {"word": "bài_tập", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.76, "y": 0.48, "vec": [0.88, 0.62, 0.22, 0.05, 0.04]},
    {"word": "thực_hành", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.82, "y": 0.55, "vec": [0.89, 0.68, 0.30, 0.12, 0.06]},
    {"word": "môn_học", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.64, "y": 0.44, "vec": [0.82, 0.60, 0.20, 0.08, 0.05]},
    {"word": "sinh_học", "cluster": "education", "label": "Giáo dục (UIT-VSFC)", "x": 0.44, "y": 0.38, "vec": [0.65, 0.55, 0.35, 0.05, 0.12]},

    # Cụm 2: Mô hình NLP & AI (Góc phần tư thứ hai: x < 0, y > 0)
    {"word": "phobert", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.72, "y": 0.68, "vec": [0.12, 0.18, 0.95, 0.22, 0.15]},
    {"word": "vit5", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.64, "y": 0.58, "vec": [0.10, 0.15, 0.92, 0.18, 0.12]},
    {"word": "vncorenlp", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.80, "y": 0.50, "vec": [0.15, 0.12, 0.90, 0.14, 0.10]},
    {"word": "underthesea", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.75, "y": 0.40, "vec": [0.14, 0.14, 0.88, 0.15, 0.12]},
    {"word": "qwen", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.54, "y": 0.76, "vec": [0.08, 0.20, 0.94, 0.25, 0.18]},
    {"word": "langgraph", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.45, "y": 0.64, "vec": [0.12, 0.22, 0.89, 0.28, 0.16]},
    {"word": "tách_từ", "cluster": "nlp_ai", "label": "Mô hình NLP & AI", "x": -0.68, "y": 0.30, "vec": [0.20, 0.16, 0.85, 0.10, 0.08]},

    # Cụm 3: Cảm xúc Tích cực vs Tiêu cực (Góc phần tư thứ tư: x > 0, y < 0 & thứ ba: x < 0, y < 0)
    {"word": "nhiệt_tình", "cluster": "sentiment_pos", "label": "Cảm xúc Tích cực", "x": 0.65, "y": -0.55, "vec": [0.30, 0.25, 0.10, 0.94, 0.05]},
    {"word": "dễ_hiểu", "cluster": "sentiment_pos", "label": "Cảm xúc Tích cực", "x": 0.75, "y": -0.45, "vec": [0.35, 0.28, 0.12, 0.92, 0.04]},
    {"word": "tận_tâm", "cluster": "sentiment_pos", "label": "Cảm xúc Tích cực", "x": 0.58, "y": -0.68, "vec": [0.28, 0.22, 0.08, 0.95, 0.06]},
    {"word": "hiện_đại", "cluster": "sentiment_pos", "label": "Cảm xúc Tích cực", "x": 0.48, "y": -0.40, "vec": [0.25, 0.20, 0.25, 0.86, 0.08]},
    {"word": "chậm_chạp", "cluster": "sentiment_neg", "label": "Cảm xúc Tiêu cực", "x": 0.20, "y": -0.78, "vec": [0.18, 0.15, 0.05, -0.88, 0.10]},
    {"word": "khó_hiểu", "cluster": "sentiment_neg", "label": "Cảm xúc Tiêu cực", "x": 0.32, "y": -0.84, "vec": [0.22, 0.18, 0.06, -0.90, 0.08]},

    # Cụm 4: Địa danh & Tổ chức Việt Nam (Góc phần tư thứ ba: x < 0, y < 0)
    {"word": "hà_nội", "cluster": "location", "label": "Địa danh & Tổ chức", "x": -0.62, "y": -0.58, "vec": [0.08, 0.10, 0.12, 0.10, 0.95]},
    {"word": "tp._hồ_chí_minh", "cluster": "location", "label": "Địa danh & Tổ chức", "x": -0.72, "y": -0.66, "vec": [0.06, 0.12, 0.10, 0.12, 0.94]},
    {"word": "việt_nam", "cluster": "location", "label": "Địa danh & Tổ chức", "x": -0.52, "y": -0.48, "vec": [0.10, 0.12, 0.15, 0.15, 0.92]},
    {"word": "vinai", "cluster": "location", "label": "Địa danh & Tổ chức", "x": -0.42, "y": -0.32, "vec": [0.12, 0.14, 0.65, 0.18, 0.75]},
]


def _cosine_sim(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    n1 = math.sqrt(sum(a * a for a in v1)) or 1e-9
    n2 = math.sqrt(sum(b * b for b in v2)) or 1e-9
    return round(dot / (n1 * n2), 4)


def inspect_and_preprocess(
    text: str,
    tone_style: str = "old",
    expand_teencode: bool = True,
    lowercase: bool = False,
) -> dict[str, Any]:
    """Phân tích chi tiết bảng mã Unicode (NFC vs NFD), dấu thanh, teencode và làm sạch văn bản."""
    raw_text = text or ""
    zero_width_matches = ZERO_WIDTH_PATTERN.findall(raw_text)

    # So sánh NFC vs NFD của chuỗi đầu vào
    text_nfc = unicodedata.normalize("NFC", ZERO_WIDTH_PATTERN.sub("", raw_text))
    text_nfd = unicodedata.normalize("NFD", ZERO_WIDTH_PATTERN.sub("", raw_text))

    # Chi tiết từng ký tự của từ đầu tiên có dấu tiếng Việt để hiển thị trực quan
    sample_word = next(
        (w for w in text_nfc.split() if any(ord(c) > 127 for c in w)),
        text_nfc[:10] if text_nfc else "Việt",
    )
    sample_word_nfc = unicodedata.normalize("NFC", sample_word)
    sample_word_nfd = unicodedata.normalize("NFD", sample_word)

    nfc_chars = [
        {
            "char": c,
            "hex": f"U+{ord(c):04X}",
            "name": unicodedata.name(c, "UNKNOWN"),
            "combining": unicodedata.combining(c) > 0,
        }
        for c in sample_word_nfc
    ]
    nfd_chars = [
        {
            "char": c,
            "hex": f"U+{ord(c):04X}",
            "name": unicodedata.name(c, "UNKNOWN"),
            "combining": unicodedata.combining(c) > 0,
        }
        for c in sample_word_nfd
    ]

    # Phát hiện các từ được mở rộng teencode & đổi dấu thanh
    final_cleaned = clean_vietnamese_text(
        raw_text,
        tone_style=tone_style,
        expand_teencode=expand_teencode,
        lowercase=lowercase,
    )

    # Ghi nhận các biến đổi cụ thể để giải thích cho người học
    transformations: list[dict[str, str]] = []
    if len(zero_width_matches) > 0:
        transformations.append({
            "type": "Zero-Width Space Removed",
            "detail": f"Đã xóa {len(zero_width_matches)} ký tự ẩn (\\u200b / \\ufeff)",
        })
    if not unicodedata.is_normalized("NFC", raw_text):
        transformations.append({
            "type": "Unicode NFD -> NFC",
            "detail": f"Gộp các dấu thanh rời thành ký tự dựng sẵn ({len(raw_text)} -> {len(text_nfc)} chars)",
        })

    for tok in text_nfc.split():
        clean_tok = re.sub(r"[^\w]", "", tok).lower()
        if expand_teencode and clean_tok in DEFAULT_TEENCODE_DICT:
            transformations.append({
                "type": "Teencode Expansion",
                "detail": f"'{clean_tok}' → '{DEFAULT_TEENCODE_DICT[clean_tok]}'",
            })
        for new_t, old_t in NEW_TO_OLD_TONE_MAP.items():
            if new_t in tok and not clean_tok.startswith("qu"):
                transformations.append({
                    "type": "Tone Mark Normalization",
                    "detail": f"'{tok}' → đổi vị trí dấu thanh theo chuẩn '{tone_style}'",
                })

    return {
        "raw_text": raw_text,
        "cleaned_text": final_cleaned,
        "is_input_nfc": unicodedata.is_normalized("NFC", raw_text),
        "len_raw": len(raw_text),
        "len_nfc": len(text_nfc),
        "len_nfd": len(text_nfd),
        "zero_width_count": len(zero_width_matches),
        "sample_word": sample_word_nfc,
        "nfc_breakdown": nfc_chars,
        "nfd_breakdown": nfd_chars,
        "tone_old": normalize_vietnamese_tone(teencode_expanded, style="old"),
        "tone_new": normalize_vietnamese_tone(teencode_expanded, style="new"),
        "transformations": transformations,
    }


def segment_and_tag(text: str) -> dict[str, Any]:
    """Tách từ tiếng Việt (Syllables vs Compound Words), gán nhãn POS & Dependency Parsing."""
    cleaned = clean_vietnamese_text(text, tone_style="old", expand_teencode=True)
    # Tách dấu câu thành token riêng để xử lý chuẩn
    raw_tokens = re.findall(r"tp\.\s*hồ\s*chí\s*minh|[\w]+|[^\w\s]", cleaned, flags=re.IGNORECASE | re.UNICODE)

    # 1. Xử lý câu kinh điển có ngữ cảnh đặc biệt ("Học sinh học sinh học")
    lower_cleaned = cleaned.lower()
    words: list[str] = []

    if "học sinh học sinh học" in lower_cleaned:
        # Xử lý thông minh cụm kinh điển: Học_sinh (N) + học (V) + sinh_học (N)
        idx = 0
        while idx < len(raw_tokens):
            window5 = [t.lower() for t in raw_tokens[idx : idx + 5]]
            if window5 == ["học", "sinh", "học", "sinh", "học"]:
                words.extend([
                    f"{raw_tokens[idx]}_{raw_tokens[idx+1]}",
                    raw_tokens[idx + 2],
                    f"{raw_tokens[idx+3]}_{raw_tokens[idx+4]}",
                ])
                idx += 5
                continue
            words.append(raw_tokens[idx])
            idx += 1
        raw_tokens = words
        words = []

    # 2. Thuật toán Longest-Match (Maximum Matching 4 -> 3 -> 2 -> 1 âm tiết)
    i = 0
    n = len(raw_tokens)
    while i < n:
        matched = False
        if re.match(r"tp\.\s*hồ\s*chí\s*minh", raw_tokens[i], flags=re.IGNORECASE):
            words.append("TP._Hồ_Chí_Minh")
            i += 1
            continue
        for span in (4, 3, 2):
            if i + span <= n:
                candidate_orig = "_".join(raw_tokens[i : i + span])
                candidate_lower = candidate_orig.lower()
                if candidate_lower in COMPOUND_LEXICON:
                    words.append(candidate_orig)
                    i += span
                    matched = True
                    break
        if not matched:
            words.append(raw_tokens[i])
            i += 1

    # Nếu pyvi hoặc underthesea được cài đặt trong môi trường, lấy thêm kết quả thực tế của thư viện
    pyvi_segmented = " ".join(words)
    uts_segmented = " ".join(words)
    engine_used = "Built-in RDR/Longest-Match Lexicon"

    try:
        from pyvi import ViTokenizer

        pyvi_segmented = ViTokenizer.tokenize(cleaned)
        engine_used = "pyvi + Built-in Lexicon"
    except ImportError:
        pass

    try:
        from underthesea import word_tokenize

        uts_segmented = word_tokenize(cleaned, format="text")
        engine_used = "underthesea + Built-in Lexicon"
    except ImportError:
        pass

    # 3. Gán nhãn từ loại (POS Tagging) và Quan hệ phụ thuộc (Dependency)
    pos_tags: list[dict[str, Any]] = []
    root_idx = 0
    for idx, w in enumerate(words):
        w_lower = w.lower()
        if w_lower in COMPOUND_LEXICON:
            tag = COMPOUND_LEXICON[w_lower]
        elif w_lower in SINGLE_POS_MAP:
            tag = SINGLE_POS_MAP[w_lower]
        elif re.match(r"^[^\w]+$", w):
            tag = "CH"
        elif w.isdigit():
            tag = "M"
        elif w[0].isupper() and idx > 0:
            tag = "Np"
        else:
            tag = "N"
        if tag == "V" and root_idx == 0:
            root_idx = idx + 1
        pos_tags.append({"index": idx + 1, "word": w, "pos": tag})

    if root_idx == 0 and pos_tags:
        root_idx = 1

    dependencies: list[dict[str, Any]] = []
    for item in pos_tags:
        idx = item["index"]
        tag = item["pos"]
        if idx == root_idx:
            head, rel = 0, "root"
        elif tag == "CH":
            head, rel = root_idx, "punct"
        elif idx < root_idx and tag in ("N", "Np", "P"):
            head, rel = root_idx, "sub"
        elif idx > root_idx and tag in ("N", "Np"):
            head, rel = root_idx, "dob"
        elif tag in ("R", "A"):
            head, rel = root_idx, "adv"
        elif tag == "E":
            head, rel = root_idx, "prep"
        else:
            head, rel = max(1, idx - 1), "nmod"
        dependencies.append({**item, "head": head, "relation": rel})

    syllables = cleaned.split()
    compound_count = sum(1 for w in words if "_" in w)

    return {
        "cleaned_text": cleaned,
        "syllables": syllables,
        "syllable_count": len(syllables),
        "words": words,
        "word_count": len(words),
        "compound_count": compound_count,
        "segmented_text": " ".join(words),
        "pyvi_segmented": pyvi_segmented,
        "underthesea_segmented": uts_segmented,
        "pos_and_dependencies": dependencies,
        "engine_used": engine_used,
    }


def explore_embeddings_and_classify(
    target_word: str = "giảng_viên",
    analogy_pos1: str = "phobert",
    analogy_neg1: str = "tách_từ",
    analogy_pos2: str = "vit5",
    sample_sentence: str = "Giảng viên dạy rất nhiệt tình, dễ hiểu và luôn giải đáp thắc mắc cho sinh viên.",
) -> dict[str, Any]:
    """Khám phá không gian Vector PhoW2V 2D, tính Cosine Similarity và phân loại cảm xúc UIT-VSFC."""
    vocab_map = {item["word"]: item for item in EMBEDDING_SPACE}
    target_key = target_word.lower().strip().replace(" ", "_")
    if target_key not in vocab_map:
        target_key = "giảng_viên"

    target_entry = vocab_map[target_key]
    neighbors = []
    for item in EMBEDDING_SPACE:
        sim = _cosine_sim(target_entry["vec"], item["vec"])
        neighbors.append({
            "word": item["word"],
            "cluster": item["cluster"],
            "label": item["label"],
            "x": item["x"],
            "y": item["y"],
            "similarity": sim,
        })
    neighbors.sort(key=lambda r: r["similarity"], reverse=True)

    # Phân tích cảm xúc câu đầu vào theo kiểu TF-IDF + Trọng số từ vựng UIT-VSFC
    seg_info = segment_and_tag(sample_sentence)
    segmented_words = [w.lower() for w in seg_info["words"]]

    pos_lex = {"nhiệt_tình": 1.4, "dễ_hiểu": 1.3, "giải_đáp": 1.0, "chi_tiết": 1.1, "thích": 1.2, "tốt": 1.1, "hiện_đại": 1.1, "tận_tâm": 1.3}
    neg_lex = {"yếu": -1.3, "chậm": -1.2, "treo": -1.4, "nhanh": -0.7, "chưa": -0.9, "khó": -1.2, "khó_hiểu": -1.4, "chậm_chạp": -1.3}

    score = 0.0
    matched_features: list[dict[str, Any]] = []
    for w in segmented_words:
        if w in pos_lex:
            score += pos_lex[w]
            matched_features.append({"feature": w, "weight": pos_lex[w], "polarity": "Positive"})
        elif w in neg_lex:
            score += neg_lex[w]
            matched_features.append({"feature": w, "weight": neg_lex[w], "polarity": "Negative"})

    if score > 0.4:
        pred_label = "Positive"
        probs = {"Positive": round(min(0.96, 0.65 + score * 0.12), 3), "Neutral": 0.08, "Negative": 0.04}
    elif score < -0.4:
        pred_label = "Negative"
        probs = {"Negative": round(min(0.95, 0.65 + abs(score) * 0.12), 3), "Neutral": 0.09, "Positive": 0.05}
    else:
        pred_label = "Neutral"
        probs = {"Neutral": 0.78, "Positive": 0.12, "Negative": 0.10}

    # Chuẩn hóa tổng xác suất = 1.0
    total_p = sum(probs.values())
    probs = {k: round(v / total_p, 3) for k, v in probs.items()}

    return {
        "target_word": target_key,
        "target_point": target_entry,
        "top_neighbors": neighbors[:6],
        "all_points": neighbors,
        "sentiment_analysis": {
            "input_sentence": sample_sentence,
            "segmented_sentence": seg_info["segmented_text"],
            "predicted_label": pred_label,
            "probabilities": probs,
            "matched_features": matched_features,
        },
    }


def compare_transformer_tokenizers(text: str) -> dict[str, Any]:
    """So sánh trực quan cách PhoBERT-base-v2, ViT5 và Qwen2.5/Sailor2 tokenize & gán nhãn NER."""
    seg_info = segment_and_tag(text)
    words = seg_info["words"]

    # 1. PhoBERT-base-v2: Bắt buộc tách từ nối '_' + Fairseq BPE (tách từ hiếm bằng '@@') + Subword Alignment
    phobert_subwords: list[str] = ["<s>"]
    subword_alignment: list[dict[str, Any]] = [
        {"subword": "<s>", "word_origin": "[CLS]", "ner_tag": "O", "loss_label_id": -100}
    ]

    entity_rules = {
        "viện_nghiên_cứu": ("B-ORGANIZATION", 1),
        "trí_tuệ_nhân_tạo": ("I-ORGANIZATION", 2),
        "vinai": ("B-ORGANIZATION", 1),
        "hà_nội": ("B-LOCATION", 3),
        "tp._hồ_chí_minh": ("B-LOCATION", 3),
        "bệnh_viện": ("B-LOCATION", 3),
        "chợ_rẫy": ("I-LOCATION", 4),
        "phobert": ("B-MISC", 5),
        "vit5": ("B-MISC", 5),
        "qwen": ("B-MISC", 5),
    }

    for w in words:
        w_lower = w.lower()
        ner_tag, label_id = entity_rules.get(w_lower, ("O", 0))
        # Mô phỏng chính xác hiện tượng BPE tách subword với hậu tố '@@' trên từ ghép dài hoặc tên riêng
        if len(w) >= 12 and "_" in w:
            parts = w.split("_")
            first_part = "_".join(parts[:-1]) + "_@@"
            second_part = parts[-1]
            phobert_subwords.extend([first_part, second_part])
            subword_alignment.append({
                "subword": first_part,
                "word_origin": w,
                "ner_tag": ner_tag,
                "loss_label_id": label_id,
            })
            subword_alignment.append({
                "subword": second_part,
                "word_origin": w,
                "ner_tag": f"(cont) {ner_tag}",
                "loss_label_id": -100,  # Masked in CrossEntropyLoss!
            })
        else:
            phobert_subwords.append(w)
            subword_alignment.append({
                "subword": w,
                "word_origin": w,
                "ner_tag": ner_tag,
                "loss_label_id": label_id,
            })

    phobert_subwords.append("</s>")
    subword_alignment.append(
        {"subword": "</s>", "word_origin": "[SEP]", "ner_tag": "O", "loss_label_id": -100}
    )

    # 2. VietAI/vit5-base: SentencePiece trực tiếp trên âm tiết tự nhiên (tiền tố '▁', không nối '_')
    cleaned_natural = seg_info["cleaned_text"]
    vit5_tokens = [f"▁{tok}" for tok in cleaned_natural.split()] + ["</s>"]

    # 3. Qwen2.5 / Sailor2: Byte-level BPE trên văn bản tự nhiên (ChatML format)
    qwen_tokens = ["<|im_start|>", "user", "\\n"] + cleaned_natural.split() + ["<|im_end|>"]

    return {
        "input_text": text,
        "cleaned_natural": cleaned_natural,
        "segmented_for_phobert": seg_info["segmented_text"],
        "phobert": {
            "model_name": "vinai/phobert-base-v2",
            "requires_word_segmentation": True,
            "max_length": 256,
            "tokens": phobert_subwords,
            "token_count": len(phobert_subwords),
            "subword_alignment": subword_alignment,
        },
        "vit5": {
            "model_name": "VietAI/vit5-base",
            "requires_word_segmentation": False,
            "max_length": 1024,
            "tokens": vit5_tokens,
            "token_count": len(vit5_tokens),
        },
        "qwen_sailor": {
            "model_name": "Qwen/Qwen2.5-7B-Instruct & Sailor2",
            "requires_word_segmentation": False,
            "max_length": 32768,
            "tokens": qwen_tokens,
            "token_count": len(qwen_tokens),
        },
    }


def simulate_agentic_rag(
    question: str,
    use_word_seg_bm25: bool = True,
    dense_weight: float = 0.6,
) -> dict[str, Any]:
    """Mô phỏng thực thi luồng LangGraph Agentic Hybrid RAG trên tập dữ liệu UIT-ViQuAD 2.0 & VietNews."""
    viquad_path = SAMPLES_DIR / "viquad_qa_sample.jsonl"
    vietnews_path = SAMPLES_DIR / "vietnews_summarization_sample.jsonl"

    kb_docs: list[dict[str, str]] = []
    if viquad_path.exists():
        with open(viquad_path, "r", encoding="utf-8") as f:
            for line in f:
                row = json.loads(line)
                kb_docs.append({
                    "id": row["id"],
                    "title": row["title"],
                    "content": row["context"],
                    "gold_answer": row["answers"]["text"][0],
                })
    if vietnews_path.exists():
        with open(vietnews_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f, 1):
                row = json.loads(line)
                kb_docs.append({
                    "id": f"vietnews_00{idx}",
                    "title": row["title"],
                    "content": row["article"],
                    "gold_answer": row["abstract"],
                })

    q_seg = segment_and_tag(question)
    q_tokens = (
        [w.lower() for w in q_seg["words"] if len(w) > 1]
        if use_word_seg_bm25
        else [w.lower() for w in q_seg["syllables"] if len(w) > 1]
    )

    scored_docs: list[dict[str, Any]] = []
    for doc in kb_docs:
        doc_seg = segment_and_tag(doc["content"])
        doc_tokens = (
            {w.lower() for w in doc_seg["words"]}
            if use_word_seg_bm25
            else {w.lower() for w in doc_seg["syllables"]}
        )

        # BM25 lexical overlap
        matched_terms = [t for t in q_tokens if t in doc_tokens]
        bm25_score = round(min(1.0, len(matched_terms) / max(1, len(q_tokens)) * 1.35), 3)

        # Dense semantic score (BGE-M3 / Halong Embedding simulation)
        semantic_keywords = {
            "viquad_001": ["khoảng_trắng", "âm_tiết", "tách_từ", "đơn_lập", "tiếng_việt", "học_sinh"],
            "viquad_002": ["phobert", "vncorenlp", "rdrsegmenter", "vinai", "tiền_xử_lý", "tokenizer", "tách_từ"],
            "vietnews_001": ["vit5", "vlsp", "tóm_tắt", "ura-hcmut", "phobert", "bước_tiến"],
            "vietnews_002": ["rag", "ảo_giác", "hallucination", "bm25", "bge-m3", "halong", "truy_xuất", "doanh_nghiệp"],
        }
        sem_hits = sum(
            1 for kw in semantic_keywords.get(doc["id"], []) if kw.replace("_", " ") in q_seg["cleaned_text"].lower() or kw in q_seg["segmented_text"].lower()
        )
        dense_score = round(min(0.98, 0.35 + sem_hits * 0.22 + bm25_score * 0.25), 3)

        hybrid_score = round(
            (1.0 - dense_weight) * bm25_score + dense_weight * dense_score, 3
        )
        scored_docs.append({
            **doc,
            "bm25_score": bm25_score,
            "dense_score": dense_score,
            "hybrid_score": hybrid_score,
            "matched_terms": matched_terms,
        })

    scored_docs.sort(key=lambda d: d["hybrid_score"], reverse=True)
    top_doc = scored_docs[0]
    is_relevant = top_doc["hybrid_score"] >= 0.42

    # Trace các bước của đồ thị LangGraph Agentic RAG
    langgraph_steps = [
        {
            "node": "1. Query Preprocessing & Word Segmentation",
            "status": "completed",
            "latency_ms": 4,
            "detail": (
                f"Chuẩn hóa NFC + Tách từ cho BM25: '{q_seg['segmented_text']}'"
                if use_word_seg_bm25
                else f"Chế độ Syllable (Không tách từ ghép): '{q_seg['cleaned_text']}'"
            ),
        },
        {
            "node": "2. Hybrid Retriever (BM25 + BGE-M3 Dense Vector)",
            "status": "completed",
            "latency_ms": 38,
            "detail": f"Top-1 Doc: [{top_doc['id']}] '{top_doc['title']}' (BM25={top_doc['bm25_score']}, Dense={top_doc['dense_score']}, Hybrid={top_doc['hybrid_score']})",
        },
        {
            "node": "3. Self-RAG Document Grader",
            "status": "passed" if is_relevant else "rewrite_triggered",
            "latency_ms": 52,
            "detail": (
                f"Tài liệu ĐẠT ngưỡng tin cậy (Hybrid Score {top_doc['hybrid_score']} >= 0.42). Chuyển thẳng tới Generator."
                if is_relevant
                else "Điểm liên quan thấp (< 0.42). Kích hoạt nhánh Query Rewriter để mở rộng từ khóa tiếng Việt."
            ),
        },
        {
            "node": "4. Answer Generator (Qwen2.5 / Gemini API)",
            "status": "completed",
            "latency_ms": 95,
            "detail": f"Sinh câu trả lời bám sát ngữ cảnh từ [{top_doc['id']}] (Không ảo giác).",
        },
    ]

    return {
        "question": question,
        "segmented_question": q_seg["segmented_text"],
        "use_word_seg_bm25": use_word_seg_bm25,
        "dense_weight": dense_weight,
        "is_relevant": is_relevant,
        "top_document": top_doc,
        "ranked_documents": scored_docs,
        "generated_answer": (
            f"{top_doc['gold_answer']} (Trích dẫn xác thực từ [{top_doc['id']} - {top_doc['title']}]: \"{top_doc['content'][:160]}...\")"
        ),
        "langgraph_trace": langgraph_steps,
    }


def evaluate_exercise(stage_id: int, payload: dict[str, Any]) -> dict[str, Any]:
    """Chấm điểm bài tập thực hành tương tác cho từng Giai đoạn (1 -> 4)."""
    if stage_id == 1:
        # Bài tập Giai đoạn 1: Chọn cấu hình chuẩn hóa văn bản đầu vào cho PhoBERT
        selected_unicode = payload.get("unicode_form", "")
        selected_tone = payload.get("tone_style", "")
        selected_seg = payload.get("word_segmentation", "")
        passed = (
            selected_unicode == "NFC"
            and selected_tone == "old"
            and selected_seg == "vncorenlp_underscore"
        )
        return {
            "stage_id": 1,
            "passed": passed,
            "score": 100 if passed else 40,
            "feedback": (
                "Xuất sắc! Bạn đã cấu hình chuẩn xác pipeline tiền xử lý cho PhoBERT: Unicode dựng sẵn (NFC) + Dấu thanh kiểu cũ (hòa, thủy) + Tách từ nối dấu gạch dưới (_)."
                if passed
                else "Chưa chính xác! Hãy nhớ: PhoBERT được huấn luyện trên văn bản Unicode dựng sẵn (NFC), dấu thanh kiểu cũ ('hòa', 'thủy') và bắt buộc tách từ bằng RDRSegmenter/VnCoreNLP (nối từ ghép bằng '_')."
            ),
        }

    if stage_id == 2:
        # Bài tập Giai đoạn 2: Phân biệt đặc trưng N-gram âm tiết vs N-gram từ ghép
        answer_tokens = payload.get("segmented_sentence", "").strip()
        passed = "học_sinh" in answer_tokens.lower() and "sinh_học" in answer_tokens.lower()
        return {
            "stage_id": 2,
            "passed": passed,
            "score": 100 if passed else 30,
            "feedback": (
                "Chính xác! Khi tách thành 'Học_sinh học sinh_học', TF-IDF và PhoW2V phân biệt rõ chủ ngữ 'Học_sinh' (student) và tân ngữ 'sinh_học' (biology)."
                if passed
                else "Gợi ý: Hãy nối các âm tiết của từ ghép bằng dấu gạch dưới '_' sao cho câu có chủ ngữ 'Học_sinh' và môn học 'sinh_học'."
            ),
        }

    if stage_id == 3:
        # Bài tập Giai đoạn 3: Subword Label Alignment cho PhoBERT NER
        first_sub_label = str(payload.get("first_subword_label", ""))
        second_sub_label = str(payload.get("second_subword_label", ""))
        passed = first_sub_label == "B-ORGANIZATION" and second_sub_label == "-100"
        return {
            "stage_id": 3,
            "passed": passed,
            "score": 100 if passed else 50,
            "feedback": (
                "Hoàn hảo! Subword đầu tiên ('Nghiên_@@') giữ nhãn thực thể gốc ('B-ORGANIZATION' / 'I-ORGANIZATION'), còn subword nối tiếp ('cứu') được gán -100 để CrossEntropyLoss bỏ qua."
                if passed
                else "Hãy kiểm tra lại: Trong bài toán Token Classification (NER), subword đầu tiên nhận nhãn thật ('B-ORGANIZATION'), còn các subword bị tách ra phía sau phải gán giá trị '-100'."
            ),
        }

    if stage_id == 4:
        # Bài tập Giai đoạn 4: Thiết kế Hybrid Agentic RAG Tiếng Việt
        bm25_seg = payload.get("bm25_use_seg", False)
        dense_model = payload.get("dense_model", "")
        self_rag_grader = payload.get("enable_grader", False)
        passed = bool(bm25_seg) and dense_model in ("bge-m3", "halong_embedding") and bool(self_rag_grader)
        return {
            "stage_id": 4,
            "passed": passed,
            "score": 100 if passed else 50,
            "feedback": (
                "Tuyệt vời! Hệ thống Hybrid Agentic RAG tiếng Việt tối ưu cần: BM25 có tách từ tiếng Việt + Dense Embedding đa ngữ/tiếng Việt (BGE-M3 / Halong) + Node chấm điểm tài liệu (Self-RAG Grader) để chống ảo giác."
                if passed
                else "Để đạt độ chính xác cao nhất trên tiếng Việt, hãy bật tách từ cho BM25, chọn mô hình BGE-M3 hoặc Halong Embedding, và bật Node kiểm định tài liệu (Document Grader)."
            ),
        }

    return {"stage_id": stage_id, "passed": False, "score": 0, "feedback": "Stage không hợp lệ."}
