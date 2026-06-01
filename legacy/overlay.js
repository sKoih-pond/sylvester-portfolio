(function () {
  const dialogs = document.querySelectorAll("dialog.overlay-dialog");
  if (!dialogs.length) return;

  document.addEventListener("click", event => {
    const opener = event.target.closest("[data-overlay-open]");
    if (opener) {
      event.preventDefault();
      const id = opener.getAttribute("data-overlay-open");
      const dialog = document.getElementById(id);
      if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
        document.body.classList.add("overlay-open");
      }
      return;
    }

    const closer = event.target.closest("[data-overlay-close]");
    if (closer) {
      const dialog = closer.closest("dialog");
      if (dialog) dialog.close();
    }
  });

  dialogs.forEach(dialog => {
    // Backdrop click: only close when the click target is the dialog itself,
    // not its inner panel.
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });

    // Restore body scroll on close, regardless of how the close was triggered
    // (ESC, button, backdrop, or programmatic).
    dialog.addEventListener("close", () => {
      document.body.classList.remove("overlay-open");
    });
  });
})();
