# CUTnTag Antibody Table – Project Plan

## Goal

Build a browser-based tool (Python backend + Node.js/HTML frontend) that lets a biologist
load a flat list of sample names, interactively assign those samples into labeled groups
(species, assay/background, group name, background link), and export a tab-separated
metadata table ready for the CUTnTag pipeline.

---

## Architecture Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Plain HTML + Vanilla JS + Tailwind CSS | Zero build step, runs anywhere, matches spec |
| Backend | Python (FastAPI) served via `uv` | Thin REST API for config, file parsing, and TSV export |
| Config | `config.yaml` | Species list lives here; hot-reloadable |
| Packaging | Docker | Reproducible server deployment |
| Dep mgmt | `uv` exclusively | Required by CLAUDE.md |

The frontend is a single `index.html` + `app.js` served by FastAPI's `StaticFiles`.
All state is held in the browser. The Python backend handles only:
- `GET /config` → species list from config.yaml
- `POST /parse` → receives uploaded file bytes, returns JSON list of sample names
- `POST /export` → receives table JSON, returns .tsv bytes

This keeps the Python side trivially testable and avoids a heavy JS framework.

---

## Directory Layout (target)

```
CUTnTag_antibody_table/
├── pyproject.toml            # uv project
├── config.yaml               # species definitions
├── CLAUDE.md
├── README.md
├── PROJECT_PLAN.md           # this file
├── ui_mockup.html            # UI design reference
│
├── src/
│   └── cutntagtable/
│       ├── __init__.py
│       ├── main.py           # FastAPI app + StaticFiles mount
│       ├── config.py         # load config.yaml → species list
│       ├── models.py         # Pydantic: Sample, Group, TableRow
│       ├── io.py             # parse_samples(), export_to_tsv()
│       └── validation.py     # validate_samples(), validate_group()
│
├── static/
│   ├── index.html            # full single-page UI
│   ├── app.js                # all UI logic (vanilla JS)
│   └── style.css             # minimal custom CSS (Tailwind via CDN)
│
├── tests/
│   ├── test_io.py
│   ├── test_validation.py
│   └── fixtures/
│       └── sample_list.txt   # 30-sample fixture from spec
│
└── docker/
    └── Dockerfile
```

---

## To-Do List

### Phase 1 — Project Scaffold

- [ ] **1.1** Run `uv init` and create `pyproject.toml` with Python 3.12+
- [ ] **1.2** Add dependencies: `fastapi`, `uvicorn`, `pyyaml`, `pydantic`, `pytest`
- [ ] **1.3** Create `src/cutntagtable/` package with `__init__.py`
- [ ] **1.4** Create `static/` directory and placeholder `index.html`
- [ ] **1.5** Create `tests/fixtures/sample_list.txt` with the 30-sample example

### Phase 2 — Python Backend

- [ ] **2.1** `config.py` — `load_species(path) -> list[Species]` (reads config.yaml)
- [ ] **2.2** `models.py` — Pydantic models: `Species`, `Group`, `TableRow`, `ExportRequest`
- [ ] **2.3** `io.py`
  - `parse_samples(content: bytes) -> list[str]` (strips blanks, deduplicates)
  - `export_to_tsv(rows: list[TableRow]) -> str`
- [ ] **2.4** `validation.py`
  - `validate_samples(names: list[str]) -> list[str]` (errors: empty, duplicate)
  - `validate_group(group: Group, existing_groups: list[Group]) -> list[str]` (duplicate name)
- [ ] **2.5** `main.py` — FastAPI routes:
  - `GET /config` → species list
  - `POST /parse` → UploadFile → sample name list + validation errors
  - `POST /export` → ExportRequest → StreamingResponse (.tsv)
  - Mount `static/` at `/`

### Phase 3 — Frontend (HTML + JS)

- [ ] **3.1** `index.html` — full page layout matching mockup (3-column: samples | controls | table)
- [ ] **3.2** `app.js` — state management
  - `state` object: `{ samples, groups, selectedSamples, editingGroup }`
  - `renderSampleList()` — shows/hides assigned samples
  - `renderDefinedGroups()` — list with (bg) badge
  - `renderBackgroundGroups()` — filtered list of background-type groups
  - `renderMainTable()` — sorted by group+sample, color-coded by group index
- [ ] **3.3** File upload: drag-and-drop + file input → `POST /parse` → populate sample list
- [ ] **3.4** Save Group logic:
  - Validate: ≥1 sample selected, species selected, type selected, group name non-empty and unique
  - Enable/disable Save button reactively
  - On save: update state, hide assigned samples, clear form
- [ ] **3.5** Edit group: click row in `defined_groups` → repopulate all form fields, unhide samples
- [ ] **3.6** Download: enabled when all samples assigned → `POST /export` → browser download
- [ ] **3.7** Messages area: show load confirmation, save confirmations, validation errors

### Phase 4 — Tests

- [ ] **4.1** `test_io.py`
  - `test_parse_samples_basic` — 30-line fixture → 30 names
  - `test_parse_samples_strips_blanks` — blank lines ignored
  - `test_parse_samples_strips_whitespace` — leading/trailing spaces removed
  - `test_export_to_tsv_header` — first row is correct header
  - `test_export_to_tsv_tab_separated` — fields joined by tab
  - `test_export_to_tsv_empty_background` — background column empty string, not "None"
- [ ] **4.2** `test_validation.py`
  - `test_validate_samples_duplicate` → returns error
  - `test_validate_samples_empty_name` → returns error
  - `test_validate_group_duplicate_name` → returns error
  - `test_validate_group_unique_name` → no error

### Phase 5 — Docker

- [ ] **5.1** `docker/Dockerfile` — Python 3.12 base, install uv, copy project, `uv sync`, expose 7862
- [ ] **5.2** Test: `docker build` + `docker run -p 7862:7862` works
- [ ] **5.3** Update README with Docker run instructions

### Phase 6 — Polish

- [ ] **6.1** Tailwind purple/blue gradient styling on header, buttons, table header
- [ ] **6.2** Color-cycling group rows in main table (5 pastel colors, cycling)
- [ ] **6.3** Filename includes project id + timestamp: `sample_metadata_<timestamp>.tsv`
- [ ] **6.4** Version string shown in UI header
- [ ] **6.5** Update README.md with usage instructions and example screenshot

---

## Key Design Decisions

### Why FastAPI + static files instead of a full Node.js server?

The spec says "Node.js preferred" but also says Python 3.12 + uv is the primary language. Using
FastAPI to serve static HTML/JS gives us the Node.js-style browser UI without requiring Node.js
in the Docker image, keeping the container smaller and the `uv`-only requirement satisfied.
**Revisit this if the user prefers a separate Node.js server.**

### State lives in the browser

All group definitions, sample assignments, and table state are held in a JS `state` object.
The Python backend is stateless. This means:
- No session management
- Browser refresh resets state (acceptable for a tool, not a service)
- Backend is trivially testable

### Species list is hot-reloadable

`GET /config` reads `config.yaml` on every request. Users can edit config.yaml and reload
the page without restarting the server.

---

## Running the App (planned)

```bash
# Install deps
uv sync

# Start server
uv run uvicorn cutntagtable.main:app --reload --port 7862

# Open browser
# http://localhost:7862
```

---

## Decisions (confirmed 2026-04-15)

1. **FastAPI + static HTML** with Tailwind CSS via CDN. No separate Node.js server.
2. **No session persistence** — browser refresh resets state. Acceptable for this tool.
3. **Optional project ID** text box in the UI. Filename logic:
   - If project ID entered: `<project_id>_sample_metadata_<timestamp>.tsv`
   - If blank: `sample_metadata_<timestamp>.tsv`
