@echo off
chcp 65001 >nul
echo Đang khởi động LearnNLP (Giao diện khóa học tương tác từng bước) tại http://localhost:8000/#/unicode-tone/1 ...
start "" "http://localhost:8000/#/unicode-tone/1"
python "%~dp0web\app.py" --port 8000
