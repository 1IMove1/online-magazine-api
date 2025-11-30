const API_URL = "http://localhost:3000/api";
let token = localStorage.getItem("token");
let currentUserId = null;

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const articleForm = document.getElementById("articleForm");
const articlesList = document.getElementById("articlesList");
const authSection = document.getElementById("auth-section");
const contentSection = document.getElementById("content-section");
const resendConfirmationForm = document.getElementById("resendConfirmationForm");
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfileModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const profileForm = document.getElementById("profileForm");
const cancelProfileEdit = document.getElementById("cancelProfileEdit");
const userAvatar = document.getElementById("userAvatar");

let currentProfileName = "";

const serverRoot = API_URL.replace(/\/api\/?$/, "");

function updateAvatar(avatarUrl, name) {
  if (!userAvatar) return;
  if (avatarUrl) {
    const imgUrl = "http://localhost:3000" + avatarUrl;
    userAvatar.style.cursor = "pointer";
    userAvatar.innerHTML = `<a href="${imgUrl}" target="_blank" style="display: block; width: 100%; height: 100%;"><img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="console.log('Image failed to load')"></a>`;
  } else {
    userAvatar.innerHTML = "";
    userAvatar.style.cursor = "default";
    userAvatar.textContent = name ? name.charAt(0).toUpperCase() : "?";
  }
}

async function loadUserProfile() {
  try {
    if (!token) return;
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const profileNameEl = document.getElementById("profileName");
      const name = data.name || "";
      if (profileNameEl) profileNameEl.value = name;
      updateAvatar(data.avatar, name);
    }
  } catch (error) {
    console.log(error.message);
  }
}

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    if (editProfileModal) editProfileModal.style.display = "block";
    if (modalBackdrop) modalBackdrop.style.display = "block";
    loadUserProfile();
  });
}

if (cancelProfileEdit) {
  cancelProfileEdit.addEventListener("click", () => {
    if (editProfileModal) editProfileModal.style.display = "none";
    if (modalBackdrop) modalBackdrop.style.display = "none";
    if (profileForm) profileForm.reset();
  });
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", () => {
    if (editProfileModal) editProfileModal.style.display = "none";
    modalBackdrop.style.display = "none";
    if (profileForm) profileForm.reset();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const nameEl = document.getElementById("profileName");
    const avatarEl = document.getElementById("profileAvatar");
    const name = nameEl ? nameEl.value : null;
    const avatar = avatarEl && avatarEl.files ? avatarEl.files[0] : null;

    if (name) formData.append("name", name);
    if (avatar) formData.append("avatar", avatar);

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        if (editProfileModal) editProfileModal.style.display = "none";
        if (modalBackdrop) modalBackdrop.style.display = "none";
        loadUserProfile();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  });
}
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("name", document.getElementById("regName").value);
  formData.append("email", document.getElementById("regEmail").value);
  formData.append("password", document.getElementById("regPassword").value);
  const avatar = document.getElementById("avatar").files[0];
  if (avatar) formData.append("avatar", avatar);

  try {
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      registerForm.reset();
    } else {
      const data = await response.json();
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value,
      }),
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      token = data.token;
      localStorage.setItem("token", token);
      const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      currentUserId = userData._id;
      loginForm.reset();
      authSection.style.display = "none";
      contentSection.style.display = "block";
      loadArticles();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
});

const newArticleBtn = document.getElementById("newArticleBtn");
const articleFormContainer = document.getElementById("articleFormContainer");
const cancelArticleBtn = document.getElementById("cancelArticle");
const showPublishedOnly = document.getElementById("showPublishedOnly");
const hideOwnArticles = document.getElementById("hideOwnArticles");
let isEditing = false;
let editingId = null;
let allArticles = [];

function filterAndDisplayArticles() {
  let filteredArticles = [...allArticles];

  if (showPublishedOnly.checked) {
    filteredArticles = filteredArticles.filter((article) => article.published === true);
  }

  if (hideOwnArticles.checked) {
    filteredArticles = filteredArticles.filter((article) => !article.isOwner);
  }

  const articlesContainer = document.querySelector(".articles-container");

  if (filteredArticles && filteredArticles.length > 0) {
    articlesContainer.innerHTML = filteredArticles
      .map(
        (article) => `
            <div class="article">
                <h3>${article.title}</h3>
                <br />
                <p style="white-space: pre-wrap;">${article.content}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <div>
                        ${
                          article.isOwner
                            ? `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div class="article-buttons" style="display: flex; align-items: center; gap: 8px;">
                                    <button data-id="${article._id}" class="edit-btn">Edit</button>
                                    <button data-id="${article._id}" class="delete-btn">Delete</button>
                                </div>
                                <span class="article-status ${article.published ? "published" : "draft"}" style="display: inline-flex; align-items: center;">
                                    Status: ${article.published ? "Published" : "Draft"}
                                </span>
                            </div>
                            `
                            : `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; display: flex; justify-content: center; align-items: center; background-color: #f0f0f0;">
                                    ${article.author.avatar ? `<img src="http://localhost:3000${article.author.avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.textContent='${article.author.name ? article.author.name.charAt(0).toUpperCase() : "?"}'">` : `<span style="font-size: 12px;">${article.author.name ? article.author.name.charAt(0).toUpperCase() : "?"}</span>`}
                                </div>
                                <p style="color: #666; font-size: 0.9em;">By: ${article.author.name || "Unknown"}</p>
                            </div>
                            `
                        }
                    </div>
                    <p style="color: #666; font-size: 0.9em;">
                        ${new Date(article.updatedAt).toLocaleString()}
                    </p>
                </div>
            </div>
        `
      )
      .join("");
  } else {
    articlesContainer.innerHTML = "<p>No articles found matching the current filters.</p>";
  }

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      editArticle(btn.dataset.id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      deleteArticle(btn.dataset.id);
    });
  });
}

newArticleBtn.addEventListener("click", () => {
  articleFormContainer.style.display = "block";
  articleForm.reset();
  isEditing = false;
  editingId = null;
  document.getElementById("submitArticle").textContent = "Create Article";
});

cancelArticleBtn.addEventListener("click", () => {
  articleFormContainer.style.display = "none";
  articleForm.reset();
});

showPublishedOnly.addEventListener("change", filterAndDisplayArticles);
hideOwnArticles.addEventListener("change", filterAndDisplayArticles);

articleForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const articleData = {
      title: document.getElementById("articleTitle").value,
      content: document.getElementById("articleContent").value,
      published: document.getElementById("articlePublished").checked,
    };

    const url = isEditing ? `${API_URL}/articles/${editingId}` : `${API_URL}/articles`;

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(articleData),
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      articleForm.reset();
      articleFormContainer.style.display = "none";
      loadArticles();
    } else {
      const data = await response.json();
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
});

resendConfirmationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("resendEmail").value;

  try {
    const response = await fetch(`${API_URL}/auth/resend-confirmation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      resendConfirmationForm.reset();
    } else {
      const data = await response.json();
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
});

async function loadArticles() {
  try {
    const response = await fetch(`${API_URL}/articles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    allArticles = await response.json();
    filterAndDisplayArticles();
  } catch (error) {
    console.log(error.message);
  }
}

async function editArticle(id) {
  try {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const article = await response.json();
    console.log(article);
    if (response.ok) {
      document.getElementById("articleTitle").value = article.title;
      document.getElementById("articleContent").value = article.content;
      document.getElementById("articlePublished").checked = article.published;

      articleFormContainer.style.display = "block";
      document.getElementById("submitArticle").textContent = "Update Article";
      isEditing = true;
      editingId = id;
    } else {
      const data = await response.json();
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
}

async function deleteArticle(id) {
  if (!confirm("Are you sure you want to delete this article?")) return;

  try {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      loadArticles();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.log(error.message);
  }
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    token = null;

    if (articleForm) articleForm.reset();
    if (loginForm) loginForm.reset();

    if (contentSection) contentSection.style.display = "none";
    if (authSection) authSection.style.display = "flex";
  });
}

if (token) {
  if (authSection) authSection.style.display = "none";
  if (contentSection) contentSection.style.display = "block";
  loadUserProfile();
  loadArticles();
}
