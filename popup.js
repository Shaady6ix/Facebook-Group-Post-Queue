const $ = (selector) => document.querySelector(selector);
let posts = [];

init();

async function init() {
  const data = await chrome.storage.local.get(["posts", "groupUrl", "lastStatus"]);
  posts = data.posts || [];
  $("#groupUrl").value = data.groupUrl || "";
  $("#status").textContent = data.lastStatus || "";
  renderQueue();
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastStatus) setStatus(changes.lastStatus.newValue || "");
});

$("#add").addEventListener("click", async () => {
  const text = $("#text").value.trim();
  const image = $("#image").files[0];
  if (!text && !image) return setStatus("Dodaj tekst lub zdjęcie.");
  const imageDataUrl = image ? await readAsDataUrl(image) : null;
  posts.push({ id: crypto.randomUUID(), text, imageDataUrl, imageName: image?.name || "" });
  await savePosts();
  $("#text").value = "";
  $("#image").value = "";
  renderQueue();
  setStatus("Post dodany do kolejki.");
});

$("#start").addEventListener("click", async () => {
  const groupUrl = $("#groupUrl").value.trim();
  await chrome.storage.local.set({ groupUrl });
  const response = await chrome.runtime.sendMessage({ type: "startQueue", payload: { groupUrl, posts, delaySeconds: $("#delay").value } });
  setStatus(response.ok ? "Uruchomiono kolejkę." : response.error);
});

$("#stop").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "stopQueue" });
  setStatus("Kolejka zatrzymana.");
});

function renderQueue() {
  const list = $("#queue");
  list.replaceChildren(...posts.map((post, index) => {
    const item = document.createElement("li");
    const preview = (post.text || post.imageName || "Zdjęcie").replace(/\s+/g, " ").slice(0, 60);
    item.append(`${preview}${preview.length === 60 ? "…" : ""}`);
    const remove = document.createElement("button");
    remove.textContent = "Usuń";
    remove.onclick = async () => { posts.splice(index, 1); await savePosts(); renderQueue(); };
    item.append(remove);
    return item;
  }));
}

async function savePosts() { await chrome.storage.local.set({ posts }); }
function setStatus(message) { $("#status").textContent = message; }
function readAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
