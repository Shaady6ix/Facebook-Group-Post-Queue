const DEFAULT_DELAY_SECONDS = 45;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "startQueue") {
    startQueue(message.payload).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "stopQueue") {
    chrome.storage.local.set({ run: { active: false } }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "postResult") {
    advanceQueue(message.payload).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "contentReady") {
    chrome.storage.local.get("run").then(({ run }) => {
      if (run?.active && run.tabId === sender.tab?.id && !run.waitingForDelay && !run.postInProgress) runCurrentPost();
    });
  }

  if (message.type === "trustedClick") {
    clickWithBrowser(sender.tab?.id, message.payload).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "trustedInput") {
    typeWithBrowser(sender.tab?.id, message.payload).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  chrome.storage.local.get("run").then(({ run }) => {
    if (run?.active && run.tabId === tabId && !run.waitingForDelay) runCurrentPost();
  });
});

async function startQueue({ groupUrl, posts, delaySeconds }) {
  const groupUrls = (groupUrl || "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (!groupUrls.length || groupUrls.some((url) => !url.includes("facebook.com/groups/"))) throw new Error("Wpisz poprawne adresy grup Facebooka — po jednym w wierszu.");
  if (!posts?.length) throw new Error("Dodaj przynajmniej jeden post do kolejki.");
  const jobs = posts.flatMap((post) => groupUrls.map((url) => ({ ...post, groupUrl: url })));

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const run = {
    active: true,
    jobs,
    currentIndex: 0,
    delaySeconds: Math.max(5, Number(delaySeconds) || DEFAULT_DELAY_SECONDS),
    tabId: tab.id,
    waitingForDelay: false
  };
  await chrome.storage.local.set({ run, lastStatus: `Otwieranie grupy 1/${groupUrls.length}…` });
  await chrome.tabs.update(tab.id, { url: jobs[0].groupUrl });
}

async function runCurrentPost() {
  const { run } = await chrome.storage.local.get("run");
  if (!run?.active || run.waitingForDelay || run.postInProgress) return;
  const job = run.jobs[run.currentIndex];
  if (!job) return finishQueue();

  const running = { ...run, postInProgress: true };
  await chrome.storage.local.set({ run: running, lastStatus: `Publikowanie ${run.currentIndex + 1}/${run.jobs.length}…` });
  try {
    const result = await chrome.tabs.sendMessage(run.tabId, { type: "publishPost", post: job });
    await advanceQueue(result);
  } catch (error) {
    await chrome.storage.local.set({ run: { ...running, postInProgress: false }, lastStatus: "Oczekiwanie na stronę grupy…" });
    setTimeout(runCurrentPost, 1200);
  }
}

async function advanceQueue({ ok, error }) {
  const { run } = await chrome.storage.local.get("run");
  if (!run?.active) return;
  if (!ok) {
    await chrome.storage.local.set({ run: { ...run, active: false }, lastStatus: `Zatrzymano: ${error}` });
    return;
  }

  const nextIndex = run.currentIndex + 1;
  if (nextIndex >= run.jobs.length) return finishQueue();
  const nextRun = { ...run, currentIndex: nextIndex, waitingForDelay: true, postInProgress: false };
  await chrome.storage.local.set({ run: nextRun, lastStatus: `Czekanie ${run.delaySeconds} s przed kolejnym postem…` });
  setTimeout(async () => {
    const { run: latest } = await chrome.storage.local.get("run");
    if (!latest?.active) return;
    await chrome.storage.local.set({ run: { ...latest, waitingForDelay: false } });
    const nextJob = latest.jobs[latest.currentIndex];
    const previousJob = latest.jobs[latest.currentIndex - 1];
    if (nextJob.groupUrl !== previousJob.groupUrl) {
      await chrome.storage.local.set({ lastStatus: "Przechodzenie do kolejnej grupy…" });
      await chrome.tabs.update(latest.tabId, { url: nextJob.groupUrl });
    } else {
      runCurrentPost();
    }
  }, run.delaySeconds * 1000);
}

async function finishQueue() {
  await chrome.storage.local.set({ run: { active: false }, lastStatus: "Gotowe — kolejka została opublikowana." });
}

async function clickWithBrowser(tabId, { x, y }) {
  if (!tabId) throw new Error("Nie znaleziono karty Facebooka.");
  const target = { tabId };
  await chrome.debugger.attach(target, "1.3");
  try {
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  } finally {
    await chrome.debugger.detach(target).catch(() => {});
  }
}

async function typeWithBrowser(tabId, { x, y, text }) {
  if (!tabId) throw new Error("Nie znaleziono karty Facebooka.");
  const target = { tabId };
  await chrome.debugger.attach(target, "1.3");
  try {
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    for (const character of text) {
      const isNewline = character === "\n";
      const event = isNewline
        ? { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }
        : { type: "keyDown", key: character, code: "", text: character, unmodifiedText: character, windowsVirtualKeyCode: 0, nativeVirtualKeyCode: 0 };
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", event);
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", { type: "keyUp", key: event.key, code: event.code, windowsVirtualKeyCode: event.windowsVirtualKeyCode, nativeVirtualKeyCode: event.nativeVirtualKeyCode });
    }
  } finally {
    await chrome.debugger.detach(target).catch(() => {});
  }
}
