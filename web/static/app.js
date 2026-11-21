/**
 * LearnNLP — Interactive Step-by-Step Animated Course & Python Lab
 * Follows the exact "Designed to Scale" interactive architecture:
 * - Hash routing (`#/<lesson-slug>/<step-number>`)
 * - 3-Column Fixed Shell: Course Tree Sidebar | Animated SVG Stage + Timeline | Step Narrative Rail
 * - 4 Topbar Modes: Học (Learn) | Phòng thiết kế (Live Python Lab) | Luyện tập (Quiz & Exercises) | Tóm tắt (Cheatsheets)
 * - 60fps Spring-Interpolated 2D PhoW2V Embedding Canvas & Live Python Backend Integration
 */

const STORAGE_KEY = "vnlp_mastery_progress_v1";
const THEME_KEY = "vnlp_mastery_theme_v1";

const DEFAULT_PROGRESS = {
  xp: 0,
  visitedSteps: {},
  completedExercises: {},
  completedQuizzes: {},
};

let userProgress = loadProgress();
let currentLessonId = "unicode-tone";
let currentStepIndex = 0; // 0-based
let currentTopMode = "learn";
let isStagePlaying = true;
let currentEmbeddingData = null;

const canvasAnimState = {
  currX: 0.68,
  currY: 0.62,
  targetX: 0.68,
  targetY: 0.62,
  phase: 0,
  rafId: null,
};

// ============================================================================
// COURSE MODULES & 8 INTERACTIVE STEP-BY-STEP LESSONS (42 ANIMATED STEPS)
// ============================================================================
const COURSE_MODULES = [
  {
    id: "mod-1",
    num: "01",
    title: "Tiền xử lý & Đặc thù Tiếng Việt",
    folderColor: "sand",
    stage: 1,
    lessons: ["unicode-tone", "word-segmentation"],
  },
  {
    id: "mod-2",
    num: "02",
    title: "Biểu diễn Văn bản & Embeddings",
    folderColor: "violet",
    stage: 2,
    lessons: ["tfidf-linear", "phow2v-space"],
  },
  {
    id: "mod-3",
    num: "03",
    title: "Pretrained Transformers Tiếng Việt",
    folderColor: "green",
    stage: 3,
    lessons: ["phobert-nlu", "ner-subword-vit5"],
  },
  {
    id: "mod-4",
    num: "04",
    title: "LLM Tiếng Việt, QLoRA & Agentic RAG",
    folderColor: "orange",
    stage: 4,
    lessons: ["qlora-nf4", "langgraph-hybrid-rag"],
  },
  {
    id: "mod-5",
    num: "05",
    title: "Thực chiến Sản xuất (Production & Applied NLP)",
    folderColor: "blue",
    stage: 5,
    lessons: ["production-data-chunking", "production-serving-eval"],
  },
];

const LESSONS = {
  "unicode-tone": {
    id: "unicode-tone",
    moduleNum: "01",
    moduleTitle: "Tiền xử lý & Đặc thù Tiếng Việt",
    stage: 1,
    title: "Bảng mã Unicode (NFC vs NFD) & Dấu thanh",
    subtitle: "Theo dõi một từ tiếng Việt qua từng byte UTF-8 để thấy vì sao mã tổ hợp NFD làm sập từ điển PhoBERT.",
    notebookTag: "Notebook 01.1",
    steps: [
      {
        label: "Bối cảnh",
        chapter: "Bối cảnh",
        chapterColor: "sand",
        title: "Hai chữ “Việt” giống hệt nhau nhưng máy tính thấy khác",
        hud: [
          { label: "Chuỗi hiển thị", value: '"Tiếng Việt"', level: "good" },
          { label: "So sánh s1 == s2", value: "False (!)", level: "bad" },
          { label: "Độ dài ký tự", value: "10 vs 13 chars", level: "warn" },
        ],
        body: `
          <p>Trước khi huấn luyện bất kỳ mô hình NLP Tiếng Việt nào, bạn phải đối mặt với một cái bẫy vô hình ở tầng byte: <b>bảng mã Unicode</b>.</p>
          <p>Trên màn hình, chuỗi <code>s1 = "Tiếng Việt"</code> (gõ từ Unikey chuẩn) và <code>s2 = "Tiếng Việt"</code> (copy từ file PDF hoặc macOS) trông giống nhau 100%. Nhưng trong Python, phép so sánh <code>s1 == s2</code> lại trả về <b>False</b>!</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Mắt người đọc hình dáng mặt chữ (glyph), còn Tokenizer của mô hình chỉ đọc dãy mã số Unicode (codepoints).",
        },
        changes: [
          { type: "add", text: "Nhận văn bản tiếng Việt từ người dùng, PDF và mạng xã hội" },
          { type: "mod", text: "Phát hiện độ dài chuỗi lệch nhau: len(s1) = 10, len(s2) = 13" },
        ],
        diagram: {
          type: "unicode-compare",
          variant: "intro",
        },
      },
      {
        label: "Vấn đề NFD",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Mã Tổ hợp (NFD) bẻ rời chữ cái và dấu thanh",
        hud: [
          { label: "Chuẩn mã hóa", value: "NFD (Tổ hợp)", level: "bad" },
          { label: "Chữ 'ệ' bị tách", value: "e + ◌̣ + ◌̂ (3 mã)", level: "bad" },
          { label: "PhoBERT Vocab", value: "Lỗi [UNK] OOV", level: "bad" },
        ],
        body: `
          <p>Ở chuẩn tổ hợp <span class="term">NFD</span> (Canonical Decomposition), một nguyên âm có dấu như <code>"ệ"</code> bị xé thành 3 codepoint rời nhau: chữ gốc <code>e (U+0065)</code> + dấu nặng <code>U+0323</code> + dấu mũ <code>U+0302</code>.</p>
          <p>Bộ từ điển 64.000 từ của <code>PhoBERT</code> hay <code>ViT5</code> chỉ lưu chữ <code>"ệ"</code> dựng sẵn. Khi gặp chuỗi NFD, bộ BPE không khớp được từ và băm nhỏ từ thành các mảnh rác hoặc <code>[UNK]</code>.</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Trộn lẫn dữ liệu NFD vào tập test làm tụt từ 5% đến 15% F1-score dù giao diện web không hề hiển thị lỗi font!",
        },
        changes: [
          { type: "del", text: "Chữ 'Việt' bị xé thành 6 ký tự rời: V + i + e + U+0323 + U+0302 + t" },
          { type: "del", text: "BPE Tokenizer không tìm thấy từ trong từ điển NFC" },
        ],
        diagram: {
          type: "unicode-compare",
          variant: "nfd-broken",
        },
      },
      {
        label: "Chuẩn NFC",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Ép toàn bộ đầu vào về Unicode Dựng sẵn (NFC)",
        hud: [
          { label: "Hàm chuẩn hóa", value: "normalize('NFC')", level: "good" },
          { label: "Chữ 'ệ' dựng sẵn", value: "U+1EC7 (1 mã)", level: "good" },
          { label: "Khớp từ điển", value: "100% Vocab Hit", level: "good" },
        ],
        body: `
          <p>Giải pháp bắt buộc ở dòng đầu tiên của mọi pipeline là gọi <code>unicodedata.normalize("NFC", text)</code> để hợp nhất chữ cái gốc và các dấu thanh rời thành <b>1 codepoint duy nhất</b> (<code>U+1EC7</code>).</p>
          <p>Đồng thời, ta quét xóa các ký tự tàng hình <span class="term">Zero-Width Space</span> (<code>\\u200b</code>, <code>\\ufeff</code>) thường dính vào giữa từ khi copy từ PDF hoặc Zalo.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Chuẩn hóa NFC + xóa Zero-Width Space tốn chưa tới 0.05 ms mỗi câu nhưng cứu toàn bộ độ chính xác của Tokenizer.",
        },
        changes: [
          { type: "add", text: "Gộp e + U+0323 + U+0302 → 'ệ' (U+1EC7) duy nhất" },
          { type: "add", text: "Quét sạch ký tự ẩn \\u200b (Zero-Width Space) và \\ufeff (BOM)" },
        ],
        diagram: {
          type: "unicode-compare",
          variant: "nfc-clean",
        },
      },
      {
        label: "Dấu thanh",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Đồng nhất vị trí dấu thanh: “hòa, thủy” hay “hoà, thuỷ”?",
        hud: [
          { label: "Vần mở oa, oe, uy", value: "hoà → hòa", level: "good" },
          { label: "Ngoại lệ phụ âm qu-", value: "quý giá (giữ y)", level: "good" },
          { label: "Chuẩn VnCoreNLP", value: "Kiểu Cũ (100%)", level: "good" },
        ],
        body: `
          <p>Ngay cả khi đã ở chuẩn <code>NFC</code>, tiếng Việt vẫn có 2 quy tắc đặt dấu thanh trên các âm tiết kết thúc bằng <code>oa, oe, uy</code>: <b>Kiểu Cũ</b> (<code>hòa, khỏe, thủy</code>) và <b>Kiểu Mới</b> (<code>hoà, khoẻ, thuỷ</code>).</p>
          <p>Toàn bộ 20GB dữ liệu huấn luyện của <code>VnCoreNLP</code> và <code>PhoBERT</code> đều dùng <b>Kiểu Cũ</b>. Vì vậy ta cần ánh xạ đồng nhất <code>hoà → hòa</code>, <code>thuỷ → thủy</code> (nhưng giữ nguyên <code>quý</code> vì <code>qu</code> là phụ âm đầu).</p>
        `,
        callout: {
          type: "tip",
          title: "Quy tắc",
          text: "Nếu âm tiết có phụ âm cuối (như 'hoàn', 'toàn', 'tuyết'), cả hai kiểu đều đặt dấu trên nguyên âm thứ hai.",
        },
        changes: [
          { type: "mod", text: "Đồng nhất 'hoà bình, sức khoẻ, thuỷ lợi' → 'hòa bình, sức khỏe, thủy lợi'" },
          { type: "add", text: "Bảo toàn ngoại lệ 'quý giá', 'quyền lợi' (phụ âm đầu qu-)" },
        ],
        diagram: {
          type: "tone-rules",
          variant: "old-vs-new",
        },
      },
      {
        label: "Teencode",
        chapter: "Kỹ thuật",
        chapterColor: "violet",
        title: "Khử nhiễu mạng xã hội & Mở rộng Teencode có kiểm soát",
        hud: [
          { label: "Teencode ánh xạ", value: "ko → không", level: "good" },
          { label: "Ranh giới từ", value: "Regex \\bword\\b", level: "good" },
          { label: "Bảo toàn phủ định", value: "Giữ 'không/chưa'", level: "good" },
        ],
        body: `
          <p>Trên bình luận thương mại điện tử hay phản hồi sinh viên (<code>UIT-VSFC</code>), người dùng viết tắt rất nhiều: <code>"GV dạy rất nhiệt tình, ko hiểu chỗ nào đều đc giải đáp"</code>.</p>
          <p>Ta dùng từ điển ánh xạ kết hợp ranh giới từ <code>\\b</code> để đổi <code>ko → không</code>, <code>đc → được</code>, <code>gv → giảng viên</code> <b>trước khi tách từ</b>. Tuyệt đối không xóa stopword mang nghĩa phủ định như <code>"không"</code>, <code>"chẳng"</code>, <code>"chưa"</code>!</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Nếu xóa từ 'không' như một stopword thông thường, câu 'Môn này không hay' sẽ biến thành 'Môn này hay' (đảo ngược hoàn toàn nhãn cảm xúc!).",
        },
        changes: [
          { type: "mod", text: "Mở rộng 'GV, ko, đc, vs' → 'giảng viên, không, được, với' trước bước tách từ" },
        ],
        diagram: {
          type: "clean-pipeline",
          variant: "teencode",
        },
      },
      {
        label: "Tổng kết",
        chapter: "Tổng kết",
        chapterColor: "ink",
        title: "Pipeline 3 bước làm sạch chuẩn Production",
        hud: [
          { label: "Thời gian xử lý", value: "0.08 ms / câu", level: "good" },
          { label: "Tỉ lệ lỗi [UNK]", value: "0.0%", level: "good" },
          { label: "Mức tăng F1", value: "+5.4% F1-score", level: "good" },
        ],
        body: `
          <p>Chỉ với một hàm <code>clean_vietnamese_text()</code> đặt ở cửa ngõ hệ thống, bạn đã triệt tiêu nguồn gây lỗi âm thầm lớn nhất của NLP Tiếng Việt:</p>
          <ul class="takeaways">
            <li><b>Bước 1 (Byte-level):</b> Xóa ký tự ẩn <code>\\u200b</code>, <code>\\ufeff</code> và ép về <b>Unicode NFC</b>.</li>
            <li><b>Bước 2 (Token-level):</b> Mở rộng Teencode theo từ điển có ranh giới từ <code>\\b</code>.</li>
            <li><b>Bước 3 (Syllable-level):</b> Đồng nhất dấu thanh về <b>Kiểu Cũ</b> (<code>hòa, khỏe, thủy</code>).</li>
          </ul>
        `,
        callout: {
          type: "insight",
          title: "Sắp tới",
          text: "Tiếp theo: Bài 1.2 — Tách từ Ghép Tiếng Việt (RDRSegmenter vs CRF): Làm sao máy tính phân biệt 'Học_sinh học sinh_học'?",
        },
        changes: [],
        diagram: {
          type: "clean-pipeline",
          variant: "full-summary",
        },
      },
    ],
  },

  "word-segmentation": {
    id: "word-segmentation",
    moduleNum: "01",
    moduleTitle: "Tiền xử lý & Đặc thù Tiếng Việt",
    stage: 1,
    title: "Tách từ Tiếng Việt (RDRSegmenter vs CRF)",
    subtitle: "Khác với tiếng Anh, khoảng trắng trong tiếng Việt chỉ ngăn cách âm tiết chứ không phải ranh giới từ.",
    notebookTag: "Notebook 01.2",
    steps: [
      {
        label: "Ảo tưởng dấu cách",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Khoảng trắng trong tiếng Việt KHÔNG phải là ranh giới từ",
        hud: [
          { label: "Câu đầu vào", value: "5 âm tiết rời", level: "warn" },
          { label: "Cắt theo dấu cách", value: "['học','sinh'] × 2", level: "bad" },
          { label: "Ngữ nghĩa từ ghép", value: "Bị phá hủy", level: "bad" },
        ],
        body: `
          <p>Trong tiếng Anh, mỗi từ được ngăn cách bởi khoảng trắng. Nhưng trong tiếng Việt, khoảng trắng chỉ dùng để tách các <b>âm tiết (tiếng / syllables)</b>, còn hơn 70% từ vựng tiếng Việt là <b>từ ghép 2–4 âm tiết</b>.</p>
          <p>Hãy xem câu kinh điển: <code>"Học sinh học sinh học"</code>. Nếu cắt theo khoảng trắng, máy tính chỉ thấy âm tiết <code>"học"</code> lặp 3 lần và <code>"sinh"</code> lặp 2 lần — mất sạch nghĩa của chủ ngữ <b>Học_sinh</b> (student) và môn <b>sinh_học</b> (biology)!</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Truyền văn bản chưa nối dấu gạch dưới '_' vào PhoBERT sẽ khiến mô hình hiểu sai hoàn toàn các từ ghép tiếng Việt.",
        },
        changes: [
          { type: "del", text: "Tách theo khoảng trắng làm mất ranh giới từ ghép 'Học_sinh' và 'sinh_học'" },
        ],
        diagram: {
          type: "word-seg",
          variant: "whitespace-fail",
        },
      },
      {
        label: "Nhập nhằng",
        chapter: "Vấn đề",
        chapterColor: "amber",
        title: "Nhập nhằng Giao thoa (Overlapping) & Tổ hợp (Combinatorial)",
        hud: [
          { label: "Chuỗi A - B - C", value: "Học - sinh - học", level: "warn" },
          { label: "Cách ghép 1", value: "Học_sinh + học", level: "good" },
          { label: "Cách ghép 2", value: "Học + sinh_học", level: "warn" },
        ],
        body: `
          <p>Tại sao không thể chỉ tra từ điển ghép từ trái sang phải (<span class="term">Longest Matching</span>)? Vì tiếng Việt có hai hiện tượng nhập nhằng kinh điển:</p>
          <p>1. <b>Nhập nhằng giao thoa:</b> Trong chuỗi 3 âm tiết <code>A - B - C</code> (<code>Học - sinh - học</code>), cả <code>A_B</code> (<code>Học_sinh</code>) lẫn <code>B_C</code> (<code>sinh_học</code>) đều có trong từ điển.<br/>2. <b>Nhập nhằng tổ hợp:</b> Cụm <code>"bàn là"</code> là 1 từ ghép <code>bàn_là</code> (chiếc bàn ủi) trong <em>"cái bàn_là"</em>, nhưng là 2 từ đơn <code>bàn + là</code> trong <em>"bàn là nơi làm việc"</em>.</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Để tách đúng ranh giới từ ghép, thuật toán bắt buộc phải nhìn vào ngữ cảnh các âm tiết đứng trước và đứng sau.",
        },
        changes: [
          { type: "mod", text: "Longest-Matching tham lam chỉ đạt ~94% F1, bó tay trước câu nhập nhằng ngữ cảnh" },
        ],
        diagram: {
          type: "word-seg",
          variant: "ambiguity",
        },
      },
      {
        label: "Nhãn B_W / I_W",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Quy bài toán Tách từ về Gán nhãn Chuỗi (B_W và I_W)",
        hud: [
          { label: "Nhãn B_W", value: "Bắt đầu từ mới", level: "good" },
          { label: "Nhãn I_W", value: "Nối dấu '_' vào trước", level: "good" },
          { label: "Chuỗi kết quả", value: "3 từ chuẩn xác", level: "good" },
        ],
        body: `
          <p>Mọi bộ tách từ hiện đại đều quy bài toán về gán cho mỗi âm tiết một trong hai nhãn <span class="term">B_W / I_W</span>:</p>
          <p>• <code>B_W</code> (Begin-Word): Mở đầu một từ mới (giữ khoảng trắng).<br/>• <code>I_W</code> (Inside-Word): Thuộc cùng từ ghép với âm tiết liền trước (nối bằng dấu gạch dưới <code>_</code>).</p>
          <p>Với chuỗi nhãn <code>[B_W, I_W, B_W, B_W, I_W]</code>, 5 âm tiết <code>Học sinh học sinh học</code> được ghép chuẩn xác thành <code>Học_sinh học sinh_học</code>.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Thư viện pyvi và underthesea sử dụng mô hình xác suất Linear-chain CRF kết hợp thuật toán Viterbi để tìm chuỗi nhãn B_W / I_W tối ưu toàn cục.",
        },
        changes: [
          { type: "add", text: "Gán nhãn chuỗi [B_W, I_W, B_W, B_W, I_W] → 'Học_sinh học sinh_học'" },
        ],
        diagram: {
          type: "word-seg",
          variant: "bw-iw-crf",
        },
      },
      {
        label: "Cây SCRDR",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "RDRSegmenter (VnCoreNLP): Cây quy tắc ngoại lệ SCRDR",
        hud: [
          { label: "Thuật toán", value: "RDRSegmenter", level: "good" },
          { label: "VLSP 2013 F1", value: "97.90% F1 (SOTA)", level: "good" },
          { label: "Tốc độ CPU", value: "~15.000 câu/giây", level: "good" },
        ],
        body: `
          <p><span class="term">RDRSegmenter</span> trong bộ <code>VnCoreNLP</code> kết hợp tốc độ của từ điển với độ thông minh của ngữ cảnh qua 2 pha:</p>
          <p>1. <b>Khởi tạo nhanh:</b> Chạy Longest-Matching từ điển.<br/>2. <b>Sửa lỗi theo ngữ cảnh:</b> Duyệt qua Cây quy tắc ngoại lệ <span class="term">SCRDR</span> xét cửa sổ 5 âm tiết <code>(w_{-2}, w_{-1}, w_0, w_{+1}, w_{+2})</code> dạng <em>"Nếu điều kiện đúng thì đổi nhãn B_W ↔ I_W, trừ khi rơi vào nhánh ngoại lệ con"</em>.</p>
        `,
        callout: {
          type: "insight",
          title: "Chuẩn PhoBERT",
          text: "VnCoreNLP (RDRSegmenter) chính là công cụ đã tách từ cho toàn bộ 20GB dữ liệu huấn luyện của PhoBERT và PhoW2V.",
        },
        changes: [
          { type: "add", text: "Cây SCRDR tự động phát hiện 'học' ở vị trí thứ 3 là động từ chính (B_W)" },
        ],
        diagram: {
          type: "word-seg",
          variant: "scrdr-tree",
        },
      },
      {
        label: "POS & Dependency",
        chapter: "Tổng kết",
        chapterColor: "ink",
        title: "Từ Tách từ đến Gán nhãn Từ loại (POS) & Cây Cú pháp Phụ thuộc",
        hud: [
          { label: "Học_sinh (N)", value: "nsub ← học (V)", level: "good" },
          { label: "học (V)", value: "ROOT (0)", level: "good" },
          { label: "sinh_học (N)", value: "dob ← học (V)", level: "good" },
        ],
        body: `
          <p>Sau khi ranh giới từ ghép đã rõ ràng, pipeline tiếp tục gán nhãn từ loại (<span class="term">POS Tagging</span>: <code>N, Np, V, A, R, E</code>) và dựng cây cú pháp phụ thuộc (<span class="term">Dependency Parsing</span>):</p>
          <ul class="takeaways">
            <li><code>Học_sinh</code> là Danh từ (<code>N</code>) đóng vai trò chủ ngữ (<code>nsub</code>) của động từ gốc <code>học (V - ROOT)</code>.</li>
            <li><code>sinh_học</code> là Danh từ (<code>N</code>) đóng vai trò tân ngữ trực tiếp (<code>dob</code>) của <code>học (V)</code>.</li>
            <li>Chọn <code>pyvi</code> khi cần tốc độ cực nhanh cho chỉ mục BM25/TF-IDF; chọn <code>VnCoreNLP</code> khi tiền xử lý cho <code>PhoBERT</code>.</li>
          </ul>
        `,
        callout: {
          type: "tip",
          title: "Thực hành ngay",
          text: "Bấm nút 'Chạy thử Python' ở góc trên sân khấu để tự tay tách từ và xem cây Dependency trên câu bất kỳ!",
        },
        changes: [],
        diagram: {
          type: "word-seg",
          variant: "pos-dep-tree",
        },
      },
    ],
  },

  "tfidf-linear": {
    id: "tfidf-linear",
    moduleNum: "02",
    moduleTitle: "Biểu diễn Văn bản & Embeddings",
    stage: 2,
    title: "TF-IDF N-gram Từ ghép & LinearSVC Baseline",
    subtitle: "Xây dựng hệ thống phân loại cảm xúc UIT-VSFC đạt 89.4% Macro-F1 chỉ trong 3 giây trên CPU.",
    notebookTag: "Notebook 02.1 (Phần A)",
    steps: [
      {
        label: "Từ chữ sang số",
        chapter: "Bối cảnh",
        chapterColor: "sand",
        title: "Làm sao nhét một câu tiếng Việt vào vector số?",
        hud: [
          { label: "Tập dữ liệu", value: "UIT-VSFC (16k câu)", level: "good" },
          { label: "Bag-of-Words", value: "Đếm tần suất từ", level: "warn" },
          { label: "Từ hư ('là','của')", value: "Tần suất cao nhưng vô nghĩa", level: "bad" },
        ],
        body: `
          <p>Mô hình học máy chỉ hiểu các con số. Cách đơn giản nhất là <b>Bag-of-Words</b>: lập từ điển gồm mọi từ ghép đã tách, rồi đếm số lần mỗi từ xuất hiện trong câu.</p>
          <p>Nhưng nếu chỉ đếm thô, các từ nối xuất hiện ở mọi câu như <code>"là"</code>, <code>"và"</code>, <code>"của"</code>, <code>"môn_học"</code> sẽ có giá trị rất lớn, lấn át các từ mang cảm xúc thật sự như <code>"nhiệt_tình"</code> hay <code>"khó_hiểu"</code>.</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Một từ xuất hiện nhiều trong 1 câu nhưng hiếm gặp ở các câu khác mới là từ khóa định danh chủ đề và cảm xúc.",
        },
        changes: [
          { type: "add", text: "Tách từ ghép bằng pyvi/VnCoreNLP trước khi trích xuất đặc trưng" },
        ],
        diagram: {
          type: "tfidf-flow",
          variant: "bow-problem",
        },
      },
      {
        label: "Công thức TF-IDF",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Sublinear TF × Smoothed IDF: Triệt tiêu từ xuất hiện tràn lan",
        hud: [
          { label: "Sublinear TF", value: "1 + ln(count)", level: "good" },
          { label: "Smoothed IDF", value: "ln((1+N)/(1+df))+1", level: "good" },
          { label: "Trọng số 'nhiệt_tình'", value: "0.68 (Cao nhất)", level: "good" },
        ],
        body: `
          <p><span class="term">TF-IDF</span> nhân tần suất từ trong câu (TF) với độ hiếm của từ đó trên toàn tập dữ liệu (IDF):</p>
          <p>• <b>Sublinear TF:</b> Thay vì đếm tuyến tính, dùng <code>1 + ln(tf)</code> để một từ lặp lại 5 lần không lấn át gấp 5 lần.<br/>• <b>IDF:</b> Từ <code>"là"</code> có mặt ở hầu hết văn bản nên <code>IDF ≈ 0</code> (bị kéo về 0). Ngược lại, từ ghép <code>"nhiệt_tình"</code> hay <code>"chậm_chạp"</code> chỉ xuất hiện ở nhóm câu khen/chê nên có <code>TF-IDF</code> nổi bật hẳn lên.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Trong scikit-learn, luôn bật sublinear_tf=True và chuẩn hóa L2 để vector không bị lệch bởi độ dài câu.",
        },
        changes: [
          { type: "mod", text: "Giảm trọng số từ phổ biến ('là', 'môn_học') xuống thấp, đẩy 'nhiệt_tình' lên cao" },
        ],
        diagram: {
          type: "tfidf-flow",
          variant: "tfidf-weights",
        },
      },
      {
        label: "Bigram cứu nghĩa",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Kết hợp Unigram + Bigram (1, 2) để bắt cụm phủ định “không dễ_hiểu”",
        hud: [
          { label: "ngram_range", value: "(1, 2) Từ ghép", level: "good" },
          { label: "Bắt cụm phủ định", value: '"không dễ_hiểu"', level: "good" },
          { label: "Kích thước Vocab", value: "~25.000 đặc trưng", level: "good" },
        ],
        body: `
          <p>Nếu chỉ xét từng từ rời (Unigram), câu <code>"Giảng_viên dạy không nhiệt_tình"</code> vẫn chứa từ <code>"nhiệt_tình"</code> và dễ bị đoán nhầm thành Tích cực!</p>
          <p>Khi cấu hình <code>ngram_range=(1, 2)</code> trên văn bản đã tách từ, bộ trích xuất tạo ra đặc trưng cụm 2 từ liên tiếp (Bigram) như <code>"không nhiệt_tình"</code>, <code>"rất dễ_hiểu"</code>, <code>"hơi nhanh"</code> — giữ trọn vẹn cực tính cảm xúc.</p>
        `,
        callout: {
          type: "warn",
          title: "Đánh đổi",
          text: "Chỉ nên dùng tới Bigram (1, 2) kết hợp min_df=2. Nếu tăng lên 3-gram hoặc 4-gram, số chiều từ điển sẽ bùng nổ theo cấp số nhân (V³) và gây overfitting.",
        },
        changes: [
          { type: "add", text: "Bổ sung Bigram từ ghép: 'rất nhiệt_tình', 'không dễ_hiểu', 'quá nhanh'" },
        ],
        diagram: {
          type: "tfidf-flow",
          variant: "bigram-rescue",
        },
      },
      {
        label: "LinearSVC Balanced",
        chapter: "Kỹ thuật",
        chapterColor: "violet",
        title: "LinearSVC + class_weight='balanced' trị mất cân bằng nhãn UIT-VSFC",
        hud: [
          { label: "Tỉ lệ nhãn Neutral", value: "Chỉ 4.0% dữ liệu", level: "warn" },
          { label: "class_weight", value: "'balanced'", level: "good" },
          { label: "UIT-VSFC Macro-F1", value: "89.4% (3 giây CPU)", level: "good" },
        ],
        body: `
          <p>Trong tập dữ liệu <span class="term">UIT-VSFC</span>, lớp <b>Neutral</b> (Trung tính) chỉ chiếm ~4% số câu. Nếu huấn luyện bình thường, mô hình sẽ bỏ rơi lớp Neutral mà vẫn đạt Accuracy > 90%.</p>
          <p>Khi kết hợp <span class="term">LinearSVC</span> với <code>class_weight="balanced"</code>, hàm mất mát tự động nhân hệ số phạt tỉ lệ nghịch với tần suất lớp, nâng điểm <b>Macro-F1</b> toàn cục lên <b>~89.4%</b> chỉ trong 3 giây chạy CPU!</p>
        `,
        callout: {
          type: "insight",
          title: "Tổng kết",
          text: "TF-IDF (1,2-gram) + LinearSVC là baseline cực mạnh và siêu nhẹ, nhưng vẫn có 2 giới hạn: vector thưa (99.9% là số 0) và không hiểu hai từ đồng nghĩa ('giảng_viên' vs 'thầy_cô').",
        },
        changes: [
          { type: "add", text: "Bật class_weight='balanced' và chấm điểm bằng Macro-F1 thay vì Accuracy" },
        ],
        diagram: {
          type: "tfidf-flow",
          variant: "linearsvc-boundary",
        },
      },
    ],
  },

  "phow2v-space": {
    id: "phow2v-space",
    moduleNum: "02",
    moduleTitle: "Biểu diễn Văn bản & Embeddings",
    stage: 2,
    title: "Không gian Vector PhoW2V & Giới hạn Đa nghĩa",
    subtitle: "Biểu diễn mỗi từ ghép tiếng Việt thành một vector đặc 300 chiều nơi khoảng cách hình học phản ánh ngữ nghĩa.",
    notebookTag: "Notebook 02.1 (Phần B)",
    steps: [
      {
        label: "Thưa vs Đặc",
        chapter: "Bối cảnh",
        chapterColor: "sand",
        title: "Từ Vector Thưa 25.000 chiều sang Vector Đặc 300 chiều",
        hud: [
          { label: "Vector One-Hot/TF-IDF", value: "25.000 chiều (99% số 0)", level: "warn" },
          { label: "cos('thầy','giảng_viên')", value: "0.000 (Vuông góc!)", level: "bad" },
          { label: "PhoW2V Dense Vector", value: "300 chiều số thực", level: "good" },
        ],
        body: `
          <p>Trong Bag-of-Words và TF-IDF, từ <code>"giảng_viên"</code> và <code>"sinh_viên"</code> nằm trên hai trục tọa độ vuông góc hoàn toàn: tích vô hướng của chúng bằng <b>0</b> (xa nhau y hệt như <code>"giảng_viên"</code> và <code>"tên_lửa"</code>).</p>
          <p><span class="term">Word2Vec</span> và <span class="term">PhoW2V</span> giải quyết điều này bằng cách nén mỗi từ ghép vào một vector đặc 100–300 chiều số thực liên tục, sao cho các từ có ngữ cảnh giống nhau nằm sát nhau trong không gian.</p>
        `,
        callout: {
          type: "insight",
          title: "Giả thuyết phân bố",
          text: "Bạn sẽ biết nghĩa của một từ thông qua những từ thường xuyên đi kèm xung quanh nó (Firth, 1957).",
        },
        changes: [
          { type: "mod", text: "Chuyển từ ma trận thưa V chiều sang không gian nhúng liên tục R^300" },
        ],
        diagram: {
          type: "embedding-space",
          variant: "sparse-vs-dense",
        },
      },
      {
        label: "Skip-gram SGNS",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Skip-gram Negative Sampling (SGNS) học ngữ cảnh như thế nào?",
        hud: [
          { label: "Từ trung tâm w_t", value: '"giảng_viên"', level: "good" },
          { label: "Mẫu dương (+)", value: '"dạy", "nhiệt_tình"', level: "good" },
          { label: "K mẫu nhiễu (-)", value: '"bê_tông", "cơn_mưa"', level: "warn" },
        ],
        body: `
          <p>Thuật toán <span class="term">SGNS</span> trượt một cửa sổ ngữ cảnh qua 20GB văn bản tiếng Việt đã tách từ. Tại mỗi vị trí, nó lấy từ trung tâm <code>"giảng_viên"</code> để kéo vector của các từ xung quanh thật (<code>"dạy"</code>, <code>"nhiệt_tình"</code>, <code>"sinh_viên"</code>) lại gần nhau.</p>
          <p>Đồng thời, nó lấy ngẫu nhiên <code>K = 5..10</code> từ nhiễu không liên quan để đẩy vector của chúng ra xa, giúp không cần tính Softmax trên toàn bộ từ điển.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Skip-gram học biểu diễn cho các từ ghép tiếng Việt ít gặp tốt hơn CBOW vì không trộn trung bình các từ ngữ cảnh.",
        },
        changes: [
          { type: "add", text: "Tối ưu hàm mục tiêu nhị phân giữa cặp từ thật (Positive) và K mẫu nhiễu (Negative)" },
        ],
        diagram: {
          type: "embedding-space",
          variant: "skipgram-window",
        },
      },
      {
        label: "Cosine & Analogy",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Độ tương đồng Cosine & Đại số tuyến tính trên nghĩa từ",
        hud: [
          { label: "cos(giảng_viên, sinh_viên)", value: "0.978 (Rất gần)", level: "good" },
          { label: "cos(nhiệt_tình, dễ_hiểu)", value: "0.996 (Cùng cực +)", level: "good" },
          { label: "Phép toán Vector", value: "Hà_Nội - VN + Nhật ≈ Tokyo", level: "good" },
        ],
        body: `
          <p>Trong không gian <span class="term">PhoW2V</span>, ta dùng <span class="term">Cosine Similarity</span> <code>cos(θ) = (u · v) / (||u|| ||v||)</code> để đo góc giữa hai vector từ. Các từ tự động tụ lại thành các cụm ngữ nghĩa rõ rệt: Giáo dục, Mô hình AI, Cảm xúc tích cực/tiêu cực, Địa danh.</p>
          <p>Thậm chí các hướng song song trong không gian còn mã hóa quan hệ: <code>vec("Hà_Nội") - vec("Việt_Nam") + vec("Nhật_Bản") ≈ vec("Tokyo")</code>.</p>
        `,
        callout: {
          type: "tip",
          title: "Khám phá trực tiếp",
          text: "Trong tab 'Phòng thiết kế', bạn có thể click trực tiếp lên đồ thị Canvas 2D 60fps của PhoW2V để xem tia vector xoay theo thời gian thực.",
        },
        changes: [
          { type: "add", text: "Hình thành các cụm ngữ nghĩa liên tục và quan hệ song song giữa các vector" },
        ],
        diagram: {
          type: "embedding-space",
          variant: "clusters-2d",
        },
      },
      {
        label: "Từ hiếm (FastText)",
        chapter: "Kỹ thuật",
        chapterColor: "violet",
        title: "Khi gặp từ viết sai chính tả hoặc từ mới (OOV): FastText Character N-gram",
        hud: [
          { label: "Từ ngoài từ điển", value: '"nhiệtt_tình" (typo)', level: "warn" },
          { label: "Word2Vec thuần", value: "Báo lỗi KeyError / OOV", level: "bad" },
          { label: "FastText Subword", value: "Ghép từ n-gram ký tự", level: "good" },
        ],
        body: `
          <p>Word2Vec gán cứng 1 vector cho mỗi từ trong từ điển: nếu gặp từ mới hoặc từ gõ sai chính tả trên mạng xã hội, nó hoàn toàn bó tay (OOV).</p>
          <p><span class="term">FastText</span> khắc phục bằng cách biểu diễn mỗi từ là <b>tổng vector của các cụm n-gram ký tự con</b> bên trong nó (ví dụ <code>&lt;nhi, hiệt, iệt_...</code>), nhờ đó vẫn suy ra được vector gần đúng cho từ chưa từng gặp.</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Chia nhỏ từ thành các mảnh subword chính là ý tưởng cầu nối dẫn tới BPE và SentencePiece của các mô hình Transformer hiện đại.",
        },
        changes: [
          { type: "add", text: "Tổng hợp vector từ các mảnh character n-grams để chống lỗi OOV" },
        ],
        diagram: {
          type: "embedding-space",
          variant: "fasttext-subword",
        },
      },
      {
        label: "Nút thắt Đa nghĩa",
        chapter: "Đánh đổi",
        chapterColor: "red",
        title: "Polysemy Bottleneck: Một chữ “đường” nhưng ba nghĩa khác nhau!",
        hud: [
          { label: "Câu 1: 'đường mía'", value: "vec('đường') cố định", level: "bad" },
          { label: "Câu 2: 'con đường'", value: "Cùng 1 vector!", level: "bad" },
          { label: "Giải pháp kế tiếp", value: "Self-Attention (PhoBERT)", level: "good" },
        ],
        body: `
          <p>Giới hạn chí mạng của mọi mô hình Static Embedding (Word2Vec, PhoW2V, FastText) là <span class="term">Polysemy Bottleneck</span>: mỗi từ chỉ có <b>duy nhất 1 vector tĩnh</b> trong bảng tra cứu.</p>
          <p>Từ <code>"đường"</code> trong <em>"pha thêm đường vào cà phê"</em> và <em>"con đường này đang kẹt xe"</em> buộc phải dùng chung một vector trung bình cộng giữa đồ ăn và giao thông! Đây chính là lý do chúng ta cần <b>Contextualized Embeddings (PhoBERT)</b> ở Giai đoạn 3.</p>
        `,
        callout: {
          type: "insight",
          title: "Sắp tới",
          text: "Tiếp theo: Giai đoạn 3 — Pretrained Transformers (PhoBERT-v2): Cơ chế Self-Attention bẻ cong vector theo từng câu như thế nào?",
        },
        changes: [
          { type: "del", text: "Vector tĩnh không thể đổi hướng theo ngữ cảnh câu chứa từ đa nghĩa" },
        ],
        diagram: {
          type: "embedding-space",
          variant: "polysemy-limit",
        },
      },
    ],
  },

  "phobert-nlu": {
    id: "phobert-nlu",
    moduleNum: "03",
    moduleTitle: "Pretrained Transformers Tiếng Việt",
    stage: 3,
    title: "Kiến trúc PhoBERT-v2 & Contextual Self-Attention",
    subtitle: "Làm chủ mô hình RoBERTa Encoder tiếng Việt đạt 93.8% Macro-F1 trên UIT-VSFC và các quy tắc sống còn khi vận hành.",
    notebookTag: "Notebook 03.1",
    steps: [
      {
        label: "Self-Attention",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Self-Attention: Mỗi từ tự nhìn toàn bộ câu để cập nhật nghĩa",
        hud: [
          { label: "Mô hình", value: "vinai/phobert-base-v2", level: "good" },
          { label: "Kiến trúc", value: "12 Layers · 768d · 135M", level: "good" },
          { label: "Vector 'đường'", value: "Động theo từng câu!", level: "good" },
        ],
        body: `
          <p>Khác với bảng tra cứu tĩnh của PhoW2V, <span class="term">PhoBERT</span> đưa các token đi qua 12 tầng <span class="term">Multi-Head Self-Attention</span> hai chiều.</p>
          <p>Ở mỗi tầng, từ <code>"đường"</code> tính tích vô hướng Query-Key với mọi từ khác trong câu. Nếu câu có <code>"cà_phê"</code>, từ <code>"đường"</code> hút thông tin của <code>"cà_phê"</code> để dịch chuyển vector về cụm Thực phẩm; nếu câu có <code>"xe_máy"</code>, nó dịch chuyển về cụm Giao thông!</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Trong PhoBERT, cùng một từ nhưng đặt ở 2 câu khác nhau sẽ sinh ra 2 vector ẩn 768 chiều hoàn toàn khác nhau.",
        },
        changes: [
          { type: "add", text: "Ma trận Attention(Q,K,V) = softmax(QK^T / √d_k)V kết nối hai chiều toàn câu" },
        ],
        diagram: {
          type: "phobert-arch",
          variant: "self-attention-context",
        },
      },
      {
        label: "Tách từ + fastBPE",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Pipeline 2 tầng của PhoBERT: Word Segmentation (_) rồi mới tới fastBPE (@@)",
        hud: [
          { label: "Tầng 1: VnCoreNLP", value: "Nối từ ghép bằng '_'", level: "good" },
          { label: "Tầng 2: fastBPE", value: "64.000 subword vocab", level: "good" },
          { label: "Ký hiệu nối mảnh", value: "Hậu tố '@@'", level: "good" },
        ],
        body: `
          <p>Điểm đặc thù nhất của <code>PhoBERT</code> là bộ Tokenizer hoạt động trên <b>đơn vị từ ghép đã nối dấu gạch dưới</b>:</p>
          <p>1. Trước tiên, <code>VnCoreNLP</code> nối các âm tiết thành từ ghép: <code>"Trí_tuệ_nhân_tạo"</code>.<br/>2. Sau đó, bộ <span class="term">fastBPE</span> tra từ điển 64.000 mục. Nếu gặp từ ghép dài hoặc hiếm, nó cắt thành các subword gắn hậu tố <code>@@</code> như <code>["Trí_tuệ_@@", "nhân_tạo"]</code> và bọc thêm <code>&lt;s&gt;</code> ở đầu, <code>&lt;/s&gt;</code> ở cuối.</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "AutoTokenizer.from_pretrained('vinai/phobert-base-v2') KHÔNG tự tách từ ghép cho bạn! Bạn phải chạy VnCoreNLP/pyvi trước khi gọi tokenizer.",
        },
        changes: [
          { type: "add", text: "Chuỗi subword chuẩn: ['<s>', 'Viện_nghiên_@@', 'cứu', 'VinAI', 'tại', 'Hà_Nội', '</s>']" },
        ],
        diagram: {
          type: "phobert-arch",
          variant: "bpe-pipeline",
        },
      },
      {
        label: "Giới hạn 256 tokens",
        chapter: "Cẩn thận",
        chapterColor: "red",
        title: "Bẫy max_position_embeddings = 258 & Kỹ thuật Cửa sổ trượt",
        hud: [
          { label: "max_position_embeddings", value: "258 (<s> + 256 + </s>)", level: "warn" },
          { label: "Truyền > 256 subwords", value: "Lỗi CUDA Index Assert!", level: "bad" },
          { label: "Giải pháp văn bản dài", value: "Sliding Window (stride 192)", level: "good" },
        ],
        body: `
          <p>Một lỗi kinh điển làm sập server khi đưa <code>PhoBERT</code> vào thực tế: ma trận <span class="term">max_position_embeddings</span> của PhoBERT chỉ có kích thước <b>258</b> (tức tối đa <b>256 subword tokens</b> nội dung cộng với <code>&lt;s&gt;</code> và <code>&lt;/s&gt;</code>).</p>
          <p>Nếu bạn đặt <code>max_length=512</code> như BERT tiếng Anh, PyTorch sẽ văng lỗi CUDA ngay lập tức! Với bài báo dài, hãy luôn đặt <code>max_length=256, truncation=True</code> hoặc chia văn bản theo cửa sổ trượt (Sliding Window chồng lấp 64 tokens) rồi gộp Mean Pooling.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Luôn cấu hình tokenizer(text, max_length=256, truncation=True, padding='max_length') khi làm việc với PhoBERT.",
        },
        changes: [
          { type: "mod", text: "Giới hạn max_length <= 256 hoặc dùng Sliding Window Chunking cho văn bản dài" },
        ],
        diagram: {
          type: "phobert-arch",
          variant: "max-len-256",
        },
      },
      {
        label: "Fine-tune chuẩn",
        chapter: "Tổng kết",
        chapterColor: "ink",
        title: "Siêu tham số vàng chống Quên thảm khốc (Catastrophic Forgetting)",
        hud: [
          { label: "Learning Rate", value: "2e-5 (AdamW)", level: "good" },
          { label: "Warmup Ratio", value: "10% bước đầu", level: "good" },
          { label: "UIT-VSFC Macro-F1", value: "93.8% (+4.4% vs SVM)", level: "good" },
        ],
        body: `
          <p>Khi gắn thêm tầng phân loại <code>Linear(768 → 3)</code> lên đầu token <code>&lt;s&gt;</code> để fine-tune trên <code>UIT-VSFC</code>, tầng mới chưa có kiến thức trong khi 12 tầng PhoBERT đã hội tụ rất sâu.</p>
          <ul class="takeaways">
            <li>Dùng tốc độ học nhỏ <code>lr = 2e-5</code> kèm <b>Linear Warmup 10%</b> để không phá vỡ trọng số tiền huấn luyện (<span class="term">Catastrophic Forgetting</span>).</li>
            <li>Bật <code>fp16=True</code> giúp giảm một nửa VRAM (chỉ tốn ~4.5 GB) và đạt <b>93.8% Macro-F1</b> sau 4 epochs.</li>
          </ul>
        `,
        callout: {
          type: "insight",
          title: "Sắp tới",
          text: "Tiếp theo: Bài 3.2 — Giải bài toán NER với Subword Alignment (-100) và Tóm tắt văn bản với VietAI/vit5.",
        },
        changes: [],
        diagram: {
          type: "phobert-arch",
          variant: "finetune-head",
        },
      },
    ],
  },

  "ner-subword-vit5": {
    id: "ner-subword-vit5",
    moduleNum: "03",
    moduleTitle: "Pretrained Transformers Tiếng Việt",
    stage: 3,
    title: "NER Subword Alignment (-100) & Tóm tắt với ViT5",
    subtitle: "Giải quyết bài toán lệch nhãn khi BPE tách đôi từ ghép và quy tắc vàng phân biệt PhoBERT (_) với ViT5 (▁).",
    notebookTag: "Notebook 03.2 & 03.3",
    steps: [
      {
        label: "Lệch nhãn BPE",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Khi 1 từ ghép mang 1 nhãn NER bị BPE chặt thành 2 mảnh!",
        hud: [
          { label: "Từ gốc & Nhãn", value: "Nghiên_cứu (I-ORG)", level: "good" },
          { label: "Sau khi qua BPE", value: "['Nghiên_@@', 'cứu']", level: "warn" },
          { label: "Độ dài Tokens vs Labels", value: "Lệch nhau (Crash!)", level: "bad" },
        ],
        body: `
          <p>Trong bài toán Nhận diện thực thể (<span class="term">IOB2</span> NER trên tập <span class="term">PhoNER_COVID19</span>), nhãn được gán ở <b>cấp độ từ</b>: ví dụ <code>["Viện_nghiên_cứu", "VinAI", "Hà_Nội"]</code> có 3 nhãn <code>[B-ORG, I-ORG, B-LOC]</code>.</p>
          <p>Nhưng khi đưa vào <code>PhoBERT</code>, bộ BPE lại tách từ dài <code>"Viện_nghiên_cứu"</code> thành 2 subword <code>["Viện_nghiên_@@", "cứu"]</code>. Lúc này chuỗi đầu vào có <b>4 subwords</b> nhưng chỉ có <b>3 nhãn</b>!</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Nếu gán trùng nhãn B-ORG cho cả hai mảnh subword, mô hình sẽ hiểu nhầm là có 2 tổ chức khác nhau đứng cạnh nhau.",
        },
        changes: [
          { type: "del", text: "Số lượng subword sau BPE lớn hơn số lượng nhãn IOB2 gốc" },
        ],
        diagram: {
          type: "ner-vit5",
          variant: "subword-mismatch",
        },
      },
      {
        label: "Mặt nạ -100",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Subword Label Alignment: Gán -100 cho mọi mảnh hậu tố và token đặc biệt",
        hud: [
          { label: "Mảnh đầu 'Viện_nghiên_@@'", value: "Giữ nhãn B-ORG (ID=1)", level: "good" },
          { label: "Mảnh sau 'cứu' & <s>", value: "Gán nhãn -100 (Masked)", level: "good" },
          { label: "PhoNER Entity F1", value: "94.2% Macro-F1", level: "good" },
        ],
        body: `
          <p>Trong PyTorch, hàm <code>nn.CrossEntropyLoss()</code> có tham số mặc định <code>ignore_index = -100</code>: bất kỳ vị trí nào mang nhãn <b><code>-100</code></b> sẽ được bỏ qua hoàn toàn khi tính Loss và đạo hàm.</p>
          <p>Nhờ thuật toán <span class="term">Subword Label Alignment</span>, ta chỉ giữ nhãn thực thể thật ở <b>mảnh subword đầu tiên</b> của mỗi từ, và gán <code>-100</code> cho các mảnh nối tiếp cũng như <code>&lt;s&gt;</code>, <code>&lt;/s&gt;</code>, <code>&lt;pad&gt;</code>.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Mô hình đa nhiệm PhoNLP mở rộng kiến trúc này để giải đồng thời POS Tagging + NER + Dependency Parsing trên cùng một encoder PhoBERT.",
        },
        changes: [
          { type: "add", text: "Gán label_id = -100 cho các mảnh nối tiếp của từ bị BPE tách đôi" },
        ],
        diagram: {
          type: "ner-vit5",
          variant: "subword-mask-100",
        },
      },
      {
        label: "Encoder-Decoder ViT5",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Tóm tắt văn bản trừu tượng (Abstractive Summarization) với VietAI/vit5",
        hud: [
          { label: "Mô hình", value: "VietAI/vit5-base", level: "good" },
          { label: "Kiến trúc", value: "Encoder-Decoder (T5)", level: "good" },
          { label: "VietNews ROUGE-L", value: "41.8 ROUGE-L", level: "good" },
        ],
        body: `
          <p><code>PhoBERT</code> chỉ có nhánh Encoder nên rất giỏi phân loại và gán nhãn, nhưng không thể tự sinh ra đoạn văn mới. Để tóm tắt tin tức (<span class="term">VietNews</span>), ta chuyển sang kiến trúc <b>Encoder-Decoder</b> của <span class="term">ViT5</span>.</p>
          <p>Được tiền huấn luyện trên 138GB tiếng Việt bằng kỹ thuật <span class="term">Span Corruption</span> (ẩn các cụm từ bằng <code>&lt;extra_id_0&gt;</code>), nhánh Encoder của ViT5 đọc toàn bộ bài báo dài 1.024 tokens và nhánh Decoder tự hồi quy sinh ra đoạn Sapô tóm tắt mượt mà.</p>
        `,
        callout: {
          type: "insight",
          title: "Thước đo ROUGE",
          text: "Chất lượng tóm tắt được đo bằng ROUGE-1 (độ phủ từ), ROUGE-2 (độ trôi chảy cụm 2 từ) và ROUGE-L (chuỗi con chung dài nhất LCS).",
        },
        changes: [
          { type: "add", text: "Nhánh Encoder mã hóa bài báo → Cross-Attention → Nhánh Decoder sinh câu tóm tắt" },
        ],
        diagram: {
          type: "ner-vit5",
          variant: "vit5-seq2seq",
        },
      },
      {
        label: "PhoBERT (_) vs ViT5 (▁)",
        chapter: "Cẩn thận",
        chapterColor: "amber",
        title: "Quy tắc sống còn: Tuyệt đối KHÔNG tách từ nối '_' khi đưa vào ViT5!",
        hud: [
          { label: "Đầu vào PhoBERT", value: "BẮT BUỘC nối '_'", level: "good" },
          { label: "Đầu vào ViT5 / LLM", value: "Văn bản NFC tự nhiên", level: "good" },
          { label: "ViT5 Tokenizer", value: "SentencePiece '▁' (U+2581)", level: "good" },
        ],
        body: `
          <p>Đây là nhầm lẫn phổ biến nhất khi chuyển từ PhoBERT sang ViT5 hoặc các LLM hiện đại:</p>
          <ul class="takeaways">
            <li><b>Họ VinAI (PhoBERT, PhoNLP, PhoW2V):</b> Huấn luyện trên dữ liệu đã qua VnCoreNLP nên <b>BẮT BUỘC</b> phải tách từ nối dấu gạch dưới (<code>"Việt_Nam"</code>).</li>
            <li><b>Họ SentencePiece / Byte-BPE (ViT5, Qwen2.5, Sailor2, BGE-M3):</b> Mã hóa trực tiếp khoảng trắng thành ký tự <code>▁</code> (<code>["▁Việt", "▁Nam"]</code>). Nếu bạn nối dấu <code>_</code>, mô hình sẽ coi <code>_</code> là ký tự rác!</li>
          </ul>
        `,
        callout: {
          type: "tip",
          title: "Kiểm chứng ngay",
          text: "Mở tab 'Phòng thiết kế' → mục 03 để xem trực tiếp token của PhoBERT vs ViT5 trên cùng một câu tiếng Việt!",
        },
        changes: [],
        diagram: {
          type: "ner-vit5",
          variant: "tokenizer-contrast",
        },
      },
    ],
  },

  "qlora-nf4": {
    id: "qlora-nf4",
    moduleNum: "04",
    moduleTitle: "LLM Tiếng Việt, QLoRA & Agentic RAG",
    stage: 4,
    title: "LLM Tiếng Việt, Token Fertility & Tinh chỉnh QLoRA 4-bit",
    subtitle: "Cách tinh chỉnh mô hình 7B–8B tham số (Qwen2.5, Sailor2, URA-LLaMA) ngay trên 1 GPU 12–16GB VRAM.",
    notebookTag: "Notebook 04.1",
    steps: [
      {
        label: "Token Fertility",
        chapter: "Bối cảnh",
        chapterColor: "sand",
        title: "Token Fertility Rate: Tại sao LLaMA-2 gốc đọc tiếng Việt chậm gấp đôi Qwen2.5 / Sailor2?",
        hud: [
          { label: "LLaMA-2 gốc (32k vocab)", value: "~2.85 tokens / từ VN", level: "bad" },
          { label: "Qwen2.5 / Sailor2 (152k)", value: "~1.25 tokens / từ VN", level: "good" },
          { label: "Tiết kiệm KV-Cache & Tốc độ", value: "Nhanh gấp 2.2×", level: "good" },
        ],
        body: `
          <p>Khi chọn LLM nguồn mở cho tiếng Việt, thông số đầu tiên phải đo là <span class="term">Token Fertility Rate</span> (số lượng subword tokens trung bình để mã hóa 1 từ tiếng Việt).</p>
          <p>Các mô hình đời cũ chỉ có 32.000 token tiếng Anh phải bẻ một chữ <code>"nghiệp"</code> thành 3–4 mảnh byte rời. Ngược lại, <span class="term">Qwen2.5</span>, <span class="term">Sailor2</span> và <code>URA-LLaMA</code> sở hữu từ điển ~152.000 tokens chứa trọn vẹn các âm tiết tiếng Việt có dấu, giúp đọc văn bản dài gấp đôi và giảm 50% bộ nhớ <span class="term">KV-Cache</span>!</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Fertility Rate ~1.25 nghĩa là gần như mỗi âm tiết tiếng Việt chỉ tốn đúng 1 token duy nhất.",
        },
        changes: [
          { type: "add", text: "Chọn nền tảng Qwen2.5-7B-Instruct hoặc Sailor2-8B với Fertility ~1.25 tok/từ" },
        ],
        diagram: {
          type: "qlora-flow",
          variant: "token-fertility",
        },
      },
      {
        label: "Bức tường VRAM",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Full Fine-tuning một LLM 7 tỷ tham số ngốn hơn 60 GB VRAM!",
        hud: [
          { label: "Trọng số BF16 (7B)", value: "14.0 GB VRAM", level: "warn" },
          { label: "Gradients + AdamW States", value: "42.0 GB VRAM", level: "bad" },
          { label: "Tổng VRAM Full Train", value: "~62.0 GB (Quá tải T4/4090)", level: "bad" },
        ],
        body: `
          <p>Một mô hình 7 tỷ tham số (7B) lưu ở chuẩn 16-bit (<code>bfloat16</code>, 2 bytes/tham số) đã tốn <b>14 GB VRAM</b> chỉ để nạp trọng số.</p>
          <p>Nếu cập nhật toàn bộ 7 tỷ tham số (Full Fine-tuning), bạn phải lưu thêm 14 GB đạo hàm (Gradients) và 28 GB trạng thái động lượng FP32 của trình tối ưu <code>AdamW</code>, cộng thêm Activations — tổng cộng vượt quá <b>60 GB VRAM</b>!</p>
        `,
        callout: {
          type: "warn",
          title: "Rào cản phần cứng",
          text: "GPU phổ thông như Google Colab T4 (16GB) hay RTX 3090/4090 (24GB) sẽ lập tức báo lỗi CUDA Out Of Memory.",
        },
        changes: [
          { type: "del", text: "Trạng thái AdamW và Gradients trên toàn bộ 7B tham số làm tràn VRAM" },
        ],
        diagram: {
          type: "qlora-flow",
          variant: "vram-wall",
        },
      },
      {
        label: "Nhánh LoRA (B×A)",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "LoRA: Đóng băng trọng số gốc W₀, chỉ huấn luyện hai ma trận hạng thấp B × A",
        hud: [
          { label: "Trọng số gốc W₀", value: "Đóng băng (Frozen)", level: "good" },
          { label: "Nhánh Adapter ΔW", value: "B(d×r) × A(r×k), r=16", level: "good" },
          { label: "Số tham số cần train", value: "Chỉ ~0.8% tổng tham số!", level: "good" },
        ],
        body: `
          <p><span class="term">LoRA</span> (Low-Rank Adaptation) phát hiện ra rằng độ biến thiên trọng số <code>ΔW</code> khi thích nghi sang tác vụ mới có hạng nội tại (intrinsic rank) rất thấp.</p>
          <p>Ta khóa cứng ma trận gốc <code>W₀ (4096 × 4096)</code> và gắn song song hai ma trận nhỏ <code>A (16 × 4096)</code> và <code>B (4096 × 16)</code> với hạng <code>r = 16</code>: <code>h = W₀x + (α/r) B·A·x</code>. Số tham số cần tính đạo hàm và lưu trạng thái AdamW giảm đi <b>99%</b>!</p>
        `,
        callout: {
          type: "tip",
          title: "Không tốn độ trễ",
          text: "Khi suy luận (inference), ta cộng trực tiếp W = W₀ + (α/r)B·A một lần duy nhất nên tốc độ chạy nhanh y hệt mô hình gốc.",
        },
        changes: [
          { type: "add", text: "Chèn LoRA Adapter (r=16, alpha=32) vào 7 tầng chiếu Attention & MLP" },
        ],
        diagram: {
          type: "qlora-flow",
          variant: "lora-adapter",
        },
      },
      {
        label: "QLoRA 4-bit NF4",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "QLoRA & Lượng tử hóa 4-bit NormalFloat (NF4): Nén 7B xuống còn ~6.8 GB VRAM!",
        hud: [
          { label: "Trọng số gốc W₀ (NF4)", value: "Chỉ 4.1 GB VRAM!", level: "good" },
          { label: "LoRA + Activations", value: "~2.7 GB (BF16)", level: "good" },
          { label: "Tổng VRAM QLoRA 7B", value: "~6.8 GB (Chạy mượt T4!)", level: "good" },
        ],
        body: `
          <p><span class="term">QLoRA</span> đi thêm một bước đột phá: vì <code>W₀</code> đã đóng băng, tại sao phải giữ nó ở 16-bit (14 GB)? QLoRA nén <code>W₀</code> xuống chuẩn <span class="term">4-bit NF4</span> (NormalFloat 4-bit có lưới phân vị dày đặc quanh điểm 0 theo phân phối chuẩn) kết hợp <b>Double Quantization</b>.</p>
          <p>Trọng số <code>W₀</code> 7B giờ chỉ chiếm <b>~4.1 GB VRAM</b>. Trong mỗi bước tính toán, GPU giải lượng tử tạm thời từng khối 64 số lên <code>BF16</code> để nhân với đầu vào, còn đạo hàm chỉ truyền qua nhánh LoRA 16-bit!</p>
        `,
        callout: {
          type: "insight",
          title: "Tổng kết",
          text: "Nhờ QLoRA 4-bit NF4, bạn có thể tinh chỉnh Qwen2.5-7B hoặc Sailor2-8B trên dữ liệu hội thoại doanh nghiệp Việt Nam chỉ với 1 GPU Colab T4 miễn phí.",
        },
        changes: [
          { type: "mod", text: "Giảm tổng VRAM huấn luyện mô hình 7B từ ~62 GB xuống còn ~6.8 GB" },
        ],
        diagram: {
          type: "qlora-flow",
          variant: "qlora-nf4-arch",
        },
      },
    ],
  },

  "langgraph-hybrid-rag": {
    id: "langgraph-hybrid-rag",
    moduleNum: "04",
    moduleTitle: "LLM Tiếng Việt, QLoRA & Agentic RAG",
    stage: 4,
    title: "Kiến trúc Hybrid Agentic RAG với LangGraph",
    subtitle: "Kết hợp BM25 (có tách từ) + BGE-M3 + RRF và vòng lặp tự kiểm định Self-RAG để triệt tiêu ảo giác.",
    notebookTag: "Notebook 04.2",
    steps: [
      {
        label: "Naive RAG trượt",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Tại sao Naive RAG chỉ dùng Dense Vector thường tìm sai tài liệu tiếng Việt?",
        hud: [
          { label: "Truy vấn mã hiệu / tên riêng", value: '"Điều 128", "RDRSegmenter"', level: "warn" },
          { label: "Dense Vector thuần", value: "Làm mờ từ khóa chính xác", level: "bad" },
          { label: "Hậu quả trên LLM", value: "Ảo giác (Hallucination)", level: "bad" },
        ],
        body: `
          <p>Một hệ thống RAG cơ bản (Naive RAG) chỉ nhúng câu hỏi thành 1 vector đặc rồi tìm kiếm Cosine. Cách này rất tốt khi hỏi ý khái quát, nhưng lại <b>trượt nặng</b> khi người dùng hỏi chính xác số hiệu văn bản pháp luật (<code>"Nghị định 100/2019"</code>), mã sản phẩm, hoặc thuật ngữ như <code>"RDRSegmenter"</code>.</p>
          <p>Khi bộ Retriever trả về đoạn văn gần giống nhưng sai điều khoản, LLM ở phía sau sẽ tự tin bịa đặt câu trả lời (<span class="term">Hallucination</span>)!</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Trong RAG tuyến tính một chiều (Retrieve → Generate), LLM hoàn toàn bị động trước tài liệu rác do Retriever đưa vào.",
        },
        changes: [
          { type: "del", text: "Dense Embedding đơn lẻ bỏ sót từ khóa chính xác; thiếu bước kiểm tra tài liệu" },
        ],
        diagram: {
          type: "rag-graph",
          variant: "naive-rag-fail",
        },
      },
      {
        label: "Hybrid BM25 + BGE-M3",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Truy xuất Lai (Hybrid Retrieval): Okapi BM25 (tách từ pyvi) + Dense BGE-M3",
        hud: [
          { label: "Nhánh Sparse (Từ khóa)", value: "BM25 + pyvi tách từ", level: "good" },
          { label: "Nhánh Dense (Ngữ nghĩa)", value: "BAAI/bge-m3 (1024d)", level: "good" },
          { label: "Độ phủ truy xuất", value: "Bắt cả mã hiệu & đồng nghĩa", level: "good" },
        ],
        body: `
          <p>Để không bỏ sót bất kỳ tài liệu nào trên tập <span class="term">UIT-ViQuAD 2.0</span>, ta chạy song song 2 nhánh truy xuất:</p>
          <p>1. <b>Nhánh Sparse (<span class="term">BM25</span>):</b> Văn bản được <b>tách từ ghép bằng <code>pyvi</code></b> trước khi lập chỉ mục để bắt chính xác tuyệt đối từ ghép chuyên ngành và mã hiệu.<br/>2. <b>Nhánh Dense (<span class="term">BGE-M3</span> / Halong Embedding):</b> Đọc câu tiếng Việt tự nhiên để tìm các đoạn văn tương đồng về mặt ý nghĩa ngay cả khi dùng từ đồng nghĩa.</p>
        `,
        callout: {
          type: "tip",
          title: "Lưu ý tiền xử lý",
          text: "Nhánh BM25 CẦN tách từ nối '_', trong khi nhánh BGE-M3 nhận văn bản chuẩn NFC tự nhiên không nối '_'.",
        },
        changes: [
          { type: "add", text: "Chạy song song BM25 (khớp từ khóa) và BAAI/bge-m3 (khớp vector ngữ nghĩa)" },
        ],
        diagram: {
          type: "rag-graph",
          variant: "hybrid-dual",
        },
      },
      {
        label: "Hợp nhất RRF",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Reciprocal Rank Fusion (RRF): Hợp nhất hai bảng xếp hạng không cần chuẩn hóa điểm",
        hud: [
          { label: "Công thức RRF", value: "Σ 1 / (60 + rank_i(d))", level: "good" },
          { label: "ViQuAD Recall@5", value: "91.5% (+12.4% vs đơn lẻ)", level: "good" },
          { label: "Độ trễ truy xuất", value: "~38 ms", level: "good" },
        ],
        body: `
          <p>Điểm BM25 có thể từ <code>0</code> đến hàng chục, trong khi điểm Cosine của BGE-M3 nằm trong <code>[-1, 1]</code>. Làm sao cộng hai thang điểm khác nhau?</p>
          <p>Thuật toán <span class="term">RRF</span> (Reciprocal Rank Fusion) giải quyết cực gọn bằng cách chỉ lấy <b>thứ hạng (rank = 1, 2, 3...)</b> của tài liệu ở mỗi nhánh: <code>RRF(d) = 1/(60 + rank_BM25) + 1/(60 + rank_Dense)</code>. Tài liệu đứng hạng cao ở cả hai nhánh sẽ tự động vươn lên Top 1!</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "RRF miễn nhiễm với sự chênh lệch thang đo giữa các mô hình và luôn ổn định trên mọi miền dữ liệu tiếng Việt.",
        },
        changes: [
          { type: "add", text: "Hợp nhất Top-K tài liệu từ BM25 và BGE-M3 bằng Reciprocal Rank Fusion (k=60)" },
        ],
        diagram: {
          type: "rag-graph",
          variant: "rrf-fusion",
        },
      },
      {
        label: "Vòng lặp Self-RAG",
        chapter: "Kỹ thuật",
        chapterColor: "violet",
        title: "Đồ thị trạng thái có chu trình LangGraph: Document Grader & Query Rewriter",
        hud: [
          { label: "Node kiểm định", value: "Self-RAG Document Grader", level: "good" },
          { label: "Khi điểm < ngưỡng", value: "Vòng lặp Query Rewriter", level: "warn" },
          { label: "Tỉ lệ Ảo giác", value: "< 1.5% (Có trích dẫn)", level: "good" },
        ],
        body: `
          <p>Thay vì đẩy thẳng tài liệu Top-K vào Generator, <span class="term">LangGraph</span> tổ chức pipeline thành một đồ thị trạng thái có nhánh rẽ điều kiện (Conditional Edge):</p>
          <p>• <b>Node Document Grader:</b> Chấm điểm xem tài liệu tìm được có thực sự trả lời được câu hỏi hay không.<br/>• Nếu <b>Đạt</b> → chuyển sang <b>Faithful Generator</b> sinh câu trả lời kèm mã trích dẫn <code>[Doc_ID]</code>.<br/>• Nếu <b>Không đạt</b> → rẽ sang <b>Query Rewriter</b> để viết lại câu hỏi rõ nghĩa hơn rồi quay lại bước truy xuất!</p>
        `,
        callout: {
          type: "tip",
          title: "Trải nghiệm trực tiếp",
          text: "Bấm 'Chạy thử Python' để mở Phòng thiết kế LangGraph RAG và kéo thanh trượt trọng số Hybrid trên tập dữ liệu UIT-ViQuAD 2.0!",
        },
        changes: [
          { type: "add", text: "Thêm chu trình tự sửa lỗi: Document Grader → Conditional Edge → Query Rewriter" },
        ],
        diagram: {
          type: "rag-graph",
          variant: "langgraph-cycle",
        },
      },
      {
        label: "Tổng kết khóa học",
        chapter: "Tổng kết",
        chapterColor: "ink",
        title: "Bức tranh toàn cảnh: Từ Byte UTF-8 đến Hệ thống Agentic RAG Tiếng Việt",
        hud: [
          { label: "Tổng độ trễ RAG", value: "~189 ms / truy vấn", level: "good" },
          { label: "Độ chính xác toàn cục", value: "91.5% Recall · 94% F1", level: "good" },
          { label: "Lộ trình 4 Giai đoạn", value: "Hoàn tất 100%", level: "good" },
        ],
        body: `
          <p>Chúc mừng bạn đã đi trọn vẹn hành trình 4 Giai đoạn của <b>LearnNLP</b>! Mọi hệ thống AI Tiếng Việt quy mô lớn đều được lắp ghép từ chính các viên gạch bạn vừa bước qua:</p>
          <ul class="takeaways">
            <li><b>Giai đoạn 1:</b> Chuẩn hóa Unicode <code>NFC</code>, dấu thanh Kiểu Cũ và tách từ ghép (<code>RDRSegmenter</code> / <code>pyvi</code>).</li>
            <li><b>Giai đoạn 2:</b> Dựng baseline <code>TF-IDF + LinearSVC</code> siêu tốc và hiểu không gian vector <code>PhoW2V</code>.</li>
            <li><b>Giai đoạn 3:</b> Fine-tune <code>PhoBERT-v2</code> (nối <code>_</code>, <code>max_len=256</code>), gán nhãn <code>-100</code> cho NER và tóm tắt với <code>ViT5</code> (không nối <code>_</code>).</li>
            <li><b>Giai đoạn 4:</b> Tinh chỉnh LLM bằng <code>QLoRA 4-bit NF4</code> và chống ảo giác với <code>Hybrid RAG + LangGraph</code>.</li>
          </ul>
        `,
        callout: {
          type: "insight",
          title: "Bước tiếp theo",
          text: "Hãy chuyển sang tab 'Phòng thiết kế' để thử nghiệm trực tiếp với Python Backend, hoặc tab 'Luyện tập' để hoàn thành 16 câu Quiz nhận trọn 1.200 XP!",
        },
        changes: [],
        diagram: {
          type: "rag-graph",
          variant: "full-architecture",
        },
      },
    ],
  },

  "production-data-chunking": {
    id: "production-data-chunking",
    moduleNum: "05",
    moduleTitle: "Thực chiến Sản xuất (Production & Applied NLP)",
    stage: 5,
    title: "Ẩn danh PII, Phân mảnh Điều/Khoản & Cross-Encoder Reranker",
    subtitle: "Làm sao xử lý hợp đồng, văn bản pháp luật dài 200 trang và dữ liệu nhạy cảm của khách hàng trong thực tế?",
    notebookTag: "Production Playbook 05.1",
    steps: [
      {
        label: "Rò rỉ PII & NĐ 13",
        chapter: "Vấn đề",
        chapterColor: "red",
        title: "Rủi ro pháp lý khi gửi thẳng CCCD, SĐT, Hợp đồng khách hàng lên Cloud LLM",
        hud: [
          { label: "Dữ liệu thực tế", value: "CCCD · SĐT · Email · STK", level: "bad" },
          { label: "Gửi thẳng Cloud API", value: "Vi phạm NĐ 13/2023!", level: "bad" },
          { label: "Lớp chặn bắt buộc", value: "PII Redaction / Masking", level: "good" },
        ],
        body: `
          <p>Trong bài tập học thuật, dữ liệu đều công khai. Nhưng trong ngân hàng, y tế hay TMĐT tại Việt Nam, văn bản chứa đầy <b>Thông tin định danh cá nhân (<span class="term">PII Masking</span>)</b>: Số CCCD 12 số, Số điện thoại, Email, Số tài khoản.</p>
          <p>Theo <b>Nghị định 13/2023/NĐ-CP</b> về Bảo vệ dữ liệu cá nhân, nếu bạn gửi nguyên văn đoạn chat chứa CCCD/SĐT khách hàng lên các API LLM bên thứ ba mà chưa ẩn danh, doanh nghiệp sẽ đối mặt với rủi ro pháp lý và rò rỉ dữ liệu nghiêm trọng!</p>
        `,
        callout: {
          type: "warn",
          title: "Cẩn thận",
          text: "Luôn đặt một tầng PII Scrubber (Regex + PhoNLP NER) để thay thế CCCD → [MASKED_CCCD], SĐT → [MASKED_PHONE] trước khi lưu Vector DB hoặc gọi LLM.",
        },
        changes: [
          { type: "add", text: "Quét và che tự động CCCD 12 số, SĐT di động Việt Nam (+84/03/05/07/08/09) và Email" },
        ],
        diagram: {
          type: "prod-data",
          variant: "pii-masking",
        },
      },
      {
        label: "Gán nhãn & Kappa",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Data-Centric NLP: Xây dựng tập dữ liệu nội bộ & Đo độ đồng thuận Cohen's Kappa",
        hud: [
          { label: "Thước đo đồng thuận", value: "Cohen's Kappa (κ >= 0.80)", level: "good" },
          { label: "Tăng tốc gán nhãn", value: "Active Learning + LLM", level: "good" },
          { label: "Khử lỗi OCR/Không dấu", value: "Diacritic Restoration", level: "good" },
        ],
        body: `
          <p>Trong thực tế, cải thiện chất lượng dữ liệu tăng F1 nhanh hơn đổi mô hình. Quy trình chuẩn để tạo tập dữ liệu doanh nghiệp gồm:</p>
          <p>1. <b>Đo độ đồng thuận (<span class="term">Cohen's Kappa</span>):</b> Cho ít nhất 2 người gán nhãn độc lập trên cùng 200 mẫu. Nếu <code>κ &lt; 0.75</code>, hướng dẫn gán nhãn (Guideline) đang mơ hồ và cần viết lại.<br/>2. <b>Active Learning:</b> Dùng mô hình hiện tại tìm các câu có độ bất định cao nhất (Confidence ~50%) để con người ưu tiên gán nhãn trước, tiết kiệm 70% chi phí nhân sự.</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Với văn bản scan PDF lỗi OCR hoặc khách hàng gõ tiếng Việt không dấu, cần chạy mô hình khôi phục dấu (Diacritic Restoration) trước khi tách từ.",
        },
        changes: [
          { type: "add", text: "Kiểm định chất lượng nhãn bằng Cohen's Kappa (κ >= 0.8) + Vòng lặp Active Learning" },
        ],
        diagram: {
          type: "prod-data",
          variant: "active-learning",
        },
      },
      {
        label: "Chunking Điều/Khoản",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Structure-Aware Chunking: Tại sao cắt cứng 500 ký tự phá hỏng văn bản Luật Việt Nam?",
        hud: [
          { label: "Fixed-size 500 chars", value: "Cắt đứt câu · Mất tiêu đề", level: "bad" },
          { label: "Structure-Aware", value: "Chương → Điều → Khoản", level: "good" },
          { label: "Header Injection", value: "[Chương II > Điều 15] ...", level: "good" },
        ],
        body: `
          <p>Sai lầm số 1 khi làm RAG cho tài liệu doanh nghiệp là dùng <code>RecursiveCharacterTextSplitter(chunk_size=500)</code> cắt mù quáng: một khoản phạt bị cắt lìa khỏi tên <b>Điều</b> và <b>Chương</b> phía trên, khiến đoạn chunk chỉ còn dòng chữ cụt lủn <em>"2. Mức phạt là 8% giá trị..."</em> (không biết phạt cho hành vi gì!).</p>
          <p>Giải pháp chuẩn là <span class="term">Structure-Aware Chunking</span>: cắt theo ranh giới <code>Chương / Điều / Khoản</code> và luôn <b>đính kèm đường dẫn tiêu đề cha</b> (<code>[Hợp đồng > Chương II > Điều 15]</code>) vào đầu mỗi chunk trước khi tạo vector!</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Contextual Header Injection giúp mỗi đoạn chunk nhỏ luôn mang đầy đủ ngữ cảnh pháp lý của toàn bộ văn bản.",
        },
        changes: [
          { type: "mod", text: "Thay Fixed-Size Chunking bằng Structure-Aware Chunking + Parent Header Injection" },
        ],
        diagram: {
          type: "prod-data",
          variant: "structure-chunking",
        },
      },
      {
        label: "Cross-Encoder Rerank",
        chapter: "Kỹ thuật",
        chapterColor: "violet",
        title: "Tầng lọc tinh Cross-Encoder Reranker (bge-reranker-v2-m3): Vũ khí tăng 18% độ chính xác RAG",
        hud: [
          { label: "Tầng 1: Hybrid RRF", value: "Lấy nhanh Top-25 (30ms)", level: "good" },
          { label: "Tầng 2: Cross-Encoder", value: "bge-reranker-v2-m3 (65ms)", level: "good" },
          { label: "Đầu vào cho LLM", value: "Top-3 tinh lọc (96.2% P@3)", level: "good" },
        ],
        body: `
          <p>Bi-Encoder (như <code>BGE-M3</code>) nén câu hỏi và tài liệu thành 2 vector riêng biệt nên rất nhanh (tìm trong 1 triệu đoạn chỉ mất 20ms), nhưng không nhìn thấy tương tác sâu từng từ giữa câu hỏi và tài liệu.</p>
          <p>Trong Production RAG, ta luôn dùng kiến trúc <b>2 tầng (Retrieve &amp; Rerank)</b>: Tầng 1 dùng <code>BM25 + BGE-M3</code> lấy nhanh Top-25 ứng viên; Tầng 2 dùng <span class="term">Cross-Encoder Reranker</span> (<code>BAAI/bge-reranker-v2-m3</code>) ghép trực tiếp <code>[CLS] Câu hỏi [SEP] Đoạn văn</code> chạy Self-Attention toàn phần để chọn ra <b>Top-3</b> chuẩn xác nhất đưa vào LLM!</p>
        `,
        callout: {
          type: "tip",
          title: "Trải nghiệm trực tiếp",
          text: "Bấm nút 'Chạy thử Python' để so sánh trực tiếp Structure-Aware Chunking vs Fixed-Size Chunking và PII Masking trên văn bản hợp đồng thật!",
        },
        changes: [
          { type: "add", text: "Chèn tầng Cross-Encoder Reranker (Top-25 → Top-3) trước khi gọi LLM Generator" },
        ],
        diagram: {
          type: "prod-data",
          variant: "cross-encoder-rerank",
        },
      },
    ],
  },

  "production-serving-eval": {
    id: "production-serving-eval",
    moduleNum: "05",
    moduleTitle: "Thực chiến Sản xuất (Production & Applied NLP)",
    stage: 5,
    title: "Ma trận Chọn Mô hình, Structured JSON, vLLM/ONNX & RAGAS",
    subtitle: "Cách tối ưu chi phí gấp 50 lần, ép LLM trả về JSON 100% đúng schema và giám sát hệ thống trên Production.",
    notebookTag: "Production Playbook 05.2",
    steps: [
      {
        label: "Ma trận Chọn Model",
        chapter: "Đánh đổi",
        chapterColor: "amber",
        title: "Đừng dùng đại bác bắn chim sẻ: Ma trận Quyết định Chọn Mô hình theo Độ trễ & Chi phí",
        hud: [
          { label: "Tầng 1: Regex + Từ điển", value: "0.1 ms · $0 (Lọc luật/PII)", level: "good" },
          { label: "Tầng 2: TF-IDF + SVM", value: "1.5 ms · CPU (Baseline)", level: "good" },
          { label: "Tầng 3: PhoBERT ONNX", value: "6 ms · 94% F1 (Phân loại/NER)", level: "good" },
        ],
        body: `
          <p>Sai lầm đắt giá nhất của kỹ sư mới vào nghề là <b>dùng LLM 7B–70B cho mọi bài toán</b>. Nếu bạn cần phân loại 10 triệu bình luận mỗi ngày, gọi LLM sẽ tốn hàng chục ngàn USD và chậm hàng giây, trong khi <code>PhoBERT</code> làm tốt hơn với chi phí chỉ bằng <b>1/100</b>!</p>
          <p>• <b>Cần phân loại văn bản, gán nhãn cảm xúc, trích xuất thực thể cố định (NER):</b> Dùng <code>TF-IDF + LinearSVC</code> hoặc <code>PhoBERT-v2</code>.<br/>• <b>Cần tóm tắt, hỏi đáp đa nguồn (RAG), suy luận linh hoạt:</b> Mới dùng tới <code>ViT5</code> hoặc <code>Qwen2.5 / Sailor2</code>.</p>
        `,
        callout: {
          type: "insight",
          title: "Kiến trúc Phân tầng (Tiered Routing)",
          text: "Trong thực tế, một bộ phân loại nhẹ (TF-IDF hoặc PhoBERT) đứng ở cửa ngõ sẽ xử lý 80% truy vấn đơn giản trong 5ms, và chỉ đẩy 20% ca phức tạp sang LLM!",
        },
        changes: [
          { type: "add", text: "Thiết lập Intent Router bằng PhoBERT/LinearSVC phía trước LLM để tiết kiệm 80% chi phí GPU" },
        ],
        diagram: {
          type: "prod-serving",
          variant: "decision-matrix",
        },
      },
      {
        label: "Structured JSON",
        chapter: "Kỹ thuật",
        chapterColor: "blue",
        title: "Constrained Decoding & Function Calling: Ép LLM trả về 100% JSON hợp lệ",
        hud: [
          { label: "Free-text LLM Output", value: "Dễ lỗi cú pháp JSON", level: "bad" },
          { label: "Pydantic JSON Schema", value: "100% Valid Schema", level: "good" },
          { label: "Function Calling", value: "Kết nối SQL / ERP API", level: "good" },
        ],
        body: `
          <p>Khi tích hợp NLP vào phần mềm kế toán, CRM hay ERP, backend không cần câu văn xã giao <em>"Dạ, đơn hàng của anh..."</em> mà cần <b>cấu trúc JSON</b> để ghi vào Database.</p>
          <p>Sử dụng kỹ thuật <span class="term">Structured Output</span> (Guided/Constrained Decoding theo <code>Pydantic Schema</code>), engine suy luận sẽ khóa xác suất logit của mọi token vi phạm cú pháp JSON tại từng bước sinh chữ — đảm bảo đầu ra luôn khớp 100% kiểu dữ liệu và sẵn sàng kích hoạt <b>Function Calling</b> (tra cứu SQL, tính toán hóa đơn).</p>
        `,
        callout: {
          type: "tip",
          title: "Nên biết",
          text: "Không bao giờ cho LLM tự nhẩm phép cộng trừ tiền tệ phức tạp; hãy dùng Function Calling để LLM gọi hàm Python/SQL tính toán rồi nhận lại kết quả.",
        },
        changes: [
          { type: "add", text: "Áp dụng Pydantic JSON Schema / Constrained Decoding cho mọi API trả dữ liệu cấu trúc" },
        ],
        diagram: {
          type: "prod-serving",
          variant: "structured-json",
        },
      },
      {
        label: "ONNX & vLLM Serving",
        chapter: "Giải pháp",
        chapterColor: "green",
        title: "Tăng tốc gấp 10 lần với ONNX Runtime (PhoBERT) và vLLM Continuous Batching (LLM)",
        hud: [
          { label: "PhoBERT ONNX INT8", value: "~4.8 ms (Tăng tốc 4×)", level: "good" },
          { label: "vLLM PagedAttention", value: ">120 tok/s · 100+ users", level: "good" },
          { label: "Semantic Cache", value: "Giảm 40% lượt gọi LLM", level: "good" },
        ],
        body: `
          <p>Không bao giờ dùng <code>model.generate()</code> mặc định của Hugging Face để phục vụ người dùng thật trên Production:</p>
          <p>1. <b>Với PhoBERT / BGE-M3 / Reranker:</b> Xuất mô hình sang <span class="term">ONNX Runtime</span> (hoặc TensorRT) và lượng tử hóa INT8/FP16 để chạy dưới <b>5–10 ms</b>.<br/>2. <b>Với LLM (Qwen2.5 / Sailor2):</b> Phục vụ qua <span class="term">vLLM</span> hoặc <code>SGLang</code>. Cơ chế <b>PagedAttention</b> và <b>Continuous Batching</b> giúp ghép hàng chục người dùng vào cùng 1 lượt chạy GPU, kèm <b>Semantic Cache</b> (trả lời ngay các câu hỏi trùng ngữ nghĩa đã hỏi trước đó).</p>
        `,
        callout: {
          type: "insight",
          title: "Ý chính",
          text: "Continuous Batching trong vLLM tăng thông lượng (throughput) lên gấp 8–15 lần so với chạy tuần tự từng request.",
        },
        changes: [
          { type: "add", text: "Triển khai PhoBERT trên ONNX Runtime + Qwen2.5 trên vLLM + Redis Semantic Cache" },
        ],
        diagram: {
          type: "prod-serving",
          variant: "vllm-onnx-serving",
        },
      },
      {
        label: "Guardrails & RAGAS",
        chapter: "Tổng kết",
        chapterColor: "ink",
        title: "Vòng lặp Vận hành: Chống Prompt Injection (Guardrails) & Giám sát RAGAS",
        hud: [
          { label: "Input Guardrail", value: "Chặn Prompt Injection", level: "good" },
          { label: "Bộ chỉ số RAGAS", value: "Faithfulness >= 0.95", level: "good" },
          { label: "Lộ trình 5 Mô-đun", value: "Sẵn sàng Production!", level: "good" },
        ],
        body: `
          <p>Bước cuối cùng để hệ thống vận hành bền vững trong doanh nghiệp là <b>Bảo vệ &amp; Quan sát (Observability)</b>:</p>
          <ul class="takeaways">
            <li><b>Input/Output Guardrails:</b> Chặn tấn công <em>Prompt Injection</em> (người dùng cố tình gài lệnh chiếm quyền điều khiển prompt) và lọc thông tin nhạy cảm ở đầu ra.</li>
            <li><b>Đánh giá tự động với <span class="term">RAGAS</span>:</b> Chấm điểm định kỳ 4 trụ cột: <em>Context Precision</em>, <em>Context Recall</em>, <em>Faithfulness</em> (độ trung thực không bịa đặt) và <em>Answer Relevance</em>.</li>
            <li><b>Feedback Loop:</b> Lưu lại các ca người dùng bấm 👎 (Thumbs-down) hoặc có điểm Reranker thấp để bổ sung tài liệu và tinh chỉnh mô hình định kỳ.</li>
          </ul>
        `,
        callout: {
          type: "tip",
          title: "Thực hành ngay trong Phòng thiết kế",
          text: "Bấm nút 'Chạy thử Python' để mở Lab 05: Thử nghiệm ẩn danh PII, phân mảnh Điều/Khoản, chặn Prompt Injection và xuất JSON Schema!",
        },
        changes: [],
        diagram: {
          type: "prod-serving",
          variant: "guardrails-ragas",
        },
      },
    ],
  },
};

const LESSON_ORDER = [
  "unicode-tone",
  "word-segmentation",
  "tfidf-linear",
  "phow2v-space",
  "phobert-nlu",
  "ner-subword-vit5",
  "qlora-nf4",
  "langgraph-hybrid-rag",
  "production-data-chunking",
  "production-serving-eval",
];

// ============================================================================
// QUIZ BANK (16 QUESTIONS ACROSS 4 STAGES)
// ============================================================================
const QUIZ_BANK = {
  1: [
    {
      q: "Câu 1.1: Tại sao hai chuỗi 'Tiếng Việt' (NFC) và 'Tiếng Việt' (NFD) hiển thị giống hệt nhau nhưng lại làm hỏng từ điển của PhoBERT?",
      options: [
        "Vì NFD tách chữ cái và dấu thanh thành các codepoint rời nhau (ví dụ 'ệ' = 'e' + dấu nặng + dấu mũ), khiến BPE Tokenizer không khớp được từ trong từ điển NFC.",
        "Vì Python 3 không hỗ trợ bảng mã Unicode tổ hợp NFD.",
        "Vì NFD tự động xóa toàn bộ khoảng trắng trong câu.",
      ],
      correct: 0,
      explain: "Chính xác! Từ điển (vocab) của PhoBERT, ViT5, BGE-M3 được xây dựng trên chuẩn NFC dựng sẵn. Nếu đầu vào ở dạng NFD tổ hợp, từ sẽ bị bẻ vụn thành các subword rác hoặc [UNK].",
    },
    {
      q: "Câu 1.2: Với các âm tiết kết thúc bằng vần 'oa, oe, uy' (không có phụ âm cuối), quy tắc đặt dấu thanh nào tương thích chuẩn nhất với dữ liệu huấn luyện gốc của VnCoreNLP và PhoBERT?",
      options: [
        "Kiểu Mới: hoà bình, sức khoẻ, thuỷ lợi",
        "Kiểu Cũ: hòa bình, sức khỏe, thủy lợi (riêng 'quý giá' giữ dấu trên 'y')",
        "Bỏ toàn bộ dấu thanh tiếng Việt trước khi đưa vào PhoBERT",
      ],
      correct: 1,
      explain: "Đúng! Kho dữ liệu 20GB huấn luyện PhoBERT và VnCoreNLP chủ yếu sử dụng quy tắc dấu thanh kiểu cũ ('hòa', 'khỏe', 'thủy').",
    },
    {
      q: "Câu 1.3: Thuật toán RDRSegmenter của VnCoreNLP giải quyết hiện tượng nhập nhằng ranh giới từ ghép tiếng Việt bằng cơ chế nào?",
      options: [
        "Khởi tạo bằng Longest-Matching từ điển, sau đó duyệt qua Cây quy tắc ngoại lệ SCRDR (Single Classification Ripple-Down Rules) xét ngữ cảnh 5 âm tiết xung quanh để sửa nhãn B_W / I_W.",
        "Cắt ngẫu nhiên cứ 2 âm tiết thành 1 từ ghép.",
        "Chỉ tra từ điển đơn thuần mà không xét ngữ cảnh câu.",
      ],
      correct: 0,
      explain: "Chính xác! Cây quy tắc ngoại lệ SCRDR giúp VnCoreNLP đạt ~97.9% F1 trên tập VLSP 2013 và xử lý tốt các câu nhập nhằng như 'Học_sinh học sinh_học'.",
    },
    {
      q: "Câu 1.4: Ký tự ẩn Zero-Width Space (U+200B) thường xuất hiện khi copy văn bản từ web/PDF gây ra tác hại gì nếu không được xóa trước khi tách từ?",
      options: [
        "Nó nằm xen giữa các chữ cái (ví dụ 'giảng\\u200bviên') khiến mắt thường không nhìn thấy nhưng làm bộ tách từ và Regex coi đó là một từ lạ hoàn toàn.",
        "Nó tự động dịch văn bản sang tiếng Anh.",
        "Nó làm tăng kích thước ảnh trên trang web.",
      ],
      correct: 0,
      explain: "Đúng vậy! Xóa các ký tự điều khiển ẩn [\\u200b\\u200c\\u200d\\ufeff] luôn là bước đầu tiên bắt buộc trong hàm clean_vietnamese_text().",
    },
  ],
  2: [
    {
      q: "Câu 2.1: Điều gì xảy ra nếu ta áp dụng TF-IDF (Unigram) trực tiếp lên câu 'Học sinh học sinh học' mà KHÔNG tách từ tiếng Việt trước?",
      options: [
        "Mô hình tự động hiểu được đâu là học sinh và đâu là môn sinh học.",
        "Câu bị quy về chỉ còn 2 âm tiết rời 'học' (xuất hiện 3 lần) và 'sinh' (xuất hiện 2 lần), làm mất hoàn toàn nghĩa của từ ghép 'học_sinh' và 'sinh_học'.",
        "TF-IDF sẽ báo lỗi cú pháp vì câu có từ lặp lại.",
      ],
      correct: 1,
      explain: "Chính xác! Tách từ tiếng Việt giúp bảo toàn đơn vị từ vựng 'Học_sinh' (student) và 'sinh_học' (biology) trước khi tính tần suất TF-IDF.",
    },
    {
      q: "Câu 2.2: Trong không gian nhúng từ PhoW2V (Word-level), thước đo nào thường được sử dụng để tìm các từ đồng nghĩa hoặc cùng trường ngữ nghĩa?",
      options: [
        "Độ tương đồng Cosine (Cosine Similarity) đo góc giữa hai vector từ.",
        "Độ dài chuỗi ký tự của hai từ.",
        "Số lượng dấu thanh giống nhau giữa hai từ.",
      ],
      correct: 0,
      explain: "Chuẩn xác! Cosine Similarity đo cos(θ) giữa 2 vector trong không gian nhiều chiều, không bị nhiễu bởi độ dài văn bản.",
    },
    {
      q: "Câu 2.3: Hạn chế lớn nhất của các mô hình Static Word Embeddings như Word2Vec và PhoW2V đối với từ đa nghĩa (ví dụ từ 'đường' trong 'đường mía' và 'con đường') là gì?",
      options: [
        "Mỗi từ trong từ điển chỉ có duy nhất 1 vector cố định, không thay đổi theo ngữ cảnh của câu (Polysemy Bottleneck).",
        "PhoW2V chỉ hỗ trợ các từ tiếng Việt có 1 âm tiết.",
        "Word2Vec không thể tính được phép nhân vô hướng.",
      ],
      correct: 0,
      explain: "Chính xác! Vì vector tĩnh cố định cho mỗi mục từ, từ 'đường' ở mọi ngữ cảnh đều nhận cùng 1 vector. Nhược điểm này được giải quyết triệt để bởi cơ chế Self-Attention trong PhoBERT.",
    },
    {
      q: "Câu 2.4: Khi huấn luyện mô hình phân loại cảm xúc trên tập UIT-VSFC (trong đó nhãn Neutral chỉ chiếm ~4% dữ liệu), kỹ thuật nào giúp mô hình không bỏ sót lớp thiểu số?",
      options: [
        "Bật tham số class_weight='balanced' trong LinearSVC / LogisticRegression và đánh giá bằng thước đo Macro-F1 thay vì chỉ nhìn Accuracy.",
        "Xóa toàn bộ các câu thuộc nhãn Positive.",
        "Chỉ dùng Unigram mà bỏ hoàn toàn Bigram.",
      ],
      correct: 0,
      explain: "Hoàn toàn chính xác! class_weight='balanced' tự động tăng trọng số phạt khi phân loại sai lớp thiểu số Neutral, và Macro-F1 tính trung bình đều trên cả 3 lớp.",
    },
  ],
  3: [
    {
      q: "Câu 3.1: Giới hạn chiều dài token đầu vào tối đa (max_length) của mô hình vinai/phobert-base-v2 là bao nhiêu?",
      options: [
        "256 subword tokens (do max_position_embeddings = 258)",
        "4096 subword tokens",
        "Không giới hạn độ dài",
      ],
      correct: 0,
      explain: "Chính xác! PhoBERT có max_position_embeddings = 258 (gồm <s> và </s>), nên max_length thực tế là 256 subwords.",
    },
    {
      q: "Câu 3.2: Điểm khác biệt quan trọng nhất về tiền xử lý đầu vào giữa PhoBERT và VietAI/vit5 là gì?",
      options: [
        "PhoBERT BẮT BUỘC phải tách từ nối dấu gạch dưới '_', trong khi ViT5 dùng SentencePiece trực tiếp trên văn bản tiếng Việt tự nhiên (KHÔNG nối '_').",
        "Cả hai đều bắt buộc phải nối từ ghép bằng dấu gạch dưới '_'.",
        "ViT5 chỉ nhận đầu vào tiếng Anh.",
      ],
      correct: 0,
      explain: "Rất chuẩn! Chỉ các mô hình huấn luyện trên dữ liệu đã qua RDRSegmenter như PhoBERT/PhoW2V/PhoNLP mới nối '_'. Còn ViT5, Qwen, Sailor2, BGE-M3 dùng văn bản tự nhiên.",
    },
    {
      q: "Câu 3.3: Trong bài toán Nhận diện thực thể (NER) với PhoBERT, khi một từ ghép mang nhãn 'B-LOC' bị BPE tách thành 2 subwords, tại sao subword thứ 2 được gán nhãn -100?",
      options: [
        "Vì -100 là giá trị ignore_index mặc định của hàm torch.nn.CrossEntropyLoss, giúp chỉ tính đạo hàm trên subword đại diện đầu tiên của mỗi từ.",
        "Vì -100 là ID của nhãn địa danh trong bảng mã VLSP.",
        "Vì PyTorch chỉ chấp nhận số âm cho bài toán NER.",
      ],
      correct: 0,
      explain: "Chính xác! Gán -100 cho các token đặc biệt (<s>, </s>, <pad>) và các subword hậu tố giúp quá trình huấn luyện Token Classification căn chỉnh chuẩn xác với nhãn mức từ.",
    },
    {
      q: "Câu 3.4: Thước đo ROUGE-L thường dùng để đánh giá chất lượng tóm tắt văn bản tiếng Việt của mô hình VietAI/vit5 trên tập VietNews dựa trên nguyên lý nào?",
      options: [
        "Độ dài chuỗi con chung dài nhất (Longest Common Subsequence - LCS) giữa bản tóm tắt máy sinh và bản tóm tắt chuẩn của biên tập viên.",
        "Tốc độ sinh token trên mỗi giây.",
        "Số lượng dấu câu xuất hiện trong bài báo gốc.",
      ],
      correct: 0,
      explain: "Đúng! ROUGE-L đo mức độ bảo toàn cấu trúc mạch câu thông qua chuỗi con chung dài nhất (LCS).",
    },
  ],
  4: [
    {
      q: "Câu 4.1: Kỹ thuật QLoRA giúp giảm mạnh dung lượng VRAM khi tinh chỉnh mô hình Qwen2.5-7B / Sailor2-8B nhờ sự kết hợp nào?",
      options: [
        "Lượng tử hóa trọng số gốc xuống 4-bit NormalFloat (NF4, đóng băng) + Double Quantization + chỉ huấn luyện các ma trận Low-Rank Adapter (LoRA) ở BF16/FP16.",
        "Xóa bớt 80% số tầng Transformer của mô hình.",
        "Chỉ huấn luyện trên CPU thay vì GPU.",
      ],
      correct: 0,
      explain: "Hoàn toàn chính xác! QLoRA giữ trọng số gốc ở 4-bit NF4 (~4.1GB cho 7B params) và chỉ cập nhật ~1% tham số ở nhánh LoRA.",
    },
    {
      q: "Câu 4.2: Tại sao hệ thống RAG tiếng Việt trong thực tế doanh nghiệp nên dùng Hybrid Search (BM25 có tách từ + Dense Embedding như BGE-M3) thay vì chỉ dùng Dense Vector?",
      options: [
        "Vì BM25 bắt chính xác tuyệt đối các mã hiệu, tên riêng, điều khoản luật và từ ghép chuyên ngành tiếng Việt, còn Dense Vector nắm bắt ngữ nghĩa tương đồng khi diễn đạt khác từ.",
        "Vì Dense Vector không thể chạy trên tiếng Việt.",
        "Vì BM25 tự động sinh được câu trả lời không cần LLM.",
      ],
      correct: 0,
      explain: "Xuất sắc! Hybrid Search (kết hợp qua Reciprocal Rank Fusion) tận dụng thế mạnh khớp từ khóa chính xác của BM25 và hiểu ngữ cảnh đồng nghĩa của Dense Embedding.",
    },
    {
      q: "Câu 4.3: Chỉ số Token Fertility Rate (số subword token trung bình trên mỗi từ tiếng Việt) của các mô hình như Qwen2.5 / Sailor2 (~1.25) thấp hơn nhiều so với LLaMA-2 gốc (~2.8) mang lại lợi ích gì?",
      options: [
        "Giúp đọc được văn bản tiếng Việt dài hơn gấp đôi trong cùng cửa sổ ngữ cảnh, giảm hơn 50% dung lượng KV-Cache và tăng gấp đôi tốc độ sinh chữ.",
        "Làm tăng dung lượng file trọng số lên gấp 10 lần.",
        "Bắt buộc người dùng phải viết tiếng Việt không dấu.",
      ],
      correct: 0,
      explain: "Chính xác! Fertility Rate thấp chứng tỏ bộ từ điển của LLM đã chứa sẵn các âm tiết và từ tiếng Việt có dấu nguyên vẹn.",
    },
    {
      q: "Câu 4.4: Trong kiến trúc Agentic Self-RAG xây dựng bằng LangGraph trên tập UIT-ViQuAD 2.0, nút Document Grader kết hợp Conditional Edge có vai trò gì?",
      options: [
        "Kiểm tra xem các đoạn văn truy xuất được có thực sự chứa thông tin trả lời câu hỏi hay không; nếu điểm thấp sẽ kích hoạt Query Rewriter viết lại câu truy vấn để chống ảo giác (Hallucination).",
        "Xóa toàn bộ cơ sở dữ liệu Vector sau mỗi câu hỏi.",
        "Tự động dịch câu trả lời sang tiếng Pháp.",
      ],
      correct: 0,
      explain: "Hoàn toàn chính xác! Vòng lặp tự kiểm định (Self-Correction Loop) trong LangGraph là chìa khóa giúp hệ thống RAG doanh nghiệp đạt độ tin cậy cao.",
    },
  ],
  5: [
    {
      q: "Câu 5.1: Tại sao khi xây dựng hệ thống RAG cho văn bản pháp luật hoặc hợp đồng Việt Nam, ta phải dùng Structure-Aware Chunking (cắt theo Chương/Điều/Khoản + đính kèm tiêu đề cha) thay vì Fixed-Size Chunking (cắt cứng mỗi 500 ký tự)?",
      options: [
        "Vì cắt cứng 500 ký tự sẽ làm đứt câu điều khoản và làm mất tiêu đề Chương/Điều phía trên, khiến đoạn chunk bị mất ngữ cảnh pháp lý (ví dụ chỉ còn mức phạt mà không biết phạt hành vi nào).",
        "Vì Python không cho phép cắt chuỗi theo độ dài cố định.",
        "Vì mô hình BGE-M3 chỉ đọc được tối đa 10 ký tự.",
      ],
      correct: 0,
      explain: "Chính xác! Structure-Aware Chunking kèm Contextual Header Injection ([Chương II > Điều 15]) bảo toàn trọn vẹn ý nghĩa pháp lý của từng đoạn văn.",
    },
    {
      q: "Câu 5.2: Trong kiến trúc Production RAG 2 tầng (Retrieve & Rerank), tại sao ta cần thêm mô hình Cross-Encoder Reranker (như bge-reranker-v2-m3) sau bước Hybrid Search (BM25 + BGE-M3)?",
      options: [
        "Vì Cross-Encoder ghép trực tiếp cặp (Câu hỏi, Đoạn văn) đi qua cơ chế Self-Attention toàn phần để chấm điểm tương tác sâu từng từ, giúp lọc từ Top-25 xuống Top-3 đoạn chính xác nhất trước khi đưa vào LLM.",
        "Vì Cross-Encoder dùng để dịch câu hỏi sang tiếng Nhật.",
        "Vì BM25 không thể chạy trên máy chủ Linux.",
      ],
      correct: 0,
      explain: "Xuất sắc! Bi-Encoder (BGE-M3) tìm cực nhanh trên hàng triệu đoạn, còn Cross-Encoder Reranker chấm điểm tinh trên 25 ứng viên hàng đầu, nâng Precision@3 thêm 15%–20%.",
    },
    {
      q: "Câu 5.3: Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và nguyên tắc bảo mật AI doanh nghiệp, cần xử lý thế nào với văn bản chứa số CCCD, Số điện thoại, Email khách hàng trước khi gửi lên Cloud LLM?",
      options: [
        "Chạy tầng PII Masking / Redaction (Regex + NER) để thay thế bằng các thẻ ẩn danh ([MASKED_CCCD], [MASKED_PHONE]) trước khi gửi ra khỏi hệ thống nội bộ.",
        "Gửi nguyên văn toàn bộ CCCD và SĐT lên Cloud LLM công cộng.",
        "Xóa toàn bộ câu hỏi của khách hàng.",
      ],
      correct: 0,
      explain: "Chính xác! Tầng PII Masking là chốt chặn bắt buộc trong mọi hệ thống NLP ngân hàng, y tế, bảo hiểm và thương mại điện tử.",
    },
    {
      q: "Câu 5.4: Để phục vụ đồng thời hàng trăm người dùng trên Production với độ trễ thấp và chi phí tối ưu, sự kết hợp công nghệ Serving nào là chuẩn mực nhất?",
      options: [
        "Phân tầng: Dùng ONNX Runtime cho các mô hình phân loại/NER nhanh (PhoBERT ~5ms) và dùng vLLM (PagedAttention + Continuous Batching) kèm Semantic Cache cho LLM.",
        "Dùng hàm model.generate() mặc định của Hugging Face chạy tuần tự từng người dùng cho mọi tác vụ.",
        "Dùng LLM 70 tỷ tham số để kiểm tra định dạng số điện thoại thay cho Regex.",
      ],
      correct: 0,
      explain: "Hoàn toàn chính xác! Phân tầng mô hình (Tiered Routing) + ONNX Runtime + vLLM Continuous Batching giúp giảm 80% chi phí GPU và tăng thông lượng gấp 10 lần.",
    },
  ],
};

// ============================================================================
// PROGRESS & STORAGE HELPERS
// ============================================================================
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        xp: parsed.xp || 0,
        visitedSteps: parsed.visitedSteps || {},
        completedExercises: parsed.completedExercises || {},
        completedQuizzes: parsed.completedQuizzes || {},
      };
    }
  } catch (e) {
    console.warn("Could not read localStorage:", e);
  }
  return { xp: 0, visitedSteps: {}, completedExercises: {}, completedQuizzes: {} };
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {
    console.warn("Could not save localStorage:", e);
  }
  updateProgressUI();
}

function markStepVisited(lessonId, stepIdx) {
  const key = `${lessonId}:${stepIdx}`;
  if (!userProgress.visitedSteps[key]) {
    userProgress.visitedSteps[key] = true;
    saveProgress();
  }
}

function isLessonCompleted(lessonId) {
  const lesson = LESSONS[lessonId];
  if (!lesson) return false;
  for (let i = 0; i < lesson.steps.length; i++) {
    if (!userProgress.visitedSteps[`${lessonId}:${i}`]) return false;
  }
  return true;
}

function awardXP(key, type, points) {
  if (type === "exercise" && !userProgress.completedExercises[key]) {
    userProgress.completedExercises[key] = true;
    userProgress.xp += points;
    saveProgress();
  } else if (type === "quiz" && !userProgress.completedQuizzes[key]) {
    userProgress.completedQuizzes[key] = true;
    userProgress.xp += points;
    saveProgress();
  }
}

function svgIcon(id, extraClass = "") {
  return `<svg class="svg-icon ${extraClass}" aria-hidden="true"><use href="#${id}"></use></svg>`;
}

function updateProgressUI() {
  const maxXP = 1500;
  const xpEl = document.getElementById("xpValueText");
  if (xpEl) {
    xpEl.textContent = `${userProgress.xp} / ${maxXP} XP`;
  }

  let totalSteps = 0;
  let doneSteps = 0;
  for (const lid of LESSON_ORDER) {
    const les = LESSONS[lid];
    totalSteps += les.steps.length;
    for (let i = 0; i < les.steps.length; i++) {
      if (userProgress.visitedSteps[`${lid}:${i}`]) doneSteps++;
    }
  }

  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const barFill = document.getElementById("progressBarFill");
  if (barFill) barFill.style.width = `${pct}%`;
  document.getElementById("progressTrack")?.setAttribute("aria-valuenow", String(pct));

  const progText = document.getElementById("progressText");
  if (progText) {
    progText.textContent = `Tiến độ: ${doneSteps}/${totalSteps} bước (${pct}%)`;
  }

  // Update checkmarks in sidebar tree
  document.querySelectorAll("[data-sidebar-lesson]").forEach((li) => {
    const lid = li.getAttribute("data-sidebar-lesson");
    const done = isLessonCompleted(lid);
    li.classList.toggle("is-done", done);
    const mark = li.querySelector(".lesson-mark");
    if (mark) {
      mark.textContent = done ? "✓" : lid === currentLessonId ? "●" : "";
    }
  });
}

// ============================================================================
// THEME SWITCHER (WARM PAPER LIGHT vs WARM INK DARK)
// ============================================================================
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);

  document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const useEl = document.getElementById("themeIconUse");
  const labelEl = document.getElementById("themeLabel");
  if (theme === "dark") {
    useEl?.setAttribute("href", "#ic-moon");
    if (labelEl) labelEl.textContent = "Tối";
  } else {
    useEl?.setAttribute("href", "#ic-sun");
    if (labelEl) labelEl.textContent = "Sáng";
  }
}

// ============================================================================
// SIDEBAR TREE RENDERER & HASH ROUTER (#/<lesson-id>/<step-1-based>)
// ============================================================================
function renderSidebarTree() {
  const container = document.getElementById("sidebarCourseTree");
  if (!container) return;

  container.innerHTML = COURSE_MODULES.map((mod) => {
    const lessonsHtml = mod.lessons
      .map((lid, idx) => {
        const les = LESSONS[lid];
        const done = isLessonCompleted(lid);
        const isCurrent = lid === currentLessonId;
        return `
          <li class="lesson-item ${isCurrent ? "is-current" : ""} ${done ? "is-done" : ""}" data-sidebar-lesson="${lid}">
            <button type="button" class="lesson-btn" data-goto-lesson="${lid}">
              <span class="lesson-mark">${done ? "✓" : isCurrent ? "●" : ""}</span>
              <span class="lesson__title">${mod.num}.${idx + 1} ${les.title}</span>
            </button>
          </li>
        `;
      })
      .join("");

    return `
      <div class="mod is-open" data-mod-id="${mod.id}">
        <button type="button" class="mod__head">
          <span class="mod__chev">▸</span>
          <span class="folder-dot folder--${mod.folderColor}"></span>
          <span class="mod__title">${mod.num}. ${mod.title}</span>
          <span class="mod__count">${mod.lessons.length}</span>
        </button>
        <ul class="mod__lessons">${lessonsHtml}</ul>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".mod__head").forEach((headBtn) => {
    headBtn.addEventListener("click", () => {
      headBtn.parentElement.classList.toggle("is-open");
    });
  });

  container.querySelectorAll("[data-goto-lesson]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lid = btn.getAttribute("data-goto-lesson");
      if (currentTopMode !== "learn") {
        switchTopMode("learn");
      }
      navigateToLessonStep(lid, 0);
      document.getElementById("courseSidebar")?.classList.remove("is-drawer-open");
    });
  });
}

function parseHashRoute() {
  const hash = window.location.hash || "";
  const match = hash.match(/^#\/([a-z0-9-]+)(?:\/(\d+))?$/i);
  if (match) {
    const lid = match[1];
    const stepNum = match[2] ? parseInt(match[2], 10) - 1 : 0;
    if (LESSONS[lid]) {
      const clampedStep = Math.max(0, Math.min(LESSONS[lid].steps.length - 1, stepNum));
      return { lessonId: lid, stepIdx: clampedStep };
    }
  }
  return { lessonId: "unicode-tone", stepIdx: 0 };
}

function navigateToLessonStep(lessonId, stepIdx, updateHash = true) {
  const lesson = LESSONS[lessonId];
  if (!lesson) return;
  const clamped = Math.max(0, Math.min(lesson.steps.length - 1, stepIdx));
  currentLessonId = lessonId;
  currentStepIndex = clamped;

  if (updateHash) {
    const targetHash = `#/${lessonId}/${clamped + 1}`;
    if (window.location.hash !== targetHash) {
      history.replaceState(null, "", targetHash);
    }
  }

  markStepVisited(lessonId, clamped);
  renderCurrentLessonStep();
}

// ============================================================================
// RENDER CURRENT LESSON & STEP (SHEET, HUD, TIMELINE, GUIDE RAIL, SVG STAGE)
// ============================================================================
function renderCurrentLessonStep() {
  const lesson = LESSONS[currentLessonId];
  const step = lesson.steps[currentStepIndex];
  const totalSteps = lesson.steps.length;
  const lessonPos = LESSON_ORDER.indexOf(currentLessonId) + 1;

  // 1. Update Sidebar active highlight
  document.querySelectorAll("[data-sidebar-lesson]").forEach((li) => {
    const lid = li.getAttribute("data-sidebar-lesson");
    li.classList.toggle("is-current", lid === currentLessonId);
  });
  updateProgressUI();

  // 2. Update Sheet Header
  document.getElementById("lessonBreadcrumb").innerHTML = `
    <span>Mô-đun ${lesson.moduleNum} · ${lesson.moduleTitle}</span>
    <span>/</span>
    <span>Bài ${lessonPos} / ${LESSON_ORDER.length}</span>
  `;
  document.getElementById("lessonTitleHeading").textContent = lesson.title;
  document.getElementById("lessonSubtitleText").textContent = lesson.subtitle;
  document.getElementById("lessonHeaderTags").innerHTML = `
    <span class="tag tag--sand">${lesson.notebookTag}</span>
    <span class="tag tag--mint">${totalSteps} bước</span>
  `;

  // 3. Update HUD Live Metrics Chips
  const hudContainer = document.getElementById("stageHudChips");
  hudContainer.innerHTML = (step.hud || [])
    .map(
      (h) => `
      <div class="chip" data-level="${h.level || "good"}">
        <span class="chip__label">${h.label}</span>
        <span class="chip__value">${h.value}</span>
      </div>
    `
    )
    .join("");

  // 4. Update SVG Animated Stage
  renderStageDiagramSVG(step.diagram, lesson, step);

  // 5. Update Step Timeline
  const timelineBox = document.getElementById("stepTimelineBox");
  timelineBox.style.setProperty("--n", String(totalSteps));
  document.getElementById("timelineStepTitle").textContent = `Bước ${currentStepIndex + 1}: ${step.label}`;
  document.getElementById("timelineStepCount").textContent = `bước ${currentStepIndex + 1} / ${totalSteps}`;

  const railPct = totalSteps > 1 ? Math.round((currentStepIndex / (totalSteps - 1)) * 100) : 100;
  document.getElementById("timelineRailFill").style.width = `${railPct}%`;

  const stepsListEl = document.getElementById("timelineStepsList");
  stepsListEl.innerHTML = lesson.steps
    .map((s, idx) => {
      const isCurrent = idx === currentStepIndex;
      const isDone = idx < currentStepIndex || !!userProgress.visitedSteps[`${currentLessonId}:${idx}`];
      return `
        <li class="${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}">
          <button type="button" data-step-dot="${idx}">
            <span class="timeline__dot">${idx + 1}</span>
            <span class="timeline__label">${s.label}</span>
          </button>
        </li>
      `;
    })
    .join("");

  stepsListEl.querySelectorAll("[data-step-dot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetIdx = parseInt(btn.getAttribute("data-step-dot"), 10);
      navigateToLessonStep(currentLessonId, targetIdx);
    });
  });

  // 6. Update Right Guide Rail
  document.getElementById("guideStepEyebrow").textContent = `BƯỚC ${currentStepIndex + 1} / ${totalSteps}`;
  const chapterBadge = document.getElementById("guideChapterBadge");
  chapterBadge.className = `chapter chapter--${step.chapterColor || "sand"}`;
  chapterBadge.textContent = step.chapter;

  document.getElementById("guideStepHeading").textContent = step.title;
  document.getElementById("guideStepBody").innerHTML = step.body;

  // Callout
  const calloutBox = document.getElementById("guideCalloutBox");
  if (step.callout) {
    const iconSym = step.callout.type === "warn" ? "!" : step.callout.type === "tip" ? "✓" : "★";
    calloutBox.innerHTML = `
      <div class="callout callout--${step.callout.type}">
        <div class="callout__icon">${iconSym}</div>
        <div>
          <div class="callout__title">${step.callout.title}</div>
          <p>${step.callout.text}</p>
        </div>
      </div>
    `;
  } else {
    calloutBox.innerHTML = "";
  }

  // Changes list
  const changesBox = document.getElementById("guideChangesBox");
  if (step.changes && step.changes.length > 0) {
    const items = step.changes
      .map((c) => {
        const sym = c.type === "add" ? "+" : c.type === "del" ? "−" : "~";
        return `<li class="chg chg--${c.type}"><b>${sym}</b><span>${c.text}</span></li>`;
      })
      .join("");
    changesBox.innerHTML = `<div class="eyebrow">THAY ĐỔI Ở BƯỚC NÀY</div><ul>${items}</ul>`;
    changesBox.hidden = false;
  } else {
    changesBox.innerHTML = "";
    changesBox.hidden = true;
  }

  // Prev / Next buttons
  const prevBtn = document.getElementById("prevStepBtn");
  prevBtn.disabled = currentStepIndex === 0 && LESSON_ORDER.indexOf(currentLessonId) === 0;

  const nextLabel = document.getElementById("nextStepBtnLabel");
  if (currentStepIndex + 1 < totalSteps) {
    nextLabel.textContent = `Tiếp: ${lesson.steps[currentStepIndex + 1].label}`;
  } else {
    const nextLessonIdx = LESSON_ORDER.indexOf(currentLessonId) + 1;
    if (nextLessonIdx < LESSON_ORDER.length) {
      const nextLes = LESSONS[LESSON_ORDER[nextLessonIdx]];
      nextLabel.textContent = `Bài tiếp: ${nextLes.title}`;
    } else {
      nextLabel.textContent = "Vào Phòng thiết kế Thực hành →";
    }
  }

  // Enhance interactive glossary terms inside the newly rendered Guide Rail
  autoEnhanceGlossaryTermsInDOM();
}

// ============================================================================
// ANIMATED SVG DIAGRAM RENDERER FOR ALL 8 LESSONS (DESIGNED TO SCALE STYLE)
// ============================================================================
function renderStageDiagramSVG(diagram, lesson, step) {
  const svg = document.getElementById("stageSvg");
  if (!svg) return;

  const t = diagram?.type || "unicode-compare";
  const v = diagram?.variant || "intro";

  if (t === "unicode-compare") {
    svg.innerHTML = buildUnicodeDiagramSVG(v);
  } else if (t === "tone-rules") {
    svg.innerHTML = buildToneRulesSVG();
  } else if (t === "clean-pipeline") {
    svg.innerHTML = buildCleanPipelineSVG(v);
  } else if (t === "word-seg") {
    svg.innerHTML = buildWordSegSVG(v);
  } else if (t === "tfidf-flow") {
    svg.innerHTML = buildTfidfFlowSVG(v);
  } else if (t === "embedding-space") {
    svg.innerHTML = buildEmbeddingStageSVG(v);
  } else if (t === "phobert-arch") {
    svg.innerHTML = buildPhobertArchSVG(v);
  } else if (t === "ner-vit5") {
    svg.innerHTML = buildNerVit5SVG(v);
  } else if (t === "qlora-flow") {
    svg.innerHTML = buildQloraFlowSVG(v);
  } else if (t === "rag-graph") {
    svg.innerHTML = buildRagGraphSVG(v);
  } else if (t === "prod-data") {
    svg.innerHTML = buildProdDataSVG(v);
  } else if (t === "prod-serving") {
    svg.innerHTML = buildProdServingSVG(v);
  }
}

function buildUnicodeDiagramSVG(variant) {
  const isNfd = variant === "nfd-broken";
  const isNfc = variant === "nfc-clean";

  return `
    <!-- Top Pipeline Track: NFC Precomposed -->
    <g transform="translate(24, 32)">
      <rect x="0" y="0" width="712" height="145" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <rect x="16" y="14" width="210" height="24" rx="7" fill="var(--green)" stroke="var(--ink)" stroke-width="1.3"/>
      <text x="121" y="30" text-anchor="middle" font-size="11.5" font-weight="800" fill="#12240f">✓ Chuẩn Dựng sẵn (NFC) · 4 chars</text>

      <!-- Input Node -->
      <rect x="20" y="56" width="115" height="64" rx="10" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="77" y="83" text-anchor="middle" font-size="16" font-weight="800" fill="var(--ink)">"Việt"</text>
      <text x="77" y="103" text-anchor="middle" font-size="10.5" fill="var(--muted)">Unikey / NFC</text>

      <!-- Animated Flow Line -->
      <line x1="135" y1="88" x2="195" y2="88" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <circle cx="165" cy="88" r="5" fill="#9fd28f" stroke="var(--ink)" stroke-width="1.4"/>

      <!-- 4 Precomposed Codepoints -->
      <g transform="translate(198, 56)">
        <rect x="0" y="0" width="68" height="64" rx="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/>
        <text x="34" y="28" text-anchor="middle" font-size="16" font-weight="800">V</text>
        <text x="34" y="48" text-anchor="middle" font-size="10" fill="var(--muted)">U+0056</text>

        <rect x="76" y="0" width="68" height="64" rx="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/>
        <text x="110" y="28" text-anchor="middle" font-size="16" font-weight="800">i</text>
        <text x="110" y="48" text-anchor="middle" font-size="10" fill="var(--muted)">U+0069</text>

        <rect x="152" y="0" width="110" height="64" rx="9" fill="var(--green)" stroke="var(--ink)" stroke-width="2"/>
        <text x="207" y="28" text-anchor="middle" font-size="17" font-weight="800" fill="#12240f">ệ (1 mã)</text>
        <text x="207" y="48" text-anchor="middle" font-size="10.5" font-weight="700" fill="#12240f">U+1EC7</text>

        <rect x="270" y="0" width="68" height="64" rx="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/>
        <text x="304" y="28" text-anchor="middle" font-size="16" font-weight="800">t</text>
        <text x="304" y="48" text-anchor="middle" font-size="10" fill="var(--muted)">U+0074</text>
      </g>

      <line x1="538" y1="88" x2="584" y2="88" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <rect x="586" y="56" width="110" height="64" rx="10" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="641" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">PhoBERT Vocab</text>
      <text x="641" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#12240f">✓ ID #318</text>
    </g>

    <!-- Bottom Pipeline Track: NFD Decomposed (or NFC Conversion) -->
    <g transform="translate(24, 206)">
      <rect x="0" y="0" width="712" height="158" rx="14" fill="var(--card)" stroke="${isNfc ? "var(--ink)" : "#c0392b"}" stroke-width="1.8"/>
      <rect x="16" y="14" width="275" height="24" rx="7" fill="${isNfc ? "var(--green)" : "var(--red-tile)"}" stroke="var(--ink)" stroke-width="1.3"/>
      <text x="153" y="30" text-anchor="middle" font-size="11.5" font-weight="800" fill="${isNfc ? "#12240f" : "var(--red-ink)"}">
        ${isNfc ? "✓ unicodedata.normalize('NFC') hợp nhất!" : "✗ Chuẩn Tổ hợp (NFD - PDF/macOS) · 6 chars"}
      </text>

      <rect x="20" y="62" width="115" height="68" rx="10" fill="var(--red-tile)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="77" y="88" text-anchor="middle" font-size="15.5" font-weight="800">"Việt"</text>
      <text x="77" y="108" text-anchor="middle" font-size="10" fill="var(--red-ink)">NFD + \\u200b</text>

      <line x1="135" y1="96" x2="188" y2="96" stroke="#c0392b" stroke-width="2" class="svg-link-flow"/>

      <!-- Decomposed pieces -->
      <g transform="translate(190, 62)">
        <rect x="0" y="0" width="48" height="68" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.3"/>
        <text x="24" y="30" text-anchor="middle" font-size="15" font-weight="800">V</text>
        <text x="24" y="50" text-anchor="middle" font-size="9.5" fill="var(--muted)">0056</text>

        <rect x="54" y="0" width="48" height="68" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.3"/>
        <text x="78" y="30" text-anchor="middle" font-size="15" font-weight="800">i</text>
        <text x="78" y="50" text-anchor="middle" font-size="9.5" fill="var(--muted)">0069</text>

        <rect x="108" y="0" width="60" height="68" rx="8" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6"/>
        <text x="138" y="30" text-anchor="middle" font-size="15" font-weight="800">e</text>
        <text x="138" y="50" text-anchor="middle" font-size="9.5">U+0065</text>

        <rect x="174" y="0" width="72" height="68" rx="8" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="4 3"/>
        <text x="210" y="30" text-anchor="middle" font-size="15" font-weight="800">◌̣ (nặng)</text>
        <text x="210" y="50" text-anchor="middle" font-size="9.5">U+0323</text>

        <rect x="252" y="0" width="68" height="68" rx="8" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="4 3"/>
        <text x="286" y="30" text-anchor="middle" font-size="15" font-weight="800">◌̂ (mũ)</text>
        <text x="286" y="50" text-anchor="middle" font-size="9.5">U+0302</text>

        <rect x="326" y="0" width="48" height="68" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.3"/>
        <text x="350" y="30" text-anchor="middle" font-size="15" font-weight="800">t</text>
        <text x="350" y="50" text-anchor="middle" font-size="9.5" fill="var(--muted)">0074</text>
      </g>

      <line x1="566" y1="96" x2="592" y2="96" stroke="${isNfc ? "var(--ink)" : "#c0392b"}" stroke-width="2" class="svg-link-flow"/>
      <rect x="594" y="62" width="102" height="68" rx="10" fill="${isNfc ? "var(--green)" : "var(--red-tile)"}" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="645" y="88" text-anchor="middle" font-size="11.5" font-weight="800" fill="${isNfc ? "#12240f" : "var(--red-ink)"}">${isNfc ? "Đã gộp NFC" : "BPE Vỡ Vụn"}</text>
      <text x="645" y="108" text-anchor="middle" font-size="11.5" font-weight="800" fill="${isNfc ? "#12240f" : "var(--red-ink)"}">${isNfc ? "→ U+1EC7 ✓" : "✗ [UNK] OOV"}</text>
    </g>
  `;
}

function buildToneRulesSVG() {
  return `
    <g transform="translate(26, 36)">
      <rect x="0" y="0" width="708" height="328" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="34" font-size="14" font-weight="800">Bộ quy tắc chuẩn hóa dấu thanh Tiếng Việt (Vần mở oa, oe, uy vs Phụ âm qu-)</text>

      <!-- Left Box: Kiểu Mới Input -->
      <rect x="24" y="56" width="205" height="240" rx="12" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="126" y="84" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--amber-ink)">Đầu vào Kiểu Mới / Lẫn lộn</text>
      <rect x="42" y="104" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="126" y="128" text-anchor="middle" font-size="14" font-weight="800">hoà bình (o-à)</text>
      <rect x="42" y="154" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="126" y="178" text-anchor="middle" font-size="14" font-weight="800">sức khoẻ (o-ẻ)</text>
      <rect x="42" y="204" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="126" y="228" text-anchor="middle" font-size="14" font-weight="800">thuỷ lợi (u-ỷ)</text>
      <rect x="42" y="250" width="168" height="34" rx="8" fill="var(--violet)" stroke="var(--ink)"/>
      <text x="126" y="272" text-anchor="middle" font-size="13.5" font-weight="800">quý giá (qu + ý)</text>

      <!-- Center Normalizer -->
      <line x1="229" y1="176" x2="278" y2="176" stroke="var(--ink)" stroke-width="2.2" class="svg-link-flow"/>
      <rect x="280" y="106" width="154" height="140" rx="12" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="357" y="142" text-anchor="middle" font-size="12.5" font-weight="800">normalize_tone()</text>
      <text x="357" y="166" text-anchor="middle" font-size="11" fill="var(--ink-2)">1. Vần mở oa, oe, uy</text>
      <text x="357" y="184" text-anchor="middle" font-size="11" font-weight="700">→ Dấu ở nguyên âm 1</text>
      <text x="357" y="210" text-anchor="middle" font-size="11" fill="var(--ink-2)">2. Nếu bắt đầu 'qu-'</text>
      <text x="357" y="228" text-anchor="middle" font-size="11" font-weight="700">→ Giữ dấu trên 'y'</text>
      <line x1="434" y1="176" x2="478" y2="176" stroke="var(--ink)" stroke-width="2.2" class="svg-link-flow"/>

      <!-- Right Box: Kiểu Cũ Output -->
      <rect x="480" y="56" width="205" height="240" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="582" y="84" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">✓ Chuẩn VnCoreNLP &amp; PhoBERT</text>
      <rect x="498" y="104" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="582" y="128" text-anchor="middle" font-size="14" font-weight="800" fill="var(--emerald)">hòa bình (ò-a) ✓</text>
      <rect x="498" y="154" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="582" y="178" text-anchor="middle" font-size="14" font-weight="800" fill="var(--emerald)">sức khỏe (ỏ-e) ✓</text>
      <rect x="498" y="204" width="168" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="582" y="228" text-anchor="middle" font-size="14" font-weight="800" fill="var(--emerald)">thủy lợi (ủ-y) ✓</text>
      <rect x="498" y="250" width="168" height="34" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="582" y="272" text-anchor="middle" font-size="13.5" font-weight="800" fill="var(--emerald)">quý giá (giữ nguyên) ✓</text>
    </g>
  `;
}

function buildCleanPipelineSVG(variant) {
  return `
    <g transform="translate(20, 48)">
      <!-- Step 0: Dirty Input -->
      <rect x="0" y="45" width="156" height="118" rx="12" fill="var(--red-tile)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="78" y="72" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--red-ink)">0. Văn bản Thô (Nhiễu)</text>
      <text x="78" y="98" text-anchor="middle" font-size="12.5" font-weight="800">"GV\\u200b dạy ko</text>
      <text x="78" y="118" text-anchor="middle" font-size="12.5" font-weight="800">hiểu đều đc</text>
      <text x="78" y="138" text-anchor="middle" font-size="12.5" font-weight="800">giải đáp hoà nhã"</text>

      <line x1="156" y1="104" x2="190" y2="104" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 1: NFC & Zero-width -->
      <rect x="192" y="45" width="152" height="118" rx="12" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="268" y="72" text-anchor="middle" font-size="11.5" font-weight="800">1. Byte-level NFC</text>
      <text x="268" y="98" text-anchor="middle" font-size="11.5">• Xóa \\u200b, \\ufeff</text>
      <text x="268" y="118" text-anchor="middle" font-size="11.5">• normalize('NFC')</text>
      <text x="268" y="140" text-anchor="middle" font-size="11" font-weight="700" fill="var(--emerald)">✓ Sạch byte ẩn</text>

      <line x1="344" y1="104" x2="378" y2="104" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 2: Teencode -->
      <rect x="380" y="45" width="156" height="118" rx="12" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="458" y="72" text-anchor="middle" font-size="11.5" font-weight="800">2. Mở rộng Teencode</text>
      <text x="458" y="98" text-anchor="middle" font-size="11.5">• GV → giảng viên</text>
      <text x="458" y="118" text-anchor="middle" font-size="11.5">• ko → không (giữ!)</text>
      <text x="458" y="138" text-anchor="middle" font-size="11.5">• đc → được</text>

      <line x1="536" y1="104" x2="568" y2="104" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 3: Tone & Ready -->
      <rect x="570" y="45" width="150" height="118" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="645" y="72" text-anchor="middle" font-size="11.5" font-weight="800" fill="#12240f">3. Dấu thanh Chuẩn</text>
      <text x="645" y="98" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">hoà → hòa</text>
      <text x="645" y="120" text-anchor="middle" font-size="11" fill="#12240f">Sẵn sàng 100%</text>
      <text x="645" y="140" text-anchor="middle" font-size="11" font-weight="800" fill="#12240f">cho VnCoreNLP ✓</text>

      <!-- Bottom Resulting Clean Sentence Banner -->
      <rect x="20" y="200" width="680" height="66" rx="12" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="360" y="224" text-anchor="middle" font-size="11" font-weight="800" fill="var(--muted)">CHUỖI ĐẦU RA CHUẨN HÓA (CLEANED TEXT):</text>
      <text x="360" y="248" text-anchor="middle" font-size="14" font-weight="800" fill="var(--emerald)">"giảng viên dạy không hiểu đều được giải đáp hòa nhã"</text>
    </g>
  `;
}

function buildWordSegSVG(variant) {
  if (variant === "whitespace-fail") {
    return `
      <g transform="translate(28, 44)">
        <rect x="0" y="0" width="704" height="120" rx="13" fill="var(--card)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="24" y="30" font-size="12.5" font-weight="800">Câu tiếng Việt gốc (5 âm tiết ngăn cách bởi khoảng trắng):</text>
        ${["Học", "sinh", "học", "sinh", "học"]
          .map(
            (s, i) => `
          <g transform="translate(${28 + i * 132}, 48)">
            <rect x="0" y="0" width="112" height="48" rx="9" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.5"/>
            <text x="56" y="30" text-anchor="middle" font-size="16" font-weight="800">${s}</text>
          </g>
        `
          )
          .join("")}

        <line x1="352" y1="120" x2="352" y2="174" stroke="#c0392b" stroke-width="2.4" class="svg-link-flow"/>

        <rect x="40" y="176" width="624" height="132" rx="13" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.8"/>
        <text x="352" y="208" text-anchor="middle" font-size="13.5" font-weight="800" fill="var(--red-ink)">✗ NẾU CẮT THEO KHOẢNG TRẮNG (.split(" ")) NHƯ TIẾNG ANH:</text>
        <text x="352" y="242" text-anchor="middle" font-size="15" font-weight="800">Chỉ còn 2 âm tiết rời: "học" (×3) và "sinh" (×2)</text>
        <text x="352" y="274" text-anchor="middle" font-size="12.5" fill="var(--red-ink)">Mất hoàn toàn danh từ chủ ngữ "Học_sinh" (student) và môn "sinh_học" (biology)!</text>
      </g>
    `;
  }

  if (variant === "ambiguity") {
    return `
      <g transform="translate(28, 36)">
        <rect x="0" y="0" width="704" height="320" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.7"/>
        <text x="352" y="34" text-anchor="middle" font-size="14" font-weight="800">Nhập nhằng Giao thoa (Overlapping Ambiguity) trên chuỗi A - B - C</text>

        <!-- 3 syllables -->
        <rect x="130" y="64" width="120" height="54" rx="10" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="190" y="96" text-anchor="middle" font-size="17" font-weight="800">A: Học</text>

        <rect x="292" y="64" width="120" height="54" rx="10" fill="var(--amber)" stroke="var(--ink)" stroke-width="2"/>
        <text x="352" y="96" text-anchor="middle" font-size="17" font-weight="800">B: sinh</text>

        <rect x="454" y="64" width="120" height="54" rx="10" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="514" y="96" text-anchor="middle" font-size="17" font-weight="800">C: học</text>

        <!-- Bracket 1: A_B -->
        <rect x="70" y="156" width="260" height="126" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="200" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="#12240f">Cách ghép 1: (A_B) + C</text>
        <text x="200" y="216" text-anchor="middle" font-size="16" font-weight="800" fill="#12240f">"Học_sinh" + "học"</text>
        <text x="200" y="246" text-anchor="middle" font-size="11.5" fill="#12240f">Danh từ (Chủ ngữ) + Động từ</text>

        <!-- Bracket 2: B_C -->
        <rect x="374" y="156" width="260" height="126" rx="12" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="504" y="186" text-anchor="middle" font-size="13" font-weight="800">Cách ghép 2: A + (B_C)</text>
        <text x="504" y="216" text-anchor="middle" font-size="16" font-weight="800">"Học" + "sinh_học"</text>
        <text x="504" y="246" text-anchor="middle" font-size="11.5">Động từ + Danh từ (Môn học)</text>
      </g>
    `;
  }

  // Default / SCRDR / B_W I_W / POS Dependency
  return `
    <g transform="translate(24, 26)">
      <!-- Syllable Row with B_W / I_W tags -->
      <text x="12" y="20" font-size="12" font-weight="800" fill="var(--muted)">1. GÁN NHÃN RANH GIỚI TỪ (B_W / I_W) BẰNG CÂY QUY TẮC SCRDR / CRF:</text>
      ${[
        { s: "Học", tag: "B_W", col: "var(--green)" },
        { s: "sinh", tag: "I_W (_)", col: "var(--green-2)" },
        { s: "học", tag: "B_W (Verb!)", col: "var(--amber)" },
        { s: "sinh", tag: "B_W", col: "var(--green)" },
        { s: "học", tag: "I_W (_)", col: "var(--green-2)" },
      ]
        .map(
          (item, i) => `
        <g transform="translate(${12 + i * 140}, 32)">
          <rect x="0" y="0" width="126" height="72" rx="10" fill="${item.col}" stroke="var(--ink)" stroke-width="1.6"/>
          <text x="63" y="28" text-anchor="middle" font-size="16" font-weight="800" fill="#12240f">${item.s}</text>
          <rect x="18" y="40" width="90" height="22" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.2"/>
          <text x="63" y="55" text-anchor="middle" font-size="11" font-weight="800">${item.tag}</text>
        </g>
      `
        )
        .join("")}

      <!-- Compound Words & Dependency Arcs -->
      <text x="12" y="144" font-size="12" font-weight="800" fill="var(--muted)">2. TỪ GHÉP SAU KHI NỐI '_' + NHÃN TỪ LOẠI (POS) &amp; CÂY CÚ PHÁP PHỤ THUỘC:</text>

      <!-- Dependency curved arcs -->
      <path d="M 356 210 Q 250 155 148 210" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <rect x="215" y="164" width="76" height="22" rx="6" fill="var(--sand)" stroke="var(--ink)"/>
      <text x="253" y="179" text-anchor="middle" font-size="11" font-weight="800">nsub (chủ)</text>

      <path d="M 356 210 Q 465 155 566 210" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <rect x="424" y="164" width="76" height="22" rx="6" fill="var(--sand)" stroke="var(--ink)"/>
      <text x="462" y="179" text-anchor="middle" font-size="11" font-weight="800">dob (tân)</text>

      <!-- 3 Final Segmented Tokens -->
      <g transform="translate(48, 212)">
        <rect x="0" y="0" width="190" height="86" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="95" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="#12240f">Học_sinh</text>
        <text x="95" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#12240f">POS: N (Danh từ)</text>

        <rect x="224" y="0" width="166" height="86" rx="12" fill="var(--amber)" stroke="var(--ink)" stroke-width="2"/>
        <text x="307" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="var(--amber-ink)">học</text>
        <text x="307" y="60" text-anchor="middle" font-size="12" font-weight="800" fill="var(--amber-ink)">POS: V · ROOT (0)</text>

        <rect x="424" y="0" width="190" height="86" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="519" y="34" text-anchor="middle" font-size="18" font-weight="800" fill="#12240f">sinh_học</text>
        <text x="519" y="60" text-anchor="middle" font-size="12" font-weight="700" fill="#12240f">POS: N (Danh từ)</text>
      </g>
    </g>
  `;
}

function buildTfidfFlowSVG(variant) {
  return `
    <g transform="translate(24, 30)">
      <rect x="0" y="0" width="712" height="334" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="32" font-size="13.5" font-weight="800">Trọng số Sublinear TF-IDF (1,2-gram Từ ghép) + Siêu phẳng LinearSVC (UIT-VSFC)</text>

      <!-- Left: Segmented N-grams -->
      <rect x="22" y="54" width="210" height="254" rx="11" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="127" y="80" text-anchor="middle" font-size="12" font-weight="800">1. N-gram Từ ghép (1, 2)</text>

      <rect x="38" y="96" width="178" height="34" rx="7" fill="var(--paper-2)" stroke="var(--line-strong)"/>
      <text x="127" y="118" text-anchor="middle" font-size="12" fill="var(--muted)">"là", "môn_học" (DF cao)</text>

      <rect x="38" y="142" width="178" height="38" rx="7" fill="var(--green)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="127" y="166" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">"nhiệt_tình" (Unigram)</text>

      <rect x="38" y="192" width="178" height="38" rx="7" fill="var(--green)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="127" y="216" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">"rất dễ_hiểu" (Bigram)</text>

      <rect x="38" y="242" width="178" height="38" rx="7" fill="var(--red-tile)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="127" y="266" text-anchor="middle" font-size="12.5" font-weight="800" fill="var(--red-ink)">"không dễ_hiểu" (Bigram)</text>

      <line x1="232" y1="180" x2="274" y2="180" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Middle: TF-IDF Weight Bars -->
      <rect x="276" y="54" width="214" height="254" rx="11" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="383" y="80" text-anchor="middle" font-size="12" font-weight="800">2. Vector TF-IDF Chuẩn hóa L2</text>

      <text x="294" y="112" font-size="11" fill="var(--muted)">"là" (IDF ≈ 0)</text>
      <rect x="294" y="118" width="18" height="12" rx="4" fill="var(--muted-2)"/>
      <text x="320" y="128" font-size="11" font-weight="700">0.04</text>

      <text x="294" y="158" font-size="11" font-weight="700">"nhiệt_tình"</text>
      <rect x="294" y="164" width="145" height="14" rx="4" fill="#3fa456" stroke="var(--ink)"/>
      <text x="446" y="175" font-size="11" font-weight="800">0.68</text>

      <text x="294" y="206" font-size="11" font-weight="700">"rất dễ_hiểu"</text>
      <rect x="294" y="212" width="132" height="14" rx="4" fill="#3fa456" stroke="var(--ink)"/>
      <text x="434" y="223" font-size="11" font-weight="800">0.61</text>

      <text x="294" y="254" font-size="11" font-weight="700">"không dễ_hiểu"</text>
      <rect x="294" y="260" width="138" height="14" rx="4" fill="#e5534b" stroke="var(--ink)"/>
      <text x="440" y="271" font-size="11" font-weight="800">-0.64</text>

      <line x1="490" y1="180" x2="528" y2="180" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Right: LinearSVC Classifier -->
      <rect x="530" y="54" width="160" height="254" rx="11" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="610" y="82" text-anchor="middle" font-size="12" font-weight="800">3. LinearSVC</text>
      <text x="610" y="100" text-anchor="middle" font-size="10.5">(balanced weights)</text>

      <rect x="546" y="122" width="128" height="44" rx="8" fill="var(--green)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="610" y="148" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">Positive: 92%</text>

      <rect x="546" y="180" width="128" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="610" y="204" text-anchor="middle" font-size="11.5" font-weight="700">Neutral: 5%</text>

      <rect x="546" y="232" width="128" height="38" rx="8" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="610" y="256" text-anchor="middle" font-size="11.5" font-weight="700">Negative: 3%</text>

      <text x="610" y="294" text-anchor="middle" font-size="11" font-weight="800">Macro-F1: 89.4%</text>
    </g>
  `;
}

function buildEmbeddingStageSVG(variant) {
  if (variant === "polysemy-limit") {
    return `
      <g transform="translate(28, 36)">
        <rect x="0" y="0" width="704" height="324" rx="14" fill="var(--card)" stroke="#c0392b" stroke-width="1.8"/>
        <text x="352" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="var(--red-ink)">Nút thắt Từ Đa Nghĩa (Polysemy Bottleneck) trong Static Word Embeddings</text>

        <!-- Context 1 -->
        <rect x="34" y="72" width="210" height="84" rx="11" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.5"/>
        <text x="139" y="102" text-anchor="middle" font-size="12.5" font-weight="800">Ngữ cảnh 1 (Ẩm thực):</text>
        <text x="139" y="128" text-anchor="middle" font-size="13">"Cho thêm <tspan font-weight="800" fill="#c0392b">đường</tspan> vào cà_phê"</text>

        <!-- Context 2 -->
        <rect x="34" y="192" width="210" height="84" rx="11" fill="var(--blue-tile)" stroke="var(--ink)" stroke-width="1.5"/>
        <text x="139" y="222" text-anchor="middle" font-size="12.5" font-weight="800">Ngữ cảnh 2 (Giao thông):</text>
        <text x="139" y="248" text-anchor="middle" font-size="13">"Con <tspan font-weight="800" fill="#c0392b">đường</tspan> này đang kẹt xe"</text>

        <line x1="244" y1="114" x2="318" y2="168" stroke="#c0392b" stroke-width="2.2" class="svg-link-flow"/>
        <line x1="244" y1="234" x2="318" y2="182" stroke="#c0392b" stroke-width="2.2" class="svg-link-flow"/>

        <!-- Single Frozen Static Vector -->
        <rect x="320" y="124" width="186" height="102" rx="12" fill="var(--red-tile)" stroke="#c0392b" stroke-width="2"/>
        <text x="413" y="156" text-anchor="middle" font-size="13" font-weight="800" fill="var(--red-ink)">PhoW2V["đường"]</text>
        <text x="413" y="180" text-anchor="middle" font-size="11.5" font-weight="700">[0.21, -0.44, ..., 0.18]</text>
        <text x="413" y="204" text-anchor="middle" font-size="10.5" fill="var(--red-ink)">Chỉ 1 vector tĩnh duy nhất!</text>

        <line x1="506" y1="175" x2="544" y2="175" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

        <rect x="546" y="114" width="134" height="122" rx="12" fill="var(--green)" stroke="var(--ink)" stroke-width="1.7"/>
        <text x="613" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">Lời giải GĐ 3:</text>
        <text x="613" y="176" text-anchor="middle" font-size="13.5" font-weight="800" fill="#12240f">PhoBERT</text>
        <text x="613" y="200" text-anchor="middle" font-size="11" fill="#12240f">Self-Attention</text>
        <text x="613" y="218" text-anchor="middle" font-size="11" font-weight="700" fill="#12240f">Vector động ✓</text>
      </g>
    `;
  }

  return `
    <g transform="translate(24, 24)">
      <rect x="0" y="0" width="712" height="348" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="22" y="30" font-size="13.5" font-weight="800">Không gian Vector Ngữ nghĩa 2D PhoW2V (Cosine Similarity &amp; Semantic Clusters)</text>

      <!-- Coordinate Axes -->
      <line x1="40" y1="185" x2="670" y2="185" stroke="var(--line-strong)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="356" y1="50" x2="356" y2="325" stroke="var(--line-strong)" stroke-width="1.5" stroke-dasharray="4 4"/>

      <!-- Cluster 1: Education (Top-Right) -->
      <circle cx="515" cy="112" r="56" fill="rgba(127, 194, 120, 0.22)" stroke="#3fa456" stroke-width="1.5" stroke-dasharray="5 4"/>
      <line x1="356" y1="185" x2="500" y2="105" stroke="var(--ink)" stroke-width="2.2" class="svg-link-flow"/>
      <circle cx="500" cy="105" r="7" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="512" y="102" font-size="12.5" font-weight="800">giảng_viên</text>
      <circle cx="535" cy="128" r="6" fill="var(--green)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="546" y="132" font-size="12" font-weight="700">sinh_viên (cos=0.98)</text>
      <circle cx="478" cy="136" r="5.5" fill="var(--green)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="415" y="152" font-size="11.5">bài_tập</text>

      <!-- Cluster 2: NLP Models (Top-Left) -->
      <circle cx="185" cy="110" r="56" fill="rgba(155, 132, 232, 0.22)" stroke="#7c63d0" stroke-width="1.5" stroke-dasharray="5 4"/>
      <circle cx="170" cy="98" r="6.5" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="182" y="102" font-size="12.5" font-weight="800">phobert</text>
      <circle cx="205" cy="126" r="6" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="216" y="130" font-size="12" font-weight="700">vit5 (cos=0.99)</text>
      <circle cx="152" cy="130" r="5.5" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="80" y="135" font-size="11.5">vncorenlp</text>

      <!-- Cluster 3: Locations (Bottom-Left) -->
      <circle cx="195" cy="258" r="50" fill="rgba(213, 176, 122, 0.25)" stroke="#a4824e" stroke-width="1.5" stroke-dasharray="5 4"/>
      <circle cx="180" cy="250" r="6" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="192" y="254" font-size="12.5" font-weight="800">hà_nội</text>
      <circle cx="210" cy="276" r="6" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="222" y="280" font-size="12" font-weight="700">tp._hồ_chí_minh</text>

      <!-- Cluster 4: Sentiment (Bottom-Right) -->
      <circle cx="520" cy="258" r="50" fill="rgba(252, 220, 189, 0.35)" stroke="#d0683a" stroke-width="1.5" stroke-dasharray="5 4"/>
      <circle cx="505" cy="248" r="6" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="516" y="252" font-size="12.5" font-weight="800">nhiệt_tình</text>
      <circle cx="534" cy="274" r="6" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="546" y="278" font-size="12" font-weight="700">dễ_hiểu (cos=0.99)</text>
    </g>
  `;
}

function buildPhobertArchSVG(variant) {
  return `
    <g transform="translate(22, 26)">
      <rect x="0" y="0" width="716" height="344" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="22" y="30" font-size="13.5" font-weight="800">Kiến trúc vinai/phobert-base-v2 (VnCoreNLP '_' → fastBPE '@@' → 12 Layers RoBERTa)</text>

      <!-- Step 1: VnCoreNLP Segmented Input -->
      <rect x="22" y="48" width="672" height="52" rx="10" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.5"/>
      <text x="36" y="70" font-size="11" font-weight="800" fill="var(--muted)">1. ĐẦU VÀO ĐÃ TÁCH TỪ GHÉP (BẮT BUỘC NỐI '_'):</text>
      <text x="36" y="90" font-size="13.5" font-weight="800">"Giảng_viên dạy rất nhiệt_tình tại Đại_học Quốc_gia Hà_Nội"</text>

      <!-- Step 2: fastBPE Subwords (max_len <= 256) -->
      <g transform="translate(22, 116)">
        ${["<s>", "Giảng_viên", "dạy", "rất", "nhiệt_@@", "tình", "Hà_Nội", "</s>"]
          .map(
            (tok, idx) => `
          <g transform="translate(${idx * 84}, 0)">
            <rect x="0" y="0" width="78" height="44" rx="8" fill="${tok.includes("@@") || tok.includes("_") ? "var(--green)" : "var(--surface)"}" stroke="var(--ink)" stroke-width="1.4"/>
            <text x="39" y="26" text-anchor="middle" font-size="11.5" font-weight="800" fill="${tok.includes("@@") || tok.includes("_") ? "#12240f" : "var(--ink)"}">${tok}</text>
          </g>
        `
          )
          .join("")}
      </g>

      <!-- Bi-directional Self-Attention Mesh Lines -->
      <line x1="61" y1="160" x2="225" y2="205" stroke="var(--ink)" stroke-width="1.6" class="svg-link-flow"/>
      <line x1="145" y1="160" x2="358" y2="205" stroke="var(--ink)" stroke-width="1.6" class="svg-link-flow"/>
      <line x1="395" y1="160" x2="225" y2="205" stroke="var(--ink)" stroke-width="1.6" class="svg-link-flow"/>
      <line x1="560" y1="160" x2="490" y2="205" stroke="var(--ink)" stroke-width="1.6" class="svg-link-flow"/>

      <!-- Step 3: 12-Layer RoBERTa Encoder Block -->
      <rect x="22" y="205" width="672" height="64" rx="12" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="358" y="233" text-anchor="middle" font-size="14" font-weight="800">12 × Transformer Encoder Layers (Multi-Head Self-Attention · 768d)</text>
      <text x="358" y="254" text-anchor="middle" font-size="11.5">max_position_embeddings = 258 (Tối đa 256 subwords · Dynamic Masking)</text>

      <!-- Step 4: Output Heads -->
      <rect x="22" y="284" width="320" height="44" rx="9" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="182" y="311" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">Vector &lt;s&gt; → UIT-VSFC: 93.8% F1 ✓</text>

      <rect x="364" y="284" width="330" height="44" rx="9" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="529" y="311" text-anchor="middle" font-size="12" font-weight="800" fill="var(--amber-ink)">lr = 2e-5 · Warmup 10% · FP16 (4.5GB)</text>
    </g>
  `;
}

function buildNerVit5SVG(variant) {
  if (variant === "vit5-seq2seq" || variant === "tokenizer-contrast") {
    return `
      <g transform="translate(22, 28)">
        <rect x="0" y="0" width="716" height="340" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="24" y="32" font-size="13.5" font-weight="800">Đối chiếu Quy ước Đầu vào: PhoBERT (fastBPE + '_') vs VietAI/vit5 (SentencePiece '▁')</text>

        <!-- PhoBERT Track -->
        <rect x="24" y="54" width="668" height="120" rx="12" fill="var(--green-tile)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="40" y="80" font-size="12.5" font-weight="800" fill="#12240f">1. vinai/phobert-base-v2 (Encoder-only · BẮT BUỘC tách từ nối '_'):</text>
        ${["<s>", "Viện_nghiên_@@", "cứu", "VinAI", "tại", "Hà_Nội", "</s>"]
          .map(
            (t, i) => `
          <rect x="${40 + i * 91}" y="98" width="84" height="52" rx="8" fill="var(--green)" stroke="var(--ink)" stroke-width="1.4"/>
          <text x="${82 + i * 91}" y="128" text-anchor="middle" font-size="11" font-weight="800" fill="#12240f">${t}</text>
        `
          )
          .join("")}

        <!-- ViT5 Track -->
        <rect x="24" y="194" width="668" height="122" rx="12" fill="var(--violet-tile)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="40" y="220" font-size="12.5" font-weight="800">2. VietAI/vit5-base &amp; Qwen2.5 (SentencePiece '▁' · TUYỆT ĐỐI KHÔNG nối '_'):</text>
        ${["▁Viện", "▁Nghiên", "▁cứu", "▁VinAI", "▁tại", "▁Hà", "▁Nội", "</s>"]
          .map(
            (t, i) => `
          <rect x="${40 + i * 79}" y="238" width="72" height="52" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/>
          <text x="${76 + i * 79}" y="268" text-anchor="middle" font-size="11.5" font-weight="800">${t}</text>
        `
          )
          .join("")}
      </g>
    `;
  }

  // Subword Label Alignment -100 Diagram
  return `
    <g transform="translate(22, 28)">
      <rect x="0" y="0" width="716" height="340" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="32" font-size="13.5" font-weight="800">Subword Label Alignment cho PhoBERT NER: Mặt nạ ignore_index = -100</text>

      <!-- Table headers -->
      <text x="24" y="78" font-size="11.5" font-weight="800" fill="var(--muted)">Từ gốc:</text>
      <text x="24" y="150" font-size="11.5" font-weight="800" fill="var(--muted)">BPE Subwords:</text>
      <text x="24" y="226" font-size="11.5" font-weight="800" fill="var(--muted)">Nhãn IOB2:</text>
      <text x="24" y="294" font-size="11.5" font-weight="800" fill="var(--muted)">CrossEntropy:</text>

      ${[
        { orig: "[CLS]", sub: "<s>", tag: "—", loss: "-100 (Bỏ qua)", mask: true },
        { orig: "Viện_nghiên_cứu", sub: "Viện_nghiên_@@", tag: "B-ORG", loss: "ID = 1 (Tính Loss)", mask: false },
        { orig: "(mảnh nối tiếp)", sub: "cứu", tag: "(cont)", loss: "-100 (Masked!)", mask: true },
        { orig: "VinAI", sub: "VinAI", tag: "I-ORG", loss: "ID = 2 (Tính Loss)", mask: false },
        { orig: "Hà_Nội", sub: "Hà_Nội", tag: "B-LOC", loss: "ID = 3 (Tính Loss)", mask: false },
      ]
        .map(
          (col, i) => `
        <g transform="translate(${136 + i * 112}, 52)">
          <rect x="0" y="0" width="104" height="42" rx="8" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.3"/>
          <text x="52" y="25" text-anchor="middle" font-size="10.5" font-weight="800">${col.orig}</text>

          <line x1="52" y1="42" x2="52" y2="72" stroke="var(--ink)" stroke-width="1.5" class="svg-link-flow"/>

          <rect x="0" y="72" width="104" height="44" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.4"/>
          <text x="52" y="98" text-anchor="middle" font-size="11" font-weight="800">${col.sub}</text>

          <line x1="52" y1="116" x2="52" y2="146" stroke="var(--ink)" stroke-width="1.5"/>

          <rect x="0" y="146" width="104" height="42" rx="8" fill="${col.mask ? "var(--paper-2)" : "var(--green)"}" stroke="var(--ink)" stroke-width="1.4"/>
          <text x="52" y="171" text-anchor="middle" font-size="11.5" font-weight="800" fill="${col.mask ? "var(--muted)" : "#12240f"}">${col.tag}</text>

          <rect x="0" y="214" width="104" height="46" rx="8" fill="${col.mask ? "var(--red-tile)" : "var(--green)"}" stroke="var(--ink)" stroke-width="1.6"/>
          <text x="52" y="241" text-anchor="middle" font-size="10.5" font-weight="800" fill="${col.mask ? "var(--red-ink)" : "#12240f"}">${col.loss}</text>
        </g>
      `
        )
        .join("")}
    </g>
  `;
}

function buildQloraFlowSVG(variant) {
  if (variant === "token-fertility") {
    return `
      <g transform="translate(24, 32)">
        <rect x="0" y="0" width="712" height="332" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="24" y="34" font-size="13.5" font-weight="800">So sánh Token Fertility Rate trên Tiếng Việt: LLaMA-2 gốc vs Qwen2.5 / Sailor2</text>

        <!-- LLaMA-2 row -->
        <rect x="24" y="56" width="664" height="114" rx="11" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6"/>
        <text x="40" y="82" font-size="12" font-weight="800" fill="var(--red-ink)">✗ LLaMA-2 gốc (32k Vocab tiếng Anh) — Fertility ≈ 2.85 tokens/từ (Tốn gấp đôi KV-Cache):</text>
        ${["Tr", "í", "▁tu", "ệ", "▁nh", "ân", "▁t", "ạo", "▁Vi", "ệt"]
          .map(
            (t, i) => `
          <rect x="${40 + i * 62}" y="98" width="56" height="50" rx="7" fill="var(--surface)" stroke="#c0392b" stroke-width="1.4"/>
          <text x="${68 + i * 62}" y="128" text-anchor="middle" font-size="12" font-weight="800">${t}</text>
        `
          )
          .join("")}

        <!-- Qwen2.5 / Sailor2 row -->
        <rect x="24" y="190" width="664" height="118" rx="11" fill="var(--green-tile)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="40" y="216" font-size="12" font-weight="800" fill="#12240f">✓ Qwen2.5 / Sailor2 / URA-LLaMA (152k Vocab) — Fertility ≈ 1.25 tokens/từ (1 âm tiết = 1 token):</text>
        ${["▁Trí", "▁tuệ", "▁nhân", "▁tạo", "▁Việt", "▁Nam"]
          .map(
            (t, i) => `
          <rect x="${40 + i * 104}" y="234" width="94" height="54" rx="8" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
          <text x="${87 + i * 104}" y="266" text-anchor="middle" font-size="13.5" font-weight="800" fill="#12240f">${t}</text>
        `
          )
          .join("")}
      </g>
    `;
  }

  return `
    <g transform="translate(24, 26)">
      <rect x="0" y="0" width="712" height="346" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="32" font-size="13.5" font-weight="800">Kiến trúc QLoRA: Trọng số gốc W₀ nén 4-bit NF4 (Đóng băng) + Nhánh LoRA B×A (BF16)</text>

      <!-- Input Activation x -->
      <rect x="28" y="142" width="110" height="70" rx="10" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="83" y="174" text-anchor="middle" font-size="14" font-weight="800">Input x</text>
      <text x="83" y="194" text-anchor="middle" font-size="11">(BF16)</text>

      <!-- Top Branch: Frozen 4-bit NF4 Base Weights -->
      <path d="M 138 162 L 210 100" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <rect x="212" y="54" width="260" height="96" rx="12" fill="var(--blue-tile)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="342" y="82" text-anchor="middle" font-size="13" font-weight="800">Frozen Base Weights W₀</text>
      <text x="342" y="104" text-anchor="middle" font-size="12" font-weight="700">4-bit NormalFloat (NF4)</text>
      <text x="342" y="126" text-anchor="middle" font-size="11">Qwen2.5-7B chỉ chiếm ~4.1 GB VRAM!</text>
      <path d="M 472 100 L 548 162" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Bottom Branch: Trainable LoRA Adapter A & B -->
      <path d="M 138 192 L 210 248" fill="none" stroke="#3fa456" stroke-width="2.2" class="svg-link-flow"/>
      <rect x="212" y="202" width="122" height="96" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="273" y="236" text-anchor="middle" font-size="13" font-weight="800" fill="#12240f">Ma trận A</text>
      <text x="273" y="256" text-anchor="middle" font-size="11.5" font-weight="700" fill="#12240f">(r=16 × d)</text>
      <text x="273" y="276" text-anchor="middle" font-size="10.5" fill="#12240f">Trainable BF16</text>

      <line x1="334" y1="250" x2="356" y2="250" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <rect x="358" y="202" width="122" height="96" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="419" y="236" text-anchor="middle" font-size="13" font-weight="800" fill="#12240f">Ma trận B</text>
      <text x="419" y="256" text-anchor="middle" font-size="11.5" font-weight="700" fill="#12240f">(d × r=16)</text>
      <text x="419" y="276" text-anchor="middle" font-size="10.5" fill="#12240f">Chỉ ~0.8% params</text>
      <path d="M 480 248 L 548 192" fill="none" stroke="#3fa456" stroke-width="2.2" class="svg-link-flow"/>

      <!-- Summation Output -->
      <rect x="550" y="132" width="138" height="92" rx="12" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="619" y="164" text-anchor="middle" font-size="13" font-weight="800">h = W₀x + BAx</text>
      <text x="619" y="186" text-anchor="middle" font-size="11.5" font-weight="700">Tổng: ~6.8 GB</text>
      <text x="619" y="206" text-anchor="middle" font-size="10.5">Chạy mượt trên T4 ✓</text>
    </g>
  `;
}

function buildRagGraphSVG(variant) {
  return `
    <g transform="translate(18, 22)">
      <rect x="0" y="0" width="724" height="354" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="22" y="30" font-size="13.5" font-weight="800">Đồ thị Trạng thái Có Chu trình LangGraph: Hybrid Retrieval (BM25 + BGE-M3) &amp; Self-RAG</text>

      <!-- Node 1: Query -->
      <rect x="20" y="136" width="118" height="76" rx="11" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="79" y="166" text-anchor="middle" font-size="12" font-weight="800">1. Câu hỏi VN</text>
      <text x="79" y="186" text-anchor="middle" font-size="10.5">NFC + Tách từ</text>

      <!-- Dual Branch to BM25 & BGE-M3 -->
      <path d="M 138 156 L 178 102" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <path d="M 138 190 L 178 242" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Sparse BM25 -->
      <rect x="180" y="60" width="146" height="76" rx="10" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="253" y="90" text-anchor="middle" font-size="12" font-weight="800">Okapi BM25</text>
      <text x="253" y="110" text-anchor="middle" font-size="10.5" fill="var(--emerald)">✓ Đã tách từ (pyvi)</text>

      <!-- Dense BGE-M3 -->
      <rect x="180" y="206" width="146" height="76" rx="10" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="253" y="236" text-anchor="middle" font-size="12" font-weight="800">BAAI/bge-m3</text>
      <text x="253" y="256" text-anchor="middle" font-size="10.5">Vector 1024d</text>

      <!-- Merge into RRF -->
      <path d="M 326 102 L 364 156" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <path d="M 326 242 L 364 190" fill="none" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <rect x="366" y="136" width="102" height="76" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.7"/>
      <text x="417" y="166" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">2. RRF</text>
      <text x="417" y="186" text-anchor="middle" font-size="10.5" font-weight="700" fill="#12240f">91.5% Recall</text>

      <line x1="468" y1="174" x2="496" y2="174" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Node 3: Document Grader -->
      <rect x="498" y="136" width="114" height="76" rx="11" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="555" y="166" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--amber-ink)">3. Doc Grader</text>
      <text x="555" y="186" text-anchor="middle" font-size="10.5" fill="var(--amber-ink)">Score &gt;= 0.42?</text>

      <!-- Self-Correction Loop (Query Rewriter) -->
      <rect x="380" y="274" width="166" height="54" rx="10" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6"/>
      <text x="463" y="298" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--red-ink)">↺ Query Rewriter</text>
      <text x="463" y="316" text-anchor="middle" font-size="10" fill="var(--red-ink)">Viết lại câu hỏi nếu trượt</text>
      <path d="M 555 212 L 555 300 L 546 300" fill="none" stroke="#c0392b" stroke-width="1.8" class="svg-link-flow"/>
      <path d="M 380 300 L 79 300 L 79 212" fill="none" stroke="#c0392b" stroke-width="1.8" class="svg-link-flow"/>

      <!-- Node 4: Faithful Generator -->
      <line x1="612" y1="174" x2="634" y2="174" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>
      <rect x="636" y="126" width="72" height="96" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="672" y="162" text-anchor="middle" font-size="11.5" font-weight="800" fill="#12240f">4. LLM</text>
      <text x="672" y="180" text-anchor="middle" font-size="10.5" font-weight="700" fill="#12240f">Qwen2.5</text>
      <text x="672" y="198" text-anchor="middle" font-size="10" fill="#12240f">+[DocID]</text>
    </g>
  `;
}

function buildProdDataSVG(variant) {
  if (variant === "pii-masking" || variant === "active-learning") {
    return `
      <g transform="translate(20, 26)">
        <rect x="0" y="0" width="720" height="346" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="24" y="32" font-size="13.5" font-weight="800">Bảo vệ Dữ liệu Cá nhân (Nghị định 13) &amp; Kiểm soát Chất lượng Nhãn (Cohen's Kappa)</text>

        <!-- Raw Input with PII -->
        <rect x="24" y="56" width="205" height="122" rx="11" fill="var(--red-tile)" stroke="#c0392b" stroke-width="1.6"/>
        <text x="126" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="var(--red-ink)">1. Văn bản Thô (Chứa PII)</text>
        <text x="126" y="106" text-anchor="middle" font-size="11.5" font-weight="700">"Khách: Nguyễn Văn A"</text>
        <text x="126" y="126" text-anchor="middle" font-size="11.5" fill="var(--red-ink)">CCCD: 079099001234</text>
        <text x="126" y="146" text-anchor="middle" font-size="11.5" fill="var(--red-ink)">SĐT: 0912345678</text>

        <line x1="229" y1="117" x2="266" y2="117" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

        <!-- PII Scrubber Engine -->
        <rect x="268" y="56" width="184" height="122" rx="11" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.7"/>
        <text x="360" y="84" text-anchor="middle" font-size="12" font-weight="800">2. PII Masking Layer</text>
        <text x="360" y="106" text-anchor="middle" font-size="11">• Regex CCCD / SĐT / Email</text>
        <text x="360" y="126" text-anchor="middle" font-size="11">• PhoNLP NER (PER/LOC)</text>
        <text x="360" y="148" text-anchor="middle" font-size="11" font-weight="700">✓ Lưu bảng ánh xạ nội bộ</text>

        <line x1="452" y1="117" x2="488" y2="117" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

        <!-- Safe Masked Text -->
        <rect x="490" y="56" width="206" height="122" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.7"/>
        <text x="593" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">3. Văn bản An toàn (Đã che)</text>
        <text x="593" y="106" text-anchor="middle" font-size="11" font-weight="800" fill="#12240f">CCCD: [MASKED_CCCD]</text>
        <text x="593" y="126" text-anchor="middle" font-size="11" font-weight="800" fill="#12240f">SĐT: [MASKED_PHONE]</text>
        <text x="593" y="148" text-anchor="middle" font-size="10.5" fill="#12240f">An toàn gửi VectorDB / LLM ✓</text>

        <!-- Bottom Track: Active Learning & Cohen's Kappa -->
        <rect x="24" y="202" width="672" height="118" rx="12" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/>
        <text x="40" y="228" font-size="12" font-weight="800">Quy trình Gán nhãn Thực chiến (Active Learning + Kiểm định Cohen's Kappa):</text>
        <rect x="40" y="244" width="186" height="56" rx="8" fill="var(--sand)" stroke="var(--ink)"/>
        <text x="133" y="268" text-anchor="middle" font-size="11.5" font-weight="800">2 Annotators Độc lập</text>
        <text x="133" y="286" text-anchor="middle" font-size="10.5">Gán thử 200 mẫu đầu</text>

        <line x1="226" y1="272" x2="262" y2="272" stroke="var(--ink)" stroke-width="1.8" class="svg-link-flow"/>

        <rect x="264" y="244" width="190" height="56" rx="8" fill="var(--green)" stroke="var(--ink)"/>
        <text x="359" y="268" text-anchor="middle" font-size="11.5" font-weight="800" fill="#12240f">Cohen's Kappa κ &gt;= 0.80</text>
        <text x="359" y="286" text-anchor="middle" font-size="10.5" fill="#12240f">Đạt chuẩn đồng thuận ✓</text>

        <line x1="454" y1="272" x2="490" y2="272" stroke="var(--ink)" stroke-width="1.8" class="svg-link-flow"/>

        <rect x="492" y="244" width="186" height="56" rx="8" fill="var(--amber)" stroke="var(--ink)"/>
        <text x="585" y="268" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--amber-ink)">Active Learning Loop</text>
        <text x="585" y="286" text-anchor="middle" font-size="10.5" fill="var(--amber-ink)">Chỉ gán các mẫu khó (p≈0.5)</text>
      </g>
    `;
  }

  return `
    <g transform="translate(20, 24)">
      <rect x="0" y="0" width="720" height="350" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="30" font-size="13.5" font-weight="800">Structure-Aware Chunking (Chương/Điều/Khoản) + Tầng lọc tinh Cross-Encoder Reranker</text>

      <!-- Left: Structure-Aware Chunking with Header Injection -->
      <rect x="22" y="50" width="246" height="276" rx="11" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="145" y="76" text-anchor="middle" font-size="12" font-weight="800">1. Structure-Aware Chunks</text>

      <rect x="34" y="92" width="222" height="66" rx="8" fill="var(--green-tile)" stroke="var(--ink)" stroke-width="1.4"/>
      <text x="44" y="112" font-size="10" font-weight="800" fill="var(--emerald)">[Hợp đồng &gt; Chương II &gt; Điều 12]</text>
      <text x="44" y="130" font-size="11" font-weight="700">"Khách hàng thanh toán hợp</text>
      <text x="44" y="146" font-size="11" font-weight="700">đồng trị giá 150 triệu đồng..."</text>

      <rect x="34" y="170" width="222" height="66" rx="8" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="44" y="190" font-size="10" font-weight="800" fill="#12240f">[Hợp đồng &gt; Chương II &gt; Điều 15]</text>
      <text x="44" y="208" font-size="11" font-weight="800" fill="#12240f">"Giao chậm quá 7 ngày, bên</text>
      <text x="44" y="224" font-size="11" font-weight="800" fill="#12240f">bán bồi thường 8% giá trị..."</text>

      <rect x="34" y="248" width="222" height="62" rx="8" fill="var(--red-tile)" stroke="#c0392b" stroke-dasharray="4 3"/>
      <text x="44" y="268" font-size="10" font-weight="800" fill="var(--red-ink)">✗ Nếu cắt cứng Fixed-size:</text>
      <text x="44" y="286" font-size="10.5" fill="var(--red-ink">"...bồi thường 8%..." (Mất tên Điều 15!)</text>

      <line x1="268" y1="188" x2="302" y2="188" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Middle: Stage 1 Hybrid RRF Top-25 -->
      <rect x="304" y="88" width="166" height="200" rx="11" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="387" y="118" text-anchor="middle" font-size="12" font-weight="800">2. Tầng 1: Hybrid RRF</text>
      <text x="387" y="142" text-anchor="middle" font-size="11">BM25 + BGE-M3</text>
      <rect x="322" y="160" width="130" height="36" rx="7" fill="var(--surface)" stroke="var(--ink)"/>
      <text x="387" y="182" text-anchor="middle" font-size="11.5" font-weight="800">Lấy nhanh Top-25</text>
      <text x="387" y="220" text-anchor="middle" font-size="10.5">Độ trễ: ~30 ms</text>
      <text x="387" y="240" text-anchor="middle" font-size="10.5">Recall@25: ~98%</text>

      <line x1="470" y1="188" x2="504" y2="188" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Right: Stage 2 Cross-Encoder Reranker -->
      <rect x="506" y="70" width="192" height="236" rx="11" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="602" y="100" text-anchor="middle" font-size="12" font-weight="800">3. Cross-Encoder</text>
      <text x="602" y="118" text-anchor="middle" font-size="11" font-weight="700">bge-reranker-v2-m3</text>
      <text x="602" y="144" text-anchor="middle" font-size="10.5">Self-Attention toàn phần</text>
      <text x="602" y="162" text-anchor="middle" font-size="10.5">trên cặp (Query, Chunk)</text>
      <rect x="524" y="184" width="156" height="52" rx="8" fill="var(--green)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="602" y="206" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">✓ Lọc tinh Top-3</text>
      <text x="602" y="224" text-anchor="middle" font-size="11" font-weight="700" fill="#12240f">Precision@3: 96.2%</text>
      <text x="602" y="268" text-anchor="middle" font-size="10.5" font-weight="700">Đưa vào LLM Generator</text>
    </g>
  `;
}

function buildProdServingSVG(variant) {
  if (variant === "decision-matrix") {
    return `
      <g transform="translate(20, 26)">
        <rect x="0" y="0" width="720" height="346" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="24" y="32" font-size="13.5" font-weight="800">Kiến trúc Phân tầng Mô hình (Tiered Routing): Tiết kiệm 80% Chi phí GPU trên Production</text>

        <!-- Tier 1 -->
        <rect x="24" y="58" width="206" height="258" rx="11" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
        <text x="127" y="86" text-anchor="middle" font-size="12.5" font-weight="800">Tầng 1: Regex + TF-IDF</text>
        <text x="127" y="108" text-anchor="middle" font-size="11" font-weight="700">LinearSVC (CPU)</text>
        <rect x="40" y="128" width="174" height="34" rx="7" fill="var(--surface)" stroke="var(--ink)"/>
        <text x="127" y="150" text-anchor="middle" font-size="11.5" font-weight="800">Độ trễ: 0.5 – 2 ms</text>
        <text x="127" y="186" text-anchor="middle" font-size="11">• Lọc Spam / Teencode</text>
        <text x="127" y="206" text-anchor="middle" font-size="11">• Ẩn danh PII / Luật cứng</text>
        <text x="127" y="226" text-anchor="middle" font-size="11">• Định tuyến Intent cơ bản</text>
        <text x="127" y="274" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--emerald)">Chi phí: ~$0 (Chạy CPU)</text>

        <line x1="230" y1="186" x2="256" y2="186" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

        <!-- Tier 2 -->
        <rect x="258" y="58" width="206" height="258" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="361" y="86" text-anchor="middle" font-size="12.5" font-weight="800" fill="#12240f">Tầng 2: PhoBERT-v2</text>
        <text x="361" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="#12240f">ONNX Runtime (INT8/FP16)</text>
        <rect x="274" y="128" width="174" height="34" rx="7" fill="var(--surface)" stroke="var(--ink)"/>
        <text x="361" y="150" text-anchor="middle" font-size="11.5" font-weight="800">Độ trễ: 5 – 12 ms</text>
        <text x="361" y="186" text-anchor="middle" font-size="11" fill="#12240f">• Phân tích cảm xúc (94% F1)</text>
        <text x="361" y="206" text-anchor="middle" font-size="11" fill="#12240f">• Trích xuất thực thể NER</text>
        <text x="361" y="226" text-anchor="middle" font-size="11" fill="#12240f">• Phân loại Ticket hỗ trợ</text>
        <text x="361" y="274" text-anchor="middle" font-size="11.5" font-weight="800" fill="#12240f">Gánh 75% lưu lượng NLU ✓</text>

        <line x1="464" y1="186" x2="490" y2="186" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

        <!-- Tier 3 -->
        <rect x="492" y="58" width="204" height="258" rx="11" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.8"/>
        <text x="594" y="86" text-anchor="middle" font-size="12.5" font-weight="800">Tầng 3: Qwen2.5 / Sailor2</text>
        <text x="594" y="108" text-anchor="middle" font-size="11" font-weight="700">vLLM + Hybrid Agentic RAG</text>
        <rect x="508" y="128" width="172" height="34" rx="7" fill="var(--surface)" stroke="var(--ink)"/>
        <text x="594" y="150" text-anchor="middle" font-size="11.5" font-weight="800">Độ trễ: 150 – 400 ms</text>
        <text x="594" y="186" text-anchor="middle" font-size="11">• Hỏi đáp Pháp lý / Tài liệu</text>
        <text x="594" y="206" text-anchor="middle" font-size="11">• Trích xuất JSON phức tạp</text>
        <text x="594" y="226" text-anchor="middle" font-size="11">• Tóm tắt &amp; Suy luận Agent</text>
        <text x="594" y="274" text-anchor="middle" font-size="11.5" font-weight="800">Chỉ gọi cho 25% ca khó ✓</text>
      </g>
    `;
  }

  return `
    <g transform="translate(20, 24)">
      <rect x="0" y="0" width="720" height="350" rx="14" fill="var(--card)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="24" y="30" font-size="13.5" font-weight="800">Production Serving Stack: Guardrails → Semantic Cache → vLLM Batching → Pydantic JSON</text>

      <!-- Step 1: Guardrail -->
      <rect x="22" y="64" width="142" height="106" rx="11" fill="var(--amber)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="93" y="94" text-anchor="middle" font-size="12" font-weight="800" fill="var(--amber-ink)">1. Guardrails</text>
      <text x="93" y="116" text-anchor="middle" font-size="10.5" fill="var(--amber-ink)">• Chặn Prompt</text>
      <text x="93" y="132" text-anchor="middle" font-size="10.5" fill="var(--amber-ink">  Injection</text>
      <text x="93" y="150" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--amber-ink)">• Ẩn danh PII</text>

      <line x1="164" y1="117" x2="194" y2="117" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 2: Semantic Cache -->
      <rect x="196" y="64" width="148" height="106" rx="11" fill="var(--sand)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="270" y="94" text-anchor="middle" font-size="12" font-weight="800">2. Semantic Cache</text>
      <text x="270" y="116" text-anchor="middle" font-size="10.5">Redis Vector Cache</text>
      <text x="270" y="136" text-anchor="middle" font-size="10.5">(cos &gt;= 0.96)</text>
      <text x="270" y="154" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--emerald)">Hit 40% → Trả về 5ms</text>

      <line x1="344" y1="117" x2="374" y2="117" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 3: vLLM & ONNX Serving -->
      <rect x="376" y="64" width="154" height="106" rx="11" fill="var(--violet)" stroke="var(--ink)" stroke-width="1.7"/>
      <text x="453" y="94" text-anchor="middle" font-size="12" font-weight="800">3. vLLM / ONNX</text>
      <text x="453" y="116" text-anchor="middle" font-size="10.5">• PagedAttention</text>
      <text x="453" y="134" text-anchor="middle" font-size="10.5">• Continuous Batch</text>
      <text x="453" y="152" text-anchor="middle" font-size="10.5" font-weight="700">&gt;120 tokens/sec</text>

      <line x1="530" y1="117" x2="558" y2="117" stroke="var(--ink)" stroke-width="2" class="svg-link-flow"/>

      <!-- Step 4: Constrained JSON -->
      <rect x="560" y="64" width="138" height="106" rx="11" fill="var(--green)" stroke="var(--ink)" stroke-width="1.8"/>
      <text x="629" y="94" text-anchor="middle" font-size="12" font-weight="800" fill="#12240f">4. JSON Output</text>
      <text x="629" y="116" text-anchor="middle" font-size="10.5" fill="#12240f">Pydantic Schema</text>
      <text x="629" y="134" text-anchor="middle" font-size="10.5" font-weight="800" fill="#12240f">100% Valid JSON</text>
      <text x="629" y="152" text-anchor="middle" font-size="10.5" fill="#12240f">+ Function Call</text>

      <!-- Bottom Observability & RAGAS Bar -->
      <rect x="22" y="202" width="676" height="122" rx="12" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/>
      <text x="40" y="228" font-size="12" font-weight="800">5. Giám sát Chất lượng Liên tục (RAGAS Evaluation &amp; Telemetry):</text>
      ${[
        { name: "Context Precision", val: "0.94" },
        { name: "Context Recall", val: "0.92" },
        { name: "Faithfulness (Không bịa)", val: "0.97" },
        { name: "Answer Relevance", val: "0.95" },
      ]
        .map(
          (m, idx) => `
        <g transform="translate(${40 + idx * 160}, 244)">
          <rect x="0" y="0" width="146" height="60" rx="8" fill="var(--green-tile)" stroke="var(--ink)"/>
          <text x="73" y="25" text-anchor="middle" font-size="10.5" font-weight="700">${m.name}</text>
          <text x="73" y="47" text-anchor="middle" font-size="15" font-weight="800" fill="var(--emerald)">${m.val} ✓</text>
        </g>
      `
        )
        .join("")}
    </g>
  `;
}

// ============================================================================
// TOPBAR MODE SWITCHING (HỌC | PHÒNG THIẾT KẾ | LUYỆN TẬP | TÓM TẮT)
// ============================================================================
function switchTopMode(modeName, targetStage = null) {
  currentTopMode = modeName;
  document.querySelectorAll("[data-top-mode]").forEach((btn) => {
    const active = btn.getAttribute("data-top-mode") === modeName;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  const bodyGrid = document.getElementById("appBodyGrid");
  const learnSheet = document.getElementById("learnSheetView");
  const learnRail = document.getElementById("learnGuideRail");
  const sandboxView = document.getElementById("sandboxPanelView");
  const exerciseView = document.getElementById("exercisePanelView");
  const cheatsheetView = document.getElementById("cheatsheetPanelView");

  const isLearn = modeName === "learn";
  bodyGrid.classList.toggle("is-wide-view", !isLearn);

  learnSheet.classList.toggle("hidden", !isLearn);
  learnRail.classList.toggle("hidden", !isLearn);
  sandboxView.classList.toggle("hidden", modeName !== "sandbox");
  exerciseView.classList.toggle("hidden", modeName !== "exercise");
  cheatsheetView.classList.toggle("hidden", modeName !== "cheatsheet");

  const activeStage = targetStage || LESSONS[currentLessonId]?.stage || 1;
  if (modeName === "sandbox") {
    switchLabStagePane(activeStage);
  } else if (modeName === "exercise") {
    switchExStagePane(activeStage);
  }
}

function switchLabStagePane(stageNum) {
  document.querySelectorAll("[data-lab-stage]").forEach((b) => {
    b.classList.toggle("active", parseInt(b.getAttribute("data-lab-stage"), 10) === stageNum);
  });
  document.querySelectorAll("[data-lab-pane]").forEach((p) => {
    p.classList.toggle("hidden", parseInt(p.getAttribute("data-lab-pane"), 10) !== stageNum);
  });
}

function switchExStagePane(stageNum) {
  document.querySelectorAll("[data-ex-stage]").forEach((b) => {
    b.classList.toggle("active", parseInt(b.getAttribute("data-ex-stage"), 10) === stageNum);
  });
  document.querySelectorAll("[data-ex-pane]").forEach((p) => {
    p.classList.toggle("hidden", parseInt(p.getAttribute("data-ex-pane"), 10) !== stageNum);
  });
}

// ============================================================================
// STEP NAVIGATION CONTROLS & KEYBOARD SHORTCUTS (←, →, 1..9, Space, R, Ctrl+K)
// ============================================================================
function goNextStep() {
  const lesson = LESSONS[currentLessonId];
  if (currentStepIndex + 1 < lesson.steps.length) {
    navigateToLessonStep(currentLessonId, currentStepIndex + 1);
  } else {
    const nextIdx = LESSON_ORDER.indexOf(currentLessonId) + 1;
    if (nextIdx < LESSON_ORDER.length) {
      navigateToLessonStep(LESSON_ORDER[nextIdx], 0);
    } else {
      switchTopMode("sandbox", 4);
    }
  }
}

function goPrevStep() {
  if (currentStepIndex > 0) {
    navigateToLessonStep(currentLessonId, currentStepIndex - 1);
  } else {
    const prevIdx = LESSON_ORDER.indexOf(currentLessonId) - 1;
    if (prevIdx >= 0) {
      const prevLid = LESSON_ORDER[prevIdx];
      navigateToLessonStep(prevLid, LESSONS[prevLid].steps.length - 1);
    }
  }
}

function toggleStageAnimation() {
  isStagePlaying = !isStagePlaying;
  const stageEl = document.getElementById("diagramStage");
  const btn = document.getElementById("toggleAnimBtn");
  const icon = document.getElementById("toggleAnimIcon");
  const label = document.getElementById("toggleAnimLabel");

  stageEl?.classList.toggle("is-paused", !isStagePlaying);
  btn?.classList.toggle("is-on", isStagePlaying);
  icon?.setAttribute("href", isStagePlaying ? "#ic-pause" : "#ic-play");
  if (label) label.textContent = isStagePlaying ? "Đang chạy" : "Tạm dừng";
}

// ============================================================================
// REST API HELPER & PYTHON SANDBOX HANDLERS
// ============================================================================
async function callApi(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

async function runStage1Preprocess() {
  const text = document.getElementById("s1InputText").value;
  const tone_style = document.getElementById("s1ToneStyle").value;
  const expand_teencode = document.getElementById("s1ExpandTeencode").checked;
  const lowercase = document.getElementById("s1Lowercase").checked;

  const data = await callApi("/api/preprocess", {
    text,
    tone_style,
    expand_teencode,
    lowercase,
  });

  const nfcBoxes = data.nfc_breakdown
    .map(
      (c, idx) => `
      <div class="cp-box" style="--idx: ${idx}">
        <div class="cp-char">${c.char}</div>
        <div class="cp-hex">${c.hex}</div>
      </div>`
    )
    .join("");

  const nfdBoxes = data.nfd_breakdown
    .map(
      (c, idx) => `
      <div class="cp-box ${c.combining ? "combining" : ""}" style="--idx: ${idx}">
        <div class="cp-char">${c.combining ? "◌" + c.char : c.char}</div>
        <div class="cp-hex">${c.hex}</div>
      </div>`
    )
    .join("");

  const transHtml =
    data.transformations.length > 0
      ? data.transformations.map((t) => `<li><strong>✓ ${t.type}:</strong> ${t.detail}</li>`).join("")
      : "<li>✓ Văn bản đầu vào đã ở trạng thái chuẩn.</li>";

  document.getElementById("s1PreprocessResult").innerHTML = `
    <div class="sub-panel">
      <h4>${svgIcon("ic-check-circle", "svg-icon-sm")} Kết Quả Văn Bản Sau Khi Chuẩn Hóa</h4>
      <p style="font-size:14.5px; font-weight:800; color:var(--emerald-text); background:var(--emerald-bg); padding:10px 12px; border-radius:9px; border:1.4px solid var(--ink);">
        ${data.cleaned_text}
      </p>
      <div style="margin-top:10px; font-size:12.5px;">
        <strong>Các bước biến đổi đã thực thi:</strong>
        <ul class="takeaways" style="margin-top:6px;">${transHtml}</ul>
      </div>
    </div>

    <div class="sub-panel">
      <h4>${svgIcon("ic-code-2", "svg-icon-sm")} Mổ Xẻ Codepoint Từ "${data.sample_word}": NFC (${data.nfc_breakdown.length} chars) vs NFD (${data.nfd_breakdown.length} chars)</h4>
      <div style="font-size:11.5px; font-weight:800; color:var(--emerald); margin-bottom:4px;">✓ NFC (Dựng sẵn - 1 codepoint duy nhất cho nguyên âm có dấu):</div>
      <div class="codepoint-list">${nfcBoxes}</div>
      <div style="font-size:11.5px; font-weight:800; color:var(--rose); margin:10px 0 4px;">✗ NFD (Tổ hợp - Tách rời dấu thanh thành Combining Marks):</div>
      <div class="codepoint-list">${nfdBoxes}</div>
    </div>
  `;
}

async function runStage1Segment() {
  const text = document.getElementById("s1SegInput").value;
  const data = await callApi("/api/segment", { text });

  const syllablePills = data.syllables.map((s) => `<span class="tok-pill">${s}</span>`).join("");

  const wordPills = data.pos_and_dependencies
    .map(
      (item) => `
      <span class="tok-pill ${item.word.includes("_") ? "compound" : ""}">
        <strong>${item.word}</strong>
        <span class="pos-badge">${item.pos}</span>
      </span>`
    )
    .join("");

  const depRows = data.pos_and_dependencies
    .map(
      (d) => `
      <tr>
        <td>${d.index}</td>
        <td><strong>${d.word}</strong></td>
        <td><span class="pos-badge">${d.pos}</span></td>
        <td>${d.head === 0 ? "ROOT (0)" : `Token #${d.head}`}</td>
        <td><code>${d.relation}</code></td>
      </tr>`
    )
    .join("");

  document.getElementById("s1SegmentResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>1. Tách theo Khoảng trắng Âm tiết (${data.syllable_count} âm tiết)</h4>
        <div class="token-stream">${syllablePills}</div>
        <h4 style="margin-top:14px;">2. Tách từ Tiếng Việt &amp; Gán nhãn POS (${data.word_count} từ, ${data.compound_count} từ ghép)</h4>
        <div class="token-stream">${wordPills}</div>
        <p class="muted" style="margin-top:10px; font-size:12px;">
          Chuỗi đầu vào chuẩn cho PhoBERT: <code>${data.segmented_text}</code>
        </p>
      </div>

      <div class="sub-panel">
        <h4>3. Bảng Phân tích Cú pháp Phụ thuộc (Dependency Parsing)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Từ (Word)</th>
              <th>POS</th>
              <th>Head</th>
              <th>Quan hệ</th>
            </tr>
          </thead>
          <tbody>${depRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

const CLUSTER_COLORS = {
  education: "#7fc278",
  nlp_ai: "#b79ce6",
  sentiment_pos: "#9fd28f",
  sentiment_neg: "#e5534b",
  location: "#f3b47f",
};

async function runStage2Embedding(targetWord = "giảng_viên") {
  const sampleSentence = document.getElementById("s2SentimentInput").value;
  const data = await callApi("/api/embedding", {
    target_word: targetWord,
    sample_sentence: sampleSentence,
  });
  currentEmbeddingData = data;
  canvasAnimState.targetX = data.target_point.x;
  canvasAnimState.targetY = data.target_point.y;

  document.getElementById("selectedWordTitle").textContent = data.target_word;

  const neighborsHtml = data.top_neighbors
    .slice(1, 6)
    .map((n) => {
      const pct = Math.max(5, Math.round(n.similarity * 100));
      return `
        <div class="neighbor-row">
          <div class="neighbor-top">
            <span>${n.word} <small class="muted">(${n.label})</small></span>
            <span>cos(θ) = ${n.similarity.toFixed(3)}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
  document.getElementById("neighborsList").innerHTML = neighborsHtml;

  const sent = data.sentiment_analysis;
  const badgeClass =
    sent.predicted_label === "Positive"
      ? "tag-emerald"
      : sent.predicted_label === "Negative"
      ? "tag-rose"
      : "pos-badge";

  const featsHtml =
    sent.matched_features.length > 0
      ? sent.matched_features
          .map((f) => `<span class="tok-pill compound">${f.feature} (${f.weight > 0 ? "+" : ""}${f.weight})</span>`)
          .join("")
      : `<span class="muted">Không có từ khóa cảm xúc mạnh (Trung tính)</span>`;

  document.getElementById("s2SentimentResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>Dự đoán Nhãn Cảm xúc (UIT-VSFC): <span class="${badgeClass}">${sent.predicted_label}</span></h4>
        <p class="muted" style="margin-bottom:8px;">Câu sau khi tách từ: <code>${sent.segmented_sentence}</code></p>
        <div><strong>Đặc trưng từ ghép đóng góp trọng số:</strong></div>
        <div class="token-stream">${featsHtml}</div>
      </div>
      <div class="sub-panel">
        <h4>Phân phối Xác suất Dự đoán (Softmax Probabilities)</h4>
        ${Object.entries(sent.probabilities)
          .map(
            ([label, prob]) => `
            <div style="margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; font-size:12.5px;">
                <span>${label}</span>
                <strong>${(prob * 100).toFixed(1)}%</strong>
              </div>
              <div class="progress-bar-track" style="margin-top:3px;">
                <div class="progress-bar-fill" style="width:${prob * 100}%"></div>
              </div>
            </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function startCanvasAnimationLoop() {
  function tick() {
    if (currentEmbeddingData && currentTopMode === "sandbox") {
      canvasAnimState.currX += (canvasAnimState.targetX - canvasAnimState.currX) * 0.14;
      canvasAnimState.currY += (canvasAnimState.targetY - canvasAnimState.currY) * 0.14;
      canvasAnimState.phase += 0.045;
      drawEmbeddingCanvas(currentEmbeddingData);
    }
    canvasAnimState.rafId = requestAnimationFrame(tick);
  }
  canvasAnimState.rafId = requestAnimationFrame(tick);
}

function drawEmbeddingCanvas(data) {
  const canvas = document.getElementById("embeddingCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const scaleX = W * 0.42;
  const scaleY = H * 0.4;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = "#342f28";
  ctx.lineWidth = 1;
  [80, 155].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(W, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, H);
  ctx.stroke();

  const tx = cx + canvasAnimState.currX * scaleX;
  const ty = cy - canvasAnimState.currY * scaleY;

  ctx.strokeStyle = "#b2d491";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  const topNeighbors = data.top_neighbors.slice(1, 5);
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(159, 210, 143, 0.75)";
  ctx.lineWidth = 1.5;
  topNeighbors.forEach((n) => {
    const nx = cx + n.x * scaleX;
    const ny = cy - n.y * scaleY;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const breatheRadius = 11 + Math.sin(canvasAnimState.phase) * 3;
  data.all_points.forEach((pt) => {
    const px = cx + pt.x * scaleX;
    const py = cy - pt.y * scaleY;
    const isTarget = pt.word === data.target_word;
    const color = CLUSTER_COLORS[pt.cluster] || "#9fd28f";

    if (isTarget) {
      ctx.beginPath();
      ctx.arc(px, py, breatheRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(178, 212, 145, 0.28)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, isTarget ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#1d1b18";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = isTarget ? "bold 12px JetBrains Mono, monospace" : "11px JetBrains Mono, monospace";
    ctx.fillStyle = isTarget ? "#ffffff" : "#ddd3c2";
    ctx.fillText(pt.word, px + 9, py + 4);
  });
}

function handleCanvasClick(event) {
  if (!currentEmbeddingData) return;
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const scaleRatioX = canvas.width / rect.width;
  const scaleRatioY = canvas.height / rect.height;
  const clickX = (event.clientX - rect.left) * scaleRatioX;
  const clickY = (event.clientY - rect.top) * scaleRatioY;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scaleX = canvas.width * 0.42;
  const scaleY = canvas.height * 0.4;

  let closestWord = null;
  let minDist = Infinity;

  currentEmbeddingData.all_points.forEach((pt) => {
    const px = cx + pt.x * scaleX;
    const py = cy - pt.y * scaleY;
    const dist = Math.hypot(clickX - px, clickY - py);
    if (dist < minDist) {
      minDist = dist;
      closestWord = pt.word;
    }
  });

  if (closestWord && minDist < 48) {
    runStage2Embedding(closestWord);
  }
}

async function runStage3TokenizerCompare() {
  const text = document.getElementById("s3TokenInput").value;
  const data = await callApi("/api/tokenize-compare", { text });

  const phobertTokens = data.phobert.tokens
    .map((t) => `<span class="tok-pill ${t.includes("@@") || t.includes("_") ? "compound" : ""}">${t}</span>`)
    .join("");

  const vit5Tokens = data.vit5.tokens.map((t) => `<span class="tok-pill">${t}</span>`).join("");

  const alignmentRows = data.phobert.subword_alignment
    .map(
      (row) => `
      <tr>
        <td><code>${row.subword}</code></td>
        <td>${row.word_origin}</td>
        <td><span class="${row.ner_tag !== "O" ? "tag-emerald" : "muted"}">${row.ner_tag}</span></td>
        <td>
          <span class="${row.loss_label_id === -100 ? "tag-rose" : "tag-emerald"}">
            ${row.loss_label_id === -100 ? "✗ -100 (Ignored)" : `✓ ID = ${row.loss_label_id}`}
          </span>
        </td>
      </tr>`
    )
    .join("");

  document.getElementById("s3TokenResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>1. <code>${data.phobert.model_name}</code> (Bắt buộc nối '_' + Fairseq BPE '@@')</h4>
        <div class="token-stream">${phobertTokens}</div>
        <h4 style="margin-top:14px;">2. <code>${data.vit5.model_name}</code> (SentencePiece '▁' trên văn bản tự nhiên)</h4>
        <div class="token-stream">${vit5Tokens}</div>
      </div>

      <div class="sub-panel">
        <h4>3. Bảng Căn chỉnh Nhãn Subword (Subword Label Alignment cho PhoBERT NER)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Subword</th>
              <th>Từ Gốc</th>
              <th>Nhãn IOB2</th>
              <th>CrossEntropy ID</th>
            </tr>
          </thead>
          <tbody>${alignmentRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

async function runStage4RagSimulate() {
  const question = document.getElementById("s4RagQuestion").value;
  const use_word_seg_bm25 = document.getElementById("s4UseWordSeg").checked;
  const dense_weight = parseFloat(document.getElementById("s4DenseWeight").value);

  const data = await callApi("/api/rag-simulate", {
    question,
    use_word_seg_bm25,
    dense_weight,
  });

  const traceHtml = data.langgraph_trace
    .map(
      (step) => `
      <div class="neighbor-row" style="border-left: 3.5px solid var(--emerald);">
        <div class="neighbor-top">
          <span><strong>${step.node}</strong></span>
          <span class="tag-emerald">${step.latency_ms} ms</span>
        </div>
        <div class="muted" style="font-size:12px;">${step.detail}</div>
      </div>`
    )
    .join("");

  const docsHtml = data.ranked_documents
    .map(
      (doc, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${doc.title}</strong> <small class="muted">(${doc.id})</small></td>
        <td>${doc.bm25_score.toFixed(3)}</td>
        <td>${doc.dense_score.toFixed(3)}</td>
        <td><span class="tag-emerald">✓ ${doc.hybrid_score.toFixed(3)}</span></td>
      </tr>`
    )
    .join("");

  document.getElementById("s4RagResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>Nhật ký Thực thi Đồ thị Trạng thái LangGraph (Step-by-Step Trace)</h4>
        <div>${traceHtml}</div>
        <div style="margin-top:12px; padding:12px; background:var(--emerald-bg); border:1.4px solid var(--ink); border-radius:9px;">
          <div style="font-size:11px; font-weight:800;">✓ CÂU TRẢ LỜI SINH BỞI AGENT (GROUNDED ANSWER):</div>
          <div style="font-size:12.8px; margin-top:4px; font-weight:600;">${data.generated_answer}</div>
        </div>
      </div>

      <div class="sub-panel">
        <h4>Bảng Xếp hạng Truy xuất Lai (Hybrid Retrieval: BM25 + BGE-M3)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Tài liệu (UIT-ViQuAD / VietNews)</th>
              <th>BM25</th>
              <th>Dense</th>
              <th>Hybrid</th>
            </tr>
          </thead>
          <tbody>${docsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

function updateVramCalculator() {
  const paramsB = parseFloat(document.getElementById("vramModelSize").value);
  const method = document.getElementById("vramMethod").value;
  const rank = parseInt(document.getElementById("vramLoraRank").value, 10);

  let baseWeightsGB = 0;
  let adapterAndOptGB = 0;
  let activationGB = 0;

  if (method === "qlora4") {
    baseWeightsGB = +(paramsB * 0.58).toFixed(1);
    adapterAndOptGB = +(paramsB * rank * 0.012).toFixed(1);
    activationGB = +(2.2 + paramsB * 0.15).toFixed(1);
  } else if (method === "lora16") {
    baseWeightsGB = +(paramsB * 2.05).toFixed(1);
    adapterAndOptGB = +(paramsB * rank * 0.015).toFixed(1);
    activationGB = +(3.0 + paramsB * 0.2).toFixed(1);
  } else {
    baseWeightsGB = +(paramsB * 2.05).toFixed(1);
    adapterAndOptGB = +(paramsB * 4.2).toFixed(1);
    activationGB = +(6.0 + paramsB * 0.5).toFixed(1);
  }

  const totalGB = +(baseWeightsGB + adapterAndOptGB + activationGB).toFixed(1);
  const gpuRec =
    totalGB <= 15
      ? "✓ Chạy tốt trên Google Colab Free (T4 16GB) hoặc RTX 3060/4060 Ti (12-16GB)"
      : totalGB <= 24
      ? "Khuyến nghị GPU RTX 3090 / RTX 4090 / L4 (24GB VRAM)"
      : "Cần GPU Server A100 / H100 (40GB - 80GB VRAM)";

  document.getElementById("vramResultBox").innerHTML = `
    <div class="sub-panel">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h4>Tổng VRAM Ước tính: <span class="tag-emerald" style="font-size:14px;">${totalGB} GB VRAM</span></h4>
          <p class="muted" style="font-size:12.5px; margin-top:4px;">Khuyến nghị phần cứng: <strong>${gpuRec}</strong></p>
        </div>
        <div style="display:flex; gap:14px; font-size:12.5px;">
          <span>Trọng số gốc: <strong>${baseWeightsGB} GB</strong></span>
          <span>LoRA + Optimizer: <strong>${adapterAndOptGB} GB</strong></span>
          <span>Activations: <strong>${activationGB} GB</strong></span>
        </div>
      </div>
    </div>
  `;
}

async function runStage5ProdPipeline() {
  const raw_text = document.getElementById("s5ProdInput").value;
  const chunk_mode = document.getElementById("s5ChunkMode").value;
  const mask_pii = document.getElementById("s5MaskPii").checked;

  const data = await callApi("/api/production-pipeline", {
    raw_text,
    chunk_mode,
    mask_pii,
  });

  const piiHtml =
    data.pii_detected.length > 0
      ? data.pii_detected
          .map(
            (p) =>
              `<span class="tok-pill compound">${p.type}: "${p.value}" → <code>${p.masked_as}</code></span>`
          )
          .join("")
      : `<span class="tag-emerald">✓ Không phát hiện PII rò rỉ</span>`;

  const chunksHtml = data.chunks
    .map(
      (c) => `
      <div class="neighbor-row" style="border-left: 3.5px solid ${c.intact_semantics ? "var(--emerald)" : "var(--rose)"};">
        <div class="neighbor-top">
          <span><strong>${c.chunk_id}</strong> · <small class="muted">${c.parent_header}</small></span>
          <span class="${c.intact_semantics ? "tag-emerald" : "tag-rose"}">Reranker Score: ${c.reranker_score}</span>
        </div>
        <div style="font-size:12.2px; margin-top:4px;">${c.text}</div>
      </div>`
    )
    .join("");

  const jsonFormatted = JSON.stringify(data.structured_output, null, 2);

  document.getElementById("s5ProdResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>1. Trạng thái Guardrail &amp; Ẩn danh PII (Nghị định 13/2023)</h4>
        <div style="margin-bottom:8px;">
          <span class="${data.guardrail_safe ? "tag-emerald" : "tag-rose"}">
            ${data.guardrail_safe ? "✓ Guardrail: AN TOÀN" : "✗ Guardrail: PHÁT HIỆN PROMPT INJECTION!"}
          </span>
        </div>
        <div class="token-stream" style="margin-bottom:10px;">${piiHtml}</div>
        <p style="font-size:12.2px; background:var(--card); padding:9px; border-radius:8px; border:1px solid var(--line-strong);">
          <strong>Văn bản sau khi qua PII Scrubber:</strong><br/>${data.masked_text}
        </p>

        <h4 style="margin-top:14px;">2. Các Đoạn Phân Mảnh (${data.chunks.length} chunks) &amp; Điểm Cross-Encoder Reranker</h4>
        <div>${chunksHtml}</div>
      </div>

      <div class="sub-panel">
        <h4>3. Đầu ra Structured JSON (Pydantic Schema / Constrained Decoding)</h4>
        <pre style="background:var(--code-bg); border:1.3px solid var(--ink-2); border-radius:9px; padding:12px; font-size:12px; overflow-x:auto; line-height:1.5;"><code>${jsonFormatted}</code></pre>
      </div>
    </div>
  `;
}

// ============================================================================
// EXERCISES & QUIZZES
// ============================================================================
function setupExerciseHandlers() {
  document.getElementById("submitEx1Btn")?.addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 1,
      payload: {
        unicode_form: document.getElementById("ex1Unicode").value,
        tone_style: document.getElementById("ex1Tone").value,
        word_segmentation: document.getElementById("ex1Seg").value,
      },
    });
    showExerciseFeedback("ex1Feedback", 1, res);
  });

  document.getElementById("submitEx2Btn")?.addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 2,
      payload: {
        segmented_sentence: document.getElementById("ex2SegAnswer").value,
      },
    });
    showExerciseFeedback("ex2Feedback", 2, res);
  });

  document.getElementById("submitEx3Btn")?.addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 3,
      payload: {
        first_subword_label: document.getElementById("ex3FirstSub").value,
        second_subword_label: document.getElementById("ex3SecondSub").value,
      },
    });
    showExerciseFeedback("ex3Feedback", 3, res);
  });

  document.getElementById("submitEx4Btn")?.addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 4,
      payload: {
        bm25_use_seg: document.getElementById("ex4Bm25").value === "true",
        dense_model: document.getElementById("ex4Dense").value,
        enable_grader: document.getElementById("ex4Grader").value === "true",
      },
    });
    showExerciseFeedback("ex4Feedback", 4, res);
  });

  document.getElementById("submitEx5Btn")?.addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 5,
      payload: {
        pii_masking: document.getElementById("ex5Pii").value,
        chunk_strategy: document.getElementById("ex5Chunk").value,
        serving_stack: document.getElementById("ex5Serving").value,
      },
    });
    showExerciseFeedback("ex5Feedback", 5, res);
  });
}

function showExerciseFeedback(elementId, stageId, res) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("pass", "fail");
  el.classList.add(res.passed ? "pass" : "fail");
  el.innerHTML = `<strong>${res.passed ? "✓ ĐẠT (+100 XP):" : "✗ CHƯA ĐẠT:"}</strong> ${res.feedback}`;
  el.hidden = false;
  if (res.passed) {
    awardXP(`stage_${stageId}`, "exercise", 100);
  }
}

function renderAllQuizzes() {
  for (let stage = 1; stage <= 5; stage++) {
    const container = document.getElementById(`quizContainer${stage}`);
    if (!container) continue;
    const questions = QUIZ_BANK[stage] || [];
    const html = questions
      .map((item, qIdx) => {
        const qKey = `q_${stage}_${qIdx}`;
        const isDone = !!userProgress.completedQuizzes[qKey];
        const optsHtml = item.options
          .map(
            (opt, oIdx) => `
            <button class="quiz-opt ${isDone && oIdx === item.correct ? "correct" : ""}"
                    type="button"
                    data-stage="${stage}" data-qidx="${qIdx}" data-oidx="${oIdx}">
              ${opt}
            </button>`
          )
          .join("");
        return `
          <div class="quiz-item">
            <div class="quiz-q">${item.q} ${isDone ? '<span class="tag-emerald">✓ +50 XP</span>' : ""}</div>
            <div class="quiz-options">${optsHtml}</div>
            <div class="feedback-box ${isDone ? "pass" : ""}" id="qfb_${stage}_${qIdx}" ${isDone ? "" : "hidden"}>
              ${isDone ? item.explain : ""}
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = `<h3 style="margin-bottom:12px;">Trắc Nghiệm Kiểm Tra Kiến Thức Giai đoạn ${stage}</h3>${html}`;
  }

  document.querySelectorAll(".quiz-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = parseInt(btn.dataset.stage, 10);
      const qIdx = parseInt(btn.dataset.qidx, 10);
      const oIdx = parseInt(btn.dataset.oidx, 10);
      const item = QUIZ_BANK[s][qIdx];
      const fbEl = document.getElementById(`qfb_${s}_${qIdx}`);

      const parent = btn.parentElement;
      parent.querySelectorAll(".quiz-opt").forEach((b) => b.classList.remove("correct", "wrong"));

      fbEl.classList.remove("pass", "fail");
      if (oIdx === item.correct) {
        btn.classList.add("correct");
        fbEl.classList.add("pass");
        fbEl.innerHTML = `<strong>✓ Chính xác (+50 XP):</strong> ${item.explain}`;
        fbEl.hidden = false;
        awardXP(`q_${s}_${qIdx}`, "quiz", 50);
      } else {
        btn.classList.add("wrong");
        fbEl.classList.add("fail");
        fbEl.innerHTML = `<strong>✗ Chưa đúng:</strong> Hãy xem lại sơ đồ bài học ở chế độ Học nhé!`;
        fbEl.hidden = false;
      }
    });
  });
}

// ============================================================================
// INITIALIZATION & EVENT BINDINGS
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSidebarTree();
  renderAllQuizzes();
  initGlossarySystem();
  startCanvasAnimationLoop();

  // Initial route from URL hash (e.g. #/unicode-tone/1 or #/phobert-nlu/2)
  const initialRoute = parseHashRoute();
  navigateToLessonStep(initialRoute.lessonId, initialRoute.stepIdx, true);

  window.addEventListener("hashchange", () => {
    const r = parseHashRoute();
    if (r.lessonId !== currentLessonId || r.stepIdx !== currentStepIndex) {
      navigateToLessonStep(r.lessonId, r.stepIdx, false);
    }
  });

  // Topbar Mode Tabs
  document.querySelectorAll("[data-top-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTopMode(btn.getAttribute("data-top-mode"));
    });
  });

  // Mobile Sidebar Drawer toggle
  document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
    document.getElementById("courseSidebar")?.classList.toggle("is-drawer-open");
  });

  // Brand home click
  document.getElementById("brandHomeLink")?.addEventListener("click", () => {
    switchTopMode("learn");
    navigateToLessonStep("unicode-tone", 0);
  });

  // Step Prev / Next / Play / Replay / Lab Jump
  document.getElementById("prevStepBtn")?.addEventListener("click", goPrevStep);
  document.getElementById("nextStepBtn")?.addEventListener("click", goNextStep);
  document.getElementById("toggleAnimBtn")?.addEventListener("click", toggleStageAnimation);
  document.getElementById("replayStepBtn")?.addEventListener("click", () => {
    renderCurrentLessonStep();
  });
  document.getElementById("openStageLabBtn")?.addEventListener("click", () => {
    const st = LESSONS[currentLessonId]?.stage || 1;
    switchTopMode("sandbox", st);
  });

  // Keyboard shortcuts (Designed to Scale conventions)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openGlossaryDrawer();
      return;
    }
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (currentTopMode !== "learn") return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNextStep();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrevStep();
    } else if (e.key === " ") {
      e.preventDefault();
      toggleStageAnimation();
    } else if (e.key.toLowerCase() === "r") {
      e.preventDefault();
      renderCurrentLessonStep();
    } else if (/^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      const les = LESSONS[currentLessonId];
      if (les && idx < les.steps.length) {
        e.preventDefault();
        navigateToLessonStep(currentLessonId, idx);
      }
    }
  });

  // Lab & Exercise sub-tabs
  document.querySelectorAll("[data-lab-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchLabStagePane(parseInt(btn.getAttribute("data-lab-stage"), 10));
    });
  });
  document.querySelectorAll("[data-ex-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchExStagePane(parseInt(btn.getAttribute("data-ex-stage"), 10));
    });
  });

  // Reset Progress
  document.getElementById("resetProgressBtn")?.addEventListener("click", () => {
    userProgress = { xp: 0, visitedSteps: {}, completedExercises: {}, completedQuizzes: {} };
    saveProgress();
    renderAllQuizzes();
    renderCurrentLessonStep();
  });

  // Sandbox Stage 1
  document.getElementById("runPreprocessBtn")?.addEventListener("click", runStage1Preprocess);
  document.querySelectorAll("[data-preset-s1]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s1InputText").value = btn.dataset.presetS1;
      runStage1Preprocess();
    });
  });
  document.getElementById("runSegmentBtn")?.addEventListener("click", runStage1Segment);
  document.querySelectorAll("[data-preset-seg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s1SegInput").value = btn.dataset.presetSeg;
      runStage1Segment();
    });
  });

  // Sandbox Stage 2
  document.querySelectorAll("[data-word-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      runStage2Embedding(btn.dataset.wordSelect);
    });
  });
  document.getElementById("runSentimentBtn")?.addEventListener("click", () => {
    const word = document.getElementById("selectedWordTitle").textContent || "giảng_viên";
    runStage2Embedding(word);
  });
  document.querySelectorAll("[data-sent-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s2SentimentInput").value = btn.dataset.sentSample;
      const word = document.getElementById("selectedWordTitle").textContent || "giảng_viên";
      runStage2Embedding(word);
    });
  });
  document.getElementById("embeddingCanvas")?.addEventListener("click", handleCanvasClick);

  // Sandbox Stage 3
  document.getElementById("runTokenCompareBtn")?.addEventListener("click", runStage3TokenizerCompare);
  document.querySelectorAll("[data-tok-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s3TokenInput").value = btn.dataset.tokSample;
      runStage3TokenizerCompare();
    });
  });

  // Sandbox Stage 4
  document.getElementById("s4DenseWeight")?.addEventListener("input", (e) => {
    document.getElementById("s4DenseWeightVal").textContent = parseFloat(e.target.value).toFixed(2);
  });
  document.getElementById("runRagSimBtn")?.addEventListener("click", runStage4RagSimulate);
  document.querySelectorAll("[data-rag-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s4RagQuestion").value = btn.dataset.ragQ;
      runStage4RagSimulate();
    });
  });
  ["vramModelSize", "vramMethod", "vramLoraRank"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateVramCalculator);
  });

  // Sandbox Stage 5 (Production Pipeline)
  document.getElementById("runProdPipelineBtn")?.addEventListener("click", runStage5ProdPipeline);
  document.getElementById("s5ChunkMode")?.addEventListener("change", runStage5ProdPipeline);
  document.getElementById("s5MaskPii")?.addEventListener("change", runStage5ProdPipeline);
  document.querySelectorAll("[data-prod-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s5ProdInput").value = btn.getAttribute("data-prod-sample");
      runStage5ProdPipeline();
    });
  });

  setupExerciseHandlers();

  // Preload Sandbox Data
  runStage1Preprocess();
  runStage1Segment();
  runStage2Embedding("giảng_viên");
  runStage3TokenizerCompare();
  runStage4RagSimulate();
  updateVramCalculator();
  runStage5ProdPipeline();
});


const NLP_GLOSSARY = {
  "pii-masking": {
    title: "PII Masking / Redaction (Ẩn danh Dữ liệu Cá nhân - Nghị định 13)",
    stage: 5,
    category: "Bảo mật & Tuân thủ AI",
    aliases: ["PII Masking", "PII", "Nghị định 13", "PII Scrubber"],
    def: "Quy trình phát hiện và che các thông tin định danh cá nhân nhạy cảm (Số CCCD 12 số, Số điện thoại, Email, Số tài khoản ngân hàng, Địa chỉ nhà) bằng các thẻ ẩn danh ([MASKED_CCCD], [MASKED_PHONE]) trước khi lưu vào Vector DB hoặc gửi lên Cloud LLM API.",
    example: "Input: 'Khách Nguyễn Văn A (CCCD: 079099001234, SĐT: 0912345678)'\nOutput: 'Khách Nguyễn Văn A (CCCD: [MASKED_CCCD], SĐT: [MASKED_PHONE])'",
    why: "Bắt buộc để tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam khi triển khai AI cho ngân hàng, y tế, bảo hiểm và TMĐT.",
    related: ["structure-chunking", "cross-encoder", "ragas"]
  },
  "structure-chunking": {
    title: "Structure-Aware Chunking & Contextual Header Injection",
    stage: 5,
    category: "Production RAG",
    aliases: ["Structure-Aware Chunking", "Header Injection", "Chunking"],
    def: "Kỹ thuật phân mảnh tài liệu dài dựa trên cấu trúc phân cấp tự nhiên của văn bản Việt Nam (Chương → Điều → Khoản → Điểm hoặc Markdown Heading) và tự động đính kèm đường dẫn tiêu đề cha ([Tên Văn Bản > Chương > Điều]) vào đầu mỗi đoạn chunk.",
    example: "[Bộ luật Lao động > Chương X > Điều 112: Nghỉ lễ, tết] Người lao động được nghỉ làm việc, hưởng nguyên lương trong những ngày lễ, tết sau đây...",
    why: "Khắc phục hoàn toàn lỗi đứt câu và mất ngữ cảnh pháp lý của phương pháp cắt cứng theo số lượng ký tự (Fixed-Size Chunking).",
    related: ["cross-encoder", "rrf", "bge-m3"]
  },
  "cross-encoder": {
    title: "Cross-Encoder Reranker (BAAI/bge-reranker-v2-m3)",
    stage: 5,
    category: "Production RAG",
    aliases: ["Cross-Encoder Reranker", "Cross-Encoder", "bge-reranker-v2-m3", "Reranker"],
    def: "Mô hình xếp hạng lại (tầng 2 sau bước Hybrid Retrieval): ghép trực tiếp cặp [CLS] Câu hỏi [SEP] Đoạn văn vào cùng một mạng Transformer để tính Self-Attention chéo giữa từng từ của câu hỏi với từng từ của đoạn văn, chấm điểm độ liên quan thực sự trong khoảng [0, 1].",
    example: "Tầng 1: BM25 + BGE-M3 lấy nhanh Top-25 đoạn văn trong 30ms.\nTầng 2: bge-reranker-v2-m3 chấm điểm 25 cặp và lọc lấy Top-3 đoạn tốt nhất đưa vào LLM.",
    why: "Giúp tăng độ chính xác Precision@3 thêm 15%–20% và giảm số lượng token rác đưa vào LLM.",
    related: ["structure-chunking", "rrf", "bge-m3", "ragas"]
  },
  "cohens-kappa": {
    title: "Cohen's Kappa (κ - Hệ số Đồng thuận Gán nhãn Dữ liệu)",
    stage: 5,
    category: "Data-Centric NLP",
    aliases: ["Cohen's Kappa", "Kappa", "Active Learning"],
    def: "Thước đo thống kê đánh giá mức độ đồng thuận giữa hai hay nhiều người gán nhãn dữ liệu (Inter-Annotator Agreement) sau khi đã loại trừ xác suất hai người gán trùng nhau một cách ngẫu nhiên: κ = (p_o - p_e) / (1 - p_e).",
    example: "• κ >= 0.80: Bộ dữ liệu và Guideline đạt chuẩn rất tốt.\n• κ < 0.65: Hướng dẫn gán nhãn đang mơ hồ, cần họp chuẩn hóa lại quy tắc trước khi gán hàng loạt.",
    why: "Đảm bảo chất lượng dữ liệu đầu vào trước khi huấn luyện PhoBERT hoặc QLoRA LLM.",
    related: ["uit-vsfc", "vlsp"]
  },
  "structured-output": {
    title: "Structured Outputs (Constrained Decoding / Pydantic JSON) & Function Calling",
    stage: 5,
    category: "Tích hợp Hệ thống",
    aliases: ["Structured Output", "Pydantic Schema", "Constrained Decoding", "Function Calling"],
    def: "Kỹ thuật ép mô hình ngôn ngữ lớn (LLM) sinh đầu ra tuân thủ tuyệt đối 100% lược đồ JSON (Pydantic Schema) bằng cách dùng máy trạng thái hữu hạn (FSM) khóa xác suất các token vi phạm cú pháp JSON tại mỗi bước giải mã, hoặc kích hoạt lời gọi hàm (Function Calling) tới SQL/API.",
    example: "{\"ma_hop_dong\": \"HD-2026\", \"gia_tri\": \"150 triệu đồng\", \"dieu_khoan\": [\"Điều 12\", \"Điều 15\"]}",
    why: "Cho phép kết nối trực tiếp đầu ra của LLM vào cơ sở dữ liệu, ERP, CRM mà không bao giờ bị lỗi JSONDecodeError.",
    related: ["vllm-onnx", "qwen-sailor2"]
  },
  "vllm-onnx": {
    title: "ONNX Runtime (PhoBERT) & vLLM Continuous Batching (LLM Serving)",
    stage: 5,
    category: "Hạ tầng Triển khai",
    aliases: ["ONNX Runtime", "vLLM", "PagedAttention", "Continuous Batching", "Semantic Cache"],
    def: "Bộ đôi công nghệ phục vụ mô hình hiệu năng cao trên Production:\n• ONNX Runtime / TensorRT: Tối ưu hóa đồ thị tính toán và lượng tử hóa INT8/FP16 cho PhoBERT/BGE-M3 (~5ms/câu).\n• vLLM: Engine phục vụ LLM sử dụng PagedAttention (quản lý KV-Cache không phân mảnh) và Continuous Batching (ghép động hàng trăm request đồng thời).",
    example: "Kết hợp thêm Redis Semantic Cache (lưu kết quả các câu hỏi có Cosine >= 0.96) giúp giảm 40% tải GPU.",
    why: "Tăng thông lượng phục vụ (Throughput) lên gấp 10–15 lần so với chạy Hugging Face pipeline tuần tự.",
    related: ["kv-cache", "phobert", "qwen-sailor2"]
  },
  "ragas": {
    title: "RAGAS (Retrieval-Augmented Generation Assessment) & Guardrails",
    stage: 5,
    category: "Đánh giá & Giám sát",
    aliases: ["RAGAS", "Guardrails", "Prompt Injection"],
    def: "Khung đánh giá tự động chất lượng hệ thống RAG trên 4 chiều: Context Precision (Độ chính xác đoạn tìm được), Context Recall (Độ phủ thông tin), Faithfulness (Độ trung thực không bịa đặt ngoài tài liệu) và Answer Relevance (Độ sát câu hỏi), kết hợp với Guardrails chống tấn công Prompt Injection.",
    example: "Faithfulness = (Số mệnh đề trong câu trả lời được chứng minh bởi tài liệu) / (Tổng số mệnh đề trong câu trả lời).",
    why: "Giúp giám sát liên tục chất lượng hệ thống RAG trên Production mà không cần con người chấm tay từng câu.",
    related: ["hallucination", "langgraph", "cross-encoder"]
  },

  "rdrsegmenter": {
    title: "RDRSegmenter (Ripple-Down Rules Segmenter)",
    stage: 1,
    category: "Thuật toán Tách từ",
    aliases: ["RDRSegmenter", "RDR", "rdrsegmenter"],
    def: "Thuật toán tách từ ghép tiếng Việt tốc độ cao nằm trong bộ công cụ VnCoreNLP (Nguyễn Đạt Quốc và cộng sự, 2018), hoạt động dựa trên Cây quy tắc ngoại lệ phân loại đơn (Single Classification Ripple-Down Rules - SCRDR).",
    example: "Bước 1: Khởi tạo bằng khớp từ điển dài nhất (Longest Matching).\nBước 2: Duyệt cây quy tắc SCRDR xét cửa sổ 5 âm tiết (w_{-2}, w_{-1}, w_0, w_{+1}, w_{+2}) để sửa nhãn B_W (bắt đầu từ) hoặc I_W (nối vào từ trước bằng dấu '_').\nVí dụ: 'Học sinh học sinh học' → 'Học_sinh học sinh_học'.",
    why: "Đạt độ chính xác ~97.90% F1 trên tập chuẩn VLSP 2013 và là bộ tách từ bắt buộc phải chạy trước khi đưa văn bản vào PhoBERT hoặc PhoNLP.",
    related: ["scrdr", "vncorenlp", "bw-iw", "longest-matching", "crf"]
  },
  "scrdr": {
    title: "SCRDR (Single Classification Ripple-Down Rules)",
    stage: 1,
    category: "Cấu trúc Dữ liệu & Luật",
    aliases: ["SCRDR", "Ripple-Down Rules", "Cây quy tắc ngoại lệ SCRDR"],
    def: "Cấu trúc cây nhị phân lưu trữ các quy tắc sửa lỗi tự động dạng 'NẾU điều kiện đúng THÌ gán nhãn mới, TRỪ KHI rơi vào nhánh ngoại lệ con (except-branch)'.",
    example: "Quy tắc cha: Nếu w_0 = 'học' và w_{-1} = 'sinh' → gán nhãn I_W (ghép thành 'sinh_học').\nNhánh ngoại lệ con (Except): Trừ khi w_{-2} = 'Học' và w_{+1} = 'sinh' → giữ nguyên B_W vì 'học' ở giữa là động từ chính!",
    why: "Giúp mô hình sửa các ca nhập nhằng giao thoa trong tiếng Việt mà không làm hỏng các quy tắc đã đúng trước đó, đồng thời tốc độ suy luận cực nhanh trên CPU.",
    related: ["rdrsegmenter", "vncorenlp", "overlapping-ambiguity", "bw-iw"]
  },
  "vncorenlp": {
    title: "VnCoreNLP (Vietnamese Core NLP Toolkit)",
    stage: 1,
    category: "Bộ Công cụ Cốt lõi",
    aliases: ["VnCoreNLP", "py_vncorenlp", "vncorenlp"],
    def: "Bộ công cụ xử lý ngôn ngữ tự nhiên tiếng Việt chuẩn mực do nhóm nghiên cứu của TS. Nguyễn Đạt Quốc phát triển, cung cấp 4 pipeline: Tách từ (RDRSegmenter), Gán nhãn từ loại (POS Tagging), Nhận diện thực thể (NER) và Phân tích cú pháp phụ thuộc (Dependency Parsing).",
    example: "import py_vncorenlp\nrdrsegmenter = py_vncorenlp.VnCoreNLP(annotators=['wseg'])\ntext = rdrsegmenter.word_segment('Ông Nguyễn Khắc Chúc đang làm việc tại Đại học Quốc gia Hà Nội.')\n# → ['Ông Nguyễn_Khắc_Chúc đang làm_việc tại Đại_học Quốc_gia Hà_Nội .']",
    why: "Toàn bộ kho dữ liệu 20GB của PhoBERT và PhoW2V đều được tách từ bằng VnCoreNLP. Dùng đúng VnCoreNLP giúp đạt F1 cao nhất khi fine-tune PhoBERT.",
    related: ["rdrsegmenter", "scrdr", "underthesea", "pyvi", "phobert"]
  },
  "underthesea": {
    title: "Underthesea NLP Toolkit",
    stage: 1,
    category: "Bộ Công cụ Python",
    aliases: ["underthesea", "Underthesea"],
    def: "Thư viện NLP Tiếng Việt mã nguồn mở phổ biến nhất trên Python (Vũ Anh và cộng sự), cài đặt trực tiếp qua pip mà không cần cài máy ảo Java (JVM), hỗ trợ tách từ bằng CRF, POS Tagging, NER, Phân loại văn bản và Sentiment Analysis.",
    example: "from underthesea import word_tokenize, pos_tag\nword_tokenize('Học sinh học sinh học', format='text')\n# → 'Học_sinh học sinh_học'",
    why: "Rất tiện lợi khi triển khai microservice Python nhẹ hoặc thử nghiệm nhanh (prototyping) khi không muốn cấu hình Java cho VnCoreNLP.",
    related: ["crf", "pyvi", "vncorenlp", "pos-tagging"]
  },
  "pyvi": {
    title: "PyVi (Python Vietnamese NLP)",
    stage: 1,
    category: "Thư viện Tách từ",
    aliases: ["pyvi", "PyVi", "ViTokenizer"],
    def: "Thư viện tách từ và gán nhãn từ loại tiếng Việt gọn nhẹ viết bằng thuần Python/Cython của Trần Việt Trung, sử dụng mô hình Linear-chain CRF với tốc độ xử lý cực nhanh (~45.000 từ/giây trên CPU).",
    example: "from pyvi import ViTokenizer\nprint(ViTokenizer.tokenize('Trường đại học Bách Khoa Hà Nội'))\n# → 'Trường đại_học Bách_Khoa Hà_Nội'",
    why: "Thường được chọn để tiền xử lý hàng triệu văn bản cho TF-IDF hoặc chỉ mục tìm kiếm BM25 trong hệ thống RAG vì tốc độ nhanh và nhẹ.",
    related: ["crf", "underthesea", "vncorenlp", "bm25"]
  },
  "nfc": {
    title: "Unicode NFC vs. NFD (Dựng sẵn vs. Tổ hợp)",
    stage: 1,
    category: "Bảng mã & Tiền xử lý",
    aliases: ["NFC", "NFD", "Unicode NFC", "Unicode NFD", "unicodedata.normalize"],
    def: "Hai chuẩn biểu diễn ký tự tiếng Việt trong Unicode:\n• NFC (Normalization Form Canonical Composition - Dựng sẵn): Gộp chữ cái gốc và dấu thanh thành 1 codepoint duy nhất (VD: 'ệ' = U+1EC7).\n• NFD (Canonical Decomposition - Tổ hợp): Tách chữ cái gốc và các dấu rời nhau (VD: 'ệ' = 'e' U+0065 + dấu nặng U+0323 + dấu mũ U+0302).",
    example: "import unicodedata\ns_nfd = 'Vie\\u0323\\u0302t' # 6 ký tự rời\ns_nfc = unicodedata.normalize('NFC', s_nfd) # 4 ký tự chuẩn ('Việt')",
    why: "Mắt thường nhìn NFC và NFD giống hệt nhau, nhưng từ điển của PhoBERT/ViT5/BGE-M3 chỉ lưu NFC. Nếu quên ép về NFC, văn bản NFD sẽ sinh ra hàng loạt token [UNK] và làm tụt 5%–15% F1-score!",
    related: ["combining-marks", "unk-token", "zero-width-space", "tone-normalization"]
  },
  "combining-marks": {
    title: "Combining Diacritical Marks (Dấu thanh tổ hợp rời U+0300–U+0323)",
    stage: 1,
    category: "Bảng mã & Tiền xử lý",
    aliases: ["Combining Diacritical Marks", "U+0300", "U+0301", "U+0303", "U+0309", "U+0323"],
    def: "Dải mã Unicode từ U+0300 đến U+0323 biểu diễn các dấu thanh rời (huyền U+0300, sắc U+0301, mũ U+0302, ngã U+0303, hỏi U+0309, nặng U+0323) được ghép nối vào sau nguyên âm gốc trong bảng mã Unicode Tổ hợp (NFD).",
    example: "• U+0300: Dấu huyền (`)\n• U+0301: Dấu sắc (´)\n• U+0309: Dấu hỏi (?)\n• U+0303: Dấu ngã (~)\n• U+0323: Dấu nặng (.)",
    why: "Sự xuất hiện của bất kỳ ký tự nào trong dải [\\u0300-\\u0323] là dấu hiệu chắc chắn văn bản đang bị nhiễm mã Unicode Tổ hợp (NFD) và cần chạy unicodedata.normalize('NFC', text).",
    related: ["nfc", "zero-width-space", "tone-normalization"]
  },
  "tone-normalization": {
    title: "Chuẩn hóa Vị trí Dấu thanh (Kiểu Cũ: hòa, thủy vs. Kiểu Mới: hoà, thuỷ)",
    stage: 1,
    category: "Âm vị học Tiếng Việt",
    aliases: ["Chuẩn hóa dấu thanh", "Kiểu Cũ", "Kiểu Mới", "hòa vs hoà", "thủy vs thuỷ"],
    def: "Trong tiếng Việt, các âm tiết có vần 'oa, oe, uy' không có phụ âm cuối tồn tại 2 cách gõ dấu thanh: Kiểu Cũ đặt dấu lên nguyên âm đầu ('hòa, khỏe, thủy') và Kiểu Mới đặt dấu lên nguyên âm thứ hai ('hoà, khoẻ, thuỷ').",
    example: "Chuẩn hóa về Kiểu Cũ để khớp 100% từ điển VnCoreNLP & PhoBERT:\n• hoà bình → hòa bình\n• sức khoẻ → sức khỏe\n• thuỷ lợi → thủy lợi\n• Ngoại lệ giữ nguyên: 'quý giá' (vì 'qu' là phụ âm đầu, 'y' là nguyên âm chính).",
    why: "Nếu dữ liệu huấn luyện gõ 'hòa_bình' còn dữ liệu test của người dùng gõ 'hoà_bình', mô hình sẽ coi đây là 2 từ hoàn toàn khác nhau nếu không đồng nhất dấu thanh.",
    related: ["nfc", "vncorenlp", "phobert"]
  },
  "zero-width-space": {
    title: "Zero-Width Space (U+200B) & BOM (U+FEFF)",
    stage: 1,
    category: "Làm sạch Nhiễu",
    aliases: ["Zero-Width Space", "\\u200b", "U+200B", "\\ufeff", "BOM"],
    def: "Các ký tự điều khiển độ rộng bằng 0 (vô hình trên màn hình) thường bị chèn ngầm vào giữa các chữ cái khi thu thập dữ liệu (crawl) từ PDF, Word, Facebook hoặc Zalo.",
    example: "Chuỗi lỗi: 'giảng\\u200bviên' (hiển thị trên màn hình vẫn là 'giảngviên' hoặc 'giảng viên', nhưng máy tính đọc thành 2 mảnh rời).\nCách xóa: re.sub(r'[\\u200b\\u200c\\u200d\\ufeff]', '', text)",
    why: "Nếu không xóa trước khi tách từ, các ký tự tàng hình này sẽ phá hỏng toàn bộ biểu thức chính quy (Regex) và làm sai lệch từ điển BPE.",
    related: ["nfc", "teencode"]
  },
  "teencode": {
    title: "Chuẩn hóa Teencode & Từ viết tắt Mạng xã hội",
    stage: 1,
    category: "Làm sạch Nhiễu",
    aliases: ["Teencode", "teencode"],
    def: "Quá trình ánh xạ các từ viết tắt, biến âm trên mạng xã hội Việt Nam ('ko', 'k', 'đc', 'vs', 'mik', 'j', 'ntn') về từ tiếng Việt chuẩn ('không', 'được', 'với', 'mình', 'gì', 'như thế nào') có xét ranh giới từ (word boundary \\b).",
    example: "re.sub(r'\\bko\\b', 'không', 'Môn này ko khó lắm')\n# → 'Môn này không khó lắm'",
    why: "Phải thực hiện TRƯỚC bước tách từ để bộ tách từ nhận diện đúng cụm từ ghép (ví dụ 'bất_động_sản' từ 'bđs') và giữ nguyên từ phủ định 'không' cho bài toán phân tích cảm xúc.",
    related: ["zero-width-space", "uit-vsfc"]
  },
  "crf": {
    title: "Linear-chain CRF (Conditional Random Fields)",
    stage: 1,
    category: "Mô hình Xác suất Chuỗi",
    aliases: ["Linear-chain CRF", "CRF", "Conditional Random Fields"],
    def: "Mô hình đồ thị vô hướng phân biệt (discriminative undirected probabilistic graphical model) dự đoán chuỗi nhãn tối ưu Y = (y_1, ..., y_n) trên toàn bộ câu X bằng cách tối ưu đồng thời điểm đặc trưng tại từng vị trí và ma trận chuyển trạng thái giữa hai nhãn liền kề (y_{i-1} → y_i).",
    example: "P(Y|X) = (1 / Z(X)) * exp( Σ_i Σ_k λ_k f_k(y_{i-1}, y_i, X, i) )\nSử dụng thuật toán Quy hoạch động Viterbi để tìm chuỗi nhãn [B_W, I_W, B_W, ...] có xác suất toàn cục lớn nhất.",
    why: "Là thuật toán lõi đứng sau bộ tách từ của pyvi, underthesea và tầng đầu ra của các mô hình nhận diện thực thể BiLSTM-CRF / PhoBERT-CRF.",
    related: ["rdrsegmenter", "bw-iw", "pyvi", "underthesea", "iob2"]
  },
  "bw-iw": {
    title: "Hệ nhãn Tách từ B_W / I_W (Begin-Word / Inside-Word)",
    stage: 1,
    category: "Hệ nhãn Chuỗi",
    aliases: ["B_W", "I_W", "B_W / I_W"],
    def: "Cách quy bài toán tách từ ghép tiếng Việt về bài toán gán nhãn chuỗi trên từng âm tiết:\n• B_W (Begin of Word): Âm tiết bắt đầu một từ mới (cách từ trước bằng khoảng trắng).\n• I_W (Inside of Word): Âm tiết nằm bên trong từ ghép (nối với âm tiết liền trước bằng dấu gạch dưới '_').",
    example: "Câu: ['Học', 'sinh', 'học', 'sinh', 'học']\nNhãn: ['B_W', 'I_W', 'B_W', 'B_W', 'I_W']\nKết quả ghép: 'Học_sinh học sinh_học'",
    why: "Nhờ quy về nhãn B_W / I_W, ta có thể huấn luyện CRF, SCRDR hoặc Transformer để tự động tách từ dựa trên ngữ cảnh câu.",
    related: ["rdrsegmenter", "crf", "iob2"]
  },
  "longest-matching": {
    title: "Longest Matching (Khớp Từ điển Dài nhất)",
    stage: 1,
    category: "Thuật toán Cơ sở",
    aliases: ["Longest-Matching", "Longest Matching"],
    def: "Thuật toán tách từ tham lam (greedy) quét từ trái sang phải và luôn ưu tiên ghép cụm âm tiết dài nhất có mặt trong từ điển tiếng Việt.",
    example: "Đạt ~94% độ chính xác trên câu thông thường, nhưng thất bại khi gặp câu nhập nhằng giao thoa cần hiểu ngữ pháp (VD: 'Học sinh học sinh học' hoặc 'Ông già đi nhanh quá').",
    why: "Được RDRSegmenter dùng làm bước khởi tạo cực nhanh trước khi áp dụng cây quy tắc ngoại lệ SCRDR để sửa lỗi ngữ cảnh.",
    related: ["rdrsegmenter", "scrdr", "overlapping-ambiguity"]
  },
  "overlapping-ambiguity": {
    title: "Nhập nhằng Giao thoa & Nhập nhằng Tổ hợp (Ambiguity)",
    stage: 1,
    category: "Ngôn ngữ học Tiếng Việt",
    aliases: ["Nhập nhằng giao thoa", "Overlapping Ambiguity", "Combinatorial Ambiguity", "Nhập nhằng tổ hợp"],
    def: "• Nhập nhằng giao thoa (Overlapping): Chuỗi 3 âm tiết A-B-C mà cả A_B và B_C đều là từ ghép hợp lệ trong từ điển (VD: 'Học sinh học').\n• Nhập nhằng tổ hợp (Combinatorial): Cụm A-B vừa có thể là 1 từ ghép A_B, vừa có thể là 2 từ đơn A + B tùy ngữ cảnh (VD: 'bàn là' trong 'cái bàn_là' vs. 'bàn là công cụ').",
    example: "1. 'Cái bàn_là này rất nóng' → bàn_là (Danh từ: chiếc bàn ủi)\n2. 'Bàn là nơi làm_việc' → Bàn (Danh từ) + là (Hệ từ)",
    why: "Là lý do tại sao tách từ tiếng Việt không thể chỉ dùng Regex hay tra từ điển đơn thuần mà phải dùng mô hình học máy xét ngữ cảnh (CRF / SCRDR).",
    related: ["rdrsegmenter", "crf", "pos-tagging"]
  },
  "pos-tagging": {
    title: "POS Tagging (Gán nhãn Từ loại Tiếng Việt - Chuẩn VLSP)",
    stage: 1,
    category: "Cú pháp học",
    aliases: ["POS Tagging", "POS", "Gán nhãn từ loại", "Np", "Nc"],
    def: "Bài toán gán nhãn từ loại ngữ pháp cho từng từ đã tách theo bộ nhãn chuẩn VLSP: N (Danh từ chung), Np (Danh từ riêng), Nc (Danh từ chỉ loại: cái, con, chiếc), V (Động từ), A (Tính từ), R (Phó từ: đang, đã, sẽ, rất), E (Giới từ), C (Liên từ).",
    example: "Ông/Nc Nguyễn_Khắc_Chúc/Np đang/R làm_việc/V tại/E Đại_học/N Hà_Nội/Np",
    why: "Đặc trưng POS Tag giúp phân biệt từ đồng âm khác loại (như 'học' là động từ V hay nằm trong danh từ N) và là đầu vào quan trọng cho NER, Dependency Parsing.",
    related: ["dependency-parsing", "vlsp", "phonlp", "vncorenlp"]
  },
  "dependency-parsing": {
    title: "Dependency Parsing (Phân tích Cú pháp Phụ thuộc)",
    stage: 1,
    category: "Cú pháp học",
    aliases: ["Dependency Parsing", "Universal Dependencies", "root", "nsub", "dob", "nmod"],
    def: "Xây dựng cây cấu trúc ngữ pháp của câu bằng các cung có hướng nối từ từ phụ thuộc (dependent) vào từ trung tâm (head), tiêu biểu theo chuẩn Universal Dependencies (UD): root (động từ gốc), nsub (chủ ngữ), dob (tân ngữ trực tiếp), nmod (bổ ngữ danh từ).",
    example: "Trong câu 'Học_sinh (1) học (2) sinh_học (3)':\n• học (2) ← root (0)\n• Học_sinh (1) ← nsub của 'học' (2)\n• sinh_học (3) ← dob của 'học' (2)",
    why: "Cực kỳ hữu ích cho bài toán Trích xuất thông tin (Information Extraction), Phân tích quan điểm theo khía cạnh (Aspect-based Sentiment Analysis) và Knowledge Graph.",
    related: ["pos-tagging", "phonlp", "biaffine-attention"]
  },
  "tfidf": {
    title: "Sublinear TF-IDF & Smoothed IDF",
    stage: 2,
    category: "Biểu diễn Văn bản Thưa",
    aliases: ["TF-IDF", "Sublinear TF-IDF", "Sublinear TF", "Smoothed IDF", "TfidfVectorizer"],
    def: "Phương pháp trọng số hóa thống kê đánh giá tầm quan trọng của từ ghép t trong văn bản d thuộc tập D:\n• Sublinear TF: 1 + ln(count(t, d)) giúp giảm ảnh hưởng của từ lặp lại quá nhiều.\n• Smoothed IDF: ln((1 + |D|) / (1 + DF(t))) + 1 giúp phạt các từ xuất hiện tràn lan ở mọi văn bản.",
    example: "TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=2)\nKết hợp với LinearSVC đạt ~89.4% Macro-F1 trên tập UIT-VSFC chỉ trong 3 giây trên CPU!",
    why: "Luôn là Baseline bắt buộc phải dựng đầu tiên trong mọi dự án phân loại văn bản tiếng Việt trước khi dùng đến Deep Learning.",
    related: ["linearsvc", "bm25", "uit-vsfc", "class-imbalance"]
  },
  "word2vec": {
    title: "Word2Vec (Skip-gram & CBOW)",
    stage: 2,
    category: "Dense Word Embeddings",
    aliases: ["Word2Vec", "Skip-gram", "CBOW"],
    def: "Mô hình mạng nơ-ron nông (Mikolov và cộng sự, 2013) ánh xạ mỗi từ thành một vector thực đặc (dense vector 100–300 chiều) dựa trên giả thuyết phân bố: các từ xuất hiện trong ngữ cảnh tương tự nhau sẽ có vector gần nhau.\n• Skip-gram: Dùng từ trung tâm w_t dự đoán các từ xung quanh w_{t+j}.\n• CBOW: Dùng trung bình các từ xung quanh dự đoán từ trung tâm w_t.",
    example: "Skip-gram xử lý các từ ghép tiếng Việt ít gặp (rare compound words) tốt hơn CBOW nhờ không làm trơn ngữ cảnh.",
    why: "Nền tảng của không gian nhúng từ tĩnh PhoW2V cho tiếng Việt.",
    related: ["sgns", "phow2v", "cosine-similarity", "fasttext"]
  },
  "sgns": {
    title: "SGNS (Skip-gram with Negative Sampling)",
    stage: 2,
    category: "Hàm Mục tiêu Huấn luyện",
    aliases: ["SGNS", "Negative Sampling"],
    def: "Kỹ thuật tối ưu hóa thay thế hàm Softmax toàn từ điển (tốn O(|V|) phép tính) bằng bài toán phân loại nhị phân Logistic giữa 1 cặp từ ngữ cảnh thật (Positive pair) và K từ nhiễu (Negative samples, thường K = 5..10) lấy mẫu theo phân phối P_n(w) ~ U(w)^(3/4).",
    example: "L_SGNS = log σ(u_c^T · v_w) + Σ_{k=1..K} E_{w_k ~ P_n} [ log σ(-u_{w_k}^T · v_w) ]\nLũy thừa 0.75 giúp tăng xác suất các từ hiếm được chọn làm mẫu âm để học biên phân cách tốt hơn.",
    why: "Giúp huấn luyện PhoW2V trên 20GB văn bản tiếng Việt nhanh gấp hàng ngàn lần so với Softmax truyền thống.",
    related: ["word2vec", "phow2v", "cosine-similarity"]
  },
  "cosine-similarity": {
    title: "Cosine Similarity (Độ tương đồng Cosine)",
    stage: 2,
    category: "Hình học Vector",
    aliases: ["Cosine Similarity", "Cosine", "cos(θ)"],
    def: "Thước đo góc giữa hai vector u và v trong không gian nhiều chiều: cos(θ) = (u · v) / (||u||_2 * ||v||_2) ∈ [-1, 1]. Chỉ phụ thuộc vào hướng ngữ nghĩa của vector chứ không bị nhiễu bởi độ lớn (tần suất xuất hiện của từ).",
    example: "• cos('phở_bò', 'bún_chả') ≈ +0.82 (cùng trường ẩm thực)\n• cos('tuyệt_vời', 'xuất_sắc') ≈ +0.86 (cùng cực cảm xúc tích cực)\n• cos('phở_bò', 'lượng_tử_hóa') ≈ +0.03 (trực giao / không liên quan)",
    why: "Là hàm khoảng cách tiêu chuẩn dùng trong cả Word2Vec/PhoW2V lẫn truy xuất vector (Vector Search) với BGE-M3 trong hệ thống RAG.",
    related: ["phow2v", "bge-m3", "word2vec"]
  },
  "phow2v": {
    title: "PhoW2V (Pretrained Word2Vec for Vietnamese - VinAI)",
    stage: 2,
    category: "Pretrained Embeddings",
    aliases: ["PhoW2V", "phow2v"],
    def: "Bộ vector nhúng từ tiếng Việt (100 chiều và 300 chiều, ở cả cấp độ âm tiết Syllable-level và từ ghép Word-level) do VinAI Research huấn luyện bằng thuật toán Skip-gram Negative Sampling trên 20GB văn bản tiếng Việt đã tách từ bằng VnCoreNLP.",
    example: "Phép toán đại số tuyến tính trên vector PhoW2V:\nvec('Hà_Nội') - vec('Việt_Nam') + vec('Nhật_Bản') ≈ vec('Tokyo')",
    why: "Rất hiệu quả cho các mô hình nhẹ (BiLSTM, CNN, clustering từ khóa) khi không có GPU để chạy Transformer.",
    related: ["word2vec", "sgns", "fasttext", "polysemy", "vncorenlp"]
  },
  "fasttext": {
    title: "FastText & Subword Character N-grams",
    stage: 2,
    category: "Subword Embeddings",
    aliases: ["FastText", "fastText", "Character N-grams"],
    def: "Mô hình mở rộng của Word2Vec (Bojanowski và cộng sự - Facebook AI) biểu diễn mỗi từ bằng tổng các vector n-gram ký tự con bên trong từ đó (ví dụ n = 3..6), giúp sinh được vector cho cả từ lạ ngoài từ điển (OOV) hoặc từ bị viết sai chính tả.",
    example: "Từ '<đường>' được phân rã thành các n-gram ký tự:\n'<đư', 'đườ', 'ườn', 'ờng', 'ng>', '<đườ', 'đườn', 'ường>'",
    why: "Giải quyết được lỗi OOV của Word2Vec truyền thống trên dữ liệu mạng xã hội nhiều lỗi gõ phím, nhưng vẫn bị giới hạn bởi tính đa nghĩa (Polysemy).",
    related: ["phow2v", "oov", "polysemy", "bpe"]
  },
  "polysemy": {
    title: "Polysemy Bottleneck (Nút thắt Từ Đa nghĩa của Static Embeddings)",
    stage: 2,
    category: "Giới hạn Lý thuyết",
    aliases: ["Polysemy", "Polysemy Bottleneck", "Từ đa nghĩa", "Static Embedding"],
    def: "Nhược điểm cốt tử của các mô hình nhúng từ tĩnh (Word2Vec, PhoW2V, FastText, GloVe): mỗi từ trong từ điển chỉ được gán duy nhất 1 vector cố định, bất chấp từ đó mang nhiều nghĩa hoàn toàn khác nhau tùy ngữ cảnh.",
    example: "Từ 'đường' trong 3 câu:\n1. 'Cho thêm đường vào cà_phê' (đường ăn)\n2. 'Con đường này đang tắc' (giao thông)\n3. 'Đường_lối phát_triển' (chính sách)\n→ Trong PhoW2V đều trả về CÙNG 1 VECTOR trung bình cộng của cả 3 nghĩa!",
    why: "Chính nút thắt này đã thúc đẩy sự ra đời của Contextualized Embeddings (PhoBERT), nơi cơ chế Self-Attention tạo ra vector động thay đổi theo từng câu.",
    related: ["phow2v", "phobert", "self-attention"]
  },
  "class-imbalance": {
    title: "Class Imbalance (Mất cân bằng Nhãn) & Macro-F1",
    stage: 2,
    category: "Đánh giá & Huấn luyện",
    aliases: ["Class Imbalance", "class_weight=\"balanced\"", "class_weight='balanced'", "Macro-F1"],
    def: "Hiện tượng phân bố số lượng mẫu giữa các lớp chênh lệch quá lớn (ví dụ trong tập UIT-VSFC, lớp Neutral chỉ chiếm ~4% tổng số câu). Nếu chỉ dùng Accuracy, mô hình đoán bừa vào 2 lớp lớn vẫn đạt điểm cao giả tạo.",
    example: "Giải pháp chuẩn:\n1. Dùng class_weight='balanced' (tự động nhân hệ số phạt w_c = N / (K * N_c) cho lớp ít mẫu).\n2. Đánh giá bằng Macro-F1 = (F1_Pos + F1_Neu + F1_Neg) / 3.",
    why: "Luôn kiểm tra phân bố nhãn và dùng Macro-F1 cho các tập dữ liệu tiếng Việt thực tế như UIT-VSFC hay VLSP.",
    related: ["uit-vsfc", "linearsvc", "tfidf"]
  },
  "linearsvc": {
    title: "LinearSVC (Support Vector Classification Tuyến tính)",
    stage: 2,
    category: "Thuật toán Phân loại",
    aliases: ["LinearSVC", "LogisticRegression"],
    def: "Bộ phân loại máy vector hỗ trợ nhân tuyến tính tối ưu bằng thuật toán LIBLINEAR, cực kỳ hiệu quả trên không gian đặc trưng TF-IDF nhiều chiều và thưa (high-dimensional sparse vectors).",
    example: "LinearSVC(C=1.0, class_weight='balanced', random_state=42)",
    why: "Khi kết hợp với TF-IDF ngram_range=(1, 2) trên văn bản tiếng Việt đã tách từ, LinearSVC thường vượt trội hơn Naive Bayes và tiệm cận các mạng nơ-ron nông.",
    related: ["tfidf", "class-imbalance", "uit-vsfc"]
  },
  "phobert": {
    title: "PhoBERT (Pretrained RoBERTa for Vietnamese - VinAI Research)",
    stage: 3,
    category: "Pretrained Encoder",
    aliases: ["PhoBERT", "PhoBERT-base-v2", "PhoBERT-large", "vinai/phobert-base-v2", "PhoBERT-v2"],
    def: "Mô hình ngôn ngữ tiền huấn luyện (Pretrained Language Model) chuẩn mực nhất cho các bài toán hiểu ngôn ngữ tiếng Việt (NLU: Phân loại, NER, POS, QA), dựa trên kiến trúc RoBERTa (Transformer Encoder hai chiều) được huấn luyện trên 20GB văn bản tiếng Việt (Wikipedia + News) đã tách từ ghép bằng VnCoreNLP.",
    example: "• vinai/phobert-base-v2: 12 layers, hidden=768, 12 heads, 135M tham số.\n• vinai/phobert-large: 24 layers, hidden=1024, 16 heads, 370M tham số.\n• Từ điển: 64.000 subword BPE.\n• Giới hạn độ dài: max_position_embeddings = 258 (tối đa 256 subwords văn bản).",
    why: "BẮT BUỘC phải chuẩn hóa Unicode NFC và tách từ ghép (nối bằng dấu '_') trước khi đưa vào AutoTokenizer của PhoBERT!",
    related: ["roberta", "bpe", "max-position-embeddings", "vncorenlp", "phonlp"]
  },
  "roberta": {
    title: "RoBERTa & Dynamic Masking",
    stage: 3,
    category: "Kiến trúc Transformer",
    aliases: ["RoBERTa", "Dynamic Masking", "MLM"],
    def: "Phiên bản tối ưu hóa quy trình tiền huấn luyện BERT (Liu và cộng sự, 2019): loại bỏ hoàn toàn tác vụ Next Sentence Prediction (NSP) không hiệu quả, tăng kích thước batch và áp dụng Dynamic Masking (che ngẫu nhiên 15% token mới ở mỗi epoch thay vì cố định tĩnh từ đầu).",
    example: "Trong 15% số từ ghép tiếng Việt được chọn để che:\n• 80% thay bằng token <mask>\n• 10% thay bằng một token ngẫu nhiên\n• 10% giữ nguyên để mô hình học biểu diễn ổn định.",
    why: "Là kiến trúc nền tảng của PhoBERT-base-v2 và PhoBERT-large.",
    related: ["phobert", "self-attention", "bpe"]
  },
  "self-attention": {
    title: "Multi-Head Self-Attention (Cơ chế Tự chú ý Đa đầu)",
    stage: 3,
    category: "Kiến trúc Transformer",
    aliases: ["Multi-Head Self-Attention", "Self-Attention", "Scaled Dot-Product Attention"],
    def: "Cơ chế cho phép mỗi token trong câu tính trọng số liên kết ngữ cảnh trực tiếp tới mọi token khác trong cùng câu thông qua 3 ma trận chiếu Query (Q), Key (K), Value (V): Attention(Q,K,V) = softmax((Q * K^T) / sqrt(d_k)) * V.",
    example: "Khi gặp từ 'đường' trong câu 'Cho thêm đường vào cà_phê', Self-Attention đặt trọng số chú ý cao vào 'cà_phê', giúp vector đầu ra của 'đường' mang nghĩa 'đường ăn' thay vì 'đường giao thông'.",
    why: "Giải quyết triệt để nút thắt từ đa nghĩa (Polysemy Bottleneck) của Word2Vec/PhoW2V.",
    related: ["phobert", "polysemy", "kv-cache"]
  },
  "bpe": {
    title: "BPE / fastBPE (Byte-Pair Encoding trên Từ ghép)",
    stage: 3,
    category: "Subword Tokenization",
    aliases: ["BPE", "fastBPE", "@@"],
    def: "Thuật toán tách từ con (Subword Tokenization) gộp dần các cặp ký tự xuất hiện cùng nhau nhiều nhất để tạo thành từ điển kích thước cố định (64.000 token trong PhoBERT). Trong fastBPE của PhoBERT, ký hiệu '@@' ở cuối token báo hiệu từ ghép chưa kết thúc và nối tiếp với mảnh liền sau.",
    example: "• Từ phổ biến giữ nguyên: 'Nguyễn_Khắc_Chúc' → ['Nguyễn_Khắc_Chúc']\n• Từ hiếm tách thành các mảnh có '@@': 'Bình_Dương' → ['Bình_@@', 'Dương']",
    why: "Giúp PhoBERT không bao giờ bị mất thông tin hoàn toàn khi gặp từ ghép mới, nhưng đòi hỏi kỹ thuật Subword Label Alignment (-100) khi làm bài toán NER.",
    related: ["phobert", "subword-alignment", "sentencepiece", "unk-token"]
  },
  "max-position-embeddings": {
    title: "max_position_embeddings = 258 & Sliding Window Chunking",
    stage: 3,
    category: "Giới hạn Kiến trúc",
    aliases: ["max_position_embeddings", "Sliding Window Chunking", "256 subwords"],
    def: "Ma trận nhúng vị trí (Positional Embedding) của PhoBERT có kích thước cố định là 258 (gồm <s> ở đầu, </s> ở cuối, và tối đa 256 subword tokens ở giữa). Nếu truyền chuỗi dài hơn 256 tokens mà không xử lý, PyTorch sẽ văng lỗi CUDA index out of bounds.",
    example: "Với văn bản dài (như bài báo 1.000 từ): Chia văn bản thành các cửa sổ trượt (Sliding Window) độ dài 256 tokens, bước nhảy stride = 192 (chồng lấp 64 tokens) rồi tổng hợp xác suất Mean/Max Pooling.",
    why: "Một trong những lỗi runtime phổ biến nhất khi áp dụng PhoBERT vào bài toán phân loại văn bản báo chí hoặc tài liệu pháp luật dài.",
    related: ["phobert", "bpe"]
  },
  "phonlp": {
    title: "PhoNLP (Joint Multi-task Vietnamese NLP - VinAI)",
    stage: 3,
    category: "Mô hình Đa nhiệm",
    aliases: ["PhoNLP", "phonlp", "Biaffine Attention"],
    def: "Mô hình học đa nhiệm (Joint Multi-task Learning) đặt trên nền tảng encoder PhoBERT-base, giải quyết đồng thời 3 bài toán trong một lượt chạy (single forward pass): POS Tagging, NER (với tầng CRF) và Dependency Parsing (với tầng Biaffine Attention).",
    example: "L_total = λ_1 * L_POS + λ_2 * L_NER + λ_3 * L_Dep\nChia sẻ biểu diễn ngữ nghĩa chung giúp điểm số cả 3 tác vụ đều cao hơn huấn luyện rời rạc.",
    why: "Lựa chọn số 1 khi cần trích xuất đồng thời từ loại, thực thể tên riêng và cây cú pháp phụ thuộc tiếng Việt.",
    related: ["phobert", "pos-tagging", "dependency-parsing", "iob2"]
  },
  "iob2": {
    title: "Chuẩn Gán nhãn Thực thể IOB2 (Inside-Outside-Beginning)",
    stage: 3,
    category: "Bài toán NER",
    aliases: ["IOB2", "B-PER", "I-PER", "B-LOC", "I-LOC", "B-ORG", "I-ORG"],
    def: "Chuẩn đánh dấu ranh giới thực thể có tên (Named Entity Recognition):\n• B-TYPE (Beginning): Token mở đầu một thực thể loại TYPE (PER: Người, LOC: Địa điểm, ORG: Tổ chức, MISC: Khác).\n• I-TYPE (Inside): Token tiếp theo nằm bên trong cùng thực thể TYPE.\n• O (Outside): Token không thuộc thực thể nào.",
    example: "Ông (O) Nguyễn_Khắc_Chúc (B-PER) làm_việc (O) tại (O) Đại_học (B-ORG) Quốc_gia (I-ORG) Hà_Nội (I-ORG)",
    why: "Giúp phân biệt rõ hai thực thể cùng loại đứng sát nhau (nhờ nhãn B-TYPE bắt đầu thực thể thứ hai).",
    related: ["subword-alignment", "phoner-covid19", "phonlp", "crf"]
  },
  "subword-alignment": {
    title: "Subword Label Alignment & ignore_index = -100",
    stage: 3,
    category: "Thuật toán Huấn luyện NER",
    aliases: ["Subword Label Alignment", "Subword Alignment", "ignore_index", "-100", "CrossEntropyLoss"],
    def: "Khi BPE Tokenizer bẻ 1 từ ghép tiếng Việt (VD: 'Bình_Dương' mang nhãn B-LOC) thành nhiều subword ('Bình_@@', 'Dương'), số lượng token tăng lên khiến chuỗi nhãn gốc bị lệch độ dài. Thuật toán chuẩn gán nhãn thật (B-LOC) cho mảnh đầu tiên ('Bình_@@') và gán nhãn -100 cho mọi mảnh nối tiếp có '@@' ('Dương') cũng như <s>, </s>.",
    example: "Tokens: ['<s>', 'tại', 'Bình_@@', 'Dương', '</s>']\nLabels: [ -100,   'O',   'B-LOC',    -100,   -100 ]",
    why: "Trong PyTorch, nn.CrossEntropyLoss(ignore_index=-100) tự động bỏ qua mọi vị trí có nhãn -100 khi tính đạo hàm, giúp mô hình không bị phạt oan trên các mảnh subword phụ.",
    related: ["bpe", "iob2", "phobert", "phoner-covid19"]
  },
  "vit5": {
    title: "ViT5 (Vietnamese Text-to-Text Transfer Transformer - VietAI)",
    stage: 3,
    category: "Pretrained Encoder-Decoder",
    aliases: ["ViT5", "VietAI/vit5-base", "VietAI/vit5-large", "vit5", "Encoder-Decoder"],
    def: "Mô hình kiến trúc Encoder-Decoder (dựa trên T5 của Google) do VietAI tiền huấn luyện trên 138GB văn bản tiếng Việt sạch (CC100 + VietNews), quy mọi bài toán NLP (Tóm tắt văn bản, Dịch máy, Sửa lỗi chính tả, Sinh câu trả lời) về định dạng Text-to-Text.",
    example: "Lưu ý cực kỳ quan trọng: ViT5 dùng SentencePiece Unigram trên văn bản thô (dùng ký tự '▁' U+2581 cho khoảng trắng). TUYỆT ĐỐI KHÔNG tách từ bằng dấu gạch dưới '_' khi đưa vào ViT5!",
    why: "Mô hình mạnh nhất hiện nay cho bài toán Tóm tắt văn bản trừu tượng (Abstractive Summarization) tiếng Việt trên tập dữ liệu VietNews.",
    related: ["sentencepiece", "span-corruption", "rouge", "vietnews"]
  },
  "sentencepiece": {
    title: "SentencePiece Unigram & Ký tự ▁ (U+2581)",
    stage: 3,
    category: "Subword Tokenization",
    aliases: ["SentencePiece", "U+2581", "Unigram"],
    def: "Bộ tách token không phụ thuộc ngôn ngữ (dùng trong ViT5, LLaMA, Gemma) coi toàn bộ chuỗi đầu vào là luồng ký tự thô và mã hóa khoảng trắng thành ký tự đặc biệt '▁' (U+2581 Lower One Eighth Block), cho phép khôi phục 100% chuỗi gốc mà không cần bộ tách từ tiền xử lý.",
    example: "Chuỗi gốc: 'Việt Nam'\nSentencePiece tokens: ['▁Việt', '▁Nam']\nNếu truyền nhầm 'Việt_Nam' (có dấu '_') vào ViT5, dấu '_' sẽ bị coi là ký tự lạ làm hỏng văn bản sinh ra.",
    why: "Nhớ quy tắc vàng: PhoBERT dùng VnCoreNLP ('_') + fastBPE ('@@'), còn ViT5 và LLM (Qwen/Sailor2) dùng văn bản thô chuẩn NFC!",
    related: ["vit5", "bpe", "token-fertility"]
  },
  "span-corruption": {
    title: "Span Corruption (Denoising Objective của ViT5)",
    stage: 3,
    category: "Mục tiêu Tiền huấn luyện",
    aliases: ["Span Corruption", "<extra_id_0>", "<extra_id_1>"],
    def: "Cơ chế tự giám sát (Self-supervised Pretraining) của họ mô hình T5/ViT5: che ngẫu nhiên các cụm từ liên tiếp (spans độ dài trung bình 3–5 âm tiết) bằng các sentinel token duy nhất (<extra_id_0>, <extra_id_1>...) và yêu cầu Decoder sinh lại đúng các cụm từ đã bị ẩn.",
    example: "• Input Encoder: 'Ngân hàng Nhà nước <extra_id_0> lãi suất điều hành <extra_id_1> hỗ trợ doanh nghiệp.'\n• Target Decoder: '<extra_id_0> vừa quyết định giảm <extra_id_1> nhằm <extra_id_2>'",
    why: "Buộc nhánh Decoder phải học cách sinh câu tiếng Việt mạch lạc, đúng ngữ pháp để phục vụ bài toán Tóm tắt và Sinh văn bản.",
    related: ["vit5", "rouge"]
  },
  "rouge": {
    title: "ROUGE-1, ROUGE-2 & ROUGE-L (Thước đo Tóm tắt Văn bản)",
    stage: 3,
    category: "Đánh giá Sinh văn bản",
    aliases: ["ROUGE", "ROUGE-1", "ROUGE-2", "ROUGE-L", "LCS"],
    def: "Bộ thước đo chuẩn đánh giá chất lượng bản tóm tắt tự động S so với bản tóm tắt chuẩn của con người R:\n• ROUGE-1 (Unigram overlap): Đo độ phủ thông tin từ vựng.\n• ROUGE-2 (Bigram overlap): Đo độ trôi chảy của cụm 2 từ liên tiếp.\n• ROUGE-L (Longest Common Subsequence - LCS): Đo dãy con chung dài nhất không cần liền kề, phản ánh cấu trúc câu.",
    example: "Với tiếng Việt, cần tách âm tiết hoặc tách từ thống nhất trên cả bản sinh ra và bản tham chiếu trước khi tính ROUGE để tránh sai lệch do dấu câu.",
    why: "ViT5-base fine-tuned trên tập VietNews đạt ~61.8 ROUGE-1, ~30.4 ROUGE-2 và ~41.2 ROUGE-L.",
    related: ["vit5", "vietnews"]
  },
  "catastrophic-forgetting": {
    title: "Catastrophic Forgetting (Hiện tượng Quên Thảm khốc khi Fine-tune)",
    stage: 3,
    category: "Tối ưu hóa Huấn luyện",
    aliases: ["Catastrophic Forgetting", "AdamW", "Warmup", "Label Smoothing"],
    def: "Hiện tượng khi tinh chỉnh (fine-tune) một mô hình Pretrained (như PhoBERT hoặc ViT5) với tốc độ học (Learning Rate) quá lớn: đạo hàm lớn từ tầng phân loại mới khởi tạo ngẫu nhiên truyền ngược xuống làm phá hủy các trọng số ngôn ngữ đã học trên 20GB dữ liệu.",
    example: "Bộ siêu tham số chuẩn chống quên thảm khốc:\n• Learning rate nhỏ: 2e-5 (PhoBERT) hoặc 5e-5 (ViT5)\n• Linear Warmup: warmup_ratio = 0.1 (tăng dần lr trong 10% bước đầu)\n• Weight Decay: 0.01 với trình tối ưu AdamW.",
    why: "Nếu đặt lr = 1e-3 khi fine-tune PhoBERT, hàm Loss sẽ đứng yên và mô hình chỉ đoán ra duy nhất 1 nhãn cho mọi câu!",
    related: ["phobert", "vit5", "lora"]
  },
  "token-fertility": {
    title: "Token Fertility Rate (Độ phân mảnh Token trên LLM)",
    stage: 4,
    category: "LLM Tiếng Việt",
    aliases: ["Token Fertility", "Token Fertility Rate"],
    def: "Số lượng subword tokens trung bình cần thiết để biểu diễn 1 từ tiếng Việt. Chỉ số này càng thấp (gần 1.0) thì bộ Tokenizer của LLM hỗ trợ tiếng Việt càng tốt.",
    example: "• Qwen2.5 / Sailor2 / URA-LLaMA: ~1.22 – 1.30 tokens/từ (1 âm tiết tiếng Việt ≈ 1 token).\n• LLaMA-2 gốc (chưa mở rộng từ điển tiếng Việt): ~2.60 – 3.10 tokens/từ (bẻ 1 chữ có dấu thành 3 byte UTF-8 rời!).",
    why: "Token Fertility thấp giúp LLM đọc được văn bản tiếng Việt dài gấp đôi trong cùng giới hạn ngữ cảnh (Context Window), tiết kiệm 50% VRAM KV-Cache và sinh chữ nhanh gấp 2 lần.",
    related: ["qwen-sailor2", "kv-cache", "sentencepiece"]
  },
  "qwen-sailor2": {
    title: "Qwen2.5, Sailor2 (SeaAI Lab) & URA-LLaMA (ĐH Bách Khoa TP.HCM)",
    stage: 4,
    category: "Hệ sinh thái LLM Tiếng Việt",
    aliases: ["Qwen2.5", "Sailor2", "URA-LLaMA", "ura-hcmut"],
    def: "Ba họ mô hình ngôn ngữ lớn (LLM) mã nguồn mở hàng đầu cho tiếng Việt:\n• Qwen2.5 (7B/14B): Bộ từ điển 151.646 tokens hỗ trợ đa ngôn ngữ và suy luận logic xuất sắc.\n• Sailor2 (8B/20B - SeaAI Lab): Huấn luyện chuyên biệt cho các ngôn ngữ Đông Nam Á, hiểu sâu văn hóa và hành văn tiếng Việt.\n• URA-LLaMA / Gemma-URA (ĐH Bách Khoa TP.HCM): Tiên phong mở rộng từ điển tiếng Việt và Continual Pretraining.",
    example: "Tất cả đều hỗ trợ tinh chỉnh nhẹ bằng QLoRA 4-bit trên 1 GPU cá nhân (12GB–16GB VRAM).",
    why: "Là các mô hình nền tảng tốt nhất để xây dựng Chatbot chuyên ngành, Trợ lý ảo và Agentic RAG tiếng Việt.",
    related: ["token-fertility", "qlora", "langgraph"]
  },
  "lora": {
    title: "LoRA (Low-Rank Adaptation of Large Language Models)",
    stage: 4,
    category: "Parameter-Efficient Fine-Tuning",
    aliases: ["LoRA", "Low-Rank Adaptation", "LoraConfig", "r = 16", "lora_alpha"],
    def: "Kỹ thuật tinh chỉnh hiệu quả tham số (Hu và cộng sự, 2021): đóng băng toàn bộ ma trận trọng số gốc W_0 ∈ R^(d×k) và chỉ chèn thêm nhánh phân rã hạng thấp ΔW = B * A với A ∈ R^(r×k), B ∈ R^(d×r) và hạng r << min(d, k) (thường r = 8, 16, 32).",
    example: "h = W_0 * x + (α / r) * B * A * x\nKhởi tạo A ~ N(0, σ^2) và B = 0 để tại bước t = 0, ΔW = 0 (không làm xáo trộn mô hình gốc).\nÁp dụng lên cả 7 tầng chiếu: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj.",
    why: "Giảm ~99% số lượng tham số cần tính đạo hàm và trạng thái trình tối ưu AdamW, đồng thời có thể trộn (merge) B*A vào W_0 khi suy luận để không tốn thêm độ trễ.",
    related: ["qlora", "nf4", "catastrophic-forgetting"]
  },
  "qlora": {
    title: "QLoRA (Quantized Low-Rank Adaptation - Dettmers et al., 2023)",
    stage: 4,
    category: "Lượng tử hóa & Tinh chỉnh",
    aliases: ["QLoRA", "BitsAndBytesConfig", "Double Quantization", "Paged Optimizers"],
    def: "Phương pháp kết hợp nén trọng số mô hình gốc W_0 xuống định dạng 4-bit NormalFloat (NF4) đóng băng trên VRAM, áp dụng Lượng tử hóa kép (Double Quantization) và Paged Optimizers, đồng thời chỉ huấn luyện các ma trận LoRA (A, B) ở độ chính xác 16-bit (bfloat16).",
    example: "Khi tính lượt truyền xuôi/ngược: giải lượng tử (dequantize) từng khối W_0 từ 4-bit NF4 lên bfloat16 ngay trong thanh ghi GPU để nhân với x.\nGiúp giảm VRAM huấn luyện mô hình 7B từ 28.4 GB xuống chỉ còn ~5.6 GB!",
    why: "Cho phép sinh viên và kỹ sư huấn luyện LLM tiếng Việt 7B–14B ngay trên Google Colab T4 miễn phí hoặc laptop RTX 3060/4060.",
    related: ["lora", "nf4", "kv-cache"]
  },
  "nf4": {
    title: "4-bit NormalFloat (NF4 Quantization)",
    stage: 4,
    category: "Toán học Lượng tử hóa",
    aliases: ["NF4", "NormalFloat", "4-bit NF4"],
    def: "Kiểu dữ liệu 4-bit (16 mức giá trị q_0 ... q_15 ∈ [-1, 1]) tối ưu về mặt lý thuyết thông tin cho các trọng số mạng nơ-ron tuân theo phân phối chuẩn N(0, σ^2). Các mức lượng tử được đặt tại các điểm phân vị diện tích bằng nhau (equal-area quantiles) của hàm phân phối chuẩn tắc, giúp mật độ lưới dày đặc quanh vùng giá trị 0.",
    example: "Chia trọng số thành từng khối 64 phần tử (blocksize = 64), chuẩn hóa về [-1, 1] qua hằng số c_1 (FP32) rồi ánh xạ vào mức NF4 gần nhất.",
    why: "Giữ lại gần như 100% độ chính xác của mô hình 16-bit gốc, vượt xa lượng tử hóa đều INT4 truyền thống.",
    related: ["qlora", "lora"]
  },
  "kv-cache": {
    title: "KV-Cache (Key-Value Cache trong Suy luận LLM)",
    stage: 4,
    category: "Tối ưu Suy luận",
    aliases: ["KV-Cache", "KV Cache"],
    def: "Bộ nhớ đệm trên VRAM lưu lại các tensor Key (K) và Value (V) của toàn bộ các token phía trước trong suốt quá trình sinh văn bản tự hồi quy (Autoregressive Generation), giúp mô hình không phải tính lại K, V của các từ cũ ở mỗi bước sinh token mới.",
    example: "Dung lượng KV-Cache tăng tuyến tính theo độ dài chuỗi token N. Vì vậy bộ Tokenizer có Token Fertility thấp (như Qwen2.5 / Sailor2) giúp giảm một nửa dung lượng KV-Cache khi xử lý tiếng Việt.",
    why: "Hiểu rõ KV-Cache giúp tính toán đúng dung lượng VRAM khi phục vụ nhiều người dùng đồng thời (vLLM / TGI).",
    related: ["token-fertility", "self-attention", "qlora"]
  },
  "bm25": {
    title: "Okapi BM25 (Best Matching 25 Sparse Retrieval)",
    stage: 4,
    category: "Truy xuất Thông tin (IR)",
    aliases: ["BM25", "Okapi BM25", "Sparse Retrieval"],
    def: "Hàm xếp hạng văn bản dựa trên từ khóa kinh điển, cải tiến vượt bậc so với TF-IDF nhờ hai cơ chế: (1) Bão hòa tần suất từ (Term Frequency Saturation với hệ số k_1 ≈ 1.5) và (2) Chuẩn hóa độ dài tài liệu (Document Length Normalization với hệ số b ≈ 0.75).",
    example: "Score_BM25(Q, D) = Σ_{t ∈ Q} IDF(t) * [ (f(t,D) * (k_1 + 1)) / (f(t,D) + k_1 * (1 - b + b * |D| / avgdl)) ]",
    why: "Cực kỳ mạnh khi tìm kiếm chính xác mã điều khoản pháp luật ('Điều 128', 'Nghị định 100/2019/NĐ-CP'), tên riêng và thuật ngữ chuyên ngành mà Dense Vector thường làm mờ.",
    related: ["bge-m3", "rrf", "tfidf", "pyvi"]
  },
  "bge-m3": {
    title: "BAAI/bge-m3 & Halong Embedding (Dense Semantic Retrieval)",
    stage: 4,
    category: "Embedding Tiếng Việt",
    aliases: ["bge-m3", "BAAI/bge-m3", "BGE-M3", "halong_embedding", "Dense Embedding"],
    def: "Các mô hình nhúng văn bản đa ngôn ngữ / tiếng Việt hiện đại ánh xạ toàn bộ câu truy vấn và đoạn văn bản (tối đa 8.192 tokens với BGE-M3) vào không gian vector 1.024 chiều để tìm kiếm theo độ tương đồng ngữ nghĩa sâu ngay cả khi hai câu không dùng chung từ vựng.",
    example: "Truy vấn: 'Xử lý chữ tiếng Việt bị tách rời dấu thanh'\nKhớp ngữ nghĩa cao với tài liệu: 'Chuẩn hóa bảng mã Unicode NFC bằng thư viện unicodedata'",
    why: "Kết hợp BAAI/bge-m3 (hoặc hiieu/halong_embedding) với Okapi BM25 tạo nên kiến trúc Hybrid Retrieval chuẩn mực cho RAG tiếng Việt.",
    related: ["bm25", "rrf", "cosine-similarity", "langgraph"]
  },
  "rrf": {
    title: "RRF (Reciprocal Rank Fusion - Trộn Xếp hạng Nghịch đảo)",
    stage: 4,
    category: "Thuật toán Hybrid RAG",
    aliases: ["RRF", "Reciprocal Rank Fusion", "Hybrid Retrieval"],
    def: "Thuật toán hợp nhất kết quả từ nhiều bộ truy xuất có thang điểm khác nhau (như điểm BM25 không giới hạn và điểm Cosine ∈ [-1, 1] của BGE-M3) bằng cách chỉ sử dụng thứ hạng (rank = 1, 2, 3...) của tài liệu trong từng danh sách với hằng số làm trơn k = 60.",
    example: "RRF_Score(d) = 1 / (60 + rank_BM25(d)) + 1 / (60 + rank_Dense(d))\nTài liệu vừa có từ khóa khớp vừa có ngữ nghĩa đúng (ví dụ hạng 2 ở cả hai nhánh) sẽ vươn lên Top 1 chung cuộc!",
    why: "Không cần chuẩn hóa thang điểm phức tạp hay huấn luyện trọng số mà vẫn ổn định và tăng ~11%–15% Recall@5 trên tập UIT-ViQuAD 2.0.",
    related: ["bm25", "bge-m3", "langgraph", "viquad"]
  },
  "langgraph": {
    title: "LangGraph & Cyclic StateGraph (Agentic RAG)",
    stage: 4,
    category: "Kiến trúc Agentic AI",
    aliases: ["LangGraph", "StateGraph", "Agentic RAG", "Document Grader", "Query Rewriter", "Self-RAG"],
    def: "Framework xây dựng ứng dụng LLM dưới dạng đồ thị trạng thái có chu trình (Cyclic StateGraph), cho phép hệ thống RAG tự kiểm tra chất lượng tài liệu tìm được (Document Grader), tự viết lại câu truy vấn tiếng Việt (Query Rewriter) và truy xuất lại nếu tài liệu chưa đủ trả lời.",
    example: "Luồng vòng lặp: [Hybrid Retriever] → [Document Grader] --(Không đạt & retry < 2)--> [Query Rewriter] → [Hybrid Retriever] --(Đạt)--> [Faithful Generator]",
    why: "Khắc phục hoàn toàn điểm yếu của Naive RAG tuyến tính (tìm sai tài liệu → LLM bịa đặt câu trả lời / Hallucination).",
    related: ["rrf", "bge-m3", "hallucination", "qwen-sailor2"]
  },
  "hallucination": {
    title: "Hallucination (Hiện tượng Ảo giác trên LLM) & Faithfulness",
    stage: 4,
    category: "Độ tin cậy AI",
    aliases: ["Hallucination", "Faithfulness", "Ảo giác"],
    def: "Hiện tượng mô hình ngôn ngữ lớn (LLM) tự suy diễn hoặc bịa đặt ra thông tin trôi chảy nhưng sai sự thật hoặc không nằm trong tài liệu tham chiếu. Faithfulness (Độ trung thực) đo mức độ câu trả lời bám sát 100% vào ngữ cảnh truy xuất được.",
    example: "Sử dụng Node Document Grader kết hợp câu lệnh hệ thống yêu cầu trích dẫn nguồn [Doc_ID] giúp triệt tiêu ảo giác trong các bài toán hỏi đáp pháp luật và y tế.",
    why: "Yêu cầu bắt buộc khi triển khai hệ thống RAG doanh nghiệp.",
    related: ["langgraph", "rrf", "viquad"]
  },
  "uit-vsfc": {
    title: "UIT-VSFC (Vietnamese Students' Feedback Corpus)",
    stage: 2,
    category: "Bộ Dữ liệu Chuẩn",
    aliases: ["UIT-VSFC", "VSFC"],
    def: "Bộ dữ liệu chuẩn gồm hơn 16.000 câu phản hồi của sinh viên Việt Nam về giảng viên và chương trình đào tạo (do nhóm UIT NLP công bố), được gán nhãn cho 2 bài toán: Phân tích cảm xúc (Positive, Neutral, Negative) và Phân loại chủ đề (Lecturer, Curriculum, Facility, Others).",
    example: "Chia sẵn: 11.426 câu Train, 1.583 câu Validation, 3.166 câu Test.",
    why: "Benchmark tiêu chuẩn để đánh giá các mô hình phân loại văn bản tiếng Việt từ TF-IDF + LinearSVC đến PhoBERT.",
    related: ["class-imbalance", "phobert", "tfidf"]
  },
  "vlsp": {
    title: "VLSP Benchmarks (Vietnamese Language and Speech Processing)",
    stage: 1,
    category: "Bộ Dữ liệu Chuẩn",
    aliases: ["VLSP", "VLSP 2013", "VLSP 2016", "VLSP 2018"],
    def: "Chuỗi hội thảo và chiến dịch đánh giá thường niên uy tín nhất của cộng đồng Xử lý Ngôn ngữ và Tiếng nói Tiếng Việt, cung cấp các bộ dữ liệu vàng (Gold Standard) cho Tách từ & POS Tagging (VLSP 2013), Nhận diện thực thể NER (VLSP 2016, 2018), Dịch máy và LLM.",
    example: "Tập VLSP 2016 NER định nghĩa 4 nhãn thực thể chuẩn: PER (Người), LOC (Địa điểm), ORG (Tổ chức), MISC (Thực thể khác).",
    why: "Thước đo chuẩn mực để so sánh độ chính xác của VnCoreNLP, underthesea, PhoBERT và PhoNLP.",
    related: ["vncorenlp", "pos-tagging", "iob2", "phoner-covid19"]
  },
  "phoner-covid19": {
    title: "PhoNER_COVID19 Dataset (VinAI Research)",
    stage: 3,
    category: "Bộ Dữ liệu NER",
    aliases: ["PhoNER_COVID19", "PhoNER"],
    def: "Bộ dữ liệu nhận diện thực thể tiếng Việt chất lượng cao gồm 10.027 câu (37.451 thực thể) trích từ bản tin dịch tễ tại Việt Nam, gồm 10 loại thực thể chi tiết: PATIENT_ID, NAME, AGE, GENDER, JOB, LOCATION, ORGANIZATION, SYMPTOM_AND_DISEASE, TRANSPORTATION, DATE.",
    example: "PhoBERT-base-v2 đạt ~94.5% Micro-F1 trên tập dữ liệu này khi áp dụng đúng Subword Label Alignment (-100).",
    why: "Tập dữ liệu mở tuyệt vời để thực hành bài toán Token Classification (NER) tiếng Việt.",
    related: ["iob2", "subword-alignment", "phobert"]
  },
  "viquad": {
    title: "UIT-ViQuAD 2.0 (Vietnamese Question Answering Dataset)",
    stage: 4,
    category: "Bộ Dữ liệu Hỏi Đáp & RAG",
    aliases: ["UIT-ViQuAD", "ViQuAD", "ViQuAD 2.0", "UIT-ViQuAD 2.0"],
    def: "Bộ dữ liệu đọc hiểu và trả lời câu hỏi tiếng Việt hơn 23.000 cặp câu hỏi - câu trả lời trích từ các bài viết Wikipedia tiếng Việt, bao gồm cả các câu hỏi không có câu trả lời trong đoạn văn (Unanswerable questions) để kiểm tra khả năng chống ảo giác của mô hình.",
    example: "Được dùng rộng rãi để đánh giá độ chính xác truy xuất (Recall@K, MRR) và chất lượng câu trả lời trong các hệ thống RAG tiếng Việt.",
    why: "Có câu hỏi bẫy (Unanswerable) rất sát với kịch bản kiểm thử Node Document Grader trong LangGraph.",
    related: ["langgraph", "rrf", "bge-m3", "hallucination"]
  },
  "vietnews": {
    title: "VietNews Abstractive Summarization Dataset",
    stage: 3,
    category: "Bộ Dữ liệu Tóm tắt",
    aliases: ["VietNews"],
    def: "Bộ dữ liệu hơn 100.000 bài báo tiếng Việt (từ Tuổi Trẻ, VnExpress, Thanh Niên) gồm cặp Nội dung bài báo (Body) và Đoạn tóm tắt chuẩn (Sapô / Abstract) do biên tập viên viết.",
    example: "Chuẩn benchmark chính để huấn luyện và đánh giá mô hình tóm tắt văn bản VietAI/vit5 bằng thước đo ROUGE-1/2/L.",
    why: "Dữ liệu thực tế rất giàu từ vựng báo chí và cấu trúc câu phức tiếng Việt.",
    related: ["vit5", "rouge", "span-corruption"]
  },
  "unk-token": {
    title: "[UNK] / <unk> & OOV (Out-Of-Vocabulary)",
    stage: 1,
    category: "Từ điển & Tokenization",
    aliases: ["[UNK]", "<unk>", "OOV", "Out-Of-Vocabulary"],
    def: "OOV là hiện tượng gặp một từ hoặc ký tự không tồn tại trong từ điển huấn luyện của mô hình. Khi đó, bộ Tokenizer buộc phải thay thế từ đó bằng token đặc biệt [UNK] (Unknown), làm mất hoàn toàn thông tin ngữ nghĩa của từ.",
    example: "Nguyên nhân gây [UNK] nhiều nhất trong tiếng Việt là quên chuẩn hóa Unicode Tổ hợp (NFD) về Dựng sẵn (NFC)!",
    why: "Luôn kiểm tra tỷ lệ token [UNK] sau bước tokenize khi gỡ lỗi (debug) pipeline NLP.",
    related: ["nfc", "bpe", "fasttext"]
  }
};

// Danh sách thứ tự ưu tiên quét thuật ngữ tự động trong DOM
const GLOSSARY_MATCH_ENTRIES = (() => {
  const list = [];
  for (const [key, item] of Object.entries(NLP_GLOSSARY)) {
    for (const alias of item.aliases) {
      list.push({ key, alias, len: alias.length });
    }
  }
  // Ưu tiên khớp cụm từ dài trước (VD: 'Linear-chain CRF' trước 'CRF')
  list.sort((a, b) => b.len - a.len);
  return list;
})();

let activeGlossaryTriggerEl = null;
let currentDrawerStageFilter = "all";

function initGlossarySystem() {
  const countBadge = document.getElementById("glossaryCountBadge");
  if (countBadge) {
    countBadge.textContent = `${Object.keys(NLP_GLOSSARY).length}+`;
  }

  // 1. Tự động gắn tương tác cho các thuật ngữ chuyên ngành trong toàn bộ bài học
  autoEnhanceGlossaryTermsInDOM();

  // 2. Lắng nghe sự kiện click trên toàn trang cho các thuật ngữ & nút đóng
  document.addEventListener("click", (e) => {
    const termTrigger = e.target.closest("[data-glossary-key]");
    if (termTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const key = termTrigger.getAttribute("data-glossary-key");
      openGlossaryPopover(key, termTrigger);
      return;
    }

    const popover = document.getElementById("glossaryPopover");
    if (popover && !popover.hidden && !popover.contains(e.target)) {
      closeGlossaryPopover();
    }
  });

  // Hỗ trợ bàn phím (Enter / Space trên thuật ngữ, Esc để đóng)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGlossaryPopover();
      closeGlossaryDrawer();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-glossary-key]")) {
      e.preventDefault();
      openGlossaryPopover(e.target.getAttribute("data-glossary-key"), e.target);
    }
  });

  document.getElementById("closeGlossaryPopoverBtn")?.addEventListener("click", closeGlossaryPopover);

  // Mở / đóng Drawer từ điển đầy đủ
  document.getElementById("openGlossaryDrawerBtn")?.addEventListener("click", () => openGlossaryDrawer());
  document.getElementById("openGlossaryFromBarBtn")?.addEventListener("click", () => openGlossaryDrawer());
  document.getElementById("openDrawerFromPopoverBtn")?.addEventListener("click", () => {
    const currentTitle = document.getElementById("glossaryPopoverTitle")?.textContent || "";
    closeGlossaryPopover();
    openGlossaryDrawer(currentTitle.split(" (")[0]);
  });
  document.getElementById("closeGlossaryDrawerBtn")?.addEventListener("click", closeGlossaryDrawer);
  document.getElementById("glossaryDrawerBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "glossaryDrawerBackdrop") {
      closeGlossaryDrawer();
    }
  });

  // Tìm kiếm & lọc theo Giai đoạn trong Drawer
  const searchInput = document.getElementById("glossarySearchInput");
  searchInput?.addEventListener("input", () => {
    renderGlossaryDrawerList(searchInput.value.trim(), currentDrawerStageFilter);
  });

  document.querySelectorAll("#glossaryStageFilters .glossary-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#glossaryStageFilters .glossary-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentDrawerStageFilter = btn.getAttribute("data-stage-filter") || "all";
      renderGlossaryDrawerList(searchInput?.value.trim() || "", currentDrawerStageFilter);
    });
  });

  renderGlossaryDrawerList("", "all");
}

function findGlossaryKeyForText(rawText) {
  const cleaned = rawText.trim();
  if (!cleaned || cleaned.length < 2) return null;
  const lower = cleaned.toLowerCase();

  for (const entry of GLOSSARY_MATCH_ENTRIES) {
    const aliasLower = entry.alias.toLowerCase();
    if (lower === aliasLower) {
      return entry.key;
    }
  }
  for (const entry of GLOSSARY_MATCH_ENTRIES) {
    if (entry.alias.length >= 4 && lower.includes(entry.alias.toLowerCase())) {
      return entry.key;
    }
  }
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function autoEnhanceGlossaryTermsInDOM() {
  // Bước A: Nâng cấp tất cả các thẻ <code> inline (bỏ qua <pre><code> trong cửa sổ code mẫu)
  document.querySelectorAll("code").forEach((codeEl) => {
    if (codeEl.closest("pre") || codeEl.hasAttribute("data-glossary-key")) return;
    const matchedKey = findGlossaryKeyForText(codeEl.textContent || "");
    if (matchedKey) {
      codeEl.classList.add("glossary-code-term");
      codeEl.setAttribute("data-glossary-key", matchedKey);
      codeEl.setAttribute("role", "button");
      codeEl.setAttribute("tabindex", "0");
      codeEl.setAttribute("title", `Bấm để xem định nghĩa: ${NLP_GLOSSARY[matchedKey].title}`);
    }
  });

  // Bước B: Quét các đoạn văn bản lý thuyết (p, li, td) để bọc các thuật ngữ chuyên ngành chưa nằm trong <code>
  const escapedAliases = GLOSSARY_MATCH_ENTRIES
    .filter((item) => item.alias.length >= 3)
    .map((item) => escapeRegExp(item.alias));
  const termRegex = new RegExp(`(?<![\\p{L}\\p{N}_])(${escapedAliases.join("|")})(?![\\p{L}\\p{N}_])`, "gu");

  const aliasToKeyMap = new Map();
  for (const item of GLOSSARY_MATCH_ENTRIES) {
    aliasToKeyMap.set(item.alias.toLowerCase(), item.key);
  }

  const textContainers = document.querySelectorAll(
    ".guide__body p, .guide__body li, .callout p, .chg span, .card p, .card li, .card td, .data-table td, .sub-panel p, .sub-panel li"
  );

  textContainers.forEach((container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (
          parent.closest(
            "code, pre, a, button, h1, h2, h3, h4, .glossary-term, .formula-box, script, style"
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return termRegex.test(node.nodeValue || "")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const textNodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode);
    }

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      termRegex.lastIndex = 0;
      let lastIndex = 0;
      let match;
      const frag = document.createDocumentFragment();
      const seenKeysInNode = new Set();

      while ((match = termRegex.exec(text)) !== null) {
        const matchedText = match[0];
        const key = aliasToKeyMap.get(matchedText.toLowerCase());
        // Chỉ bọc lần xuất hiện đầu tiên của mỗi thuật ngữ trong cùng 1 câu để giao diện thoáng mắt
        if (!key || seenKeysInNode.has(key)) {
          continue;
        }
        seenKeysInNode.add(key);

        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const span = document.createElement("span");
        span.className = "glossary-term";
        span.setAttribute("data-glossary-key", key);
        span.setAttribute("role", "button");
        span.setAttribute("tabindex", "0");
        span.setAttribute("title", `Bấm để xem định nghĩa: ${NLP_GLOSSARY[key].title}`);
        span.textContent = matchedText;
        frag.appendChild(span);

        lastIndex = termRegex.lastIndex;
      }

      if (lastIndex > 0) {
        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        textNode.parentNode?.replaceChild(frag, textNode);
      }
    });
  });
}

function openGlossaryPopover(key, triggerEl) {
  const entry = NLP_GLOSSARY[key];
  const popover = document.getElementById("glossaryPopover");
  if (!entry || !popover) return;

  if (activeGlossaryTriggerEl) {
    activeGlossaryTriggerEl.classList.remove("active-term");
  }
  activeGlossaryTriggerEl = triggerEl || null;
  activeGlossaryTriggerEl?.classList.add("active-term");

  document.getElementById("glossaryPopoverStage").textContent = `Giai đoạn ${entry.stage}`;
  document.getElementById("glossaryPopoverCat").textContent = entry.category;
  document.getElementById("glossaryPopoverTitle").textContent = entry.title;
  document.getElementById("glossaryPopoverDef").textContent = entry.def;

  const exSection = document.getElementById("glossaryExampleSection");
  const exBox = document.getElementById("glossaryPopoverExample");
  if (entry.example) {
    exBox.textContent = entry.example;
    exSection.hidden = false;
  } else {
    exSection.hidden = true;
  }

  const whySection = document.getElementById("glossaryWhySection");
  const whyText = document.getElementById("glossaryPopoverWhy");
  if (entry.why) {
    whyText.textContent = entry.why;
    whySection.hidden = false;
  } else {
    whySection.hidden = true;
  }

  const relSection = document.getElementById("glossaryRelatedSection");
  const relContainer = document.getElementById("glossaryPopoverRelated");
  if (entry.related && entry.related.length > 0) {
    relContainer.innerHTML = entry.related
      .filter((relKey) => NLP_GLOSSARY[relKey])
      .map(
        (relKey) =>
          `<button type="button" class="glossary-rel-chip" data-glossary-key="${relKey}">${NLP_GLOSSARY[relKey].aliases[0]}</button>`
      )
      .join("");
    relSection.hidden = false;
  } else {
    relSection.hidden = true;
  }

  popover.hidden = false;
  popover.classList.remove("hidden");

  // Định vị thông minh quanh phần tử vừa bấm (không bao giờ tràn khỏi màn hình)
  if (triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const popWidth = Math.min(440, window.innerWidth - 24);
    const popHeight = popover.offsetHeight || 340;

    let left = rect.left;
    if (left + popWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popWidth - 12);
    }
    if (left < 12) left = 12;

    let top = rect.bottom + 10;
    if (top + popHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - popHeight - 10);
    }

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }
}

function closeGlossaryPopover() {
  const popover = document.getElementById("glossaryPopover");
  if (popover) {
    popover.hidden = true;
    popover.classList.add("hidden");
  }
  if (activeGlossaryTriggerEl) {
    activeGlossaryTriggerEl.classList.remove("active-term");
    activeGlossaryTriggerEl = null;
  }
}

function openGlossaryDrawer(initialQuery = "") {
  const backdrop = document.getElementById("glossaryDrawerBackdrop");
  const searchInput = document.getElementById("glossarySearchInput");
  if (!backdrop) return;
  backdrop.hidden = false;
  backdrop.classList.remove("hidden");
  if (searchInput) {
    searchInput.value = initialQuery;
    renderGlossaryDrawerList(initialQuery, currentDrawerStageFilter);
    setTimeout(() => searchInput.focus(), 50);
  }
}

function closeGlossaryDrawer() {
  const backdrop = document.getElementById("glossaryDrawerBackdrop");
  if (backdrop) {
    backdrop.hidden = true;
    backdrop.classList.add("hidden");
  }
}

function renderGlossaryDrawerList(query = "", stageFilter = "all") {
  const listEl = document.getElementById("glossaryDrawerList");
  if (!listEl) return;

  const qLower = query.toLowerCase();
  const entries = Object.entries(NLP_GLOSSARY).filter(([, item]) => {
    if (stageFilter !== "all" && String(item.stage) !== String(stageFilter)) {
      return false;
    }
    if (!qLower) return true;
    const matchTitle = item.title.toLowerCase().includes(qLower);
    const matchAlias = item.aliases.some((a) => a.toLowerCase().includes(qLower));
    const matchDef = item.def.toLowerCase().includes(qLower);
    const matchCat = item.category.toLowerCase().includes(qLower);
    return matchTitle || matchAlias || matchDef || matchCat;
  });

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="muted" style="text-align:center; padding: 32px 12px;">Không tìm thấy thuật ngữ nào khớp với từ khóa <strong>"${escapeHtml(query)}"</strong>.</div>`;
    return;
  }

  listEl.innerHTML = entries
    .map(
      ([, item]) => `
      <article class="glossary-drawer-card">
        <div class="glossary-drawer-card-head">
          <span class="glossary-drawer-term-name">${escapeHtml(item.title)}</span>
          <div style="display:flex; gap:6px;">
            <span class="glossary-stage-badge">Giai đoạn ${item.stage}</span>
            <span class="glossary-category-badge">${escapeHtml(item.category)}</span>
          </div>
        </div>
        <p class="glossary-def-text">${escapeHtml(item.def)}</p>
        ${
          item.example
            ? `<div class="glossary-example-box" style="margin-top:8px;">${escapeHtml(item.example)}</div>`
            : ""
        }
        ${
          item.why
            ? `<p class="glossary-why-text" style="margin-top:8px;"><strong>Ứng dụng thực chiến:</strong> ${escapeHtml(item.why)}</p>`
            : ""
        }
      </article>
    `
    )
    .join("");
}

