# ◆ Consistium — Atomic Habit Tracker

<img width="1657" height="662" alt="image" src="https://github.com/user-attachments/assets/8d9306da-5127-4a41-97e4-404d52740284" />

<img width="1902" height="926" alt="image" src="https://github.com/user-attachments/assets/1972a363-efeb-4d88-97cc-74ec75ec7bce" />

<img width="1915" height="623" alt="image" src="https://github.com/user-attachments/assets/8a6b89bd-867b-456d-a120-dbc22faa3b25" />




> *"You do not rise to the level of your goals. You fall to the level of your systems."* — James Clear

**Consistium** is a premium daily habit tracker inspired by James Clear's *Atomic Habits*. Track your habits, build streaks, and become 1% better every day.

<p align="center">
  <img src="assets/screenshot.png" alt="Consistium App Preview" width="800"/>
</p>

## ✨ Features

- **Daily Habit Tracking** — Tap to mark habits complete with satisfying animations
- **Good vs. Bad Habits** — Build positive routines or track habits you're trying to break
- **Special Tasks** — Add one-off daily tasks that do not repeat
- **Reverse Logic for Bad Habits** — Bad habits are marked as "Resisted" (complete) by default and only "Slipped" if checked
- **Score Ring** — Visual progress indicator with animated percentage
- **Streak Counter** — Track consecutive perfect days
- **Weekly Heatmap** — See your weekly consistency at a glance
- **Add/Edit/Delete Habits** — Full CRUD with emoji picker
- **Date Navigation** — Review past days or plan ahead (← → arrow keys)
- **Confetti Celebration** — Perfect day triggers confetti animation 🎉
- **🌗 Light & Dark Theme** — Default light theme with a one-click dark mode toggle; automatically respects your system colour-scheme preference
- **150+ Curated Quotes** — Motivational quotes from *Atomic Habits*, *Deep Work*, *Mindset*, and *Wild Courage*
- **Quote Navigation** — Browse quotes manually with ← → arrows, or let them auto-rotate every 5 minutes
- **Data Persistence** — All data saved in localStorage
- **Import/Export** — Backup and restore your data as JSON
- **Keyboard Shortcuts** — Arrow keys for navigation, Escape to close modals
- **Responsive Design** — Works beautifully on mobile and desktop
- **🐳 Docker Support** — One-command deployment with Docker Compose and Nginx
- **📊 Observability** — Built-in Prometheus & Grafana stack for monitoring Nginx metrics

## 🔄 Habit Types
 
 Consistium supports three types of activities to help you design your ideal life:
 
- **Good Habits (Build)** — Activities you want to perform. They are marked as "Done" when checked.
- **Bad Habits (Break)** — Activities you want to avoid. These use reverse logic: they are marked as **"Resisted ✓"** (successful) by default. If you perform the habit, you check it to mark it as **"Slipped ✗"**.
- **Special Tasks (One-time)** — Day-specific tasks that do not recur. These only show up on the day they are created and contribute to that day's score.
 
## 🚀 Getting Started

### Option 1 — Static File (No Installation)

Simply open `index.html` in any modern browser. No build tools, no dependencies, no server required.

```bash
# Clone the repo
git clone https://github.com/Kalpanapramodya97/consistium.git
cd consistium

# Open in browser
start index.html   # Windows
open index.html    # macOS
```

### Option 2 — Docker Compose (Local Build)

Run with Docker Compose for a production-ready Nginx setup. This builds the image locally from the source code:

```bash
docker compose up -d
```

The app will be available at `http://localhost:3000`.

### Option 3 — Pre-built Docker Image (GHCR)

You can run the pre-built image directly from our GitHub Container Registry. You don't need to clone the repository, install dependencies, or even explicitly pull the image. Docker handles everything automatically:

```bash
docker run -d -p 3000:80 --name consistium-app ghcr.io/kalpanapramodya97/consistium/habit-tracker:latest
```

*(Note: If the image isn't already on your machine, Docker will automatically download it from the registry and start the server.)*

The app will be available at `http://localhost:3000`.

## 🎯 Default Habits

| Emoji | Habit |
|-------|-------|
| 📚 | Read 10 pages |
| 💪 | Gym workout |
| 🗣️ | Table topic speech |
| 💻 | DevOps tutorials × 2 |
| 📝 | 12 job applications |
| 💼 | Message 5 LinkedIn recruiters & comment on 2 posts |

## 🛠 Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, animations, glassmorphism
- **Vanilla JavaScript** — Zero dependencies, IIFE pattern
- **localStorage** — Client-side persistence
- **Docker + Nginx** — Containerised deployment
- **Prometheus & Grafana** — Full observability stack with metrics and dashboards via Docker Compose

## 📸 Design Highlights

- Light & dark themes with ambient floating orbs
- One-click theme toggle with system-preference detection
- Animated score ring with gradient stroke
- Micro-interactions on hover and completion
- Confetti celebration on perfect days
- Weekly heatmap with intensity levels
- 150+ quotes across 4 books with fade-transition navigation
- Premium typography with Inter & JetBrains Mono

## 📄 License

MIT © 2026 Kalpana Pramodya

---

*Built with ♦ Consistium — 1% better every day*
