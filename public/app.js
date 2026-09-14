const favKey = "showflixFavorites";
const watchKey = "showflixContinue";

function getFavs() {
  try {
    return JSON.parse(localStorage.getItem(favKey) || "[]");
  } catch {
    return [];
  }
}

function saveFavs(data) {
  localStorage.setItem(favKey, JSON.stringify(data));
}

function toggleFavorite(id) {
  const numericId = Number(id);
  let favs = getFavs();

  if (favs.includes(numericId)) {
    favs = favs.filter(x => x !== numericId);
    alert("Removed from Favorites");
  } else {
    favs.push(numericId);
    alert("Added to Favorites ❤️");
  }

  saveFavs(favs);
  location.reload();
}

function isFavorite(id) {
  return getFavs().includes(Number(id));
}

function saveWatching(showId, season, episode, time) {
  let data = getWatching();

  data[String(showId)] = {
    season: Number(season),
    episode: Number(episode),
    time: Number(time) || 0,
    updatedAt: Date.now()
  };

  localStorage.setItem(watchKey, JSON.stringify(data));
}

function getWatching() {
  try {
    return JSON.parse(localStorage.getItem(watchKey) || "{}");
  } catch {
    return {};
  }
}

function removeWatching(showId) {
  const data = getWatching();
  delete data[String(showId)];
  localStorage.setItem(watchKey, JSON.stringify(data));
}

function filterShows() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const value = input.value.toLowerCase().trim();

  document.querySelectorAll(".show-card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(value) ? "" : "none";
  });
}

function filterCategory(category) {
  document.querySelectorAll(".show-card").forEach(card => {
    const cardCategory = card.dataset.category;

    card.style.display =
      category === "All" || cardCategory === category
        ? ""
        : "none";
  });
}

function clearFavorites() {
  localStorage.removeItem(favKey);
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".favorite-btn").forEach(button => {
    const match = (button.getAttribute("onclick") || "").match(/\d+/);

    if (match && isFavorite(Number(match[0]))) {
      button.classList.add("active");
      button.textContent = "❤️ Added";
    }
  });
});

async function loadContinueWatching() {
  const section = document.getElementById("continueSection");
  if (!section) return;

  const data = getWatching();
  const ids = Object.keys(data);

  if (!ids.length) return;

  try {
    const response = await fetch("/api/shows");
    if (!response.ok) return;

    const shows = await response.json();

    const items = ids
      .map(id => {
        const show = shows.find(s => Number(s.id) === Number(id));
        const progress = data[id];

        if (!show || !progress) return "";

        return `
          <div class="continue-card">
            ${
              show.poster
                ? `<img class="mini-poster" src="${show.poster}" alt="">`
                : `<div class="poster mini-poster">${show.emoji || "🎬"}</div>`
            }

            <div class="continue-info">
              <h3>${show.title}</h3>

              <p>
                Season ${progress.season}
                • Episode ${progress.episode}
              </p>

              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>

              <a
                class="btn"
                href="/watch/${show.id}/${progress.season}/${progress.episode}"
              >
                ▶ Continue
              </a>
            </div>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!items) return;

    section.innerHTML = `
      <div class="section-title">
        <h2>▶ Continue Watching</h2>
      </div>

      ${items}
    `;
  } catch {
    // Ignore if API is unavailable.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadContinueWatching();
});
