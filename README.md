# Vietnamese NLP Mastery: Từ Tiền Xử Lý Tiếng Việt Đến Pretrained Transformers, LLM & Agentic RAG

[![CI Status](https://img.shields.io/github/actions/workflow/status/vietnamese-nlp-mastery/vietnamese-nlp-mastery/ci.yml?branch=main&label=CI%20Notebooks%20%26%20Tests)](.github/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Kho tài nguyên học tập, thực hành và benchmark toàn diện về **Xử lý Ngôn ngữ Tự nhiên Tiếng Việt (Vietnamese NLP)** — được thiết kế theo lộ trình 4 giai đoạn (6 tuần), kết hợp giữa **Awesome Vietnamese NLP List** và **End-to-End Practical Notebooks**.

---

## 1. Hệ Sinh Thái & Các Nguồn Cốt Lõi (Core Repositories & Ecosystem)

| Phân nhóm | Repository / Nguồn cốt lõi | Vai trò & Đặc điểm nổi bật |
| :--- | :--- | :--- |
| **Danh mục tổng hợp & Datasets** | [`undertheseanlp/vietnamese-nlp`](https://github.com/undertheseanlp/vietnamese-nlp)<br>[`magizbox/awesome-vietnamese-nlp`](https://github.com/magizbox/awesome-vietnamese-nlp) | Hai danh sách tổng hợp đầy đủ nhất về các bộ dữ liệu chuẩn (**VLSP**, **UIT-VSFC**, **UIT-ViQuAD**, **VietNews**), bảng xếp hạng SOTA và bài báo khoa học cho từng bài toán tiếng Việt. |
| **Tiền xử lý & Pipeline cơ bản** | [`undertheseanlp/underthesea`](https://github.com/undertheseanlp/underthesea)<br>[`vncorenlp/VnCoreNLP`](https://github.com/vncorenlp/VnCoreNLP)<br>[`trungtv/pyvi`](https://github.com/trungtv/pyvi) | Bộ công cụ cốt lõi xử lý đặc thù tiếng Việt: tách từ ghép (**Word Segmentation**), gán nhãn từ loại (**POS Tagging**), nhận diện thực thể (**NER**) và phân tích cú pháp phụ thuộc (**Dependency Parsing**). |
| **Pretrained Models & Transformer** | [`VinAIResearch/PhoBERT`](https://github.com/VinAIResearch/PhoBERT)<br>[`VinAIResearch/PhoNLP`](https://github.com/VinAIResearch/PhoNLP)<br>[`VietAI/vit5`](https://github.com/VietAI/vit5) | Các mô hình Encoder (`PhoBERT-base-v2`, `PhoNLP`) và Encoder-Decoder (`ViT5`) chuẩn mực nhất cho tiếng Việt để thực hành Fine-tuning phân loại văn bản, NER, dịch máy và tóm tắt văn bản. |
| **Kỷ nguyên LLM & Agentic RAG Tiếng Việt** | [`ura-hcmut`](https://huggingface.co/ura-hcmut) (ĐH Bách Khoa TP.HCM)<br>[`sail/Sailor2`](https://huggingface.co/sail) (SeaAI Lab)<br>[`Qwen/Qwen2.5`](https://huggingface.co/Qwen) & [`BAAI/bge-m3`](https://huggingface.co/BAAI/bge-m3) | Nguồn tài nguyên mã nguồn mở mạnh mẽ để thực hành **Instruction Tuning (LoRA/QLoRA)** và xây dựng hệ thống **Hybrid Agentic RAG** bằng **LangGraph** hoặc **Gemini API** trên dữ liệu tiếng Việt. |

---

## 2. Cấu Trúc Thư Mục (Repository Structure)

```text
vietnamese-nlp-mastery/
├── .github/workflows/
│   └── ci.yml                                           # CI/CD tự động lint code, kiểm tra schema notebook & chạy pytest
├── 01_Foundations_Preprocessing/
│   ├── vn_preprocessing.py                              # Module chuẩn hóa Unicode NFC/NFD, dấu thanh (hòa/hoà), teencode
│   ├── 01_unicode_normalization_and_cleaning.ipynb      # Thực hành chuẩn hóa Unicode dựng sẵn/tổ hợp & làm sạch dữ liệu
│   └── 02_word_segmentation_underthesea_vncorenlp.ipynb # So sánh tốc độ & độ chính xác tách từ: pyvi, underthesea, VnCoreNLP
├── 02_Classical_and_Embeddings/
│   └── 01_tfidf_word2vec_phow2v.ipynb                   # Biểu diễn văn bản với TF-IDF, Word2Vec và PhoW2V (VinAI)
├── 03_Pretrained_Transformers/
│   ├── 01_phobert_text_classification_uit_vsfc.ipynb    # Fine-tuning PhoBERT-base-v2 phân tích cảm xúc trên UIT-VSFC
│   ├── 02_phonlp_named_entity_recognition.ipynb         # Nhận diện thực thể (NER) với PhoNLP & Subword Alignment
│   └── 03_vit5_abstractive_summarization.ipynb          # Tóm tắt văn bản trừu tượng trên tập VietNews với VietAI/vit5
├── 04_Vietnamese_LLMs_and_Agents/
│   ├── 01_qlora_finetuning_qwen_vietnamese.ipynb        # Lượng tử hóa 4-bit (NF4) & QLoRA Fine-tuning Qwen2.5/Sailor2
│   └── 02_vietnamese_rag_langgraph_pipeline.ipynb       # Xây dựng Hybrid Agentic RAG (BM25 + BGE-M3 + LangGraph) trên ViQuAD
├── datasets/
│   ├── download_datasets.py                             # Script tải tự động các tập dữ liệu chuẩn (UIT-VSFC, ViQuAD, VietNews)
│   ├── samples/                                         # Dữ liệu mẫu JSONL sẵn sàng chạy offline tức thì
│   └── README.md                                        # Tài liệu chi tiết về các tập dữ liệu
├── tests/
│   └── test_vn_preprocessing.py                         # Unit tests kiểm chứng chuẩn hóa tiếng Việt & Web API
├── web/                                                 # Nền tảng Web Học tập Tương tác (Full-stack Python + Web UI)
│   ├── app.py                                           # FastAPI / Built-in HTTP Backend Server (http://localhost:8000)
│   ├── nlp_engine.py                                    # Core NLP Engine xử lý trực tiếp cho 4 Giai đoạn
│   └── static/                                          # Giao diện học tập (2D Embedding Canvas, SVG Diagrams, Quiz)
├── pyproject.toml                                       # Cấu hình quản lý package theo từng Giai đoạn & Ruff linter
├── requirements.txt                                     # Danh sách thư viện đầy đủ
└── README.md
```

---

## 3. Lộ Trình Thực Hành 4 Giai Đoạn & Danh Sách Notebooks

### Giai đoạn 1: Khởi tạo & Xử lý đặc thù Tiếng Việt (Tuần 1)
- **Bài 1.1**: [Chuẩn hóa Unicode (`NFC` vs `NFD`), dấu thanh (`hòa` vs `hoà`) & làm sạch văn bản](01_Foundations_Preprocessing/01_unicode_normalization_and_cleaning.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/01_Foundations_Preprocessing/01_unicode_normalization_and_cleaning.ipynb)
- **Bài 1.2**: [Tách từ Tiếng Việt (`pyvi`, `underthesea`, `VnCoreNLP`), POS Tagging & Dependency Parsing](01_Foundations_Preprocessing/02_word_segmentation_underthesea_vncorenlp.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/01_Foundations_Preprocessing/02_word_segmentation_underthesea_vncorenlp.ipynb)

### Giai đoạn 2: Biểu diễn văn bản & Fine-tuning PhoBERT / ViT5 (Tuần 2 - 3)
- **Bài 2.1**: [TF-IDF Baseline, Word2Vec & Pretrained `PhoW2V`](02_Classical_and_Embeddings/01_tfidf_word2vec_phow2v.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/02_Classical_and_Embeddings/01_tfidf_word2vec_phow2v.ipynb)
- **Bài 3.1**: [Fine-tuning `PhoBERT-base-v2` phân tích cảm xúc trên `UIT-VSFC`](03_Pretrained_Transformers/01_phobert_text_classification_uit_vsfc.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/03_Pretrained_Transformers/01_phobert_text_classification_uit_vsfc.ipynb)
- **Bài 3.2**: [Nhận diện thực thể có tên (NER) với `PhoNLP` & `PhoBERT`](03_Pretrained_Transformers/02_phonlp_named_entity_recognition.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/03_Pretrained_Transformers/02_phonlp_named_entity_recognition.ipynb)
- **Bài 3.3**: [Tóm tắt văn bản trừu tượng trên `VietNews` với `VietAI/vit5`](03_Pretrained_Transformers/03_vit5_abstractive_summarization.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/03_Pretrained_Transformers/03_vit5_abstractive_summarization.ipynb)

### Giai đoạn 3: LLM Tiếng Việt, QLoRA Fine-tuning & Agentic RAG (Tuần 4 - 5)
- **Bài 4.1**: [Lượng tử hóa 4-bit & QLoRA Fine-tuning `Qwen2.5` / `Sailor2` trên hội thoại Tiếng Việt](04_Vietnamese_LLMs_and_Agents/01_qlora_finetuning_qwen_vietnamese.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/04_Vietnamese_LLMs_and_Agents/01_qlora_finetuning_qwen_vietnamese.ipynb)
- **Bài 4.2**: [Xây dựng hệ thống Agentic RAG Tiếng Việt với `LangGraph` & Hybrid Search trên `ViQuAD`](04_Vietnamese_LLMs_and_Agents/02_vietnamese_rag_langgraph_pipeline.ipynb)
  [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vietnamese-nlp-mastery/vietnamese-nlp-mastery/blob/main/04_Vietnamese_LLMs_and_Agents/02_vietnamese_rag_langgraph_pipeline.ipynb)

---

## 4. Bảng Tổng Hợp Kết Quả Thực Nghiệm & Benchmark Tham Chiếu (Giai đoạn 4)

| Giai đoạn | Bài toán & Tập dữ liệu | Mô hình / Công cụ | Yêu cầu tách từ (`_`) | Metric chính | Kết quả tham chiếu | VRAM tiêu thụ | Thời gian chạy (T4 / RTX 3090) |
| :---: | :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **01** | Word Segmentation (VLSP 2013) | `pyvi` / `underthesea` / `VnCoreNLP` | — | F1-score / Speed | **97.9% F1** (`VnCoreNLP`) | CPU (~500MB RAM) | ~12,000 - 15,000 câu/giây |
| **02** | Sentiment Analysis (`UIT-VSFC`) | `TF-IDF (1,2-gram)` + `LinearSVC` | **Có** | Macro-F1 | ~89.4% | CPU (<1GB RAM) | ~3 giây (Full train) |
| **03** | Sentiment Analysis (`UIT-VSFC`) | `vinai/phobert-base-v2` | **Bắt buộc Có** | Macro-F1 | **~93.8%** | ~4.5 GB VRAM (FP16) | ~8 phút (4 epochs) |
| **03** | Named Entity Recognition (`PhoNER`) | `PhoBERT-base-v2` / `PhoNLP` | **Bắt buộc Có** | Entity Macro-F1 | **~94.2%** | ~5.0 GB VRAM (FP16) | ~10 phút (5 epochs) |
| **03** | Summarization (`VietNews`) | `VietAI/vit5-base` | **Không** | ROUGE-L | **~41.8** | ~10.5 GB VRAM (FP16) | ~45 phút / epoch |
| **04** | Instruction Tuning (VN Chat) | `Qwen2.5-7B-Instruct` (QLoRA 4-bit) | **Không** | Eval Loss / MT-Bench VN | ~7.8 / 10 | ~10.0 GB VRAM (NF4) | ~35 phút (1,000 mẫu) |
| **04** | Agentic RAG (`UIT-ViQuAD 2.0`) | `BM25 (pyvi)` + `BGE-M3` + `LangGraph` | BM25: **Có** / Dense: **Không** | Recall@5 / EM | **~91.5% Recall@5** | ~3.5 GB VRAM (Embedding) | ~180 ms / truy vấn |

---

## 5. Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh (Quickstart)

### Bước 1: Clone repo và cài đặt môi trường
Bạn có thể cài đặt từng phần theo giai đoạn học tập để tránh xung đột thư viện và tiết kiệm dung lượng:

```bash
# Cài đặt Giai đoạn 1 & 2 (Tiền xử lý, Tách từ, TF-IDF, Word2Vec)
pip install -e ".[foundations,embeddings,dev]"

# Cài đặt Giai đoạn 3 (PhoBERT, PhoNLP, ViT5)
pip install -e ".[transformers]"

# Cài đặt Giai đoạn 4 (QLoRA LLM & LangGraph Agentic RAG)
pip install -e ".[llm_rag]"
```

### Bước 2: Khởi tạo dữ liệu mẫu hoặc tải trọn bộ dữ liệu
```bash
# Tạo nhanh 4 tập dữ liệu mẫu offline trong datasets/samples/ (chạy xong trong 1 giây)
python datasets/download_datasets.py --mode sample

# Hoặc tải trọn bộ dữ liệu từ Hugging Face Hub về datasets/raw/
python datasets/download_datasets.py --mode full --dataset uit_vsfc
```

### Bước 3: Khởi chạy Nền tảng Web Học tập Tương tác (Interactive Web Platform)
```bash
python web/app.py --port 8000
```
Mở trình duyệt tại **`http://localhost:8000`** để trải nghiệm:
- **Hình minh họa động (SVG & 2D Canvas)**: So sánh byte-level `NFC` vs `NFD`, không gian Vector 2D `PhoW2V` tương tác click chọn điểm tính $\cos(\theta)$, kiến trúc Subword Alignment `PhoBERT` vs `ViT5`, và luồng `LangGraph Agentic RAG`.
- **Phòng thí nghiệm Live Sandbox**: Gọi trực tiếp vào Python Backend để chuẩn hóa tiếng Việt, tách từ, phân loại cảm xúc `UIT-VSFC`, tính toán VRAM `QLoRA` và chạy thử `Hybrid RAG` trên `UIT-ViQuAD 2.0`.
- **Bài tập Thực hành & Quiz lưu tiến độ**: Chấm điểm tự động và tích lũy XP cho cả 4 Giai đoạn.

### Bước 4: Chạy kiểm thử tự động (Unit Tests & Notebook Validation)
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```
