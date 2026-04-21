![CUTnTag antibody table](./header_image.png)

# CUTnTag antibody table
Build a table of samples, grouped by species and antibody, for CUTnTag pipeline

## Live App

👉 **[http://cbsugenomics2.biohpc.cornell.edu:7862/](http://cbsugenomics2.biohpc.cornell.edu:7862/)**

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-org>/CUTnTag_antibody_table.git
cd CUTnTag_antibody_table

# Install dependencies (requires uv)
uv sync

# Start the server
uv run uvicorn cutntagtable.main:app --reload --port 7862

# Open in your browser
# http://localhost:7862
```

> **Requirements:** Python 3.12+, [uv](https://docs.astral.sh/uv/)

---

## User Guide

### 1. Load your sample list

Drag and drop a plain-text file onto the upload area, or click **click to browse** to select one.
The file must be two-column and tab-delimited with no header row. The first column is ignored; sample names are read from the second column. This text input file can be found in the project directory under `/local/Illumina/DRV/` and is typically named `2nd-rename-<order-ID>.txt`.

Example sample names from 2nd column of input file:

```
1	A1_HEK293A_H3K27me3_10486710_23GVWTLT3_L2
2	A2_HEK293B_H3K27me3_10486710_23GVWTLT3_L2
3	E1_HEK293A_Ig23GVWTLT3_L2
4	E2_HEK293B_Ig23GVWTLT3_L2
```

Once loaded, all sample names appear in the **Select samples to group** list.

### 2. Define groups

For each group you want to create:

1. **Select samples** — click one or more sample names in the list. Use **Ctrl+click** to add individual samples or **Shift+click** to select a range.
2. **Choose a species** — pick from the radio buttons (Human, Mouse, Fly, etc.).
3. **Choose a type** — **Assay** or **Background**.
4. **Enter a group name** — must be unique (e.g. `HEK293_H3K27me3`).
5. **Link a background group** *(optional, assay groups only)* — once you have saved at least one background group, it will appear in the **Background groups** list. Click it to link it to the current assay group.
6. Click **Save group**.

The group is added to the preview table on the right, and the assigned samples are hidden from the sample list so they cannot be placed into a second group.

### 3. Edit a group

Click any row in the **Select group to edit** list. The form repopulates with that group's settings and the samples become selectable again. Adjust anything you like, then click **Save group** to apply the changes. Clicking the same row again cancels the edit without saving.

### 4. Download the metadata table

Once every sample has been assigned to a group, the **Download .tsv** button becomes active. Optionally enter a **Project ID** — if provided, it is prepended to the filename.

The downloaded file is tab-separated with the following columns:

| sample_name | species | type | group | background |
|-------------|---------|------|-------|------------|

Filename format:
- With project ID: `<project_id>_sample_metadata_<YYYYMMDD_HHMMSS>.tsv`
- Without project ID: `sample_metadata_<YYYYMMDD_HHMMSS>.tsv`

### Species reference

Species options are loaded from `config.yaml`. The radio button labels are the human-readable aliases; the value written to the output file is the genome reference identifier.

| Alias | Reference written to TSV |
|-------|--------------------------|
| Human | hg38 |
| Mouse | mm10 |
| Fly | dm6 |
| Arabidopsis | TAIR10 |
| Escherichia coli | MG1655 |
| Bos taurus | BosTau9 |
| Horse | equcab3 |

To add or change species, edit `config.yaml` and reload the page — no server restart required.

---

## Docker

### Build the image

```bash
docker build -t cutntagtable -f docker/Dockerfile .
```

### Run the container

```bash
docker run -p 7862:7862 cutntagtable
```

Then open [http://localhost:7862](http://localhost:7862) in your browser.

### Use a custom config

Mount a local `config.yaml` to override the species list without rebuilding the image:

```bash
docker run -p 7862:7862 -v "$(pwd)/config.yaml:/app/config.yaml" cutntagtable
```

### Environment notes

- The container exposes **port 7862**.
- The server binds to `0.0.0.0` inside the container, so it is reachable from the host and from other machines on the same network.
- For server deployments, consider placing a reverse proxy (nginx, Caddy) in front of the container to handle TLS.

---

## Running Tests

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest tests/test_io.py -v
```

Tests are located in `tests/` and cover:

| File | What it tests |
|------|---------------|
| `tests/test_io.py` | Sample file parsing, TSV export format |
| `tests/test_validation.py` | Empty/duplicate sample names, group name validation |

Test fixtures (e.g. a 30-sample input file) live in `tests/fixtures/`.

---

## Project Structure

```
CUTnTag_antibody_table/
├── config.yaml                  # Species definitions (alias + genome reference)
├── pyproject.toml               # uv project definition and dependencies
├── README.md
├── CLAUDE.md                    # Development spec and AI assistant instructions
├── PROJECT_PLAN.md              # Phased implementation plan
│
├── src/
│   └── cutntagtable/
│       ├── __init__.py
│       ├── main.py              # FastAPI app, routes, static file serving
│       ├── config.py            # Reads config.yaml → species list
│       ├── models.py            # Pydantic models: Species, Group, TableRow, ExportRequest
│       ├── io.py                # parse_samples(), export_to_tsv()
│       └── validation.py       # validate_samples(), validate_group()
│
├── static/
│   ├── index.html               # Single-page UI
│   ├── app.js                   # All UI logic (vanilla JS, no framework)
│   └── style.css                # Custom CSS (Tailwind via CDN + listbox/color styles)
│
├── tests/
│   ├── test_io.py
│   ├── test_validation.py
│   └── fixtures/
│       └── sample_list.txt      # 30-sample example file
│
└── docker/
    └── Dockerfile
```

### Architecture summary

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | HTML + Vanilla JS + Tailwind CSS | Full UI, all group state held in browser |
| Backend | Python + FastAPI | Config delivery, file parsing, TSV export |
| Config | `config.yaml` | Species list, hot-reloadable |
| Packaging | Docker | Reproducible deployment |
| Dep management | `uv` | Exclusive package manager |

All application state (loaded samples, defined groups, assignments) lives in the browser. The Python backend is stateless — a page refresh resets the session.

---

## Update History

| Version | Date | Description |
|--------:|------|-------------|
| v0.2.1 | 2026-04-21 | Add Ignore sample type; fix export validation error for Ignore type; species mismatch warning; two-column input file format |
| v0.2.0 | 2026-04-16 | Full implementation: FastAPI backend, vanilla JS UI, sample grouping workflow, TSV export, Docker support, test suite |
| v0.1.0 | 2026-04-15 | Initial commit |
