/**
 * NoteEditor - Frontend Logic & Interactive Engine (ភាសាខ្មែរ / Khmer Localization)
 * គ្រប់គ្រងការវាយតម្លៃ ពិន្ទុ មតិយោបល់ ផ្ទាំងសាកល្បង Markdown និងការទាញយក
 */

// =============================================================================
// 1. Initial Community Seed Reviews (មតិយោបល់គំរូជាភាសាខ្មែរ)
// =============================================================================
const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    author: "សុខ ចាន់ដារ៉ា",
    role: "Senior Frontend Engineer",
    avatarBg: "linear-gradient(135deg, #10b981, #06b6d4)",
    rating: 5,
    title: "ទីបំផុត បានជួបកម្មវិធីកត់ត្រាលើ Windows ដ៏លឿន និងមិនស៊ី RAM ច្រើន!",
    comment: "ខ្ញុំបានស្វែងរកកម្មវិធីកត់ត្រា Markdown ស្រាលៗជាយូរមកហើយ។ NoteEditor បើកដំណើរការលឿនដូចផ្លេកបន្ទោរ ហើយផ្ទាំង Preview ជាមួយ Syntax Highlighting គឺរលូនខ្លាំងណាស់។ Dark Mode មើលទៅស្រស់ស្អាត ស័ក្តិសមឥតខ្ចោះជាមួយ Windows 11។",
    tags: ["លឿនរហ័ស", "ផ្ទាំងងងឹតស្អាត", "Markdown ល្អឥតខ្ចោះ"],
    date: "2026-10-02",
    helpfulCount: 42,
    verified: true
  },
  {
    id: "rev-2",
    author: "គង់ ពិសិដ្ឋ",
    role: "Technical Writer & Creator",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    rating: 5,
    title: "ជំនួសកម្មវិធីសរសេរចាស់ៗដ៏ធ្ងន់ៗទាំងអស់បានយ៉ាងល្អ",
    comment: "បរិយាកាសការងារដែលគ្មានការរំខានពិតជាអស្ចារ្យណាស់។ ខ្ញុំសរសេរឯកសាររាប់សិបទំព័រនៅទីនេះដោយមិនមានការគាំងទាល់តែសោះ។ ប្រព័ន្ធ Auto-save ជួយសង្គ្រោះឯកសារខ្ញុំបានច្រើនដង។ ហើយអ្វីដែលពិសេសគឺឥតគិតថ្លៃ ១០០% គ្មានការទារលុយប្រចាំខែឡើយ។",
    tags: ["ឥតគិតថ្លៃ ១០០%", "Markdown ល្អឥតខ្ចោះ", "ទំហំស្រាល (40MB)"],
    date: "2026-09-28",
    helpfulCount: 31,
    verified: true
  },
  {
    id: "rev-3",
    author: "ជា ស្រីមុំ",
    role: "និស្សិតវិទ្យាសាស្ត្រកុំព្យូទ័រ",
    avatarBg: "linear-gradient(135deg, #f59e0b, #ef4444)",
    rating: 5,
    title: "ល្អបំផុតសម្រាប់ការកត់ត្រាមេរៀនសាកលវិទ្យាល័យ និងកូដរហ័ស",
    comment: "ខ្ញុំចូលចិត្តការរក្សាទុកឯកសារជាទម្រង់ .md នៅលើកុំព្យូទ័រផ្ទាល់ដោយមិនចាំបាច់មានអ៊ីនធឺណិត។ រូបមន្តគណិតវិទ្យា និងការបង្ហាញពណ៌កូដជួយដល់ការរៀនមុខវិជ្ជាបច្ចេកវិទ្យាច្រើនណាស់។",
    tags: ["លឿនរហ័ស", "ផ្ទាំងងងឹតស្អាត", "ឥតគិតថ្លៃ ១០០%"],
    date: "2026-09-25",
    helpfulCount: 19,
    verified: true
  },
  {
    id: "rev-4",
    author: "វ៉ាន់ សុភ័ក្ត្រ",
    role: "Product Designer",
    avatarBg: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    rating: 5,
    title: "ការរចនាម៉ូតស្រស់ស្អាត ទំនើប និងមិនរំខានភ្នែក",
    comment: "ពុម្ពអក្សរ និងចន្លោះឃ្លាមានតុល្យភាពល្អ។ ផ្លូវកាត់ក្តារចុច (Shortcuts) ងាយស្រួលប្រើ ហើយមាន Checklists ស្រាប់ក្នុងចំណាំ ធ្វើឱ្យការរៀបចំកិច្ចការប្រចាំថ្ងៃកាន់តែងាយស្រួល។",
    tags: ["ផ្ទាំងងងឹតស្អាត", "Markdown ល្អឥតខ្ចោះ"],
    date: "2026-09-19",
    helpfulCount: 15,
    verified: true
  },
  {
    id: "rev-5",
    author: "ហេង វិសាល",
    role: "DevOps Engineer",
    avatarBg: "linear-gradient(135deg, #10b981, #3b82f6)",
    rating: 4,
    title: "ឧបករណ៍ដ៏អស្ចារ្យសម្រាប់កត់ត្រារហ័ស និងកែសម្រួល Config YAML",
    comment: "លឿនមែនទែន ហើយស៊ី RAM តិចបំផុតក្នុង Task Manager (ក្រោម 60MB)។ ជួយការងាររៀបចំម៉ាស៊ីន server បានយ៉ាងរហ័ស និងងាយស្រួល។",
    tags: ["ទំហំស្រាល (40MB)", "លឿនរហ័ស"],
    date: "2026-09-14",
    helpfulCount: 8,
    verified: true
  },
  {
    id: "rev-6",
    author: "ម៉េង ស្រីលក្ខណ៍",
    role: "Fullstack Web Developer",
    avatarBg: "linear-gradient(135deg, #ec4899, #f59e0b)",
    rating: 5,
    title: "ការរក្សាទិន្នន័យក្នុងម៉ាស៊ីន (Offline-first) គឺជាអ្វីដែលខ្ញុំចង់បានបំផុត",
    comment: "មិនបាច់ Login មិនបាច់បង់ប្រាក់ថ្លៃ AI មិនបាច់ភ័យខ្លាចគេលួចតាមដានទិន្នន័យ។ គ្រាន់តែទាញយក Install ៥ វិនាទី ហើយប្រើបានភ្លាមៗ។ អរគុណក្រុមការងារដែលបង្កើតកម្មវិធីនេះឡើង!",
    tags: ["ឥតគិតថ្លៃ ១០០%", "លឿនរហ័ស", "ផ្ទាំងងងឹតស្អាត"],
    date: "2026-09-08",
    helpfulCount: 27,
    verified: true
  }
];

// =============================================================================
// 2. State & Storage Management
// =============================================================================
const STORAGE_KEY_REVIEWS = "noteeditor_user_reviews_km_v2";
const STORAGE_KEY_UPVOTES = "noteeditor_upvoted_ids_km_v2";

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
    const saved = localStorage.getItem(STORAGE_KEY_UPVOTES);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function markReviewUpvoted(id) {
  try {
    const upvoted = getUpvotedIds();
    if (!upvoted.includes(id)) {
      upvoted.push(id);
      localStorage.setItem(STORAGE_KEY_UPVOTES, JSON.stringify(upvoted));
    }
  } catch (e) {
    console.error(e);
  }
}

let currentReviews = loadReviews();
let currentFilter = "all";
let currentSort = "newest";
let visibleLimit = 5;

// =============================================================================
// 3. Dynamic Rating Statistics & Breakdown
// =============================================================================
function updateRatingStats() {
  const total = currentReviews.length;
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  currentReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    counts[star] = (counts[star] || 0) + 1;
    sum += star;
  });

  const avg = total > 0 ? (sum / total).toFixed(1) : "5.0";

  // Display elements
  const avgBigEl = document.getElementById("avg-rating-display");
  const avgStarsEl = document.getElementById("avg-stars-display");
  const totalCountEl = document.getElementById("total-reviews-count");

  if (avgBigEl) avgBigEl.textContent = avg;
  if (avgStarsEl) {
    const roundedAvg = Math.round(parseFloat(avg));
    avgStarsEl.textContent = "★".repeat(roundedAvg) + "☆".repeat(5 - roundedAvg);
  }
  if (totalCountEl) {
    totalCountEl.textContent = `ផ្អែកលើការវាយតម្លៃពិតប្រាកដចំនួន ${total}`;
  }

  // Update breakdown bars
  for (let i = 1; i <= 5; i++) {
    const bar = document.getElementById(`bar-${i}`);
    const countLabel = document.getElementById(`count-${i}`);
    const percent = total > 0 ? ((counts[i] / total) * 100).toFixed(1) : 0;

    if (bar) bar.style.width = `${percent}%`;
    if (countLabel) countLabel.textContent = counts[i];
  }

  // Update filter pill counts
  const filterCountAll = document.getElementById("filter-count-all");
  const filterCount5 = document.getElementById("filter-count-5");
  const filterCount4 = document.getElementById("filter-count-4");
  const filterCount3 = document.getElementById("filter-count-3");

  if (filterCountAll) filterCountAll.textContent = total;
  if (filterCount5) filterCount5.textContent = counts[5];
  if (filterCount4) filterCount4.textContent = counts[4];
  if (filterCount3) filterCount3.textContent = counts[1] + counts[2] + counts[3];
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
        <p style="color: var(--text-secondary); margin-bottom: 12px;">មិនមានមតិយោបល់ត្រូវនឹងតម្រងនេះទេ។</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="setFilter('all')">បង្ហាញមតិយោបល់ទាំងអស់</button>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

  container.innerHTML = toDisplay.map(r => {
    const isNew = r.id === highlightId ? "is-newly-added" : "";
    const isUpvoted = upvotedIds.includes(r.id);
    const starString = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const initials = r.author ? r.author.trim().substring(0, 2) : "អ្នក";

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
                <span class="badge-verified-user" title="បានផ្ទៀងផ្ទាត់ការដំឡើង NoteEditor">
                  ✓ អ្នកប្រើប្រាស់ពិតប្រាកដ
                </span>
              </div>
              <span class="reviewer-role-text">${escapeHtml(r.role || "អ្នកប្រើប្រាស់ Windows")}</span>
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
                  onclick="handleUpvote('${r.id}')" aria-label="គាំទ្រថាមានប្រយោជន៍">
            <span>👍 មានប្រយោជន៍</span>
            <span class="helpful-count">(${r.helpfulCount || 0})</span>
          </button>
          <span class="download-ref">NoteEditor v2.0 សម្រាប់ Windows</span>
        </div>
      </article>
    `;
  }).join("");

  if (loadMoreBtn) {
    if (filtered.length > visibleLimit) {
      loadMoreBtn.style.display = "inline-block";
      loadMoreBtn.textContent = `បង្ហាញមតិយោបល់បន្ថែម (${filtered.length - visibleLimit} ទៀត)`;
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
    showToast("អ្នកបានបោះឆ្នោតគាំទ្រការវាយតម្លៃនេះរួចហើយ!");
    return;
  }

  const review = currentReviews.find(r => r.id === reviewId);
  if (review) {
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    markReviewUpvoted(reviewId);
    saveReviews(currentReviews);
    renderReviews();
    showToast("សូមអរគុណសម្រាប់ការបោះឆ្នោតគាំទ្រ! 👍");
  }
};

// =============================================================================
// 5. Interactive Star Rating Selector in Review Form
// =============================================================================
const STAR_FEEDBACK_LABELS = {
  1: "១ / ៥ - ត្រូវការការកែលម្អច្រើន",
  2: "២ / ៥ - ធម្មតា មានកម្រិតមួយចំនួន",
  3: "៣ / ៥ - ល្អ បំពេញតម្រូវការមូលដ្ឋាន",
  4: "៤ / ៥ - ល្អណាស់! ដំណើរការលឿន និងរលូន",
  5: "៥ / ៥ - ល្អឥតខ្ចោះ & ណែនាំយ៉ាងខ្លាំង!"
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
    feedbackEl.textContent = STAR_FEEDBACK_LABELS[rating] || `${rating} / 5`;
  }

  starBtns.forEach(btn => {
    // Hover highlight
    btn.addEventListener("mouseenter", () => {
      const hoverVal = parseInt(btn.getAttribute("data-val"), 10);
      starBtns.forEach(b => {
        const v = parseInt(b.getAttribute("data-val"), 10);
        b.classList.toggle("hovered", v <= hoverVal);
      });
    });

    // Click select
    btn.addEventListener("click", () => {
      const val = parseInt(btn.getAttribute("data-val"), 10);
      hiddenInput.value = val;
      updateVisuals(val);
    });
  });

  picker.addEventListener("mouseleave", () => {
    starBtns.forEach(b => b.classList.remove("hovered"));
    const currentVal = parseInt(hiddenInput.value || "5", 10);
    updateVisuals(currentVal);
  });

  // Initial set
  updateVisuals(parseInt(hiddenInput.value || "5", 10));
}

// =============================================================================
// 6. Review Form Submission & Real-Time Publishing
// =============================================================================
function initReviewForm() {
  const form = document.getElementById("new-review-form");
  const authorInput = document.getElementById("review-author");
  const roleInput = document.getElementById("review-role");
  const titleInput = document.getElementById("review-title");
  const commentTextarea = document.getElementById("review-comment");
  const charsLeftSpan = document.getElementById("comment-chars-left");

  if (!form || !commentTextarea) return;

  // Character counter
  commentTextarea.addEventListener("input", () => {
    const left = 1500 - commentTextarea.value.length;
    if (charsLeftSpan) {
      charsLeftSpan.textContent = left;
      charsLeftSpan.style.color = left < 50 ? "var(--accent-rose)" : "var(--text-muted)";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset error messages
    document.querySelectorAll(".form-error-msg").forEach(el => el.classList.remove("visible"));
    document.querySelectorAll(".form-input, .form-textarea").forEach(el => el.classList.remove("input-error"));

    // Validate Author
    if (!authorInput.value.trim()) {
      document.getElementById("name-error-msg")?.classList.add("visible");
      authorInput.classList.add("input-error");
      isValid = false;
    }

    // Validate Title
    if (!titleInput.value.trim()) {
      document.getElementById("title-error-msg")?.classList.add("visible");
      titleInput.classList.add("input-error");
      isValid = false;
    }

    // Validate Comment
    if (commentTextarea.value.trim().length < 10) {
      document.getElementById("comment-error-msg")?.classList.add("visible");
      commentTextarea.classList.add("input-error");
      isValid = false;
    }

    if (!isValid) return;

    // Selected Tags
    const checkedTags = Array.from(form.querySelectorAll("input[name='tag']:checked")).map(cb => cb.value);

    // Selected Rating
    const ratingVal = parseInt(document.getElementById("form-rating-val").value || "5", 10);

    // Generate colorful avatar background
    const avatarGradients = [
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #8b5cf6, #ec4899)",
      "linear-gradient(135deg, #f59e0b, #ef4444)",
      "linear-gradient(135deg, #06b6d4, #3b82f6)",
      "linear-gradient(135deg, #ec4899, #f59e0b)"
    ];
    const randomGradient = avatarGradients[Math.floor(Math.random() * avatarGradients.length)];

    const newReview = {
      id: "rev-" + Date.now(),
      author: authorInput.value.trim(),
      role: roleInput.value.trim() || "អ្នកប្រើប្រាស់ Windows",
      avatarBg: randomGradient,
      rating: ratingVal,
      title: titleInput.value.trim(),
      comment: commentTextarea.value.trim(),
      tags: checkedTags.length > 0 ? checkedTags : ["អ្នកប្រើប្រាស់ពិតប្រាកដ"],
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

    showToast("🎉 សូមអរគុណ! ការវាយតម្លៃ និងមតិយោបល់របស់អ្នកត្រូវបានផ្សព្វផ្សាយ។");

    // Scroll smoothly to newly inserted review
    const newEl = document.getElementById(newReview.id);
    if (newEl) {
      newEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

// =============================================================================
// 7. Interactive Live Markdown Sandbox (ជាភាសាខ្មែរ)
// =============================================================================
const SAMPLE_MARKDOWN = `# សូមស្វាគមន៍មកកាន់ NoteEditor v2.0 🚀

NoteEditor ត្រូវបានបង្កើតឡើងដើម្បី **ល្បឿនលឿន**, **ភាពងាយស្រួល**, និង **ភាពសាមញ្ញ**។

## លក្ខណៈពិសេសចម្បងៗ
- [x] បើកដំណើរការលឿនដូចផ្លេកបន្ទោរ (< 15ms)
- [x] រក្សាទុកឯកសារនៅលើកុំព្យូទ័រ Windows របស់អ្នកផ្ទាល់
- [x] គ្មានការបង់ប្រាក់ប្រចាំខែ និងគ្មានការលួចតាមដានទិន្នន័យ
- [ ] សាកល្បងសរសេរ Markdown ផ្ទាល់ក្នុងប្រអប់នេះ!

### ឧទាហរណ៍កូដ (Code Block)
\`\`\`javascript
function saveKhmerNote(title, content) {
  console.log("កំពុងរក្សាទុកឯកសារ:", title);
  return { id: Date.now(), title, content, date: new Date() };
}
\`\`\`

> "ភាពសាមញ្ញគឺជាមូលដ្ឋានគ្រឹះនៃភាពជឿជាក់។" — Edsger W. Dijkstra

អ្នកអាចកែសម្រួលអត្ថបទនេះ ឬចុចលើប៊ូតុងខាងលើដើម្បីសាកល្បង!`;

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

    if (wordCount) wordCount.textContent = `${words} ពាក្យ`;
    if (charCount) charCount.textContent = `${chars} តួអក្សរ`;
  }

  // Populate sample
  textarea.value = SAMPLE_MARKDOWN;
  update();

  textarea.addEventListener("input", update);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      textarea.value = SAMPLE_MARKDOWN;
      update();
      showToast("បានកំណត់គំរូសាកល្បងឡើងវិញ!");
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
      replacement = `**${selected || "អក្សរដិត"}**`;
      cursorOffset = selected ? replacement.length : 2;
      break;
    case "italic":
      replacement = `*${selected || "អក្សរទ្រេត"}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case "heading":
      replacement = `\n## ${selected || "ចំណងជើងថ្មី"}\n`;
      cursorOffset = replacement.length;
      break;
    case "code":
      if (selected.includes("\n")) {
        replacement = `\n\`\`\`javascript\n${selected || "// កូដរបស់អ្នកនៅទីនេះ"}\n\`\`\`\n`;
      } else {
        replacement = `\`${selected || "code"}\``;
      }
      cursorOffset = replacement.length;
      break;
    case "task":
      replacement = `\n- [ ] ${selected || "កិច្ចការត្រូវធ្វើ"}\n`;
      cursorOffset = replacement.length;
      break;
    case "quote":
      replacement = `\n> ${selected || "សម្រង់សម្តីដ៏មានអត្ថន័យ"}\n`;
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
        showToast("🚀 កំពុងចាប់ផ្តើមទាញយក: NoteEditor_v2_Setup.exe");
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
    return d.toLocaleDateString("km-KH", { year: "numeric", month: "short", day: "numeric" });
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
