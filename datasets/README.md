# Bộ Dữ Liệu Chuẩn Tiếng Việt (Vietnamese NLP Datasets)

Thư mục này chứa script tự động hóa việc khởi tạo dữ liệu mẫu (`samples/`) và tải dữ liệu đầy đủ (`raw/`) cho toàn bộ lộ trình thực hành.

## 1. Các Bộ Dữ Liệu Cốt Lõi

| Dataset | Bài toán (Task) | Nguồn gốc | Số lượng mẫu | Định dạng sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **UIT-VSFC** | Sentiment Analysis & Topic Classification | UIT NLP Group | 16,175 câu | Văn bản phản hồi sinh viên (3 nhãn cảm xúc, 4 nhãn chủ đề) |
| **PhoNER_COVID19 / VLSP** | Named Entity Recognition (NER) | VinAI Research / VLSP | 10,027 câu | Gán nhãn thực thể mức từ (Word-level IOB2) |
| **UIT-ViQuAD 2.0** | Question Answering & RAG | UIT NLP Group | 23,000+ câu hỏi | Đoạn văn Wikipedia + Câu hỏi + Vị trí câu trả lời |
| **VietNews** | Abstractive Summarization | VietAI / Cộng đồng | 105,000+ bài báo | Tiêu đề + Tóm tắt (Abstract) + Nội dung bài báo |

## 2. Hướng Dẫn Sử Dụng

### Khởi tạo nhanh bộ dữ liệu mẫu (Offline - Không cần chờ tải)
```bash
python datasets/download_datasets.py --mode sample
```
Lệnh này sinh ra 4 file `.jsonl` chuẩn trong `datasets/samples/` để bạn có thể chạy thử ngay mọi Notebook trong repo từ Giai đoạn 1 đến Giai đoạn 3.

### Tải trọn bộ dữ liệu từ Hugging Face Hub
```bash
# Tải riêng tập UIT-VSFC cho bài toán phân loại cảm xúc với PhoBERT
python datasets/download_datasets.py --mode full --dataset uit_vsfc

# Hoặc tải toàn bộ các tập dữ liệu
python datasets/download_datasets.py --mode full --dataset all
```
