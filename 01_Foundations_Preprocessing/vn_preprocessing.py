"""Các hàm cốt lõi xử lý đặc thù văn bản Tiếng Việt (Giai đoạn 1).

Bao gồm:
1. Chuẩn hóa Unicode (NFC vs NFD) và loại bỏ ký tự điều khiển ẩn (Zero-width space).
2. Chuẩn hóa vị trí dấu thanh Tiếng Việt (Kiểu cũ: 'hòa, khỏe, thủy' <-> Kiểu mới: 'hoà, khoẻ, thuỷ').
   - Lưu ý đặc biệt: PhoBERT và VnCoreNLP được huấn luyện chủ yếu trên quy tắc dấu thanh kiểu cũ ('hòa', 'thủy').
3. Giải mã Teencode / Từ viết tắt phổ biến trong bình luận mạng xã hội & phản hồi sinh viên (UIT-VSFC).
4. Pipeline làm sạch văn bản tổng hợp.
"""

from __future__ import annotations

import re
import unicodedata

# Bảng ánh xạ chuẩn hóa dấu thanh giữa Kiểu Mới (hoà, khoẻ, thuỷ) và Kiểu Cũ (hòa, khỏe, thủy)
# Áp dụng khi các nguyên âm đôi (oa, oe, uy) đứng cuối âm tiết (không có phụ âm cuối).
NEW_TO_OLD_TONE_MAP: dict[str, str] = {
    # oa
    "oà": "òa",
    "oá": "óa",
    "oả": "ỏa",
    "oã": "õa",
    "oạ": "ọa",
    "Oà": "Òa",
    "Oá": "Óa",
    "Oả": "Ỏa",
    "Oã": "Õa",
    "Oạ": "Ọa",
    # oe
    "oè": "òe",
    "oé": "óe",
    "oẻ": "ỏe",
    "oẽ": "õe",
    "oẹ": "ọe",
    "Oè": "Òe",
    "Oé": "Óe",
    "Oẻ": "Ỏe",
    "Oẽ": "Õe",
    "Oẹ": "Ọe",
    # uy (trừ trường hợp đứng sau 'q' như 'quý, quyển' luôn đặt dấu ở 'y')
    "uỳ": "ùy",
    "uý": "úy",
    "uỷ": "ủy",
    "uỹ": "ũy",
    "uỵ": "ụy",
    "Uỳ": "Ùy",
    "Uý": "Úy",
    "Uỷ": "Ủy",
    "Uỹ": "Ũy",
    "Uỵ": "Ụy",
}

OLD_TO_NEW_TONE_MAP: dict[str, str] = {v: k for k, v in NEW_TO_OLD_TONE_MAP.items()}

# Từ điển Teencode & viết tắt phổ biến trong tiếng Việt (đặc biệt hữu ích cho UIT-VSFC & Social NLP)
DEFAULT_TEENCODE_DICT: dict[str, str] = {
    "ko": "không",
    "k": "không",
    "kh": "không",
    "hok": "không",
    "dc": "được",
    "đc": "được",
    "vs": "với",
    "mik": "mình",
    "mk": "mình",
    "뇨": "nhỏ",
    "ntn": "như thế nào",
    "j": "gì",
    "trc": "trước",
    "gv": "giảng viên",
    "sv": "sinh viên",
    "bt": "bài tập",
    "th": "thực hành",
    "lt": "lý thuyết",
    "cntt": "công nghệ thông tin",
}

# Biểu thức chính quy loại bỏ ký tự ẩn (Zero-width spaces, BOM, byte rác)
ZERO_WIDTH_PATTERN = re.compile(r"[\u200b\u200c\u200d\ufeff\u2060]")
MULTI_SPACE_PATTERN = re.compile(r"\s+")


def normalize_unicode(text: str, form: str = "NFC") -> str:
    """Chuẩn hóa bảng mã Unicode (mặc định về NFC - Unicode dựng sẵn) và xóa ký tự ẩn.

    Tại sao cần NFC?
    - Văn bản tiếng Việt copy từ PDF, macOS hoặc một số bộ gõ có thể ở dạng NFD (Unicode tổ hợp),
      ví dụ chữ 'ệ' gồm 'ê' + dấu nặng rời ('\\u0323').
    - Nếu không đưa về NFC, chiều dài chuỗi sẽ sai lệch và Tokenizer của PhoBERT/LLM sẽ tách sai từ.
    """
    if not text:
        return ""
    cleaned = ZERO_WIDTH_PATTERN.sub("", text)
    return unicodedata.normalize(form, cleaned)


def normalize_vietnamese_tone(text: str, style: str = "old") -> str:
    """Chuẩn hóa vị trí đặt dấu thanh tiếng Việt cho các vần oa, oe, uy ở cuối âm tiết.

    Args:
        text: Chuỗi văn bản đầu vào (sẽ được tự động chuẩn hóa NFC trước).
        style:
            - 'old' (mặc định, khuyên dùng cho PhoBERT / VnCoreNLP): 'hòa bình', 'thủy lợi', 'khỏe mạnh'.
            - 'new' (quy chuẩn Bộ GD&ĐT mới): 'hoà bình', 'thuỷ lợi', 'khoẻ mạnh'.
    """
    text = normalize_unicode(text, "NFC")
    if style not in ("old", "new"):
        raise ValueError("style phải là 'old' hoặc 'new'")

    mapping = NEW_TO_OLD_TONE_MAP if style == "old" else OLD_TO_NEW_TONE_MAP

    # Duyệt từng từ để xử lý ngoại lệ chữ 'qu' (như 'quý', 'quỷ' luôn đặt dấu trên 'y')
    def _replace_word(match: re.Match[str]) -> str:
        word = match.group(0)
        lower_word = word.lower()
        # Nếu bắt đầu bằng 'qu' + y mang dấu thanh (như quý, quỷ, quỳ...) thì giữ nguyên dấu trên 'y'
        if style == "old" and lower_word.startswith("qu"):
            return word
        for src, dst in mapping.items():
            if word.endswith(src):
                return word[: -len(src)] + dst
        return word

    return re.sub(r"[^\W\d_]+", _replace_word, text, flags=re.UNICODE)


def normalize_teencode(
    text: str, custom_dict: dict[str, str] | None = None
) -> str:
    """Thay thế các từ viết tắt / teencode phổ biến bằng từ tiếng Việt chuẩn."""
    mapping = {**DEFAULT_TEENCODE_DICT, **(custom_dict or {})}
    tokens = text.split()
    normalized_tokens: list[str] = []
    for token in tokens:
        # Tách dấu câu ở đầu/cuối từ để tra cứu chính xác
        match = re.match(r"^([^\w]*)([\w]+)([^\w]*)$", token, flags=re.UNICODE)
        if match:
            prefix, core, suffix = match.groups()
            replacement = mapping.get(core.lower(), core)
            normalized_tokens.append(f"{prefix}{replacement}{suffix}")
        else:
            normalized_tokens.append(token)
    return " ".join(normalized_tokens)


def clean_vietnamese_text(
    text: str,
    tone_style: str = "old",
    expand_teencode: bool = True,
    lowercase: bool = False,
) -> str:
    """Pipeline chuẩn hóa văn bản tiếng Việt hoàn chỉnh trước khi đưa vào tách từ / mô hình."""
    text = normalize_unicode(text, "NFC")
    if expand_teencode:
        text = normalize_teencode(text)
    text = normalize_vietnamese_tone(text, style=tone_style)
    text = MULTI_SPACE_PATTERN.sub(" ", text).strip()
    if lowercase:
        text = text.lower()
    return text
