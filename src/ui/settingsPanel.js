import { icon } from "./icons.js";
import { isDamageNumbersEnabled, setDamageNumbersEnabled } from "../data/settings.js";

export function createSettingsPanel({ audio, onResetProgress } = {}) {
  const root = document.createElement("div");
  root.className = "fantasy-panel fantasy-panel--ornate";
  Object.assign(root.style, {
    margin: "0 auto",
    maxWidth: "560px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "var(--sp-4)",
  });

  const audioSection = document.createElement("div");
  Object.assign(audioSection.style, { display: "flex", flexDirection: "column", gap: "var(--sp-3)" });
  const audioSectionTitle = document.createElement("h3");
  audioSectionTitle.className = "fantasy-title--section";
  Object.assign(audioSectionTitle.style, { margin: "0", fontSize: "16px" });
  audioSectionTitle.textContent = "Звук и музыка";

  const audioToggle = document.createElement("button");
  audioToggle.type = "button";
  audioToggle.className = "fantasy-button fantasy-button--ghost";
  Object.assign(audioToggle.style, { width: "100%", justifyContent: "space-between" });

  const musicToggle = document.createElement("button");
  musicToggle.type = "button";
  musicToggle.className = "fantasy-button fantasy-button--ghost";
  Object.assign(musicToggle.style, { width: "100%", justifyContent: "space-between" });

  const volumeRow = document.createElement("div");
  Object.assign(volumeRow.style, { display: "flex", alignItems: "center", gap: "var(--sp-3)" });
  const volumeLabel = document.createElement("span");
  volumeLabel.className = "fantasy-subtitle";
  volumeLabel.textContent = "Громкость";
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "100";
  Object.assign(volumeSlider.style, { flex: "1", accentColor: "var(--color-accent)" });
  const volumeValue = document.createElement("span");
  volumeValue.className = "fantasy-mono";
  Object.assign(volumeValue.style, { minWidth: "42px", textAlign: "right", color: "var(--color-accent)" });

  const syncAudioSettings = () => {
    if (!audio?.music) {
      audioToggle.disabled = true;
      musicToggle.disabled = true;
      volumeSlider.disabled = true;
      audioToggle.textContent = "Звук недоступен";
      musicToggle.textContent = "Музыка недоступна";
      volumeValue.textContent = "—";
      return;
    }
    audioToggle.replaceChildren();
    audioToggle.appendChild(icon(audio.music.isMuted() ? "volumeOff" : "volume", 18));
    const label = document.createElement("span");
    label.textContent = audio.music.isMuted() ? "Звук выключен" : "Звук включён";
    audioToggle.appendChild(label);

    musicToggle.replaceChildren();
    musicToggle.appendChild(icon(audio.music.isMusicEnabled() ? "music" : "musicOff", 18));
    const musicLabel = document.createElement("span");
    musicLabel.textContent = audio.music.isMusicEnabled() ? "Музыка включена" : "Музыка выключена";
    musicToggle.appendChild(musicLabel);

    const currentVolume = Math.round(audio.music.getVolume() * 100);
    volumeSlider.value = String(currentVolume);
    volumeValue.textContent = `${currentVolume}%`;
  };

  audioToggle.addEventListener("click", () => {
    audio?.music?.toggleMuted();
    syncAudioSettings();
  });
  musicToggle.addEventListener("click", () => {
    audio?.music?.toggleMusicEnabled();
    syncAudioSettings();
  });
  volumeSlider.addEventListener("input", () => {
    audio?.music?.setVolume(Number(volumeSlider.value) / 100);
    volumeValue.textContent = `${volumeSlider.value}%`;
  });

  volumeRow.append(volumeLabel, volumeSlider, volumeValue);
  audioSection.append(audioSectionTitle, audioToggle, musicToggle, volumeRow);

  const displaySection = document.createElement("div");
  Object.assign(displaySection.style, { display: "flex", flexDirection: "column", gap: "var(--sp-3)" });
  const displaySectionTitle = document.createElement("h3");
  displaySectionTitle.className = "fantasy-title--section";
  Object.assign(displaySectionTitle.style, { margin: "0", fontSize: "16px" });
  displaySectionTitle.textContent = "Отображение";

  const damageNumbersToggle = document.createElement("button");
  damageNumbersToggle.type = "button";
  damageNumbersToggle.className = "fantasy-button fantasy-button--ghost";
  Object.assign(damageNumbersToggle.style, { width: "100%", justifyContent: "space-between" });

  const syncDisplaySettings = () => {
    const enabled = isDamageNumbersEnabled();
    damageNumbersToggle.replaceChildren();
    damageNumbersToggle.appendChild(icon(enabled ? "eye" : "eyeOff", 18));
    const label = document.createElement("span");
    label.textContent = enabled ? "Цифры урона включены" : "Цифры урона выключены";
    damageNumbersToggle.appendChild(label);
  };

  damageNumbersToggle.addEventListener("click", () => {
    setDamageNumbersEnabled(!isDamageNumbersEnabled());
    syncDisplaySettings();
  });

  displaySection.append(displaySectionTitle, damageNumbersToggle);

  const canReset = typeof onResetProgress === "function";
  let saveSection = null;

  if (canReset) {
    saveSection = document.createElement("div");
    Object.assign(saveSection.style, { display: "flex", flexDirection: "column", gap: "var(--sp-3)" });

    const saveSectionTitle = document.createElement("h3");
    saveSectionTitle.className = "fantasy-title--section";
    Object.assign(saveSectionTitle.style, { margin: "0", fontSize: "16px" });
    saveSectionTitle.textContent = "Сохранение";

    const saveHint = document.createElement("p");
    saveHint.className = "fantasy-text-dim";
    Object.assign(saveHint.style, { margin: "0", fontSize: "14px" });
    saveHint.textContent = "Билд, золото и дерево навыков.";

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "fantasy-button fantasy-button--danger";
    Object.assign(resetButton.style, { width: "100%" });
    resetButton.textContent = "Сбросить сохранение";

    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "fantasy-grain";
    Object.assign(confirmOverlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "3000",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--sp-5)",
      background: "radial-gradient(circle at center, rgba(27, 20, 16, 0.85), rgba(6, 4, 3, 0.96))",
      backdropFilter: "blur(3px)",
      color: "var(--color-text)",
      pointerEvents: "auto",
    });

    const confirmPanel = document.createElement("div");
    confirmPanel.className = "fantasy-panel fantasy-panel--ornate";
    Object.assign(confirmPanel.style, {
      maxWidth: "460px",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "var(--sp-4)",
      textAlign: "center",
    });

    const confirmTitle = document.createElement("h3");
    confirmTitle.className = "fantasy-title fantasy-title--section";
    Object.assign(confirmTitle.style, { margin: "0" });
    confirmTitle.textContent = "Сбросить сохранение?";

    const confirmText = document.createElement("p");
    confirmText.className = "fantasy-text-dim";
    Object.assign(confirmText.style, { margin: "0", fontSize: "15px", lineHeight: "1.6" });
    confirmText.textContent =
      "Билд вернётся к стандартному, золото и узлы дерева навыков обнулятся. Отменить это нельзя.";

    const confirmActions = document.createElement("div");
    Object.assign(confirmActions.style, { display: "flex", gap: "var(--sp-3)", justifyContent: "center" });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "fantasy-button fantasy-button--ghost";
    cancelButton.textContent = "Отмена";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "fantasy-button fantasy-button--danger";
    confirmButton.textContent = "Сбросить";

    confirmActions.append(cancelButton, confirmButton);
    confirmPanel.append(confirmTitle, confirmText, confirmActions);
    confirmOverlay.append(confirmPanel);

    const onDialogKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeDialog();
    };

    function openDialog() {
      confirmOverlay.style.display = "flex";
      document.addEventListener("keydown", onDialogKeyDown, true);
    }

    function closeDialog() {
      confirmOverlay.style.display = "none";
      document.removeEventListener("keydown", onDialogKeyDown, true);
    }

    resetButton.addEventListener("click", openDialog);
    cancelButton.addEventListener("click", closeDialog);
    confirmOverlay.addEventListener("click", (event) => {
      if (event.target === confirmOverlay) closeDialog();
    });
    confirmButton.addEventListener("click", () => {
      onResetProgress();
      closeDialog();
    });

    document.body.append(confirmOverlay);
    saveSection.append(saveSectionTitle, saveHint, resetButton);
  }

  root.append(audioSection, displaySection);
  if (saveSection) root.append(saveSection);

  function refresh() {
    syncAudioSettings();
    syncDisplaySettings();
  }
  refresh();

  return { root, refresh };
}
