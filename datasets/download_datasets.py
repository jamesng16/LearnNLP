"""Script tải và chuẩn hóa các bộ dữ liệu chuẩn cho NLP Tiếng Việt.

Hỗ trợ:
1. Chế độ `--mode sample` (mặc định nhanh): Sinh dữ liệu mẫu chuẩn xác tại `datasets/samples/`
   để chạy thử nhanh toàn bộ pipeline mà không cần chờ tải hàng GB dữ liệu.
2. Chế độ `--mode full`: Tải trọn bộ dữ liệu từ Hugging Face Hub về `datasets/raw/`
   cho các tập dữ liệu kinh điển:
   - UIT-VSFC (Phân tích cảm xúc phản hồi sinh viên)
   - UIT-ViQuAD 2.0 (Hỏi đáp đọc hiểu máy tiếng Việt - dùng cho RAG & QA)
   - VietNews (Tóm tắt văn bản tiếng Việt - dùng cho ViT5)
   - VLSP-NER Sample / PhoNER_COVID19 (Nhận diện thực thể có tên tiếng Việt)

Cách dùng:
    python datasets/download_datasets.py --mode sample
    python datasets/download_datasets.py --mode full --dataset uit_vsfc
    python datasets/download_datasets.py --mode full --dataset all
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent
SAMPLES_DIR = BASE_DIR / "samples"
RAW_DIR = BASE_DIR / "raw"

# Danh mục Hugging Face Hub IDs tương ứng với các tập dữ liệu chuẩn tiếng Việt
HF_DATASET_REGISTRY: dict[str, dict[str, str]] = {
    "uit_vsfc": {
        "hf_id": "ura-hcmut/UIT-VSFC",
        "fallback_hf_id": "uitnlp/vietnamese_students_feedback",
        "task": "Sentiment Analysis & Topic Classification",
        "description": "16,000+ câu phản hồi của sinh viên Việt Nam (Positive/Neutral/Negative).",
    },
    "phoner_covid19": {
        "hf_id": "vinai/phoner_covid19",
        "fallback_hf_id": "vinai/phoner_covid19",
        "task": "Named Entity Recognition (NER)",
        "description": "Bộ dữ liệu NER tiếng Việt chuẩn của VinAI Research với 10 loại thực thể.",
    },
    "viquad": {
        "hf_id": "taidng/UIT-ViQuAD2.0",
        "fallback_hf_id": "uitnlp/viquad2.0",
        "task": "Extractive Question Answering & RAG Evaluation",
        "description": "23,000+ cặp câu hỏi - đoạn văn trích từ Wikipedia tiếng Việt.",
    },
    "vietnews": {
        "hf_id": "vietgpt/vietnews",
        "fallback_hf_id": "bkai-foundation-models/vietnews-abstractive-summarization",
        "task": "Abstractive Text Summarization",
        "description": "hơn 100,000 bài báo tiếng Việt kèm tóm tắt chuẩn cho huấn luyện ViT5.",
    },
}


def generate_offline_samples(output_dir: Path = SAMPLES_DIR) -> dict[str, Path]:
    """Tạo các tập dữ liệu mẫu (JSONL) chuẩn hóa để chạy nhanh các Notebook và CI tests."""
    output_dir.mkdir(parents=True, exist_ok=True)
    created_files: dict[str, Path] = {}

    # 1. UIT-VSFC sample (Sentiment: 0=Negative, 1=Neutral, 2=Positive)
    uit_vsfc_samples: list[dict[str, Any]] = [
        {
            "sentence": "Giảng viên dạy rất nhiệt tình, dễ hiểu và luôn giải đáp thắc mắc cho sinh viên.",
            "sentiment": 2,
            "sentiment_label": "Positive",
            "topic": 0,
            "topic_label": "Lecturer",
        },
        {
            "sentence": "Tài liệu môn học xử lý ngôn ngữ tự nhiên rất chi tiết, bám sát thực tế.",
            "sentiment": 2,
            "sentiment_label": "Positive",
            "topic": 1,
            "topic_label": "Curriculum",
        },
        {
            "sentence": "Phòng máy tính cấu hình hơi yếu, chạy mô hình học sâu rất chậm và hay bị treo.",
            "sentiment": 0,
            "sentiment_label": "Negative",
            "topic": 2,
            "topic_label": "Facility",
        },
        {
            "sentence": "Thầy giảng bài hơi nhanh, phần bài tập lớn chưa có hướng dẫn cụ thể.",
            "sentiment": 0,
            "sentiment_label": "Negative",
            "topic": 0,
            "topic_label": "Lecturer",
        },
        {
            "sentence": "Môn học kéo dài trong 15 tuần với 3 tín chỉ lý thuyết và 1 tín chỉ thực hành.",
            "sentiment": 1,
            "sentiment_label": "Neutral",
            "topic": 1,
            "topic_label": "Curriculum",
        },
        {
            "sentence": "Cần bổ sung thêm các bài thực hành về mô hình ngôn ngữ lớn và hệ thống truy xuất.",
            "sentiment": 1,
            "sentiment_label": "Neutral",
            "topic": 1,
            "topic_label": "Curriculum",
        },
    ]
    vsfc_path = output_dir / "uit_vsfc_sample.jsonl"
    _write_jsonl(vsfc_path, uit_vsfc_samples)
    created_files["uit_vsfc"] = vsfc_path

    # 2. NER Sample (PhoNER / VLSP style - Word-level IOB2 tags)
    ner_samples: list[dict[str, Any]] = [
        {
            "words": [
                "Viện",
                "Nghiên_cứu",
                "Trí_tuệ",
                "Nhân_tạo",
                "VinAI",
                "tại",
                "Hà_Nội",
                "vừa",
                "công_bố",
                "mô_hình",
                "PhoBERT",
                ".",
            ],
            "tags": [
                "B-ORGANIZATION",
                "I-ORGANIZATION",
                "I-ORGANIZATION",
                "I-ORGANIZATION",
                "I-ORGANIZATION",
                "O",
                "B-LOCATION",
                "O",
                "O",
                "O",
                "B-MISC",
                "O",
            ],
        },
        {
            "words": [
                "Bệnh_nhân",
                "Nguyễn_Văn_A",
                "(",
                "45",
                "tuổi",
                ")",
                "điều_trị",
                "tại",
                "Bệnh_viện",
                "Chợ_Rẫy",
                ",",
                "TP._Hồ_Chí_Minh",
                ".",
            ],
            "tags": [
                "O",
                "B-NAME",
                "O",
                "B-AGE",
                "O",
                "O",
                "O",
                "O",
                "B-LOCATION",
                "I-LOCATION",
                "O",
                "B-LOCATION",
                "O",
            ],
        },
    ]
    ner_path = output_dir / "ner_vlsp_phoner_sample.jsonl"
    _write_jsonl(ner_path, ner_samples)
    created_files["phoner_covid19"] = ner_path

    # 3. VietNews Summarization Sample (for ViT5)
    vietnews_samples: list[dict[str, Any]] = [
        {
            "title": "Bước tiến mới của xử lý ngôn ngữ tự nhiên tiếng Việt",
            "abstract": "Các mô hình tiền huấn luyện như PhoBERT, ViT5 và các LLM mã nguồn mở đã giúp cải thiện vượt bậc chất lượng phân tích văn bản tiếng Việt.",
            "article": (
                "Trong những năm gần đây, lĩnh vực xử lý ngôn ngữ tự nhiên (NLP) tiếng Việt đã chứng kiến "
                "sự phát triển mạnh mẽ nhờ nguồn dữ liệu mở từ cộng đồng VLSP, UIT NLP và các viện nghiên cứu. "
                "Trước đây, các bài toán như phân loại văn bản hay nhận diện thực thể phụ thuộc nhiều vào kỹ thuật "
                "trích xuất đặc trưng thủ công như TF-IDF kết hợp với SVM. Sự ra đời của PhoBERT (VinAI Research) "
                "và ViT5 (VietAI) đã thiết lập các kỷ lục mới trên hầu hết các thước đo chuẩn. Tiếp nối làn sóng đó, "
                "các nhóm nghiên cứu như URA-HCMUT và SeaAI Lab tiếp tục đóng góp các mô hình ngôn ngữ lớn (LLM) "
                "tối ưu riêng cho đặc thù văn hóa và ngôn ngữ Việt Nam."
            ),
        },
        {
            "title": "Ứng dụng kiến trúc RAG trong trợ lý ảo doanh nghiệp tại Việt Nam",
            "abstract": "Kết hợp truy xuất thông tin ngữ nghĩa (RAG) với mô hình ngôn ngữ lớn giúp giảm thiểu hiện tượng ảo giác khi trả lời câu hỏi chuyên ngành.",
            "article": (
                "Một trong những thách thức lớn nhất khi triển khai mô hình ngôn ngữ lớn (LLM) vào doanh nghiệp "
                "là hiện tượng ảo giác (hallucination) và thông tin lỗi thời. Kiến trúc Retrieval-Augmented Generation (RAG) "
                "giải quyết vấn đề này bằng cách kết hợp tìm kiếm từ khóa (BM25 có tách từ tiếng Việt) và tìm kiếm vector "
                "ngữ nghĩa (Dense Embedding như BGE-M3 hoặc Halong Embedding) để cung cấp ngữ cảnh xác thực cho mô hình "
                "trước khi sinh câu trả lời."
            ),
        },
    ]
    vietnews_path = output_dir / "vietnews_summarization_sample.jsonl"
    _write_jsonl(vietnews_path, vietnews_samples)
    created_files["vietnews"] = vietnews_path

    # 4. ViQuAD Sample (for Vietnamese RAG & QA)
    viquad_samples: list[dict[str, Any]] = [
        {
            "id": "viquad_001",
            "title": "Xử lý ngôn ngữ tự nhiên tiếng Việt",
            "context": (
                "Tiếng Việt là một ngôn ngữ đơn lập và phân tích tính, trong đó ranh giới giữa các từ không được "
                "phân tách tự nhiên bằng khoảng trắng. Khoảng trắng trong tiếng Việt dùng để phân tách các âm tiết "
                "(hay còn gọi là tiếng), ví dụ từ ghép 'học_sinh' gồm hai âm tiết 'học' và 'sinh'. Do đó, bài toán "
                "tách từ (Word Segmentation) đóng vai trò là bước tiền xử lý quan trọng cho nhiều mô hình như PhoBERT "
                "hoặc tìm kiếm từ khóa BM25."
            ),
            "question": "Tại sao khoảng trắng trong tiếng Việt không trực tiếp phân tách từ như tiếng Anh?",
            "answers": {
                "text": ["Khoảng trắng trong tiếng Việt dùng để phân tách các âm tiết (hay còn gọi là tiếng)"],
                "answer_start": [117],
            },
        },
        {
            "id": "viquad_002",
            "title": "Mô hình PhoBERT",
            "context": (
                "PhoBERT là mô hình ngôn ngữ tiền huấn luyện quy mô lớn đầu tiên dành riêng cho tiếng Việt do "
                "VinAI Research phát triển vào năm 2020. PhoBERT có hai phiên bản chính là PhoBERT-base (135 triệu tham số) "
                "và PhoBERT-large (370 triệu tham số), được huấn luyện dựa trên kiến trúc RoBERTa trên tập dữ liệu "
                "20GB văn bản tiếng Việt đã được tách từ bằng RDRSegmenter (VnCoreNLP)."
            ),
            "question": "Dữ liệu đầu vào của mô hình PhoBERT cần được tiền xử lý bằng công cụ nào trước khi đưa vào tokenizer?",
            "answers": {
                "text": ["RDRSegmenter (VnCoreNLP)"],
                "answer_start": [315],
            },
        },
    ]
    viquad_path = output_dir / "viquad_qa_sample.jsonl"
    _write_jsonl(viquad_path, viquad_samples)
    created_files["viquad"] = viquad_path

    return created_files


def _write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for row in records:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def download_from_huggingface(dataset_key: str, output_dir: Path = RAW_DIR) -> None:
    """Tải tập dữ liệu đầy đủ từ Hugging Face Hub."""
    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise RuntimeError(
            "Vui lòng cài đặt thư viện `datasets`: pip install datasets"
        ) from exc

    if dataset_key not in HF_DATASET_REGISTRY:
        raise ValueError(
            f"Dataset '{dataset_key}' không hợp lệ. Chọn một trong: {list(HF_DATASET_REGISTRY.keys())}"
        )

    meta = HF_DATASET_REGISTRY[dataset_key]
    target_dir = output_dir / dataset_key
    target_dir.mkdir(parents=True, exist_ok=True)

    for hf_id in (meta["hf_id"], meta["fallback_hf_id"]):
        try:
            print(f"[INFO] Đang tải '{dataset_key}' từ Hugging Face Hub ({hf_id})...")
            ds = load_dataset(hf_id)
            ds.save_to_disk(str(target_dir))
            print(f"[SUCCESS] Đã lưu '{dataset_key}' tại: {target_dir}")
            return
        except Exception as err:
            print(f"[WARN] Không thể tải từ {hf_id}: {err}")

    print(
        f"[FALLBACK] Chuyển sang tạo dữ liệu mẫu offline cho '{dataset_key}' tại {SAMPLES_DIR}"
    )
    generate_offline_samples(SAMPLES_DIR)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Công cụ tải và khởi tạo dữ liệu chuẩn cho Vietnamese NLP Mastery."
    )
    parser.add_argument(
        "--mode",
        choices=["sample", "full"],
        default="sample",
        help="Chế độ tải: 'sample' (tạo dữ liệu mẫu offline tức thì) hoặc 'full' (tải từ Hugging Face).",
    )
    parser.add_argument(
        "--dataset",
        choices=[*HF_DATASET_REGISTRY.keys(), "all"],
        default="all",
        help="Tên tập dữ liệu cần tải khi ở chế độ 'full'.",
    )
    args = parser.parse_args()

    # Luôn đảm bảo bộ sample offline tồn tại
    created = generate_offline_samples(SAMPLES_DIR)
    print(f"[OK] Đã khởi tạo {len(created)} tập dữ liệu mẫu tại: {SAMPLES_DIR}")
    for name, path in created.items():
        print(f"  - {name}: {path.name}")

    if args.mode == "full":
        keys = (
            list(HF_DATASET_REGISTRY.keys())
            if args.dataset == "all"
            else [args.dataset]
        )
        for key in keys:
            download_from_huggingface(key, RAW_DIR)


if __name__ == "__main__":
    main()
