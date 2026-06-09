(function () {
  function isIndex(part) {
    return /^\d+$/.test(part);
  }

  function coerce(input) {
    const type = input.dataset.jsonType || "string";
    if (type === "boolean") return input.checked;
    if (type === "number") {
      if (input.value === "") return 0;
      const parsed = Number(input.value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return input.value;
  }

  function assign(root, path, value) {
    const parts = String(path || "").split(".").filter(Boolean);
    if (!parts.length) return;
    let cursor = root;
    parts.forEach(function (part, index) {
      const key = isIndex(part) ? Number(part) : part;
      const isLast = index === parts.length - 1;
      const nextPart = parts[index + 1];
      if (isLast) {
        cursor[key] = value;
        return;
      }
      if (cursor[key] === undefined || cursor[key] === null) {
        cursor[key] = isIndex(nextPart) ? [] : {};
      }
      cursor = cursor[key];
    });
  }

  function rebuildJson(form) {
    const output = form.querySelector("[data-json-output]");
    if (!output) return;
    const root = output.dataset.rootType === "array" ? [] : {};
    form.querySelectorAll("[data-json-path]").forEach(function (input) {
      assign(root, input.dataset.jsonPath, coerce(input));
    });
    output.value = JSON.stringify(root);
  }

  document.querySelectorAll("[data-admin-json-form]").forEach(function (form) {
    form.addEventListener("input", function () {
      rebuildJson(form);
    });
    form.addEventListener("change", function () {
      rebuildJson(form);
    });
    form.addEventListener("submit", function () {
      rebuildJson(form);
    });
  });

  function previewTarget(id) {
    return document.querySelector(`[data-image-preview="${id}"]`);
  }

  document.querySelectorAll("[data-image-preview-input]").forEach(function (input) {
    input.addEventListener("input", function () {
      const preview = previewTarget(input.dataset.imagePreviewInput);
      if (!preview) return;
      preview.src = input.value || preview.getAttribute("src");
    });
  });

  document.querySelectorAll("[data-image-preview-file]").forEach(function (input) {
    input.addEventListener("change", function () {
      const preview = previewTarget(input.dataset.imagePreviewFile);
      const file = input.files && input.files[0];
      if (!preview || !file) return;

      const reader = new FileReader();
      reader.addEventListener("load", function () {
        preview.src = reader.result;
      });
      reader.readAsDataURL(file);
    });
  });
})();
