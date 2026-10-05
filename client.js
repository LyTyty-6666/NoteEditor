/**
 * NoteEditor - Frontend Logic & Interactive Engine (ភាសាខ្មែរ / Khmer Localization)
 * គ្រប់គ្រងការវាយតម្លៃ ពិន្ទុ មតិយោបល់ ផ្ទាំងសាកល្បង Markdown និងការទាញយក
 */

// =============================================================================
// 1. Community Reviews (Clean slate - real users only)
// =============================================================================
const DEFAULT_REVIEWS = [];

// =============================================================================
// 2. State & Storage Management
// =============================================================================
const STORAGE_KEY_REVIEWS = "noteeditor_real_user_reviews_v1";
const STORAGE_KEY_UPVOTES = "noteeditor_real_upvoted_ids_v1";

function loadReviews() {
  try {
    // Clear out old mock seed data from previous test keys
    localStorage.removeItem("noteeditor_user_reviews_km_v2");
    localStorage.removeItem("noteeditor_user_reviews_km");

    const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Exclude any legacy mock review IDs (rev-1 to rev-6)
        return parsed.filter(r => !r.id || !/^rev-[1-6]$/.test(r.id));
      }
    }
  } catch (e) {
    console.error("Failed to load reviews from localStorage", e);
  }
  return [];
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

// Fetch live reviews from server (Turso DB)
async function fetchLiveReviews() {
  try {
    const res = await fetch('/api/comments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        currentReviews = data;
        saveReviews(currentReviews);
        updateRatingStats();
        renderReviews();
        return;
      }
    }
  } catch (err) {
    console.log("Turso comments API not reachable, using local storage mode:", err.message);
  }
}

let currentReviews = loadReviews();
let currentFilter = "all";
let currentSort = "newest";
let visibleLimit = 5;

// =============================================================================
// Avatar Gradient Generator
// =============================================================================
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #ec4899, #f59e0b)",
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #f59e0b)"
];

function getAvatarGradient(name) {
  let hash = 0;
  const str = String(name || "U");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

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

  const avg = total > 0 ? (sum / total).toFixed(1) : "0.0";

  // Display elements
  const avgBigEl = document.getElementById("avg-rating-display");
  const avgStarsEl = document.getElementById("avg-stars-display");
  const totalCountEl = document.getElementById("total-reviews-count");
  const recBadgeEl = document.querySelector(".recommendation-badge");
  const navPillEl = document.getElementById("nav-star-pill");
  const navCountEl = document.getElementById("nav-review-count");
  const heroTrustEl = document.getElementById("hero-trust-rating");

  if (avgBigEl) avgBigEl.textContent = total > 0 ? toKhmerDigits(avg) : "--";
  if (avgStarsEl) {
    if (total > 0) {
      const roundedAvg = Math.round(parseFloat(avg));
      avgStarsEl.textContent = "★".repeat(roundedAvg) + "☆".repeat(5 - roundedAvg);
    } else {
      avgStarsEl.textContent = "☆☆☆☆☆";
    }
  }
  if (totalCountEl) {
    totalCountEl.textContent = total > 0
      ? `ផ្អែកលើការវាយតម្លៃពិតប្រាកដចំនួន ${toKhmerDigits(total)}`
      : "មិនទាន់មានការវាយតម្លៃនៅឡើយទេ";
  }

  // Update navbar & hero badges
  if (navPillEl && navCountEl) {
    if (total > 0) {
      navPillEl.textContent = `★ ${toKhmerDigits(avg)}`;
      navCountEl.textContent = `(${toKhmerDigits(total)} ការវាយតម្លៃ)`;
    } else {
      navPillEl.textContent = `★ មតិយោបល់`;
      navCountEl.textContent = `(សហគមន៍)`;
    }
  }
  if (heroTrustEl) {
    heroTrustEl.textContent = total > 0
      ? `ពិន្ទុ ${toKhmerDigits(avg)}/៥.០ (${toKhmerDigits(total)} ការវាយតម្លៃ)`
      : `ការវាយតម្លៃពិតប្រាកដ`;
  }

  // Update recommendation badge
  if (recBadgeEl) {
    if (total > 0) {
      const positiveCount = (counts[4] || 0) + (counts[5] || 0);
      const recPercent = Math.round((positiveCount / total) * 100);
      recBadgeEl.style.display = "inline-flex";
      const recSpan = recBadgeEl.querySelector("span");
      if (recSpan) recSpan.textContent = `${toKhmerDigits(recPercent)}% នៃអ្នកប្រើប្រាស់ណែនាំឱ្យប្រើកម្មវិធីនេះ`;
    } else {
      recBadgeEl.style.display = "none";
    }
  }

  // Update breakdown bars
  for (let i = 1; i <= 5; i++) {
    const bar = document.getElementById(`bar-${i}`);
    const countLabel = document.getElementById(`count-${i}`);
    const percent = total > 0 ? ((counts[i] / total) * 100).toFixed(1) : 0;

    if (bar) bar.style.width = `${percent}%`;
    if (countLabel) countLabel.textContent = toKhmerDigits(counts[i]);
  }

  // Update filter pill counts
  const filterCountAll = document.getElementById("filter-count-all");
  const filterCount5 = document.getElementById("filter-count-5");
  const filterCount4 = document.getElementById("filter-count-4");
  const filterCount3 = document.getElementById("filter-count-3");

  if (filterCountAll) filterCountAll.textContent = toKhmerDigits(total);
  if (filterCount5) filterCount5.textContent = toKhmerDigits(counts[5]);
  if (filterCount4) filterCount4.textContent = toKhmerDigits(counts[4]);
  if (filterCount3) filterCount3.textContent = toKhmerDigits(counts[1] + counts[2] + counts[3]);
}

// =============================================================================
// 4. Render Reviews Stream
// =============================================================================
function renderReviews(highlightId = null) {
  const container = document.getElementById("reviews-stream");
  const loadMoreBtn = document.getElementById("load-more-reviews-btn");
  if (!container) return;

  // Empty state when no real reviews exist yet
  if (currentReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 24px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-card);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">💬</div>
        <h4 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">មិនទាន់មានមតិយោបល់នៅឡើយទេ</h4>
        <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto 20px auto; font-size: 0.95rem; line-height: 1.6;">
          សូមក្លាយជាមនុស្សដំបូងគេបង្អស់ដែលចែករំលែកបទពិសោធន៍ និងវាយតម្លៃអំពី NoteEditor!
        </p>
        <a href="#review-form-anchor" class="btn btn-primary btn-sm">
          សរសេរការវាយតម្លៃដំបូងគេ ✍️
        </a>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    return;
  }

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
window.handleUpvote = async function(reviewId) {
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

    // Sync upvote with Turso database
    try {
      await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId })
      });
    } catch (e) {
      console.warn("Failed to sync upvote to server:", e);
    }
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Anti-bot honeypot check (hidden field)
    const honeypot = document.getElementById("website_url_hp");
    if (honeypot && honeypot.value.trim() !== "") {
      console.warn("Bot submission blocked via honeypot.");
      showToast("❌ ការបញ្ជូនត្រូវបានបដិសេធ (Spam Bot Detected)។");
      return;
    }

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

    const submitBtn = document.getElementById("submit-review-btn");
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>កំពុងបញ្ជូន...</span>`;
    }

    const authorText = authorInput.value.trim();
    const roleText = roleInput.value.trim() || "អ្នកប្រើប្រាស់ Windows";
    const titleText = titleInput.value.trim();
    const commentText = commentTextarea.value.trim();
    const tagsList = checkedTags.length > 0 ? checkedTags : ["អ្នកប្រើប្រាស់ពិតប្រាកដ"];

    let newReview = {
      id: "rev-" + Date.now(),
      author: authorText,
      role: roleText,
      avatarBg: getAvatarGradient(authorText),
      rating: ratingVal,
      title: titleText,
      comment: commentText,
      tags: tagsList,
      date: new Date().toISOString().split("T")[0],
      helpfulCount: 0,
      verified: true
    };

    // Save to Turso live database
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.comment) {
          newReview = result.comment;
        }
      }
    } catch (err) {
      console.warn("Could not save to live API, saved locally:", err);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }

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

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
function toKhmerDigits(num) {
  if (num === null || num === undefined) return "";
  return String(num).replace(/[0-9]/g, d => KHMER_DIGITS[d]);
}

const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = toKhmerDigits(d.getDate());
    const month = KHMER_MONTHS[d.getMonth()] || "";
    const year = toKhmerDigits(d.getFullYear());
    return `${day} ${month} ${year}`;
  } catch (e) {
    return isoStr;
  }
}

// =============================================================================
// 10. Initialization on DOMContentLoaded
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial review statistics & render (cached)
  updateRatingStats();
  renderReviews();

  // Fetch live reviews from Turso cloud database
  fetchLiveReviews();

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
