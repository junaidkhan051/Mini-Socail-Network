

let posts = [];
let isPublic = true;
let notifCount = 0;

// ── Helper: get a timestamp string ──
function timeAgo() {
    return "Just now";
}

// ── Helper: update the post counter in sidebar ──
function updatePostCount() {
    const el = document.getElementById("postCount");
    if (el) el.textContent = posts.length;
}

// ── Helper: increment notification badge ──
function addNotification() {
    notifCount++;
    const badge = document.getElementById("notifBadge");
    if (badge) {
        badge.textContent = notifCount;
        badge.classList.add("visible");
    }
}

// ── Toggle privacy ──
function togglePrivacy() {
    isPublic = !isPublic;

    const btn = document.getElementById("privacyToggle");
    const status = document.getElementById("privacyStatus");

    if (isPublic) {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
        status.textContent = "Public";
        status.style.color = "var(--green)";
    } else {
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        status.textContent = "Private";
        status.style.color = "var(--text-secondary)";
    }
}

// ── Character counter ──
function updateCharCount() {
    const content = document.getElementById("postContent").value;
    const el = document.getElementById("charCount");
    const len = content.length;
    el.textContent = `${len} / 500`;
    el.classList.remove("warn", "danger");
    if (len >= 450) el.classList.add("danger");
    else if (len >= 380) el.classList.add("warn");
}

// ── Image preview ──
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("imagePreview");
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
        preview.onclick = () => { preview.style.display = "none"; event.target.value = ""; };
    }
}

// ── Keyboard shortcut: Ctrl+Enter to post ──
function handlePostKey(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        createPost();
    }
}

// ── Create a new post ──
function createPost() {
    const contentEl = document.getElementById("postContent");
    const imageInput = document.getElementById("imageUpload");
    const preview = document.getElementById("imagePreview");
    const content = contentEl.value.trim();

    if (!content) {
        contentEl.style.borderColor = "var(--like-color)";
        contentEl.style.boxShadow = "0 0 0 3px rgba(255,107,138,0.2)";
        setTimeout(() => {
            contentEl.style.borderColor = "";
            contentEl.style.boxShadow = "";
        }, 1200);
        return;
    }

    const post = {
        id: Date.now(),
        content,
        likes: 0,
        liked: false,
        comments: [],
        time: timeAgo(),
        image: imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : null,
        showComments: false
    };

    posts.unshift(post);

    // Reset inputs
    contentEl.value = "";
    imageInput.value = "";
    preview.style.display = "none";
    preview.src = "";
    updateCharCount();
    updatePostCount();

    renderFeed();
    addNotification();
}

// ── Like a post ──
function likePost(index) {
    const post = posts[index];
    if (post.liked) {
        post.likes--;
        post.liked = false;
    } else {
        post.likes++;
        post.liked = true;
    }
    renderFeed();
}

// ── Toggle comments panel ──
function toggleComments(index) {
    posts[index].showComments = !posts[index].showComments;
    renderFeed();

    // Auto-focus the comment input
    if (posts[index].showComments) {
        setTimeout(() => {
            const input = document.getElementById(`commentInput-${index}`);
            if (input) input.focus();
        }, 60);
    }
}

// ── Submit a comment (button click or Enter key) ──
function submitComment(index, event) {
    if (event && event.key && event.key !== "Enter") return;
    const input = document.getElementById(`commentInput-${index}`);
    const comment = input ? input.value.trim() : "";
    if (!comment) return;
    posts[index].comments.push(comment);
    input.value = "";
    renderFeed();

    // Keep comments open and scroll to new comment
    posts[index].showComments = true;
}

// ── Render entire feed ──
function renderFeed() {
    const feed = document.getElementById("feed");
    const emptyMsg = document.getElementById("emptyMsg");

    if (emptyMsg) emptyMsg.style.display = posts.length ? "none" : "block";

    // Rebuild DOM
    // Clear existing post cards (keep emptyMsg element)
    Array.from(feed.querySelectorAll(".post")).forEach(el => el.remove());

    posts.forEach((post, index) => {
        const div = document.createElement("div");
        div.classList.add("post");
        div.setAttribute("data-post-id", post.id);

        const commentsHtml = post.comments.map(c => `
            <div class="comment-item">
                <div class="comment-avatar">JK</div>
                <div class="comment-bubble">
                    <div class="comment-author">Junaid Khan</div>
                    ${escapeHtml(c)}
                </div>
            </div>
        `).join("");

        div.innerHTML = `
            <div class="post-header">
                <div class="avatar small">JK</div>
                <div class="post-meta">
                    <div class="post-author">Junaid Khan</div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>

            <p class="post-content-text">${escapeHtml(post.content)}</p>

            ${post.image ? `<img class="post-image" src="${post.image}" alt="Post image">` : ""}

            <div class="post-actions">
                <button class="action-btn ${post.liked ? "liked" : ""}" onclick="likePost(${index})" id="likeBtn-${index}">
                    ${post.liked ? "❤️" : "🤍"} Like <span class="count">${post.likes > 0 ? post.likes : ""}</span>
                </button>
                <button class="action-btn" onclick="toggleComments(${index})">
                    💬 Comment <span class="count">${post.comments.length > 0 ? post.comments.length : ""}</span>
                </button>
            </div>

            <div class="comments-section ${post.showComments ? "open" : ""}">
                ${commentsHtml}
                <div class="comment-input-row">
                    <input
                        id="commentInput-${index}"
                        type="text"
                        placeholder="Write a comment… (Enter to send)"
                        maxlength="300"
                        onkeydown="submitComment(${index}, event)"
                    >
                    <button class="comment-send-btn" onclick="submitComment(${index}, null)">Send</button>
                </div>
            </div>
        `;

        feed.appendChild(div);
    });
}

// ── Sanitise user text before inserting into HTML ──
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
    renderFeed();
});