const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "shows.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const IMAGE_DIR = path.join(__dirname, "public", "images");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const ADMIN_USER = "admin";
const ADMIN_PASS = "showflix123";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "showflix-demo-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 9) +
      ext;

    cb(null, name);
  }
});


const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/videos"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".mp4", ".webm", ".mov", ".m4v"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowed.includes(ext)) {
      return cb(new Error("Only MP4, WEBM, MOV and M4V videos are allowed"));
    }

    cb(null, true);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];

    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
    }
  }
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));
fs.mkdirSync(path.join(__dirname, "public/videos"), { recursive: true });

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function defaultShows() {
  return [
    {
      id: 1,
      title: "My First Show",
      category: "Drama",
      emoji: "🎬",
      rating: "8.5",
      description: "A demo drama series for ShowFlix.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "Adventure World",
      category: "Adventure",
      emoji: "🌍",
      rating: "8.8",
      description: "An exciting adventure journey.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "Dream Story",
      category: "Drama",
      emoji: "⭐",
      rating: "9.0",
      description: "A beautiful dream story.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    },
    {
      id: 4,
      title: "Action Zone",
      category: "Action",
      emoji: "🔥",
      rating: "8.7",
      description: "Action packed entertainment.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    },
    {
      id: 5,
      title: "Comedy Night",
      category: "Comedy",
      emoji: "😂",
      rating: "8.2",
      description: "Fun and comedy for everyone.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    },
    {
      id: 6,
      title: "Mystery House",
      category: "Mystery",
      emoji: "🏠",
      rating: "8.9",
      description: "A mysterious house full of secrets.",
      poster: "",
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    }
  ];
}

function getShows() {
  if (!fs.existsSync(DATA_FILE)) {
    const data = defaultShows();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    let changed = false;

    data.forEach(show => {
      if (!show.seasons) {
        show.seasons = [];

        if (Array.isArray(show.episodes)) {
          show.seasons.push({
            number: 1,
            episodes: show.episodes
          });
        }

        delete show.episodes;
        changed = true;
      }

      if (!Array.isArray(show.seasons)) {
        show.seasons = [];
        changed = true;
      }

      if (!show.poster) {
        show.poster = "";
      }
    });

    if (changed) saveShows(data);

    return data;
  } catch {
    const data = defaultShows();
    saveShows(data);
    return data;
  }
}

function saveShows(shows) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(shows, null, 2));
}

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const users = [];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return users;
  }

  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function page(title, content, extraScript = "") {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ShowFlix</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

<header class="navbar">
  <a class="logo" href="/">SHOWFLIX</a>

  <nav class="nav-links">
    <a href="/">Home</a>
    <a href="/favorites">❤️ Favorites</a>
    <a href="/profile">Profile</a>
    <a href="/admin">Admin</a>
  </nav>
</header>

<main class="container">
    ${title !== "Home" ? `<button class="back-button" onclick="history.back()">← Back</button>` : ""}
${content}
</main>

<footer>
  <p>© 2026 ShowFlix • Demo Streaming App</p>
</footer>

<script src="/app.js"></script>
${extraScript}
</body>
</html>
`;
}

function posterHtml(show, large = false) {
  if (show.poster) {
    return `
      <img
        src="${escapeHtml(show.poster)}"
        alt="${escapeHtml(show.title)}"
        class="${large ? "poster-image large" : "poster-image"}"
      >
    `;
  }

  return `
    <div class="${large ? "poster large" : "poster"}">
      ${escapeHtml(show.emoji || "🎬")}
    </div>
  `;
}

function showCard(show) {
  const totalEpisodes = (show.seasons || []).reduce(
    (sum, season) => sum + (season.episodes || []).length,
    0
  );

  return `
<div class="show-card" data-category="${escapeHtml(show.category)}">
  ${posterHtml(show)}

  <div class="card-content">
    <h3>${escapeHtml(show.title)}</h3>
    <p>${escapeHtml(show.category)} • ${totalEpisodes} Episodes</p>

    <div class="rating">⭐ ${escapeHtml(show.rating || "N/A")}</div>

    <a class="btn" href="/show/${show.id}">View Show</a>

    <button
      class="favorite-btn"
      onclick="toggleFavorite(${show.id})"
      type="button"
    >
      ❤️
    </button>
  </div>
</div>
`;
}

function adminRequired(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }

  res.redirect("/admin/login");
}

function nextId(shows) {
  return shows.length
    ? Math.max(...shows.map(s => Number(s.id) || 0)) + 1
    : 1;
}

/* HOME */

app.get("/", (req, res) => {
  const shows = getShows();

  const categories = [
    "All",
    ...new Set(shows.map(show => show.category).filter(Boolean))
  ];

  res.send(
    page(
      "Home",
      `
<section class="hero">
  <div class="hero-content">
    <p class="small-label">WELCOME TO</p>
    <h1>SHOWFLIX</h1>
    <p>Watch your favourite shows and episodes in one place.</p>
  </div>
</section>

<div class="search-box">
  <input
    id="searchInput"
    type="text"
    placeholder="🔍 Search shows..."
    oninput="filterShows()"
  >
</div>

<div class="categories">
  ${categories
    .map(
      category => `
      <button
        class="category-btn"
        onclick="filterCategory('${escapeHtml(category)}')"
        type="button"
      >
        ${escapeHtml(category)}
      </button>
    `
    )
    .join("")}
</div>

<h2>🔥 Trending Now</h2>

<div class="show-grid">
  ${shows.map(showCard).join("")}
</div>
`
    )
  );
});

/* SHOW DETAILS */

app.get("/show/:id", (req, res) => {
  const shows = getShows();
  const show = shows.find(s => Number(s.id) === Number(req.params.id));

  if (!show) {
    return res.status(404).send(page("Not Found", "<h1>Show not found</h1>"));
  }

  const seasons = show.seasons || [];

  res.send(
    page(
      show.title,
      `
<div class="show-detail">

  <div>
    ${posterHtml(show, true)}
  </div>

  <div class="detail-content">
    <p class="small-label">${escapeHtml(show.category)}</p>

    <h1>${escapeHtml(show.title)}</h1>

    <div class="rating">
      ⭐ ${escapeHtml(show.rating || "N/A")}
    </div>

    <p>${escapeHtml(show.description || "No description available.")}</p>

    <button
      class="btn"
      type="button"
      onclick="toggleFavorite(${show.id})"
    >
      ❤️ Add / Remove Favorite
    </button>
  </div>

</div>

<h2>Episodes</h2>

${
  seasons.length
    ? seasons
        .map(
          season => `
          <section class="season">
            <h3>Season ${season.number}</h3>

            ${(season.episodes || [])
              .map(
                episode => `
                <div class="episode">
                  <div>
                    <strong>Episode ${episode.number}</strong>
                    <span>${escapeHtml(episode.title || "")}</span>
                  </div>

                  <a
                    class="btn"
                    href="/watch/${show.id}/${season.number}/${episode.number}"
                  >
                    ▶ Watch
                  </a>
                </div>
              `
              )
              .join("")}
          </section>
        `
        )
        .join("")
    : "<p>No episodes available.</p>"
}
`
    )
  );
});

/* WATCH */

app.get("/watch/:showId/:season/:episode", (req, res) => {
  const shows = getShows();

  const show = shows.find(
    s => Number(s.id) === Number(req.params.showId)
  );

  if (!show) {
    return res.status(404).send(page("Not Found", "<h1>Show not found</h1>"));
  }

  const season = (show.seasons || []).find(
    s => Number(s.number) === Number(req.params.season)
  );

  if (!season) {
    return res.status(404).send(page("Not Found", "<h1>Season not found</h1>"));
  }

  const episode = (season.episodes || []).find(
    e => Number(e.number) === Number(req.params.episode)
  );

  if (!episode) {
    return res.status(404).send(page("Not Found", "<h1>Episode not found</h1>"));
  }

  const video = episode.video || DEMO_VIDEO;

  res.send(
    page(
      `${show.title} - Episode ${episode.number}`,
      `
<h1>${escapeHtml(show.title)}</h1>

<h2>
  Season ${season.number} • Episode ${episode.number}
</h2>

<div class="video-player">
  <video
    id="videoPlayer"
    controls
    playsinline
    preload="metadata"
  >
    <source src="${escapeHtml(video)}" type="video/mp4">
    Your browser does not support video.
  </video>
</div>

<p>${escapeHtml(episode.title || "")}</p>

<a class="btn" href="/show/${show.id}">← Back to Show</a>
`,
      `
<script>
const player = document.getElementById("videoPlayer");

if (player) {
  player.addEventListener("timeupdate", () => {
    if (typeof saveWatching === "function") {
      saveWatching(
        ${Number(show.id)},
        ${Number(season.number)},
        ${Number(episode.number)},
        player.currentTime
      );
    }
  });
}
</script>
`
    )
  );
});

/* FAVORITES */

app.get("/favorites", (req, res) => {
  const shows = getShows();

  res.send(
    page(
      "Favorites",
      `
<h1>❤️ My Favorites</h1>

<p>Your favorite shows are saved on this device.</p>

<div class="show-grid">
  ${shows.map(showCard).join("")}
</div>

<button class="btn btn-dark" onclick="clearFavorites()" type="button">
  Clear Favorites
</button>
`
    )
  );
});

/* PROFILE */

app.get("/profile", (req, res) => {
  const user = req.session.user;

  res.send(
    page(
      "Profile",
      `
<h1>👤 Profile</h1>

${
  user
    ? `
    <div class="notice">
      <h2>${escapeHtml(user.name)}</h2>
      <p>${escapeHtml(user.email)}</p>
      <a class="btn" href="/logout">Logout</a>
    </div>
    `
    : `
    <div class="notice">
      <p>You are not logged in.</p>
      <a class="btn" href="/login">Login</a>
      <a class="btn btn-dark" href="/signup">Create Account</a>
    </div>
    `
}
`
    )
  );
});

/* LOGIN */

app.get("/login", (req, res) => {
  res.send(
    page(
      "Login",
      `
<h1>Login</h1>

<form class="form" method="POST" action="/login">

  <input
    type="email"
    name="email"
    placeholder="Email"
    required
  >

  <input
    type="password"
    name="password"
    placeholder="Password"
    required
  >

  <button class="btn" type="submit">Login</button>
</form>

<p>New user? <a href="/signup">Create account</a></p>
`
    )
  );
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();

  const user = users.find(
    u => u.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.send(
      page(
        "Login",
        `<div class="notice">Account not found. <a href="/signup">Create account</a></div>`
      )
    );
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.send(
      page(
        "Login",
        `<div class="notice">Wrong password.</div>`
      )
    );
  }

  req.session.user = {
    name: user.name,
    email: user.email
  };

  res.redirect("/profile");
});

/* SIGNUP */

app.get("/signup", (req, res) => {
  res.send(
    page(
      "Signup",
      `
<h1>Create Account</h1>

<form class="form" method="POST" action="/signup">

  <input
    type="text"
    name="name"
    placeholder="Your Name"
    required
  >

  <input
    type="email"
    name="email"
    placeholder="Email"
    required
  >

  <input
    type="password"
    name="password"
    placeholder="Password"
    minlength="6"
    required
  >

  <button class="btn" type="submit">
    Create Account
  </button>
</form>
`
    )
  );
});

app.post("/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    return res.send(
      page(
        "Signup",
        `<div class="notice">Please enter valid details. Password must be at least 6 characters.</div>`
      )
    );
  }

  const users = getUsers();

  if (users.some(u => u.email === email)) {
    return res.send(
      page(
        "Signup",
        `<div class="notice">This email is already registered.</div>`
      )
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    id: Date.now(),
    name,
    email,
    password: hashedPassword
  });

  saveUsers(users);

  res.send(
    page(
      "Account Created",
      `
<div class="notice">
  <h2>Account created successfully 🎉</h2>
  <a class="btn" href="/login">Login Now</a>
</div>
`
    )
  );
});

/* LOGOUT */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/* ADMIN LOGIN */

app.get("/admin/login", (req, res) => {
  res.send(
    page(
      "Admin Login",
      `
<h1>🔐 Admin Login</h1>

<form class="form" method="POST" action="/admin/login">

  <input
    type="text"
    name="username"
    placeholder="Admin Username"
    required
  >

  <input
    type="password"
    name="password"
    placeholder="Admin Password"
    required
  >

  <button class="btn" type="submit">
    Login
  </button>
</form>
`
    )
  );
});

app.post("/admin/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.redirect("/admin");
  }

  res.send(
    page(
      "Admin Login",
      `
<div class="notice">
  ❌ Wrong admin username or password.
  <br><br>
  <a href="/admin/login">Try Again</a>
</div>
`
    )
  );
});

app.get("/admin/logout", (req, res) => {
  req.session.admin = false;
  res.redirect("/");
});

/* ADMIN DASHBOARD */

app.get("/admin", adminRequired, (req, res) => {
  const shows = getShows();

  res.send(
    page(
      "Admin Panel",
      `
<div class="admin-head">
  <div>
    <p class="small-label">CONTROL CENTER</p>
    <h1>⚙️ ShowFlix Admin</h1>
  </div>

  <a class="btn btn-dark" href="/admin/logout">Logout</a>
</div>

<div class="admin-actions">
  <a class="btn" href="/admin/add-show">➕ Add Show</a>
</div>

<h2>Manage Shows</h2>

<div class="admin-list">

${
  shows.length
    ? shows
        .map(
          show => `
<div class="admin-item">

  <div class="admin-item-info">
    ${posterHtml(show)}

    <div>
      <h3>${escapeHtml(show.title)}</h3>
      <p>${escapeHtml(show.category)} • ⭐ ${escapeHtml(show.rating || "N/A")}</p>
    </div>
  </div>

  <div class="admin-buttons">
    <a class="btn" href="/admin/edit-show/${show.id}">✏️ Edit</a>
    <a class="btn" href="/admin/add-episode/${show.id}">➕ Episode</a>
      <a class="btn" href="/admin/manage-show/${show.id}">⚙️ Manage</a>

    <form
      method="POST"
      action="/admin/delete-show/${show.id}"
      onsubmit="return confirm('Delete this show and all episodes?')"
    >
      <button class="btn danger" type="submit">
        🗑️ Delete
      </button>
    </form>
  </div>

</div>
`
        )
        .join("")
    : "<p>No shows available.</p>"
}

</div>
`
    )
  );
});

/* ADD SHOW */

app.get("/admin/add-show", adminRequired, (req, res) => {
  res.send(
    page(
      "Add Show",
      `
<h1>➕ Add New Show</h1>

<form
  class="form"
  method="POST"
  action="/admin/add-show"
  enctype="multipart/form-data"
>

  <input
    type="text"
    name="title"
    placeholder="Show Title"
    required
  >

  <input
    type="text"
    name="category"
    placeholder="Category"
    required
  >

  <input
    type="text"
    name="emoji"
    placeholder="Emoji e.g. 🎬"
    value="🎬"
  >

  <input
    type="text"
    name="rating"
    placeholder="Rating e.g. 8.8"
    value="8.0"
  >

  <textarea
    name="description"
    placeholder="Show description"
    rows="5"
  ></textarea>

  <label>Poster Image</label>

  <input
    type="file"
    name="poster"
    accept=".jpg,.jpeg,.png,.webp"
  >

  <input
    type="text"
    name="posterUrl"
    placeholder="Or paste poster image URL"
  >

  <button class="btn" type="submit">
    Create Show
  </button>
</form>
`
    )
  );
});

app.post(
  "/admin/add-show",
  adminRequired,
  upload.single("poster"),
  (req, res) => {
    const shows = getShows();

    const poster =
      req.file
        ? "/images/" + req.file.filename
        : String(req.body.posterUrl || "").trim();

    const newShow = {
      id: nextId(shows),
      title: String(req.body.title || "Untitled Show").trim(),
      category: String(req.body.category || "Drama").trim(),
      emoji: String(req.body.emoji || "🎬").trim(),
      rating: String(req.body.rating || "8.0").trim(),
      description: String(req.body.description || "").trim(),
      poster,
      seasons: [
        {
          number: 1,
          episodes: [
            {
              number: 1,
              title: "Episode 1",
              video: DEMO_VIDEO
            }
          ]
        }
      ]
    };

    shows.push(newShow);
    saveShows(shows);

    res.redirect("/admin");
  }
);

/* EDIT SHOW */

app.get("/admin/edit-show/:id", adminRequired, (req, res) => {
  const shows = getShows();

  const show = shows.find(
    s => Number(s.id) === Number(req.params.id)
  );

  if (!show) {
    return res.status(404).send(
      page("Not Found", "<h1>Show not found</h1>")
    );
  }

  res.send(
    page(
      "Edit Show",
      `
<h1>✏️ Edit Show</h1>

<form
  class="form"
  method="POST"
  action="/admin/edit-show/${show.id}"
  enctype="multipart/form-data"
>

  <input
    type="text"
    name="title"
    value="${escapeHtml(show.title)}"
    placeholder="Show Title"
    required
  >

  <input
    type="text"
    name="category"
    value="${escapeHtml(show.category)}"
    placeholder="Category"
    required
  >

  <input
    type="text"
    name="emoji"
    value="${escapeHtml(show.emoji || "🎬")}"
    placeholder="Emoji"
  >

  <input
    type="text"
    name="rating"
    value="${escapeHtml(show.rating || "8.0")}"
    placeholder="Rating"
  >

  <textarea
    name="description"
    rows="5"
    placeholder="Description"
  >${escapeHtml(show.description || "")}</textarea>

  ${
    show.poster
      ? `
      <p>Current Poster:</p>
      <img
        src="${escapeHtml(show.poster)}"
        class="poster-preview"
        alt="Current poster"
      >
      `
      : ""
  }

  <label>Replace Poster</label>

  <input
    type="file"
    name="poster"
    accept=".jpg,.jpeg,.png,.webp"
  >

  <input
    type="text"
    name="posterUrl"
    value="${escapeHtml(show.poster || "")}"
    placeholder="Poster image URL"
  >

  <button class="btn" type="submit">
    Save Changes
  </button>
</form>
`
    )
  );
});

app.post(
  "/admin/edit-show/:id",
  adminRequired,
  upload.single("poster"),
  (req, res) => {
    const shows = getShows();

    const index = shows.findIndex(
      s => Number(s.id) === Number(req.params.id)
    );

    if (index === -1) {
      return res.status(404).send(
        page("Not Found", "<h1>Show not found</h1>")
      );
    }

    const show = shows[index];

    show.title = String(req.body.title || show.title).trim();
    show.category = String(req.body.category || show.category).trim();
    show.emoji = String(req.body.emoji || show.emoji || "🎬").trim();
    show.rating = String(req.body.rating || show.rating || "8.0").trim();
    show.description = String(
      req.body.description || show.description || ""
    ).trim();

    if (req.file) {
      if (
        show.poster &&
        show.poster.startsWith("/images/")
      ) {
        const oldFile = path.join(
          __dirname,
          "public",
          show.poster
        );

        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }

      show.poster = "/images/" + req.file.filename;
    } else if (req.body.posterUrl !== undefined) {
      show.poster = String(req.body.posterUrl).trim();
    }

    saveShows(shows);

    res.redirect("/admin");
  }
);

/* DELETE SHOW */

app.post("/admin/delete-show/:id", adminRequired, (req, res) => {
  const shows = getShows();

  const index = shows.findIndex(
    s => Number(s.id) === Number(req.params.id)
  );

  if (index === -1) {
    return res.redirect("/admin");
  }

  const show = shows[index];

  if (
    show.poster &&
    show.poster.startsWith("/images/")
  ) {
    const posterFile = path.join(
      __dirname,
      "public",
      show.poster
    );

    if (fs.existsSync(posterFile)) {
      fs.unlinkSync(posterFile);
    }
  }

  shows.splice(index, 1);
  saveShows(shows);

  res.redirect("/admin");
});

/* ADD EPISODE */

app.get("/admin/add-episode/:id", adminRequired, (req, res) => {
  const shows = getShows();

  const show = shows.find(
    s => Number(s.id) === Number(req.params.id)
  );

  if (!show) {
    return res.status(404).send(
      page("Not Found", "<h1>Show not found</h1>")
    );
  }

  const seasons = show.seasons || [];

  res.send(
    page(
      "Add Episode",
      `
<h1>➕ Add Episode</h1>

<div class="notice">
  <strong>${escapeHtml(show.title)}</strong>
</div>

<form class="form" method="POST" enctype="multipart/form-data">

  <input
    type="number"
    name="season"
    min="1"
    value="${seasons.length ? seasons[seasons.length - 1].number : 1}"
    placeholder="Season Number"
    required
  >

  <input
    type="number"
    name="episode"
    min="1"
    placeholder="Episode Number"
    required
  >

  <input
    type="text"
    name="title"
    placeholder="Episode Title"
    required
  >

  <input
    type="url"
    name="video"
    placeholder="Video URL"
    required
  >

  
<div class="form-group" style="margin-top:12px;">
  <label><strong>या Video File Upload करें</strong></label>
  <input
    type="file"
    name="videoFile"
    accept="video/mp4,video/webm,video/quicktime,.m4v"
  >
  <small>MP4, WEBM, MOV, M4V — अधिकतम 500 MB</small>
</div>

<button class="btn" type="submit">
    Add Episode
  </button>
</form>
`
    )
  );
});

app.post("/admin/add-episode/:id", adminRequired, videoUpload.single("videoFile"), (req, res) => {
  const shows = getShows();

  const show = shows.find(
    s => Number(s.id) === Number(req.params.id)
  );

  if (!show) {
    return res.status(404).send(
      page("Not Found", "<h1>Show not found</h1>")
    );
  }

  const seasonNumber = Number(req.body.season);
  const episodeNumber = Number(req.body.episode);

  if (!Array.isArray(show.seasons)) {
    show.seasons = [];
  }

  let season = show.seasons.find(
    s => Number(s.number) === seasonNumber
  );

  if (!season) {
    season = {
      number: seasonNumber,
      episodes: []
    };

    show.seasons.push(season);
  }

  season.episodes.push({
    number: episodeNumber,
    title: String(req.body.title || `Episode ${episodeNumber}`),
    video: String(req.body.video || DEMO_VIDEO)
  });

  show.seasons.sort((a, b) => a.number - b.number);

  show.seasons.forEach(s => {
    s.episodes.sort((a, b) => a.number - b.number);
  });

  saveShows(shows);

  res.redirect("/admin");
});

/* DELETE EPISODE */

app.post(
  "/admin/delete-episode/:showId/:season/:episode",
  adminRequired,
  (req, res) => {
    const shows = getShows();

    const show = shows.find(
      s => Number(s.id) === Number(req.params.showId)
    );

    if (!show) {
      return res.redirect("/admin");
    }

    const season = (show.seasons || []).find(
      s => Number(s.number) === Number(req.params.season)
    );

    if (!season) {
      return res.redirect("/admin");
    }

    season.episodes = (season.episodes || []).filter(
      e => Number(e.number) !== Number(req.params.episode)
    );

    show.seasons = show.seasons.filter(
      s => (s.episodes || []).length > 0
    );

    saveShows(shows);

    res.redirect(`/admin/edit-show/${show.id}`);
  }
);

/* ADMIN SHOW EPISODE MANAGEMENT */

app.get("/admin/manage-show/:id", adminRequired, (req, res) => {
  const shows = getShows();

  const show = shows.find(
    s => Number(s.id) === Number(req.params.id)
  );

  if (!show) {
    return res.status(404).send(
      page("Not Found", "<h1>Show not found</h1>")
    );
  }

  res.send(
    page(
      "Manage Episodes",
      `
<h1>🎬 Manage Episodes</h1>

<h2>${escapeHtml(show.title)}</h2>

<a class="btn" href="/admin/add-episode/${show.id}">
  ➕ Add Episode
</a>

${
  (show.seasons || [])
    .map(
      season => `
      <section class="season">
        <h3>Season ${season.number}</h3>

        ${(season.episodes || [])
          .map(
            episode => `
            <div class="episode">

              <div>
                <strong>
                  Episode ${episode.number}
                </strong>

                <span>
                  ${escapeHtml(episode.title || "")}
                </span>
              </div>

              <form
                method="POST"
                action="/admin/delete-episode/${show.id}/${season.number}/${episode.number}"
                onsubmit="return confirm('Delete this episode?')"
              >
                <button class="btn danger" type="submit">
                  🗑️ Delete
                </button>
              </form>

            </div>
          `
          )
          .join("")}
      </section>
    `
    )
    .join("")
}
`
    )
  );
});

/* 404 */

app.use((req, res) => {
  res.status(404).send(
    page(
      "404",
      `
<h1>404</h1>
<p>Page not found.</p>
<a class="btn" href="/">Go Home</a>
`
    )
  );
});

/* ERROR HANDLER */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).send(
    page(
      "Error",
      `
<div class="notice">
  <h2>Something went wrong</h2>
  <p>${escapeHtml(err.message)}</p>
  <a class="btn" href="/">Go Home</a>
</div>
`
    )
  );
});

app.listen(PORT, () => {
  console.log(`ShowFlix is running on http://localhost:${PORT}`);
});
