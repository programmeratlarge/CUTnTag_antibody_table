// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  samples: [],          // string[] — all loaded sample names
  assigned: new Set(),  // Set<string> — samples already in a group
  groups: [],           // Group[] — saved groups
  // Group shape: { name, species, type, background, samples[] }

  selected: new Set(),  // Set<string> — currently highlighted in sample list
  selectedBg: null,     // string | null — selected background group name
  selectedDefinedGroup: null, // string | null — group being edited
  editingGroupName: null,     // string | null — original name when editing
  speciesList: [],       // Species[] loaded from /config
};

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function boot() {
  await loadConfig();
  wireEvents();
  updateSaveButton();
}

async function loadConfig() {
  try {
    const res = await fetch("/config");
    const data = await res.json();
    state.speciesList = data.species;
    document.getElementById("version-badge").textContent = `v${data.version}`;
    renderSpeciesRadios();
  } catch (e) {
    logMessage("error", `Failed to load config: ${e.message}`);
  }
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function wireEvents() {
  // File upload
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("bg-purple-50"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("bg-purple-50"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("bg-purple-50");
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) uploadFile(fileInput.files[0]);
  });

  // Group name uniqueness check
  document.getElementById("group-name").addEventListener("input", () => {
    validateGroupNameField();
    updateSaveButton();
  });

  // Type radio — when switching away from assay, clear bg selection if editing an assay
  document.querySelectorAll('input[name="type"]').forEach(r =>
    r.addEventListener("change", updateSaveButton)
  );

  // Species radios (delegated — rendered dynamically)
  document.getElementById("species-radios").addEventListener("change", updateSaveButton);

  // Save
  document.getElementById("save-btn").addEventListener("click", saveGroup);

  // Download
  document.getElementById("download-btn").addEventListener("click", downloadTsv);
}

// ─── File upload ──────────────────────────────────────────────────────────────

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/parse", { method: "POST", body: form });
    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      data.errors.forEach(e => logMessage("error", e));
    }
    if (data.samples && data.samples.length > 0) {
      // Reset everything when a new file is loaded
      state.samples = data.samples;
      state.assigned = new Set();
      state.groups = [];
      state.selected = new Set();
      state.selectedBg = null;
      state.selectedDefinedGroup = null;
      state.editingGroupName = null;
      renderAll();
      logMessage("ok", `Loaded ${data.samples.length} samples from ${file.name}`);
    }
  } catch (e) {
    logMessage("error", `Upload failed: ${e.message}`);
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderAll() {
  renderSampleList();
  renderBgGroups();
  renderDefinedGroups();
  renderMainTable();
  updateSaveButton();
  updateDownloadButton();
}

function renderSpeciesRadios() {
  const container = document.getElementById("species-radios");
  container.innerHTML = state.speciesList.map(s => `
    <label class="flex items-center gap-2 cursor-pointer">
      <input type="radio" name="species" value="${s.reference}" class="accent-purple-600" />
      <span>${s.alias}</span>
    </label>
  `).join("");
}

function renderSampleList() {
  const el = document.getElementById("sample-list");
  const visible = state.samples.filter(s => !state.assigned.has(s));

  if (visible.length === 0 && state.samples.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-300 italic p-2">Load a file to see samples</p>';
    return;
  }
  if (visible.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-400 italic p-2">All samples assigned ✓</p>';
    return;
  }

  el.innerHTML = visible.map(s => {
    const sel = state.selected.has(s) ? "selected" : "";
    return `<div class="sample-item ${sel}" data-name="${escHtml(s)}" title="${escHtml(s)}">${escHtml(s)}</div>`;
  }).join("");

  el.querySelectorAll(".sample-item").forEach(item => {
    item.addEventListener("click", e => toggleSampleSelection(item.dataset.name, e));
  });
}

function toggleSampleSelection(name, e) {
  if (e.shiftKey && state.lastClicked) {
    // Range select
    const visible = state.samples.filter(s => !state.assigned.has(s));
    const a = visible.indexOf(state.lastClicked);
    const b = visible.indexOf(name);
    if (a !== -1 && b !== -1) {
      const [lo, hi] = a < b ? [a, b] : [b, a];
      visible.slice(lo, hi + 1).forEach(s => state.selected.add(s));
    }
  } else if (e.ctrlKey || e.metaKey) {
    state.selected.has(name) ? state.selected.delete(name) : state.selected.add(name);
  } else {
    const alreadySolo = state.selected.size === 1 && state.selected.has(name);
    state.selected.clear();
    if (!alreadySolo) state.selected.add(name);
  }
  state.lastClicked = name;
  renderSampleList();
  updateSaveButton();
}

function renderBgGroups() {
  const el = document.getElementById("bg-group-list");
  const bgGroups = state.groups.filter(g => g.type === "background");
  if (bgGroups.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-300 italic p-1">No background groups yet</p>';
    return;
  }
  el.innerHTML = bgGroups.map(g => {
    const sel = state.selectedBg === g.name ? "selected" : "";
    return `<div class="group-row ${sel}" data-name="${escHtml(g.name)}">${escHtml(g.name)}</div>`;
  }).join("");

  el.querySelectorAll(".group-row").forEach(row => {
    row.addEventListener("click", () => {
      state.selectedBg = state.selectedBg === row.dataset.name ? null : row.dataset.name;

      if (state.selectedBg) {
        const selectedSpecies = document.querySelector('input[name="species"]:checked')?.value;
        const bgGroup = state.groups.find(g => g.name === state.selectedBg);
        if (selectedSpecies && bgGroup && bgGroup.species !== selectedSpecies) {
          logMessage("warning", `Species mismatch: assay group is "${selectedSpecies}" but background group "${bgGroup.name}" is "${bgGroup.species}"`);
        }
      }

      renderBgGroups();
    });
  });
}

function renderDefinedGroups() {
  const el = document.getElementById("defined-groups-list");
  if (state.groups.length === 0) {
    el.innerHTML = '<p class="text-xs text-gray-300 italic p-1">No groups yet</p>';
    return;
  }
  el.innerHTML = state.groups.map(g => {
    const badge = g.type === "background"
      ? '<span class="ml-1 text-gray-400 text-xs">(bg)</span>'
      : "";
    const sel = state.selectedDefinedGroup === g.name ? "selected" : "";
    return `<div class="group-row ${sel}" data-name="${escHtml(g.name)}">${escHtml(g.name)}${badge}</div>`;
  }).join("");

  el.querySelectorAll(".group-row").forEach(row => {
    row.addEventListener("click", () => startEditGroup(row.dataset.name));
  });
}

function renderMainTable() {
  const tbody = document.getElementById("main-table-body");
  const stats = document.getElementById("table-stats");

  if (state.groups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-gray-300 italic">Saved groups will appear here</td></tr>`;
    stats.textContent = "";
    return;
  }

  // Build flat rows sorted by group name then sample name
  const rows = [];
  const groupOrder = [...state.groups].sort((a, b) => a.name.localeCompare(b.name));
  groupOrder.forEach((g, idx) => {
    const colorClass = `group-color-${idx % 5}`;
    const sortedSamples = [...g.samples].sort();
    sortedSamples.forEach(s => {
      rows.push({ sample: s, species: g.species, type: g.type, group: g.name, bg: g.background, colorClass });
    });
  });

  tbody.innerHTML = rows.map(r => `
    <tr class="${r.colorClass}">
      <td class="px-3 py-1 font-mono">${escHtml(r.sample)}</td>
      <td class="px-3 py-1">${escHtml(r.species)}</td>
      <td class="px-3 py-1">${escHtml(r.type)}</td>
      <td class="px-3 py-1">${escHtml(r.group)}</td>
      <td class="px-3 py-1">${escHtml(r.bg)}</td>
    </tr>
  `).join("");

  const assigned = state.assigned.size;
  const total = state.samples.length;
  stats.textContent = `${state.groups.length} groups defined · ${assigned} / ${total} samples assigned`;
}

// ─── Save group ───────────────────────────────────────────────────────────────

function saveGroup() {
  const name = document.getElementById("group-name").value.trim();
  const speciesRadio = document.querySelector('input[name="species"]:checked');
  const typeRadio = document.querySelector('input[name="type"]:checked');

  if (!name || !speciesRadio || !typeRadio || state.selected.size === 0) return;

  const group = {
    name,
    species: speciesRadio.value,
    type: typeRadio.value,
    background: state.selectedBg || "",
    samples: [...state.selected],
  };

  if (state.editingGroupName) {
    // Replace existing group in-place
    const idx = state.groups.findIndex(g => g.name === state.editingGroupName);
    const old = state.groups[idx];

    // Un-assign the old samples, re-assign new ones
    old.samples.forEach(s => state.assigned.delete(s));
    group.samples.forEach(s => state.assigned.add(s));

    // If the old group was background, remove its name from other groups' backgrounds
    if (old.type === "background" && old.name !== name) {
      state.groups.forEach(g => { if (g.background === old.name) g.background = ""; });
    }

    state.groups[idx] = group;
    logMessage("ok", `Updated group "${name}"`);
  } else {
    group.samples.forEach(s => state.assigned.add(s));
    state.groups.push(group);
    logMessage("ok", `Saved group "${name}" (${group.type}, ${group.species}, ${group.samples.length} samples)`);
  }

  // Reset form
  document.getElementById("group-name").value = "";
  state.selected = new Set();
  state.selectedBg = null;
  state.selectedDefinedGroup = null;
  state.editingGroupName = null;

  renderAll();
}

// ─── Edit group ───────────────────────────────────────────────────────────────

function startEditGroup(groupName) {
  const group = state.groups.find(g => g.name === groupName);
  if (!group) return;

  // If clicking the already-selected group, deselect
  if (state.selectedDefinedGroup === groupName) {
    cancelEdit();
    return;
  }

  // If we were editing another group, first un-restore it (just close silently)
  if (state.editingGroupName) {
    const prev = state.groups.find(g => g.name === state.editingGroupName);
    if (prev) prev.samples.forEach(s => state.assigned.add(s));
  }

  state.editingGroupName = groupName;
  state.selectedDefinedGroup = groupName;

  // Un-assign samples so they become visible in the list
  group.samples.forEach(s => state.assigned.delete(s));

  // Populate form fields
  document.getElementById("group-name").value = group.name;

  const speciesInput = document.querySelector(`input[name="species"][value="${group.species}"]`);
  if (speciesInput) speciesInput.checked = true;

  document.querySelector(`input[name="type"][value="${group.type}"]`).checked = true;

  state.selected = new Set(group.samples);
  state.selectedBg = group.background || null;

  renderAll();
  logMessage("info", `Editing group "${groupName}" — make changes then click Save group`);
}

function cancelEdit() {
  if (state.editingGroupName) {
    const group = state.groups.find(g => g.name === state.editingGroupName);
    if (group) group.samples.forEach(s => state.assigned.add(s));
  }
  state.editingGroupName = null;
  state.selectedDefinedGroup = null;
  state.selected = new Set();
  state.selectedBg = null;
  document.getElementById("group-name").value = "";
  renderAll();
}

// ─── Download ─────────────────────────────────────────────────────────────────

async function downloadTsv() {
  const projectId = document.getElementById("project-id").value.trim();

  // Build flat rows (same sort as table)
  const allRows = [];
  const groupOrder = [...state.groups].sort((a, b) => a.name.localeCompare(b.name));
  groupOrder.forEach(g => {
    [...g.samples].sort().forEach(s => {
      allRows.push({ sample_name: s, species: g.species, type: g.type, group: g.name, background: g.background });
    });
  });

  try {
    const res = await fetch("/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: allRows, project_id: projectId }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : "sample_metadata.tsv";

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    logMessage("ok", `Downloaded ${filename}`);
  } catch (e) {
    logMessage("error", `Download failed: ${e.message}`);
  }
}

// ─── Button state ─────────────────────────────────────────────────────────────

function validateGroupNameField() {
  const name = document.getElementById("group-name").value.trim();
  const errEl = document.getElementById("group-name-error");
  const existing = state.groups.map(g => g.name).filter(n => n !== state.editingGroupName);
  const isDuplicate = name.length > 0 && existing.includes(name);
  errEl.classList.toggle("hidden", !isDuplicate);
}

function updateSaveButton() {
  const name = document.getElementById("group-name").value.trim();
  const speciesChecked = !!document.querySelector('input[name="species"]:checked');
  const typeChecked = !!document.querySelector('input[name="type"]:checked');
  const hasSelected = state.selected.size > 0;

  const existing = state.groups.map(g => g.name).filter(n => n !== state.editingGroupName);
  const nameOk = name.length > 0 && !existing.includes(name);

  const btn = document.getElementById("save-btn");
  btn.disabled = !(hasSelected && speciesChecked && typeChecked && nameOk);
}

function updateDownloadButton() {
  const allAssigned = state.samples.length > 0 && state.assigned.size === state.samples.length;
  const btn = document.getElementById("download-btn");
  const hint = document.getElementById("download-hint");
  btn.disabled = !allAssigned;
  hint.classList.toggle("hidden", allAssigned || state.samples.length === 0);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function logMessage(level, text) {
  const el = document.getElementById("messages");
  const icons = { ok: "✓", error: "✗", info: "ℹ", warning: "⚠" };
  const colors = { ok: "text-green-600", error: "text-red-600", info: "text-blue-600", warning: "text-yellow-600" };
  const icon = icons[level] || "·";
  const color = colors[level] || "";
  const textStyle = level === "warning" ? "text-red-600 font-bold" : "";
  const line = document.createElement("div");
  line.innerHTML = `<span class="${color} font-bold">${icon}</span> <span class="${textStyle}">${escHtml(text)}</span>`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Start ────────────────────────────────────────────────────────────────────
boot();
