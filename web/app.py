"""Full-Stack Backend Server cho nền tảng Web Học tập Thực hành Vietnamese NLP Mastery.

Hỗ trợ 2 chế độ chạy tự động:
1. Chế độ FastAPI + Uvicorn (khi đã cài `pip install fastapi uvicorn`).
2. Chế độ Zero-Dependency Python HTTP Server tích hợp sẵn (chạy ngay lập tức bằng `python web/app.py`
   với đầy đủ mọi REST API `/api/*` kể cả khi chưa cài thêm package ngoài).

Khởi chạy:
    python web/app.py --port 8000
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

WEB_DIR = Path(__file__).resolve().parent
STATIC_DIR = WEB_DIR / "static"
sys.path.insert(0, str(WEB_DIR))

from nlp_engine import (  # noqa: E402
    EMBEDDING_SPACE,
    compare_transformer_tokenizers,
    evaluate_exercise,
    explore_embeddings_and_classify,
    inspect_and_preprocess,
    segment_and_tag,
    simulate_agentic_rag,
)


def handle_api_request(path: str, method: str, body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """Router xử lý chung cho cả FastAPI và Built-in HTTP Server."""
    if path == "/api/status" and method == "GET":
        return 200, {
            "status": "ok",
            "project": "Vietnamese NLP Mastery Interactive Web Lab",
            "stages": 4,
            "embedding_vocab_size": len(EMBEDDING_SPACE),
        }

    if path == "/api/preprocess" and method == "POST":
        res = inspect_and_preprocess(
            text=body.get(
                "text",
                "GV\u200b dạy rất nhiệt tình, ko hiểu chỗ nào đều đc giải đáp vs thái độ hoà nhã.",
            ),
            tone_style=body.get("tone_style", "old"),
            expand_teencode=bool(body.get("expand_teencode", True)),
            lowercase=bool(body.get("lowercase", False)),
        )
        return 200, res

    if path == "/api/segment" and method == "POST":
        res = segment_and_tag(
            text=body.get(
                "text",
                "Viện Nghiên cứu Trí tuệ Nhân tạo VinAI tại Hà Nội vừa công bố mô hình PhoBERT.",
            )
        )
        return 200, res

    if path == "/api/embedding" and method == "POST":
        res = explore_embeddings_and_classify(
            target_word=body.get("target_word", "giảng_viên"),
            sample_sentence=body.get(
                "sample_sentence",
                "Giảng viên dạy rất nhiệt tình, dễ hiểu và luôn giải đáp thắc mắc cho sinh viên.",
            ),
        )
        return 200, res

    if path == "/api/tokenize-compare" and method == "POST":
        res = compare_transformer_tokenizers(
            text=body.get(
                "text",
                "Viện Nghiên cứu Trí tuệ Nhân tạo VinAI tại Hà Nội vừa công bố mô hình PhoBERT.",
            )
        )
        return 200, res

    if path == "/api/rag-simulate" and method == "POST":
        res = simulate_agentic_rag(
            question=body.get(
                "question",
                "Dữ liệu đầu vào của mô hình PhoBERT cần được tiền xử lý bằng công cụ tách từ nào?",
            ),
            use_word_seg_bm25=bool(body.get("use_word_seg_bm25", True)),
            dense_weight=float(body.get("dense_weight", 0.6)),
        )
        return 200, res

    if path == "/api/evaluate-exercise" and method == "POST":
        stage_id = int(body.get("stage_id", 1))
        payload = body.get("payload", {})
        res = evaluate_exercise(stage_id, payload)
        return 200, res

    return 404, {"error": f"Endpoint không tồn tại: {method} {path}"}


# ==============================================================================
# FastAPI Integration (nếu môi trường có cài đặt fastapi)
# ==============================================================================
try:
    from fastapi import FastAPI, Request
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles

    app = FastAPI(
        title="Vietnamese NLP Mastery — Interactive Learning Platform",
        version="1.0.0",
    )

    @app.get("/api/status")
    async def api_status() -> JSONResponse:
        code, data = handle_api_request("/api/status", "GET", {})
        return JSONResponse(content=data, status_code=code)

    @app.post("/api/{endpoint_name}")
    async def api_post_dispatcher(endpoint_name: str, request: Request) -> JSONResponse:
        body = await request.json()
        code, data = handle_api_request(f"/api/{endpoint_name}", "POST", body)
        return JSONResponse(content=data, status_code=code)

    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    @app.get("/")
    async def serve_index() -> FileResponse:
        return FileResponse(str(STATIC_DIR / "index.html"))

    HAS_FASTAPI = True
except ImportError:
    app = None
    HAS_FASTAPI = False


# ==============================================================================
# Zero-Dependency Fallback HTTP Server (Chạy ngay với Standard Library Python)
# ==============================================================================
class VNLPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        req_path = parsed.path

        if req_path.startswith("/api/"):
            code, payload = handle_api_request(req_path, "GET", {})
            self._send_json(code, payload)
            return

        # Phục vụ file tĩnh trong web/static/
        if req_path in ("/", "/index.html"):
            file_path = STATIC_DIR / "index.html"
        elif req_path.startswith("/static/"):
            rel = req_path[len("/static/") :]
            file_path = (STATIC_DIR / rel).resolve()
        else:
            rel = req_path.lstrip("/")
            file_path = (STATIC_DIR / rel).resolve()

        if not str(file_path).startswith(str(STATIC_DIR.resolve())) or not file_path.is_file():
            self._send_json(404, {"error": "File not found"})
            return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{mime_type or 'text/plain'}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            body = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            body = {}

        code, payload = handle_api_request(parsed.path, "POST", body)
        self._send_json(code, payload)

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args: Any) -> None:
        return  # Giữ console gọn gàng


def run_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    if HAS_FASTAPI:
        try:
            import uvicorn

            print(f"[FastAPI] Đang chạy Vietnamese NLP Mastery Web tại: http://{host}:{port}")
            uvicorn.run(app, host=host, port=port)
            return
        except ImportError:
            pass

    server = ThreadingHTTPServer((host, port), VNLPRequestHandler)
    print(f"[Python Web Server] Đang chạy Vietnamese NLP Mastery Web tại: http://{host}:{port}")
    print("Nhấn Ctrl+C để dừng server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng server.")
        server.server_close()


if __name__ == "__main__":
    default_port = int(os.environ.get("PORT", "8000"))
    default_host = os.environ.get("HOST", "0.0.0.0" if "PORT" in os.environ else "127.0.0.1")
    parser = argparse.ArgumentParser(description="Khởi chạy Vietnamese NLP Mastery Web App")
    parser.add_argument("--host", default=default_host, help="Host address")
    parser.add_argument("--port", type=int, default=default_port, help="Port number")
    args = parser.parse_args()
    run_server(host=args.host, port=args.port)
