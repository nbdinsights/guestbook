const form = document.getElementById("entry-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");
const listEl = document.getElementById("entries");
const emptyNote = document.getElementById("empty-note");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || "";
}

function render(entries) {
  listEl.innerHTML = "";
  emptyNote.hidden = entries.length > 0;
  for (const entry of entries) {
    const li = document.createElement("li");
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = entry.name;
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = new Date(entry.created_at).toLocaleString();
    const msg = document.createElement("p");
    msg.className = "msg";
    msg.textContent = entry.message;
    li.append(who, when, msg);
    listEl.appendChild(li);
  }
}

async function loadEntries() {
  const res = await fetch("/api/entries");
  if (!res.ok) throw new Error("failed to load entries");
  render(await res.json());
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  setStatus("Signing…");
  try {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.value, message: messageInput.value }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "could not save your message");
    form.reset();
    setStatus("Thanks for signing!", "ok");
    await loadEntries();
  } catch (err) {
    setStatus(err.message, "err");
  } finally {
    submitBtn.disabled = false;
  }
});

loadEntries().catch(() => {
  setStatus("Could not load messages — try refreshing.", "err");
});
