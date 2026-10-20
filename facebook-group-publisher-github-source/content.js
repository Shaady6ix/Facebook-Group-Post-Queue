const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

chrome.runtime.sendMessage({ type: "contentReady" }).catch(() => {});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "publishPost") return;
  publishPost(message.post)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function publishPost(post) {
  const composer = await waitFor(findComposer, 15000, "Nie znaleziono pola „Napisz coś…” na stronie grupy");
  await trustedClick(composer);

  const dialog = await waitFor(findCreatePostDialog, 10000, "Kliknięto pole, ale okno tworzenia posta się nie otworzyło");
  const editor = await waitFor(() => findPostEditor(dialog), 10000, "Nie znaleziono edytora tekstu w oknie posta");
  await trustedInput(editor, post.text || "");
  if (post.text) await waitFor(() => editor.innerText.includes(post.text), 4000, "Facebook nie przyjął tekstu w edytorze posta");

  if (post.imageDataUrl) await attachImage(dialog, post.imageDataUrl);
  await sleep(800);

  const publishButton = await waitFor(findPublishButton, 10000, "Nie znaleziono przycisku „Opublikuj”");
  if (isDisabled(publishButton)) throw new Error("Przycisk „Opublikuj” jest nieaktywny.");
  publishButton.click();

  await waitFor(() => !document.contains(dialog), 12000, "Facebook nie potwierdził zamknięcia okna po publikacji");
  chrome.runtime.sendMessage({ type: "postResult", payload: { ok: true } });
}

async function attachImage(dialog, dataUrl) {
  const fileInput = dialog.querySelector('input[type="file"]') || await waitFor(() => {
    const media = findByText(/Zdjęcie|film/i, dialog);
    media?.click();
    return dialog.querySelector('input[type="file"]');
  }, 6000);
  if (!fileInput) throw new Error("Nie znaleziono pola dodawania zdjęcia.");

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "jpg";
  const file = new File([blob], `post-image.${extension}`, { type: blob.type });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  fileInput.dispatchEvent(new Event("input", { bubbles: true }));
  fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(1500);
}

function findByText(pattern, scope = document) {
  return [...scope.querySelectorAll('[role="button"], [contenteditable="true"], div, span')]
    .find((node) => pattern.test((node.getAttribute("aria-label") || node.textContent || "").trim()));
}

function findComposer() {
  const buttonMatch = [...document.querySelectorAll('[role="button"][tabindex="0"]')]
    .find((node) => isVisible(node) && /^(Napisz coś|Co masz na myśli)[.…]*$/i.test((node.textContent || "").trim()));
  if (buttonMatch) return buttonMatch;

  const labelMatch = [...document.querySelectorAll('[aria-label]')]
    .find((node) => isVisible(node) && /Napisz coś|Co masz na myśli/i.test(node.getAttribute("aria-label") || ""));
  if (labelMatch) return labelMatch;

  const exactText = [...document.querySelectorAll('span, div')]
    .find((node) => isVisible(node) && /^(Napisz coś|Co masz na myśli)[.…]*$/i.test((node.textContent || "").trim()));
  if (!exactText) return null;
  return exactText.closest('[role="button"], [tabindex="0"]') || exactText.parentElement;
}

function findCreatePostDialog() {
  return [...document.querySelectorAll('[role="dialog"]')].find((dialog) =>
    isVisible(dialog) && /Utwórz post|Napisz coś/i.test(dialog.textContent || "")
  );
}

function findPostEditor(dialog) {
  const selector = '[contenteditable="true"][role="textbox"][data-lexical-editor="true"][aria-placeholder*="Utwórz post"]';
  const inDialog = [...dialog.querySelectorAll(selector)].find(isVisible);
  if (inDialog) return inDialog;
  return [...document.querySelectorAll(selector)].find(isVisible) || null;
}

function findPublishButton() {
  return [...document.querySelectorAll('[role="button"], button')].find((node) =>
    isVisible(node) && /^Opublikuj$/i.test((node.getAttribute("aria-label") || node.textContent || "").trim())
  );
}

function findButton(scope, pattern) {
  return [...scope.querySelectorAll('[role="button"], button')]
    .find((node) => pattern.test((node.getAttribute("aria-label") || node.textContent || "").trim()));
}

function isDisabled(element) {
  return element.getAttribute("aria-disabled") === "true" || element.disabled;
}

function isVisible(element) {
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
}

async function trustedClick(element) {
  element.scrollIntoView({ block: "center", inline: "center" });
  await sleep(150);
  const rect = element.getBoundingClientRect();
  const response = await chrome.runtime.sendMessage({
    type: "trustedClick",
    payload: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  });
  if (!response?.ok) throw new Error(response?.error || "Przeglądarka nie wykonała kliknięcia.");
}

async function trustedInput(element, text) {
  element.scrollIntoView({ block: "center", inline: "center" });
  const rect = element.getBoundingClientRect();
  const response = await chrome.runtime.sendMessage({
    type: "trustedInput",
    payload: { x: rect.left + Math.min(12, rect.width / 2), y: rect.top + Math.min(14, rect.height / 2), text }
  });
  if (!response?.ok) throw new Error(response?.error || "Przeglądarka nie wpisała tekstu posta.");
}

async function waitFor(getter, timeout, errorMessage = "Nie znaleziono oczekiwanego elementu Facebooka") {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = getter();
    if (value) return value;
    await sleep(200);
  }
  throw new Error(errorMessage);
}
