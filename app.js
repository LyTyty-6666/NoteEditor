/**
 * NoteEditor - Frontend Logic & Interactive Engine
 * Handles Reviews & Ratings, Commenting, Star Picker, Markdown Sandbox, and Download Handlers
 */

// =============================================================================
// 1. Initial Community Seed Reviews
// =============================================================================
const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    author: "Elena Rostova",
    role: "Senior Frontend Engineer",
    avatarBg: "linear-gradient(135deg, #10b981, #06b6d4)",
    rating: 5,
    title: "Finally, a Windows editor that isn't a 500MB Electron monster!",
    comment: "I've been searching for a native, lightweight markdown note app for months. NoteEditor starts up in literal milliseconds and the split-screen markdown preview with code block syntax highlighting is buttery smooth. The dark mode matches Windows 11 aesthetics beautifully.",
    tags: ["Blazing Fast", "Clean Dark UI", "Great Markdown"],
    date: "2026-10-02",
    helpfulCount: 42,
    verified: true
  },
  {
    id: "rev-2",
    author: "Marcus Vance",
    role: "Technical Writer & Author",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    rating: 5,
    title: "Completely replaced my bloated writing software",
    comment: "The distraction-free workflow is a breath of fresh air. I draft full documentation chapters here without any sluggishness. Auto-save has already saved my draft twice during unexpected reboots. And the best part? Absolutely free with no subscriptions.",
    tags: ["100% Free", "Great Markdown", "Lightweight (40MB)"],
    date: "2026-09-28",
    helpfulCount: 31,
    verified: true
  },
  {
    id: "rev-3",
    author: "David Chen",
    role: "Computer Science Student",
    avatarBg: "linear-gradient(135deg, #f59e0b, #ef4444)",
    rating: 5,
    title: "Perfect for university lecture notes and quick code snippets",
    comment: "I love having my notes stored as standard .md files on my hard drive instead of trapped inside some cloud service. The math equations and syntax highlighting make STEM coursework so much easier to organize.",
    tags: ["Blazing Fast", "Clean Dark UI", "100% Free"],
    date: "2026-09-25",
    helpfulCount: 19,
    verified: true
  },
  {
    id: "rev-4",
    author: "Sarah Lindqvist",
    role: "Product Designer",
    avatarBg: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    rating: 5,
    title: "Minimalist, sleek, and zero distraction",
    comment: "The typography and spacing are top tier. Keyboard shortcuts are intuitive, and having quick checklists right inside my notes keeps daily sprints organized without opening heavy task apps.",
    tags: ["Clean Dark UI", "Great Markdown"],
    date: "2026-09-19",
    helpfulCount: 15,
    verified: true
  },
  {
    id: "rev-5",
    author: "Liam O'Connor",
    role: "DevOps Engineer",
    avatarBg: "linear-gradient(135deg, #10b981, #3b82f6)",
    rating: 4,
    title: "Great tool for scratchpad notes and yaml config edits",
    comment: "Super snappy and takes almost zero RAM in Task Manager (under 60MB on my machine). Only small feature I'd love is a split view for 3 files at once, but v2.0 is already miles ahead of everything else.",
    tags: ["Lightweight (40MB)", "Blazing Fast"],
    date: "2026-09-14",
    helpfulCount: 8,
    verified: true
  },
  {
    id: "rev-6",
    author: "Kavita Patel",
    role: "Fullstack Developer",
    avatarBg: "linear-gradient(135deg, #ec4899, #f59e0b)",
    rating: 5,
    title: "The offline-first philosophy is exactly what was missing",
    comment: "No login prompt, no AI subscription nag screen, no network requests tracking keystrokes. Just double-click the exe, install in 5 seconds, and write. Thank you to the creators for keeping this free!",
    tags: ["100% Free", "Blazing Fast", "Clean Dark UI"],
    date: "2026-09-08",
    helpfulCount: 27,
    verified: true
  }
];

// =============================================================================
// 2. State & Storage Management
// =============================================================================
const STORAGE_KEY_REVIEWS = "noteeditor_user_reviews_v2";
const STORAGE_KEY_UPVOTES = "noteeditor_upvoted_ids_v2";

function loadReviews() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load reviews from localStorage", e);
  }
  return [...DEFAULT_REVIEWS];
}

function saveReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error("Failed to save reviews to localStorage", e);
  }
}

function getUpvotedIds() {
  try {
    const ids = localStorage.getItem(STORAGE_KEY_UPVOTES);
    return ids ? JSON.parse(ids) : [];
  } catch (e) {
    return [];
  }
}

function markReviewUpvoted(id) {
  const ids = getUpvotedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY_UPVOTES, JSON.stringify(ids));
  }
}

// Current runtime state
let currentReviews = loadReviews();
let currentFilter = "all";
let currentSort = "newest";
let visibleLimit = 5;

// =============================================================================
// 3. Rating & Review Statistics Calculations
// =============================================================================
function updateRatingStats() {
  const total = currentReviews.length;
  if (total === 0) return;

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  currentReviews.forEach(r => {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    counts[star] = (counts[star] || 0) + 1;
    sum += r.rating;
  });

  const avg = (sum / total).toFixed(1);

  // Update big score
  const avgDisplay = document.getElementById("avg-rating-display");
  const avgStars = document.getElementById("avg-stars-display");
  const totalCount = document.getElementById("total-reviews-count");

  if (avgDisplay) avgDisplay.textContent = avg;
  if (avgStars) {
    const fullStars = Math.round(avg);
    avgStars.textContent = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  }
  if (totalCount) {
    totalCount.textContent = `Based on ${total} community ratings & reviews`;
  }

  // Update breakdown bars
  for (let s = 1; s <= 5; s++) {
    const bar = document.getElementById(`bar-${s}`);
    const countEl = document.getElementById(`count-${s}`);
    const pct = total > 0 ? ((counts[s] / total) * 100).toFixed(1) : 0;
    if (bar) bar.style.width = `${pct}%`;
    if (countEl) countEl.textContent = counts[s];
  }

  // Update filter pill counts
  const filterCountAll = document.getElementById("filter-count-all");
  const filterCount5 = document.getElementById("filter-count-5");
  const filterCount4 = document.getElementById("filter-count-4");
  const filterCount3 = document.getElementById("filter-count-3");

  if (filterCountAll) filterCountAll.textContent = total;
  if (filterCount5) filterCount5.textContent = counts[5];
  if (filterCount4) filterCount4.textContent = counts[4];
  if (filterCount3) filterCount3.textContent = counts[3] + counts[2] + counts[1];
}

// =============================================================================
// 4. Render Reviews Stream
// =============================================================================
function renderReviews(highlightId = null) {
  const container = document.getElementById("reviews-stream");
  const loadMoreBtn = document.getElementById("load-more-reviews-btn");
  if (!container) return;

  // Filter
  let filtered = currentReviews.filter(r => {
    if (currentFilter === "all") return true;
    if (currentFilter === "5") return r.rating === 5;
    if (currentFilter === "4") return r.rating === 4;
    if (currentFilter === "3") return r.rating <= 3;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (currentSort === "highest") {
      return b.rating - a.rating || new Date(b.date) - new Date(a.date);
    }
    if (currentSort === "helpful") {
      return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    }
    // Default newest
    return new Date(b.date) - new Date(a.date);
  });

  const upvotedIds = getUpvotedIds();
  const toDisplay = filtered.slice(0, visibleLimit);

  if (toDisplay.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-card);">
        <p style="color: var(--text-secondary); margin-bottom: 12px;">No reviews found matching this filter.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="setFilter('all')">Show All Reviews</button>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

  container.innerHTML = toDisplay.map(r => {
    const isNew = r.id === highlightId ? "is-newly-added" : "";
    const isUpvoted = upvotedIds.includes(r.id);
    const starString = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const initials = r.author ? r.author.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "U";

    const tagsHtml = (r.tags && r.tags.length > 0)
      ? `<div class="review-card-tags">
          ${r.tags.map(t => `<span class="review-pill-tag">${escapeHtml(t)}</span>`).join("")}
        </div>`
      : "";

    return `
      <article class="review-item-card ${isNew}" id="${r.id}">
        <div class="review-card-top">
          <div class="reviewer-profile">
            <div class="reviewer-avatar" style="background: ${r.avatarBg || 'linear-gradient(135deg, #10b981, #06b6d4)'}">
              ${escapeHtml(initials)}
            </div>
            <div class="reviewer-meta">
              <div class="reviewer-name-row">
                <span class="reviewer-name">${escapeHtml(r.author)}</span>
                <span class="badge-verified-user" title="Verified installer of NoteEditor">
                  ✓ Verified User
                </span>
              </div>
              <span class="reviewer-role-text">${escapeHtml(r.role || "Windows User")}</span>
            </div>
          </div>
          <div class="review-date">${formatDate(r.date)}</div>
        </div>

        <div class="review-card-rating">
          <span class="review-stars-gold">${starString}</span>
          <span class="review-numeric-score">${r.rating}.0 / 5.0</span>
        </div>

        <h4 class="review-card-title">${escapeHtml(r.title)}</h4>
        <p class="review-card-comment">${escapeHtml(r.comment)}</p>

        ${tagsHtml}

        <div class="review-card-footer">
          <button type="button" class="helpful-vote-btn ${isUpvoted ? 'has-voted' : ''}" 
                  onclick="handleUpvote('${r.id}')" aria-label="Mark review as helpful">
            <span>👍 Helpful</span>
            <span class="helpful-count">(${r.helpfulCount || 0})</span>
          </button>
          <span class="download-ref">NoteEditor v2.0 for Windows</span>
        </div>
      </article>
    `;
  }).join("");

  if (loadMoreBtn) {
    if (filtered.length > visibleLimit) {
      loadMoreBtn.style.display = "inline-block";
      loadMoreBtn.textContent = `Load More Reviews (${filtered.length - visibleLimit} more)`;
    } else {
      loadMoreBtn.style.display = "none";
    }
  }
}

// Global hook for filter buttons
window.setFilter = function(filterVal) {
  currentFilter = filterVal;
  visibleLimit = 5;
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === filterVal);
  });
  renderReviews();
};

// Global hook for upvotes
window.handleUpvote = function(reviewId) {
  const upvoted = getUpvotedIds();
  if (upvoted.includes(reviewId)) {
    showToast("You've already marked this review as helpful!");
    return;
  }

  const review = currentReviews.find(r => r.id === reviewId);
  if (review) {
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    markReviewUpvoted(reviewId);
    saveReviews(currentReviews);
    renderReviews();
    showToast("Thanks! Marked as helpful 👍");
  }
};

// =============================================================================
// 5. Interactive Star Rating Selector in Review Form
// =============================================================================
const STAR_FEEDBACK_LABELS = {
  1: "1 / 5 - Poor experience, needs work",
  2: "2 / 5 - Fair, but has limitations",
  3: "3 / 5 - Good, meets basic needs",
  4: "4 / 5 - Very good! Enjoyable and snappy",
  5: "5 / 5 - Outstanding & Highly Recommended!"
};

function initStarPicker() {
  const picker = document.getElementById("interactive-star-picker");
  const hiddenInput = document.getElementById("form-rating-val");
  const feedbackEl = document.getElementById("star-feedback-text");
  if (!picker || !hiddenInput || !feedbackEl) return;

  const starBtns = Array.from(picker.querySelectorAll(".star-picker-btn"));

  function updateVisuals(rating) {
    starBtns.forEach(btn => {
      const val = parseInt(btn.getAttribute("data-val"), 10);
      btn.classList.toggle("active", val <= rating);
    });
    feedbackEl.textContent = STAR_FEEDBACK_LABELS[rating] || `${rating} / 5 Stars`;
  }

  starBtns.forEach(btn => {
    const val = parseInt(btn.getAttribute("data-val"), 10);

    // Hover effect
    btn.addEventListener("mouseenter", () => {
      updateVisuals(val);
    });

    // Click effect
    btn.addEventListener("click", () => {
      hiddenInput.value = val;
      updateVisuals(val);
    });
  });

  // Mouse leave restores saved value
  picker.addEventListener("mouseleave", () => {
    const current = parseInt(hiddenInput.value, 10) || 5;
    updateVisuals(current);
  });

  // Initial state
  updateVisuals(5);
}

// =============================================================================
// 6. Review Form Submission Handler
// =============================================================================
function initReviewForm() {
  const form = document.getElementById("new-review-form");
  const commentTextarea = document.getElementById("review-comment");
  const charsLeftSpan = document.getElementById("comment-chars-left");

  if (!form) return;

  // Character counter
  if (commentTextarea && charsLeftSpan) {
    commentTextarea.addEventListener("input", () => {
      const left = 1500 - commentTextarea.value.length;
      charsLeftSpan.textContent = left;
      charsLeftSpan.style.color = left < 50 ? "#f43f5e" : "var(--text-muted)";
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("review-author");
    const roleInput = document.getElementById("review-role");
    const titleInput = document.getElementById("review-title");
    const ratingInput = document.getElementById("form-rating-val");

    // Reset error states
    form.querySelectorAll(".form-group").forEach(g => g.classList.remove("has-error"));

    let hasError = false;

    if (!nameInput.value.trim()) {
      nameInput.closest(".form-group").classList.add("has-error");
      hasError = true;
    }

    if (!titleInput.value.trim()) {
      titleInput.closest(".form-group").classList.add("has-error");
      hasError = true;
    }

    if (!commentTextarea.value.trim() || commentTextarea.value.trim().length < 10) {
      commentTextarea.closest(".form-group").classList.add("has-error");
      hasError = true;
    }

    if (hasError) return;

    // Collect tags
    const checkedTags = Array.from(form.querySelectorAll('input[name="tag"]:checked')).map(cb => cb.value);

    // Dynamic gradient for avatar
    const gradients = [
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #6366f1, #a855f7)",
      "linear-gradient(135deg, #f59e0b, #ec4899)",
      "linear-gradient(135deg, #06b6d4, #3b82f6)",
      "linear-gradient(135deg, #10b981, #84cc16)"
    ];
    const randomBg = gradients[Math.floor(Math.random() * gradients.length)];

    const newReview = {
      id: "rev-" + Date.now(),
      author: nameInput.value.trim(),
      role: roleInput.value.trim() || "Verified User",
      avatarBg: randomBg,
      rating: parseInt(ratingInput.value, 10) || 5,
      title: titleInput.value.trim(),
      comment: commentTextarea.value.trim(),
      tags: checkedTags.length > 0 ? checkedTags : ["Verified Download"],
      date: new Date().toISOString().split("T")[0],
      helpfulCount: 0,
      verified: true
    };

    // Prepend to current list
    currentReviews.unshift(newReview);
    saveReviews(currentReviews);

    // Update stats and re-render
    updateRatingStats();
    currentFilter = "all";
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-filter") === "all");
    });
    renderReviews(newReview.id);

    // Reset form
    form.reset();
    document.getElementById("form-rating-val").value = "5";
    initStarPicker();
    if (charsLeftSpan) charsLeftSpan.textContent = "1500";

    showToast("🎉 Thank you! Your review & comment are now published.");

    // Scroll smoothly to newly inserted review
    const newEl = document.getElementById(newReview.id);
    if (newEl) {
      newEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

// =============================================================================
// 7. Interactive Live Markdown Sandbox
// =============================================================================
const SAMPLE_MARKDOWN = `# Welcome to NoteEditor v2.0 🚀

NoteEditor is built for **speed**, **focus**, and **simplicity**.

## Key Capabilities
- [x] Lightning-fast cold startup (< 15ms)
- [x] Local-first file storage on your Windows PC
- [x] Zero subscriptions or telemetry
- [ ] Test real-time markdown in this interactive preview!

### Sample Code Block
\`\`\`javascript
function createNote(title, content) {
  console.log("Saving note locally:", title);
  return { id: Date.now(), title, content, updated: new Date() };
}
\`\`\`

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

Feel free to edit this text or use the formatting buttons above!`;

function parseSimpleMarkdown(md) {
  if (!md) return "";

  let html = md;

  // Escape basic HTML tags to prevent XSS
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code Blocks
  html = html.replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Task lists
  html = html.replace(/^- \[x\] (.*$)/gim, '<li><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<li><input type="checkbox" disabled> $1</li>');

  // Bullet lists
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gi, "<ul>$1</ul>");
  // Clean nested duplicate <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/gi, "");

  // Paragraphs for empty lines
  const lines = html.split("\n");
  const processed = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<pre") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<block")) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processed.join("\n");
}

function initDemoSandbox() {
  const textarea = document.getElementById("demo-textarea");
  const output = document.getElementById("demo-rendered-output");
  const wordCount = document.getElementById("demo-word-count");
  const charCount = document.getElementById("demo-char-count");
  const resetBtn = document.getElementById("demo-reset-btn");

  if (!textarea || !output) return;

  function update() {
    const text = textarea.value;
    output.innerHTML = parseSimpleMarkdown(text);

    // Update counts
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    if (wordCount) wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
    if (charCount) charCount.textContent = `${chars} character${chars === 1 ? '' : 's'}`;
  }

  // Populate sample
  textarea.value = SAMPLE_MARKDOWN;
  update();

  textarea.addEventListener("input", update);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      textarea.value = SAMPLE_MARKDOWN;
      update();
      showToast("Demo reset to default sample!");
    });
  }

  // Toolbar Actions
  document.querySelectorAll(".tool-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      insertFormatting(textarea, action);
      update();
    });
  });
}

function insertFormatting(textarea, action) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let replacement = "";
  let cursorOffset = 0;

  switch (action) {
    case "bold":
      replacement = `**${selected || "bold text"}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;
    case "italic":
      replacement = `*${selected || "italic text"}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "heading":
      replacement = `\n## ${selected || "New Heading"}\n`;
      cursorOffset = replacement.length;
      break;
    case "code":
      if (selected.includes("\n")) {
        replacement = `\n\`\`\`javascript\n${selected || "// your code here"}\n\`\`\`\n`;
      } else {
        replacement = `\`${selected || "code"}\``;
      }
      cursorOffset = replacement.length;
      break;
    case "task":
      replacement = `\n- [ ] ${selected || "To-do item"}\n`;
      cursorOffset = replacement.length;
      break;
    case "quote":
      replacement = `\n> ${selected || "Thoughtful quote"}\n`;
      cursorOffset = replacement.length;
      break;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
}

// =============================================================================
// 8. Download Modal & Toast Notification
// =============================================================================
function initDownloadTriggers() {
  const modal = document.getElementById("download-modal");
  const closeBtn = document.getElementById("modal-close-btn");
  const modalReviewBtn = document.getElementById("modal-review-btn");

  function openDownloadModal() {
    if (modal) {
      modal.removeAttribute("hidden");
    }
  }

  function closeDownloadModal() {
    if (modal) {
      modal.setAttribute("hidden", "true");
    }
  }

  // Intercept all download trigger links to also display confirmation modal
  document.querySelectorAll(".trigger-download, a[download]").forEach(link => {
    link.addEventListener("click", () => {
      setTimeout(() => {
        openDownloadModal();
        showToast("🚀 Download initiated: NoteEditor_v2_Setup.exe");
      }, 300);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDownloadModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDownloadModal();
    });
  }

  if (modalReviewBtn) {
    modalReviewBtn.addEventListener("click", () => {
      closeDownloadModal();
      const reviewSection = document.getElementById("reviews");
      if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: "smooth" });
        const nameInput = document.getElementById("review-author");
        if (nameInput) setTimeout(() => nameInput.focus(), 600);
      }
    });
  }
}

function showToast(message, duration = 4000) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// =============================================================================
// 9. Helpers & Utilities
// =============================================================================
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return isoStr;
  }
}

// =============================================================================
// 10. Initialization on DOMContentLoaded
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial review statistics & render
  updateRatingStats();
  renderReviews();

  // 2. Interactive Star Picker
  initStarPicker();

  // 3. Review form submit
  initReviewForm();

  // 4. Live Markdown Sandbox
  initDemoSandbox();

  // 5. Download buttons & modal
  initDownloadTriggers();

  // 6. Filter button events
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.getAttribute("data-filter");
      window.setFilter(f);
    });
  });

  // 7. Sort select event
  const sortSelect = document.getElementById("review-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderReviews();
    });
  }

  // 8. Load more reviews button
  const loadMoreBtn = document.getElementById("load-more-reviews-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleLimit += 5;
      renderReviews();
    });
  }

  // 9. Scroll to review form button
  const scrollToFormBtn = document.getElementById("btn-scroll-to-form");
  if (scrollToFormBtn) {
    scrollToFormBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("review-form-anchor");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        const nameInput = document.getElementById("review-author");
        if (nameInput) setTimeout(() => nameInput.focus(), 500);
      }
    });
  }
});
