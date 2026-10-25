function getStoredProfileData() {
  try {
    const name = window.localStorage.getItem("bwetvProfileName") || "";
    const image = window.localStorage.getItem("bwetvProfileImage") || "";
    return { name: name.trim(), image };
  } catch (error) {
    return { name: "", image: "" };
  }
}

function saveStoredProfileData({ name = "", image = "" }) {
  try {
    if (name) {
      window.localStorage.setItem("bwetvProfileName", name);
    } else {
      window.localStorage.removeItem("bwetvProfileName");
    }
    if (image) {
      window.localStorage.setItem("bwetvProfileImage", image);
    } else {
      window.localStorage.removeItem("bwetvProfileImage");
    }
  } catch (error) {
    // Ignore storage failures.
  }
}

async function hydrateProfileFromFirestore(user) {
  const services = getFirebaseServices();
  if (!user || !services || !services.db) {
    return getStoredProfileData();
  }

  try {
    const snapshot = await services.db.collection("profiles").doc(user.uid).get();
    const data = snapshot.data() || {};
    const name = String(data.displayName || data.name || "").trim();
    const image = String(data.avatar || data.image || "").trim();
    saveStoredProfileData({ name, image });
    return { name, image };
  } catch (error) {
    return getStoredProfileData();
  }
}

async function syncProfileToFirestore(user, profileOverrides = {}) {
  const services = getFirebaseServices();
  if (!user || !services || !services.db) {
    return getStoredProfileData();
  }

  const saved = getStoredProfileData();
  const nextProfile = {
    name: profileOverrides.name ?? saved.name ?? getDisplayName(user),
    image: profileOverrides.image ?? saved.image ?? ""
  };

  const serverTimestamp = window.firebase?.firestore?.FieldValue?.serverTimestamp;
  const payload = {
    displayName: nextProfile.name,
    avatar: nextProfile.image,
    updatedAt: typeof serverTimestamp === "function" ? serverTimestamp() : Date.now()
  };

  try {
    await services.db.collection("profiles").doc(user.uid).set(payload, { merge: true });
    saveStoredProfileData(nextProfile);
  } catch (error) {
    saveStoredProfileData(nextProfile);
  }

  return nextProfile;
}

function getProfileDisplayName(user) {
  const customName = getStoredProfileData().name;
  if (customName) {
    return customName;
  }
  return getDisplayName(user);
}

function getDefaultProfileImage() {
  return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23e5e7eb'/%3E%3Ccircle cx='60' cy='45' r='24' fill='%236b7280'/%3E%3Cpath d='M30 100c5-18 21-28 30-28s25 10 30 28' fill='%236b7280'/%3E%3C/svg%3E";
}

function applyProfileAppearance(user) {
  const profileNameInput = document.getElementById("profileNameInput");
  const profilePreview = document.getElementById("profilePreview");
  const currentViewer = document.getElementById("currentViewer");
  const profileData = getStoredProfileData();
  const activeName = getProfileDisplayName(user);

  if (profileNameInput) {
    profileNameInput.value = profileData.name || activeName;
  }

  if (profilePreview) {
    profilePreview.src = profileData.image || getDefaultProfileImage();
  }

  if (currentViewer) {
    currentViewer.textContent = activeName;
  }
}

function setupCommunityAuth(services) {
  const { auth } = services || {};
  const loginSection = document.getElementById("loginSection");
  const communitySection = document.getElementById("communitySection");
  if (!auth || !loginSection || !communitySection) return;

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginButton = document.getElementById("loginBtn");
  const signupButton = document.getElementById("signupBtn");
  const anonymousButton = document.getElementById("anonBtn");
  const communityStatus = document.getElementById("communityStatus");
  const currentViewer = document.getElementById("currentViewer");
  const signOutButton = document.getElementById("signOutBtn");
  const profileNameInput = document.getElementById("profileNameInput");
  const profilePicInput = document.getElementById("profilePicInput");
  const profilePreview = document.getElementById("profilePreview");

  const updateCommunityStatus = (message, tone = "default") => {
    if (!communityStatus) return;
    communityStatus.textContent = message;
    communityStatus.className = `mt-4 text-sm ${getToneClass(tone, {
      error: "text-red-700",
      success: "text-green-700",
      default: "text-gray-600"
    })}`;
  };

  const withAuth = async (callback) => {
    try {
      await callback();
    } catch (error) {
      updateCommunityStatus(error && error.message ? error.message : "Something went wrong.", "error");
    }
  };

  if (loginButton) {
    loginButton.addEventListener("click", () =>
      withAuth(() => auth.signInWithEmailAndPassword(emailInput?.value.trim() || "", passwordInput?.value || ""))
    );
  }

  if (signupButton) {
    signupButton.addEventListener("click", () =>
      withAuth(() => auth.createUserWithEmailAndPassword(emailInput?.value.trim() || "", passwordInput?.value || ""))
    );
  }

  if (anonymousButton) {
    anonymousButton.addEventListener("click", () => withAuth(() => auth.signInAnonymously()));
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => withAuth(async () => {
      await auth.signOut();
      updateCommunityStatus("Signed out. Continue as guest or sign in again.");
    }));
  }

  if (profileNameInput) {
    profileNameInput.addEventListener("input", async () => {
      const value = profileNameInput.value.trim();
      const user = auth.currentUser;
      if (!user) {
        if (value) {
          saveStoredProfileData({ name: value, image: getStoredProfileData().image });
        } else {
          saveStoredProfileData({ name: "", image: getStoredProfileData().image });
        }
        return;
      }

      const nextProfile = {
        name: value || "",
        image: getStoredProfileData().image
      };
      saveStoredProfileData(nextProfile);
      await syncProfileToFirestore(user, nextProfile);
      if (currentViewer) {
        currentViewer.textContent = value || getDisplayName(user);
      }
    });
  }

  if (profilePicInput) {
    profilePicInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = String(reader.result || "");
        const user = auth.currentUser;
        const nextProfile = {
          name: getStoredProfileData().name || getDisplayName(user),
          image: imageData
        };
        saveStoredProfileData(nextProfile);
        if (profilePreview) {
          profilePreview.src = imageData;
        }
        if (user) {
          await syncProfileToFirestore(user, nextProfile);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  auth.onAuthStateChanged(async (user) => {
    const isSignedIn = Boolean(user);
    loginSection.classList.toggle("hidden", isSignedIn);
    communitySection.classList.toggle("hidden", !isSignedIn);

    if (isSignedIn) {
      const hydrated = await hydrateProfileFromFirestore(user);
      saveStoredProfileData(hydrated);
      applyProfileAppearance(user);
      const name = getProfileDisplayName(user);
      if (currentViewer) {
        currentViewer.textContent = name;
      }
      updateCommunityStatus(user.isAnonymous ? `You are participating as ${name}.` : `Welcome back, ${name}.`, "success");
    }
  });
}

function setupCommunityPosts(services) {
  const { auth, db } = services || {};
  const serverTimestamp = window.firebase?.firestore?.FieldValue?.serverTimestamp;
  const postInput = document.getElementById("postInput");
  const postButton = document.getElementById("postBtn");
  const postsContainer = document.getElementById("postsContainer");
  const postStatus = document.getElementById("postStatus");

  if (!auth || !db || !postInput || !postButton || !postsContainer) {
    return;
  }

  postButton.addEventListener("click", async () => {
    const text = postInput.value.trim();
    if (!text) return;

    try {
      await db.collection("posts").add({
        text,
        user: getProfileDisplayName(auth.currentUser),
        avatar: getStoredProfileData().image || "",
        timestamp: typeof serverTimestamp === "function" ? serverTimestamp() : Date.now()
      });
      postInput.value = "";
      if (postStatus) {
        postStatus.textContent = "Discussion shared.";
      }
    } catch (error) {
      if (postStatus) {
        postStatus.textContent = "Unable to publish right now.";
      }
    }
  });

  db.collection("posts")
    .orderBy("timestamp", "desc")
    .limit(10)
    .onSnapshot(
      (snapshot) => {
        postsContainer.innerHTML = "";
        snapshot.forEach((doc) => {
          const post = doc.data() || {};
          const card = createElement("article", "rounded-lg border border-gray-200 bg-white p-3 shadow-sm");
          const meta = createElement("div", "mb-2 flex items-center gap-2");
          const avatar = post.avatar ? document.createElement("img") : null;
          if (avatar) {
            avatar.src = post.avatar;
            avatar.alt = `${post.user || "Community member"} avatar`;
            avatar.className = "h-8 w-8 rounded-full object-cover border border-gray-200";
            meta.appendChild(avatar);
          }
          meta.appendChild(createElement("p", "text-sm font-semibold text-gray-800", post.user || "Community member"));
          const body = createElement("p", "text-sm text-gray-600 whitespace-pre-wrap", post.text || "");
          card.appendChild(meta);
          card.appendChild(body);
          postsContainer.appendChild(card);
        });
      },
      () => {
        if (postStatus) {
          postStatus.textContent = "Discussions are temporarily unavailable.";
        }
      }
    );
}
