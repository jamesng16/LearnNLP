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

// Ngân hàng câu hỏi trắc nghiệm thực chiến cho 4 giai đoạn
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
  const maxXP = 800;
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
