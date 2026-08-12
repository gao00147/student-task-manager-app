# Student Task Manager App

A simple app that helps students organize school assignments, due dates, and priorities in one place.

Built for the Web Development with JavaScript final project (Algonquin College, 26S_MTM6302_010). Client: hard0257.

## Project brief

College students juggling assignments, projects, quizzes, and personal tasks often lose track of what's due first. This app lets a student add a task, set a due date, priority, and optional notes, mark it complete, edit it, or delete it, all in one clean dashboard-style view that works on desktop, tablet, and mobile.

## Features

- Add a task (name, due date, priority, optional notes)
- Edit a task in place
- Mark a task complete / incomplete
- Delete a task (with confirmation)
- Filter by All / Incomplete / Completed
- Filter by priority (High / Medium / Low)
- Priority shown with distinct colors (High = red, Medium = amber, Low = green) and auto-sorted high → low
- Overdue tasks highlighted in a distinct color, separate from High-priority red
- Summary stats (total, completed, overdue) and a progress bar
- Data persisted with `localStorage` — survives a page refresh
- No login, no backend — fully client-side
- Responsive: desktop (≥768px), tablet (481–767px), mobile (≤480px)

## Tech stack

Vanilla JavaScript, HTML, CSS — no frameworks.

## Project structure

```
index.html
style.css
app.js
prototypes/
  wireframe-desktop.png   wireframe-tablet.png   wireframe-mobile.png   (lo-fi)
  hifi-desktop.png        hifi-tablet.png        hifi-mobile.png        (hi-fi)
```

## Running it

Open `index.html` in a browser. No build step, no dependencies.
