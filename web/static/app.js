/**
 * Frontend Interactive Motion Controller cho Vietnamese NLP Mastery.
 * Tích hợp:
 * - View Transitions API (`document.startViewTransition`) + Mandatory Accessibility Focus Routing
 * - 60fps Spring-Interpolated 2D Embedding Canvas (`requestAnimationFrame`)
 * - Staggered Token & Codepoint Entrances (`--idx`)
 * - Sequential LangGraph Node Animation
 * - Light Editorial / Dark Studio Theme Toggle
 */

const STORAGE_KEY = "vnlp_mastery_progress_v1";
const THEME_KEY = "vnlp_mastery_theme_v1";

const DEFAULT_PROGRESS = {
  xp: 0,
  completedExercises: {},
  completedQuizzes: {},
};

let userProgress = loadProgress();
let currentStage = 1;
let currentEmbeddingData = null;

// Trạng thái nội suy chuyển động Spring trên Canvas 2D Embedding
const canvasAnimState = {
  currX: 0.68,
  currY: 0.62,
  targetX: 0.68,
  targetY: 0.62,
  phase: 0,
  rafId: null,
};

// Ngân hàng 16 câu hỏi trắc nghiệm chuyên sâu cho 4 giai đoạn (4 câu / giai đoạn)
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
        "Câu bị quy về chỉ còn 2 âm tiết rời 'học' (xuất hiện 2 lần) và 'sinh' (xuất hiện 3 lần), làm mất hoàn toàn nghĩa của từ ghép 'học_sinh' và 'sinh_học'.",
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
      explain: "Chính xác! PhoBERT có max_position_embeddings = 258 (gồm <s> và </s>), nên max_length thực tế là 256 subwords. Với văn bản dài hơn cần chia chunk hoặc dùng mô hình hỗ trợ ngữ cảnh dài.",
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
      explain: "Đúng! ROUGE-L đo mức độ bảo toàn cấu trúc mạch câu thông qua chuỗi con chung dài nhất (LCS) ở mức từ hoặc âm tiết.",
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
      explain: "Hoàn toàn chính xác! QLoRA giữ trọng số gốc ở 4-bit NF4 (~4.5GB cho 7B params) và chỉ cập nhật ~1% tham số ở nhánh LoRA.",
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
      explain: "Chính xác! Fertility Rate thấp chứng tỏ bộ từ điển của LLM đã chứa sẵn các âm tiết và từ tiếng Việt có dấu nguyên vẹn thay vì phải bẻ nhỏ từng byte UTF-8.",
    },
    {
      q: "Câu 4.4: Trong kiến trúc Agentic Self-RAG xây dựng bằng LangGraph trên tập UIT-ViQuAD 2.0, nút Document Grader kết hợp Conditional Edge có vai trò gì?",
      options: [
        "Kiểm tra xem các đoạn văn truy xuất được có thực sự chứa thông tin trả lời câu hỏi hay không; nếu điểm thấp sẽ kích hoạt Query Rewriter viết lại câu truy vấn hoặc từ chối trả lời để chống ảo giác (Hallucination).",
        "Xóa toàn bộ cơ sở dữ liệu Vector sau mỗi câu hỏi.",
        "Tự động dịch câu trả lời sang tiếng Pháp.",
      ],
      correct: 0,
      explain: "Hoàn toàn chính xác! Vòng lặp tự kiểm định (Self-Correction Loop) trong LangGraph là chìa khóa giúp hệ thống RAG doanh nghiệp đạt độ tin cậy cao.",
    },
  ],
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Could not read localStorage:", e);
  }
  return { ...DEFAULT_PROGRESS, completedExercises: {}, completedQuizzes: {} };
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch (e) {
    console.warn("Could not save localStorage:", e);
  }
  updateProgressUI();
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
  const maxXP = 1200;
  const pct = Math.min(100, Math.round((userProgress.xp / maxXP) * 100));
  const xpEl = document.getElementById("xpDisplay");
  if (xpEl) {
    xpEl.innerHTML = `${svgIcon("ic-award", "svg-icon-sm")} ${userProgress.xp} / ${maxXP} XP`;
  }
  const barFill = document.getElementById("progressBarFill");
  if (barFill) {
    barFill.style.width = `${pct}%`;
  }
  document.getElementById("progressTrack")?.setAttribute("aria-valuenow", String(pct));

  let completedStages = 0;
  for (let s = 1; s <= 4; s++) {
    const exDone = !!userProgress.completedExercises[`stage_${s}`];
    const q0Done = !!userProgress.completedQuizzes[`q_${s}_0`];
    const q1Done = !!userProgress.completedQuizzes[`q_${s}_1`];
    const statusEl = document.getElementById(`stageStatus${s}`);
    if (!statusEl) continue;
    if (exDone && q0Done && q1Done) {
      completedStages++;
      statusEl.textContent = "✓";
      statusEl.classList.add("done");
      statusEl.setAttribute("aria-label", "Đã hoàn thành");
    } else {
      statusEl.textContent = "○";
      statusEl.classList.remove("done");
      statusEl.setAttribute("aria-label", "Chưa hoàn thành");
    }
  }
  const progText = document.getElementById("progressText");
  if (progText) {
    progText.textContent = `Hoàn thành: ${completedStages}/4 Giai đoạn (${pct}%)`;
  }
}

// ============================================================================
// Theme Management (Clean Editorial Light vs Deep Studio Dark)
// ============================================================================
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)");

  // Mặc định ưu tiên giao diện Sáng (Light Editorial) để dễ đọc chữ nhất,
  // trừ khi người dùng đã chọn Dark Mode.
  const initialTheme = saved || "light";
  applyTheme(initialTheme);

  sysDark?.addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    if (!document.startViewTransition) {
      applyTheme(next);
    } else {
      document.startViewTransition(() => applyTheme(next));
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const useEl = document.getElementById("themeIconUse");
  const labelEl = document.getElementById("themeLabel");
  if (theme === "dark") {
    useEl?.setAttribute("href", "#ic-moon");
    if (labelEl) labelEl.textContent = "Giao diện Tối";
  } else {
    useEl?.setAttribute("href", "#ic-sun");
    if (labelEl) labelEl.textContent = "Giao diện Sáng";
  }
}

// ============================================================================
// Discrete Entry/Exit Transition Helper (`@starting-style` + Fallback)
// ============================================================================
let supportsDisplayTransition;
function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function showElement(el) {
  if (!el) return;
  el.removeAttribute("data-closing");
  el.hidden = false;
}

// Helper gọi REST API tới Python Backend
async function callApi(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

// ============================================================================
// Landing Page <-> Interactive Studio View Transitions & Navigation
// ============================================================================
function activateStageDOM(targetStage) {
  currentStage = targetStage;
  document.querySelectorAll(".stage-btn").forEach((b) => {
    b.classList.toggle("active", parseInt(b.dataset.stage, 10) === currentStage);
  });
  document.querySelectorAll(".stage-view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`stage-${currentStage}`)?.classList.add("active");

  const activeTabName = document.querySelector(".mode-tab.active")?.dataset.tab || "visual";
  switchTabDOM(activeTabName);
}

function enterStudio(targetStage = 1) {
  const updateDOM = () => {
    document.getElementById("landingView")?.classList.add("hidden");
    document.getElementById("studioView")?.classList.remove("hidden");
    document.getElementById("backToLandingBtn")?.classList.remove("hidden");
    activateStageDOM(targetStage);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const focusHeading = () => {
    document.getElementById(`stage-heading-${targetStage}`)?.focus({ preventScroll: true });
  };

  if (!document.startViewTransition) {
    updateDOM();
    focusHeading();
    return;
  }
  const transition = document.startViewTransition(() => updateDOM());
  transition.finished.finally(() => focusHeading());
}

function returnToLanding() {
  const updateDOM = () => {
    document.getElementById("studioView")?.classList.add("hidden");
    document.getElementById("backToLandingBtn")?.classList.add("hidden");
    document.getElementById("landingView")?.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const focusLanding = () => {
    document.getElementById("landing-main-heading")?.focus({ preventScroll: true });
  };

  if (!document.startViewTransition) {
    updateDOM();
    focusLanding();
    return;
  }
  const transition = document.startViewTransition(() => updateDOM());
  transition.finished.finally(() => focusLanding());
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateProgressUI();
  renderAllQuizzes();
  initGlossarySystem();
  startCanvasAnimationLoop();

  // Landing Page CTA & Stage Card triggers
  document.getElementById("startLearningMainBtn")?.addEventListener("click", () => {
    enterStudio(1);
  });

  document.querySelectorAll("[data-enter-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetStage = parseInt(btn.dataset.enterStage, 10) || 1;
      enterStudio(targetStage);
    });
  });

  document.getElementById("backToLandingBtn")?.addEventListener("click", returnToLanding);
  document.getElementById("brandHomeLink")?.addEventListener("click", returnToLanding);
  document.getElementById("brandHomeLink")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      returnToLanding();
    }
  });

  // Stage switching with View Transitions + Mandatory Focus Routing
  document.querySelectorAll(".stage-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetStage = parseInt(btn.dataset.stage, 10);
      if (targetStage === currentStage) return;

      const performStageSwitch = () => {
        activateStageDOM(targetStage);
      };

      const focusHeading = () => {
        document.getElementById(`stage-heading-${currentStage}`)?.focus({ preventScroll: true });
      };

      if (!document.startViewTransition) {
        performStageSwitch();
        focusHeading();
        return;
      }
      const transition = document.startViewTransition(() => performStageSwitch());
      transition.finished.finally(() => focusHeading());
    });
  });

  // Mode tab switching (Visual / Sandbox / Exercise) with View Transitions
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      const updateTabState = () => {
        document.querySelectorAll(".mode-tab").forEach((t) => {
          const isTarget = t === tab;
          t.classList.toggle("active", isTarget);
          t.setAttribute("aria-selected", String(isTarget));
        });
        switchTabDOM(tabName);
      };

      if (!document.startViewTransition) {
        updateTabState();
        return;
      }
      document.startViewTransition(() => updateTabState());
    });
  });

  // Footer CTA buttons to jump directly to Sandbox/Exercise tab
  document.querySelectorAll("[data-jump-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-jump-tab") || "sandbox";
      const tabBtn = document.querySelector(`.mode-tab[data-tab="${targetTab}"]`);
      if (tabBtn) {
        tabBtn.click();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Copy Python code block buttons
  document.querySelectorAll("[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-copy-target");
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;
      try {
        await navigator.clipboard.writeText(codeEl.innerText);
        const origHtml = btn.innerHTML;
        btn.innerHTML = `${svgIcon("ic-check-circle", "svg-icon-sm")}<span>Đã Copy!</span>`;
        setTimeout(() => {
          btn.innerHTML = origHtml;
        }, 1800);
      } catch (e) {
        console.warn("Clipboard copy failed:", e);
      }
    });
  });

  // Reset progress button
  document.getElementById("resetProgressBtn").addEventListener("click", () => {
    userProgress = { xp: 0, completedExercises: {}, completedQuizzes: {} };
    saveProgress();
    renderAllQuizzes();
  });

  // Stage 1 Sandbox bindings
  document.getElementById("runPreprocessBtn").addEventListener("click", runStage1Preprocess);
  document.querySelectorAll("[data-preset-s1]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s1InputText").value = btn.dataset.presetS1;
      runStage1Preprocess();
    });
  });

  document.getElementById("runSegmentBtn").addEventListener("click", runStage1Segment);
  document.querySelectorAll("[data-preset-seg]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s1SegInput").value = btn.dataset.presetSeg;
      runStage1Segment();
    });
  });

  // Stage 2 Sandbox bindings (2D Embedding Canvas & Sentiment)
  document.querySelectorAll("[data-word-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      runStage2Embedding(btn.dataset.wordSelect);
    });
  });
  document.getElementById("runSentimentBtn").addEventListener("click", () => {
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

  const canvas = document.getElementById("embeddingCanvas");
  canvas.addEventListener("click", handleCanvasClick);

  // Stage 3 Sandbox bindings
  document.getElementById("runTokenCompareBtn").addEventListener("click", runStage3TokenizerCompare);
  document.querySelectorAll("[data-tok-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s3TokenInput").value = btn.dataset.tokSample;
      runStage3TokenizerCompare();
    });
  });

  // Stage 4 Sandbox bindings
  document.getElementById("s4DenseWeight").addEventListener("input", (e) => {
    document.getElementById("s4DenseWeightVal").textContent = parseFloat(e.target.value).toFixed(2);
  });
  document.getElementById("runRagSimBtn").addEventListener("click", runStage4RagSimulate);
  document.querySelectorAll("[data-rag-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("s4RagQuestion").value = btn.dataset.ragQ;
      runStage4RagSimulate();
    });
  });

  ["vramModelSize", "vramMethod", "vramLoraRank"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateVramCalculator);
  });

  setupExerciseHandlers();

  // Initial load for all sandboxes
  runStage1Preprocess();
  runStage1Segment();
  runStage2Embedding("giảng_viên");
  runStage3TokenizerCompare();
  runStage4RagSimulate();
  updateVramCalculator();
});

function switchTabDOM(tabName) {
  const stageEl = document.getElementById(`stage-${currentStage}`);
  stageEl.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

// ============================================================================
// STAGE 1: UNICODE & WORD SEGMENTATION SANDBOX (STAGGERED REVEALS)
// ============================================================================
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
      ? data.transformations
          .map((t) => `<li><strong>✓ ${t.type}:</strong> ${t.detail}</li>`)
          .join("")
      : "<li>✓ Văn bản đầu vào đã ở trạng thái chuẩn.</li>";

  document.getElementById("s1PreprocessResult").innerHTML = `
    <div class="sub-panel">
      <h4>${svgIcon("ic-check-circle", "svg-icon-sm")} Kết Quả Văn Bản Sau Khi Chuẩn Hóa</h4>
      <p style="font-size:15.5px; font-weight:700; color:var(--emerald-text); background:var(--emerald-bg); padding:12px 14px; border-radius:10px; border:1.5px solid var(--emerald);">
        ${data.cleaned_text}
      </p>
      <div style="margin-top:14px; font-size:13.5px;">
        <strong>Các bước biến đổi đã thực thi:</strong>
        <ul class="bullet-list" style="margin-top:6px;">${transHtml}</ul>
      </div>
    </div>

    <div class="sub-panel">
      <h4>${svgIcon("ic-code-2", "svg-icon-sm")} Mổ Xẻ Codepoint Từ "${data.sample_word}": NFC (${data.nfc_breakdown.length} chars) vs. NFD (${data.nfd_breakdown.length} chars)</h4>
      <div style="font-size:12.5px; font-weight:700; color:var(--emerald); margin-bottom:6px;">✓ NFC (Dựng sẵn - 1 ký tự duy nhất cho nguyên âm có dấu):</div>
      <div class="codepoint-list">${nfcBoxes}</div>
      <div style="font-size:12.5px; font-weight:700; color:var(--rose); margin:12px 0 6px;">✗ NFD (Tổ hợp - Tách rời dấu thanh thành Combining Marks):</div>
      <div class="codepoint-list">${nfdBoxes}</div>
    </div>
  `;
}

async function runStage1Segment() {
  const text = document.getElementById("s1SegInput").value;
  const data = await callApi("/api/segment", { text });

  const syllablePills = data.syllables
    .map((s, idx) => `<span class="tok-pill" style="--idx: ${idx}">${s}</span>`)
    .join("");

  const wordPills = data.pos_and_dependencies
    .map(
      (item, idx) => `
      <span class="tok-pill ${item.word.includes("_") ? "compound" : ""}" style="--idx: ${idx}">
        <strong>${item.word}</strong>
        <span class="pos-badge pos-${item.pos}">${item.pos}</span>
      </span>`
    )
    .join("");

  const depRows = data.pos_and_dependencies
    .map(
      (d) => `
      <tr>
        <td>${d.index}</td>
        <td><strong>${d.word}</strong></td>
        <td><span class="pos-badge pos-${d.pos}">${d.pos}</span></td>
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
        <h4 style="margin-top:18px;">2. Tách từ Tiếng Việt &amp; Gán nhãn POS (${data.word_count} từ, ${data.compound_count} từ ghép)</h4>
        <div class="token-stream">${wordPills}</div>
        <p class="muted" style="margin-top:12px; font-size:13px;">
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
              <th>Từ loại (POS)</th>
              <th>Từ gốc (Head)</th>
              <th>Quan hệ (Dep)</th>
            </tr>
          </thead>
          <tbody>${depRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// STAGE 2: 60FPS SPRING-ANIMATED 2D VECTOR EMBEDDING CANVAS
// ============================================================================
const CLUSTER_COLORS = {
  education: "#38bdf8",
  nlp_ai: "#a855f7",
  sentiment_pos: "#10b981",
  sentiment_neg: "#f43f5e",
  location: "#f59e0b",
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

  // Render nearest neighbors with staggered animation
  const neighborsHtml = data.top_neighbors
    .slice(1, 6)
    .map((n, idx) => {
      const pct = Math.max(5, Math.round(n.similarity * 100));
      return `
        <div class="neighbor-row" style="--idx: ${idx}">
          <div class="neighbor-top">
            <span>${n.word} <small class="muted">(${n.label})</small></span>
            <span style="color:var(--hero);">cos(θ) = ${n.similarity.toFixed(3)}</span>
          </div>
          <div class="progress-bar-track" style="height:7px;">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
  document.getElementById("neighborsList").innerHTML = neighborsHtml;

  // Render Sentiment Analysis Result
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
          .map(
            (f, idx) =>
              `<span class="tok-pill compound" style="--idx: ${idx}">${f.feature} (${f.weight > 0 ? "+" : ""}${f.weight})</span>`
          )
          .join("")
      : `<span class="muted">Không có từ khóa cảm xúc mạnh (Trung tính)</span>`;

  document.getElementById("s2SentimentResult").innerHTML = `
    <div class="result-grid">
      <div class="sub-panel">
        <h4>Dự đoán Nhãn Cảm xúc (UIT-VSFC): <span class="${badgeClass}">${sent.predicted_label}</span></h4>
        <p class="muted" style="margin-bottom:10px;">Câu sau khi tách từ: <code>${sent.segmented_sentence}</code></p>
        <div><strong>Đặc trưng từ ghép đóng góp trọng số:</strong></div>
        <div class="token-stream">${featsHtml}</div>
      </div>
      <div class="sub-panel">
        <h4>Phân phối Xác suất Dự đoán (Softmax Probabilities)</h4>
        ${Object.entries(sent.probabilities)
          .map(
            ([label, prob]) => `
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; font-size:13.5px;">
                <span>${label}</span>
                <strong>${(prob * 100).toFixed(1)}%</strong>
              </div>
              <div class="progress-bar-track" style="height:8px; margin-top:4px;">
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
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  function tick() {
    if (currentEmbeddingData && currentStage === 2) {
      if (prefersReducedMotion) {
        canvasAnimState.currX = canvasAnimState.targetX;
        canvasAnimState.currY = canvasAnimState.targetY;
      } else {
        // Non-linear Spring Damping Interpolation
        canvasAnimState.currX += (canvasAnimState.targetX - canvasAnimState.currX) * 0.14;
        canvasAnimState.currY += (canvasAnimState.targetY - canvasAnimState.currY) * 0.14;
        canvasAnimState.phase += 0.045;
      }
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
  const scaleX = W * 0.43;
  const scaleY = H * 0.41;

  ctx.clearRect(0, 0, W, H);

  // 1. Vẽ lưới tọa độ & vòng tròn đồng tâm
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  [90, 175].forEach((r) => {
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

  // 2. Vẽ tia Vector nội suy mượt từ gốc tọa độ (0,0) tới vị trí hiện tại
  ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // 3. Vẽ đường nối đứt nét tới 4 từ gần nhất kèm hạt tín hiệu chuyển động
  const topNeighbors = data.top_neighbors.slice(1, 5);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
  ctx.lineWidth = 1.6;
  topNeighbors.forEach((n) => {
    const nx = cx + n.x * scaleX;
    const ny = cy - n.y * scaleY;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 4. Vẽ tất cả các điểm từ vựng (với hiệu ứng thở sin-wave trên điểm đang chọn)
  const breatheRadius = 12 + Math.sin(canvasAnimState.phase) * 3.5;

  data.all_points.forEach((pt) => {
    const px = cx + pt.x * scaleX;
    const py = cy - pt.y * scaleY;
    const isTarget = pt.word === data.target_word;
    const color = CLUSTER_COLORS[pt.cluster] || "#38bdf8";

    if (isTarget) {
      ctx.beginPath();
      ctx.arc(px, py, breatheRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56, 189, 248, 0.26)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, isTarget ? 7.5 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = isTarget ? "bold 13.5px Inter, sans-serif" : "12.5px Inter, sans-serif";
    ctx.fillStyle = isTarget ? "#ffffff" : "#cbd5e1";
    ctx.fillText(pt.word, px + 10, py + 4);
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
  const scaleX = canvas.width * 0.43;
  const scaleY = canvas.height * 0.41;

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

  if (closestWord && minDist < 50) {
    runStage2Embedding(closestWord);
  }
}

// ============================================================================
// STAGE 3: TRANSFORMER TOKENIZERS & SUBWORD ALIGNMENT
// ============================================================================
async function runStage3TokenizerCompare() {
  const text = document.getElementById("s3TokenInput").value;
  const data = await callApi("/api/tokenize-compare", { text });

  const phobertTokens = data.phobert.tokens
    .map(
      (t, idx) =>
        `<span class="tok-pill ${t.includes("@@") || t.includes("_") ? "compound" : ""}" style="--idx: ${idx}">${t}</span>`
    )
    .join("");

  const vit5Tokens = data.vit5.tokens
    .map((t, idx) => `<span class="tok-pill" style="--idx: ${idx}">${t}</span>`)
    .join("");

  const alignmentRows = data.phobert.subword_alignment
    .map(
      (row) => `
      <tr>
        <td><code>${row.subword}</code></td>
        <td>${row.word_origin}</td>
        <td><span class="${row.ner_tag !== "O" ? "tag-emerald" : "muted"}">${row.ner_tag}</span></td>
        <td>
          <span class="${row.loss_label_id === -100 ? "tag-rose" : "tag-emerald"}">
            ${row.loss_label_id === -100 ? "✗ -100 (Ignored in Loss)" : `✓ ID = ${row.loss_label_id}`}
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
        <h4 style="margin-top:18px;">2. <code>${data.vit5.model_name}</code> (SentencePiece '▁' trên văn bản tự nhiên)</h4>
        <div class="token-stream">${vit5Tokens}</div>
      </div>

      <div class="sub-panel">
        <h4>3. Bảng Căn chỉnh Nhãn Subword (Subword Label Alignment cho PhoBERT NER)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Subword Token</th>
              <th>Từ Gốc</th>
              <th>Nhãn Thực Thể (IOB2)</th>
              <th>Label ID trong CrossEntropy</th>
            </tr>
          </thead>
          <tbody>${alignmentRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// STAGE 4: LANGGRAPH AGENTIC RAG (SEQUENTIAL NODE MOTION) & QLORA CALCULATOR
// ============================================================================
async function runStage4RagSimulate() {
  const question = document.getElementById("s4RagQuestion").value;
  const use_word_seg_bm25 = document.getElementById("s4UseWordSeg").checked;
  const dense_weight = parseFloat(document.getElementById("s4DenseWeight").value);

  const data = await callApi("/api/rag-simulate", {
    question,
    use_word_seg_bm25,
    dense_weight,
  });

  // Animate LangGraph Live Stepper sequentially
  const lgNodes = document.querySelectorAll("#langgraphNodeVisualizer .lg-node");
  lgNodes.forEach((n) => n.classList.remove("active-step"));
  lgNodes.forEach((node, idx) => {
    setTimeout(() => {
      node.classList.add("active-step");
    }, idx * 180);
  });

  const traceHtml = data.langgraph_trace
    .map(
      (step, idx) => `
      <div class="neighbor-row" style="--idx: ${idx}; border-left: 4px solid var(--emerald);">
        <div class="neighbor-top">
          <span><strong>${step.node}</strong></span>
          <span class="tag-emerald">${step.latency_ms} ms</span>
        </div>
        <div class="muted" style="font-size:13px;">${step.detail}</div>
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
        <div class="neighbors-list">${traceHtml}</div>
        <div style="margin-top:16px; padding:14px; background:var(--emerald-bg); border:1.5px solid var(--emerald); border-radius:10px;">
          <div style="font-size:12px; color:var(--emerald-text); font-weight:800;">✓ CÂU TRẢ LỜI SINH BỞI AGENT (GROUNDED ANSWER):</div>
          <div style="font-size:14px; margin-top:4px; font-weight:500;">${data.generated_answer}</div>
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
              <th>Hybrid Score</th>
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
      : "Cần GPU Server A100 / H100 (40GB - 80GB VRAM) hoặc DeepSpeed ZeRO-3";

  document.getElementById("vramResultBox").innerHTML = `
    <div class="sub-panel">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h4>Tổng VRAM Ước tính: <span class="highlight-token">${totalGB} GB VRAM</span></h4>
          <p class="muted" style="font-size:13.5px; margin-top:6px;">Khuyến nghị phần cứng: <strong>${gpuRec}</strong></p>
        </div>
        <div style="display:flex; gap:16px; font-size:13.5px;">
          <span>Trọng số gốc: <strong>${baseWeightsGB} GB</strong></span>
          <span>LoRA + Optimizer: <strong>${adapterAndOptGB} GB</strong></span>
          <span>Activations/Grad: <strong>${activationGB} GB</strong></span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// HANDS-ON EXERCISES & QUIZZES
// ============================================================================
function setupExerciseHandlers() {
  document.getElementById("submitEx1Btn").addEventListener("click", async () => {
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

  document.getElementById("submitEx2Btn").addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 2,
      payload: {
        segmented_sentence: document.getElementById("ex2SegAnswer").value,
      },
    });
    showExerciseFeedback("ex2Feedback", 2, res);
  });

  document.getElementById("submitEx3Btn").addEventListener("click", async () => {
    const res = await callApi("/api/evaluate-exercise", {
      stage_id: 3,
      payload: {
        first_subword_label: document.getElementById("ex3FirstSub").value,
        second_subword_label: document.getElementById("ex3SecondSub").value,
      },
    });
    showExerciseFeedback("ex3Feedback", 3, res);
  });

  document.getElementById("submitEx4Btn").addEventListener("click", async () => {
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
}

function showExerciseFeedback(elementId, stageId, res) {
  const el = document.getElementById(elementId);
  el.classList.remove("pass", "fail");
  el.classList.add(res.passed ? "pass" : "fail");
  el.innerHTML = `<strong>${res.passed ? "✓ ĐẠT (100/100):" : "✗ CHƯA ĐẠT:"}</strong> ${res.feedback}`;
  showElement(el);
  if (res.passed) {
    awardXP(`stage_${stageId}`, "exercise", 100);
  }
}

function renderAllQuizzes() {
  for (let stage = 1; stage <= 4; stage++) {
    const container = document.getElementById(`quizContainer${stage}`);
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
            <div class="quiz-q">${item.q} ${isDone ? '<span class="tag-emerald">✓ Đã hoàn thành (+50 XP)</span>' : ""}</div>
            <div class="quiz-options">${optsHtml}</div>
            <div class="feedback-box ${isDone ? "pass" : ""}" id="qfb_${stage}_${qIdx}" ${isDone ? "" : "hidden"}>
              ${isDone ? item.explain : ""}
            </div>
          </div>
        `;
      })
      .join("");

    container.innerHTML = `<div class="card-title-row"><div class="icon-badge">${svgIcon("ic-book-open")}</div><h3>Câu Hỏi Trắc Nghiệm Kiểm Tra Kiến Thức Giai đoạn ${stage}</h3></div>${html}`;
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
        showElement(fbEl);
        awardXP(`q_${s}_${qIdx}`, "quiz", 50);
      } else {
        btn.classList.add("wrong");
        fbEl.classList.add("fail");
        fbEl.innerHTML = `<strong>✗ Chưa đúng:</strong> Hãy thử suy nghĩ lại dựa trên kiến thức ở phần Lý thuyết &amp; Phòng thí nghiệm nhé!`;
        showElement(fbEl);
      }
    });
  });
}

// ============================================================================
// Interactive NLP Technical Term Glossary (Popover + Auto-Highlighter + Drawer)
// ============================================================================
const NLP_GLOSSARY = {
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
    ".card p, .card li, .card td, .prose-text, .bullet-list li, .data-table td, .hero-desc, .concept-card p, .concept-card li, .pipeline-step p, .callout-box, .worked-step p, .sub-panel p, .sub-panel li"
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

