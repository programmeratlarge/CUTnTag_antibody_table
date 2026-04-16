# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CUTnTag antibody table** is a python / node.js app running in a docker container that enables a user to read in a list of samples from a biology experiment and group them together by species and antibody. It also allows samples to be labled as either "assay" or "background" and then further enables assay groups to be associated with the appropriate background group.

In practice, it provides an interface that allows a user to easily create groups of samples and attach labels to those groups, such as species, assay/background, and group name, then saves those sample names and labels in a table (i.e. a tab separated text file).

The project focuses on ease of use, since setting up the table by hand is prone to error.

# CUTnTag antibody table – Technical Specification

## 1. Overview

**CUTnTag_antibody_table** is a Node.js / Python-based utility app able to read in a text file of sample names and build a table that groups those samples and add lables for species, type, group name, and background.

The primary goals are:

* Ease of use to avoid errors in table setup.
* Create a tab separated text file in a format that can be used in a subsequent process (see below for format requrements).
* Run locally in a Windows + Python environment, with optional Dockerized deployment and simple web UI (e.g., Node.js).

---

## 2. Target Runtime Environment

* **OS**: Windows 10/11 (primary development and usage environment).
* **Editor**: Cursor (VS Code fork); project structure should be friendly to VS Code/Cursor (e.g., `.vscode` tasks optional).
* **Language**: Python 3.12+ (managed via `uv`).
* **Dependency Management**: `uv` (for creating virtual environments and managing dependencies).
* **UI Framework**: Node.js (preferred) for a local browser-based interface.
* **CSS styling**: Tailwind CSS for accent styling (purple/blue gradients for headers, tabs, and buttons). 
* **Containerization**: Docker for packaging a reproducible environment and deploying the app on a server.

**CRITICAL**: This project uses `uv` exclusively for Python package management.

**Always use:**
```bash
uv add package_name          # Add dependencies
uv run script.py            # Run Python scripts
```

**Never use:**
```bash
pip install xxx            # WRONG
python script.py           # WRONG
python -m module           # WRONG
python -c "code"           # WRONG
```

**Important notes:**
- It's acceptable to have nested uv projects (subdirectory of another uv project)
- `uv` may show warnings about nested projects - these are usually not problems
- Favor Python scripts over shell/PowerShell scripts for platform independence

---

## 3. Core Concepts / How the app will work:

The UI will consit of a file browser selection (allowing file selection or drag and drop) to get the input list of samples (a single column text file with no header).

Next, it will have an listbox to display this list - the user will be able to click on multiple samples to select them. This window will be labeled "Select samples to group:"

Next to this will be radio buttons for species - the list of species will come from the config.yaml file which has the following format:

species:
  - alias: "Human"
    reference: "hg38"
  - alias: "Mouse"
    reference: "mm10"
  - alias: "Fly"
    reference: "dm6"
  - alias: "Arabidopsis"
    reference: "TAIR10"
  - alias: "Escherichia coli"
    reference: "MG1655"
  - alias: "Bos taurus"
    reference: "BosTau9"
  - alias: "Horse"
    reference: "equcab3"

The label on each radio button will come from the "alias" field

Next will be radio buttons for "Assay" or "Background" - call this type

Next will be a text box for the group name - group names are unique - the user cannot enter a group name that has already been defined.

Next will be a listbox with a list of groups that already have the label "Background" - this is a selectable list (one selection only) and will initially be blank, until one or more background groups have beed defined. This listbox will be labeled "Background groups". Call this background_groups

Next will be a list of all groups that have been defined - this is a selectable list (one selection only) and will initially be blank, until one or more groups have beed defined (both assay and background). This listbox will be labeled "Select group to edit". Call this defined_groups

Last, will be a larger window area that displays the table that will be output. This table will have the following columns: "sample name", "species", "type", "group", and "background"
samples within this window will be sorted by "group" and then by "sample name" and each group background will have a different color to distingush them. Call this the main table. it is not selectable or editable.

Below the listbox displaying the initial sample list there will be a button labeled "Save group" - initially disabled - it will only become enabled when everything required for a table entry has been selected. i.e. one or more samples have been selected, a species has been selected, a type has been selected, and a group has been entered (the background column is optional). Note: one or more samples can be selected from the samples list. The value for the background column is made by selecting a row in the background_groups listbox - one one row can be selected.

Once the required values are present the "Save group" button is enabled - when clicked, the selected samples and the species and the type and the group (and the background if entered) are populated in the appropriate columns of the main table. Next the group name is added to the defined_groups list and is the type entered is "background" then the group name is added to the background_groups list. Last, hide the samples in this group from the samples list, so that they cannot be selected for a different group (i.e. a sample can only be in one group). Disable the "Save group" button, ready for the next group to be defined.

When all samples have been assigned to groups (i.e. the sample selection has all entries hidden), then the "Download" button will be enabled. Clicking this button will output the main table to a tab separated file named sample_metadata_<timestamp>.tsv with one header row ("sample name", "species", "type", "group", and "background") and all of the rows from the main table.

At any time the user will have the ability to edit defined groups. By clicking on a row in the defined_groups listbox, entries for that group will be populated into the appropriate fields (i.e. the samples will be unhidden from the samples listbox, the species and type radio buttons will be selected, the group name will populate into the group name text box and the background selection, if any will be highlighted in the background_groups listbox). The user will then be able to make changes to any of these and then save the group again.

Here is an example of the input text file:

A1_HEK293A_H3K27me3_10486710_23GVWTLT3_L2
A2_HEK293B_H3K27me3_10486710_23GVWTLT3_L2
A3_mCD8A_H3K27me3_10486710_23GVWTLT3_L2
A4_mCD8B_H3K27me3_10486710_23GVWTLT3_L2
A5_hCD8A_H3K27me3_10486710_23GVWTLT3_L2
A6_hCD8B_H3K27me3_10486710_23GVWTLT3_L2
B1_HEK293A_H3K4me1_10486710_23GVWTLT3_L2
B2_HEK293B_H3K4me1_10486710_23GVWTLT3_L2
B3_mCD8A_H3K4me1_10486710_23GVWTLT3_L2
B4_mCD8B_H3K4me1_10486710_23GVWTLT3_L2
B5_hCD8A_H3K4me1_10486710_23GVWTLT3_L2
B6_hCD8B_H3K4me1_10486710_23GVWTLT3_L2
C1_HEK293A_H3K4me3_10486710_23GVWTLT3_L2
C2_HEK293B_H3K4me3_10486710_23GVWTLT3_L2
C3_mCD8A_H3K4me3_10486710_23GVWTLT3_L2
C4_mCD8B_H3K4me3_10486710_23GVWTLT3_L2
C5_hCD8A_H3K4me3_10486710_23GVWTLT3_L2
C6_hCD8B_H3K4me3_10486710_23GVWTLT3_L2
D1_HEK293A_H3K27ac_10486710_23GVWTLT3_L2
D2_HEK293B_H3K27ac_10486710_23GVWTLT3_L2
D3_mCD8A_H3K27ac_10486710_23GVWTLT3_L2
D4_mCD8B_H3K27ac_10486710_23GVWTLT3_L2
D5_hCD8A_H3K27ac_10486710_23GVWTLT3_L2
D6_hCD8B_H3K27ac_10486710_23GVWTLT3_L2
E1_HEK293A_Ig23GVWTLT3_L2
E2_HEK293B_Ig23GVWTLT3_L2
E3_mCD8A_Ig23GVWTLT3_L2
E4_mCD8B_Ig23GVWTLT3_L2
E5_hCD8A_Ig23GVWTLT3_L2
E6_hCD8B_Ig23GVWTLT3_L2

And here is an example of the output file format:

sample_name species type  group background
A1_HEK293A_H3K27me3_10486710_23GVWTLT3_L2 hg38  assay HEK293_H3K27me3 HEK293_Ig23GVWTLT3
A2_HEK293B_H3K27me3_10486710_23GVWTLT3_L2 hg38  assay HEK293_H3K27me3 HEK293_Ig23GVWTLT3
A3_mCD8A_H3K27me3_10486710_23GVWTLT3_L2 mm10  assay mCD8_H3K27me3 mCD8_Ig23GVWTLT3
A4_mCD8B_H3K27me3_10486710_23GVWTLT3_L2 mm10  assay mCD8_H3K27me3 mCD8_Ig23GVWTLT3
A5_hCD8A_H3K27me3_10486710_23GVWTLT3_L2 hg38  assay hCD8_H3K27me3 hCD8_Ig23GVWTLT3
A6_hCD8B_H3K27me3_10486710_23GVWTLT3_L2 hg38  assay hCD8_H3K27me3 hCD8_Ig23GVWTLT3
B1_HEK293A_H3K4me1_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K4me1  HEK293_Ig23GVWTLT3
B2_HEK293B_H3K4me1_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K4me1  HEK293_Ig23GVWTLT3
B3_mCD8A_H3K4me1_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K4me1  mCD8_Ig23GVWTLT3
B4_mCD8B_H3K4me1_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K4me1  mCD8_Ig23GVWTLT3
B5_hCD8A_H3K4me1_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K4me1  hCD8_Ig23GVWTLT3
B6_hCD8B_H3K4me1_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K4me1  hCD8_Ig23GVWTLT3
C1_HEK293A_H3K4me3_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K4me3  HEK293_Ig23GVWTLT3
C2_HEK293B_H3K4me3_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K4me3  HEK293_Ig23GVWTLT3
C3_mCD8A_H3K4me3_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K4me3  mCD8_Ig23GVWTLT3
C4_mCD8B_H3K4me3_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K4me3  mCD8_Ig23GVWTLT3
C5_hCD8A_H3K4me3_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K4me3  hCD8_Ig23GVWTLT3
C6_hCD8B_H3K4me3_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K4me3  hCD8_Ig23GVWTLT3
D1_HEK293A_H3K27ac_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K27ac  HEK293_Ig23GVWTLT3
D2_HEK293B_H3K27ac_10486710_23GVWTLT3_L2  hg38  assay HEK293_H3K27ac  HEK293_Ig23GVWTLT3
D3_mCD8A_H3K27ac_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K27ac  mCD8_Ig23GVWTLT3
D4_mCD8B_H3K27ac_10486710_23GVWTLT3_L2  mm10  assay mCD8_H3K27ac  mCD8_Ig23GVWTLT3
D5_hCD8A_H3K27ac_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K27ac  hCD8_Ig23GVWTLT3
D6_hCD8B_H3K27ac_10486710_23GVWTLT3_L2  hg38  assay hCD8_H3K27ac  hCD8_Ig23GVWTLT3
E1_HEK293A_Ig23GVWTLT3_L2 hg38  background  HEK293_Ig23GVWTLT3  
E2_HEK293B_Ig23GVWTLT3_L2 hg38  background  HEK293_Ig23GVWTLT3  
E3_mCD8A_Ig23GVWTLT3_L2 mm10  background  mCD8_Ig23GVWTLT3  
E4_mCD8B_Ig23GVWTLT3_L2 mm10  background  mCD8_Ig23GVWTLT3  
E5_hCD8A_Ig23GVWTLT3_L2 hg38  background  hCD8_Ig23GVWTLT3  
E6_hCD8B_Ig23GVWTLT3_L2 hg38  background  hCD8_Ig23GVWTLT3  

---

## 4. Functional Requirements

### 4.1 File Input & Parsing

* Users can load a test sample list via:

  * File browser selection.
  * Drag-and-drop (supported by the UI framework).

* Supported formats:

  * `.tsv` (primary).
  * Optionally `.csv` (configurable).

* Rows with all required fields blank should be ignored; partial rows must be validated and either accepted or flagged.

### 4.2 Validation Logic

Validation runs immediately after file load and before any calculations.

#### 4.2.1 Column Presence

* All required columns must be present (case-insensitive match, but normalized internally).
* If any required column is missing:

  * Show blocking error (no calculations performed).
  * Error message should list missing columns.

#### 4.2.2 Data Type & Value Constraints

For each row:

  * All samples must be associated with a group.
  * Each group name should be unique.
  * Each group must have a species, type, and group name. The background lable is optional
  * Treat as blocking errors.

Validation behavior:

* If any blocking error occurs (e.g., missing required field, bad data type, negative/zero where not allowed):

  * Display detailed error messages in a text area.
  * Prevent downstream calculations.

* Non-blocking warnings should be surfaced but do not necessarily prevent calculations unless thresholds are exceeded.

#### 4.2.3 Uniqueness

* If duplicates are found:

  * List duplicates and corresponding rows.
  * Treat as blocking errors.

Sanity checks:

  * All samples must be associated with a group.
  * Each group name should be unique.
  * Each group must have a species, type, and group name. The background lable is optional
  * Treat as blocking errors.

### 4.4 Outputs

#### 4.4.1 On-Screen Tables

Selectable list of samples
Selectable list of background groups
Table showing groups that have been defined with their associated lables

#### 4.4.2 Downloadable Files

* Export options:

  * `.tsv` exports for core table.

  Tab separated text file with the following columns: "sample name", "species", "type", "group", and "background"

* Timestamps and project identifiers should be included in filenames. e.g.: <project_id>_sample_metadata_<timestamp>.tsv

### 4.5 UI/UX Requirements (Gradio or Similar)

* Main layout:

  1. **File upload panel**

     * Drag-and-drop area + file browser button.

  2. **Global parameters panel**

     * Inputs for:

       * Selectable list of samples 
       * Radio buttons for species
       * Radio buttons for assay or background
       * Text box for group name
       * Selectable list of background groups

  3. **Validation & messages**

     * Scrollable text area to show:

       * Errors (blocking).
       * Warnings (non-blocking).
       * Summary

  4. **Results**

     * Tabbed interface for:

       * Color coded sample groups 
       * Labels associated with each group

  5. **Export controls**

     * Buttons for:

       * Downloading tab separated text file

* States:

  * Before file upload: disabled calculation controls and empty tables.
  * After successful validation: enable “Download” button.
  * After calculation: show tables and export options.

---

## 5. Architecture & Code Organization

### 5.1 Project Structure

Example layout:

```text
CUTnTag_antibody_table/
  pyproject.toml        # uv-managed project definition
  README.md
  CLAUDE.md             # development instructions / spec
  src/
    CUTnTag_antibody_table/
      __init__.py
      config.py         # default parameters, thresholds
      models.py         # dataclasses / Pydantic models for Library, Project, etc.
      io.py             # spreadsheet parsing and serialization
      validation.py     # validation routines
      compute.py        # xxx + xxx algorithms
      ui.py             # Gradio app definitions
      logging_utils.py  # logging helpers (optional)
  tests/
    test_io.py
    test_validation.py
    test_compute.py
  docker/
    Dockerfile
  .gitignore
```

### 5.2 Data Models

Use dataclasses or Pydantic models for strong typing and validation.

### 5.3 Modules

* `io.py`

  * Functions:

    * `load_samples(path_or_bytes) -> pd.DataFrame`
    * `export_results_to_tsv(...) -> bytes or file path`

* `validation.py`

  * Functions:

    * `validate_columns(df) -> list[Error]`
    * `validate_rows(df) -> list[Error]`
    * `validate_uniqueness(df) -> list[Error]`
    * `run_all_validations(df) -> (clean_df, errors, warnings)`

---

## 6. Non-Functional Requirements

* **Robustness**:

  * Must handle spreadsheets with xxx.
  * Clear error messages whenever computation cannot proceed.

* **Performance**:

  * Typical dataset should process in under a few seconds.

* **Reproducibility**:

  * Versions of assumptions (e.g., xxx) encoded as constants in `config.py`.
  * Include app version string and timestamp in exports.

* **Testability**:

  * Core logic (`compute_xxx`, `compute_xxx`) must be unit tested.
  * Validation functions should have tests covering edge cases (missing columns, negative values, duplicates).

* **Portability**:

  * App must run via:

    * `uv run python -m CUTnTag_antibody_table.ui`
    * `docker run ...` for containerized environment.

---

## 7. Docker & Deployment

### 7.1 Dockerfile Requirements

* Base image: official Python 3.12+ (or similar).
* Install system-level dependencies (if any) used by Pandas / Excel writers.
* Copy project, install via `uv` or `pip` (depending on deployment approach).
* Expose port (e.g., `7860`) for Gradio.
* Set entrypoint to start the app, e.g.:

```bash
uv run python -m CUTnTag_antibody_table.ui
```

### 7.2 Deployment Usage

* Local:

  * User runs `uv sync` to install dependencies.
  * Then `uv run python -m xxx.ui`.

* Server:

  * Build Docker image.
  * Run container with published port.
  * Users connect via browser to server:port.

---

## 8. Testing & QA Plan

* **Validation tests**:

  * Missing required column → blocking error.
  * Non-numeric `xxx` → blocking error.
  * Duplicate xxx → blocking error.

* **Integration tests**:

  * Provide a small test spreadsheet as fixture.
  * Run full pipeline: load → validate → compute → export.

* **Regression tests**:

  * Fixed input → stable output (xxx, xxx) even after refactoring.

---

This specification should give Claude Code a clear roadmap to:

1. Scaffold the Python project with `uv`.
2. Implement robust spreadsheet parsing and validation.
3. Implement the core xxx algorithms with clear, testable functions.
4. Build a minimal but functional Gradio UI.
5. Add Docker support for deployment.

---

## Working with Users: Core Principles

### Before starting, always read project plan for the full background

### 1. Establish Context First
When a user asks for help:
- Ask what they're trying to accomplish (understand the goal)
- Ask what error or behavior they're seeing (get actual error messages)

### 2. Diagnose Before Fixing (MOST IMPORTANT)

**DO NOT jump to conclusions and write lots of code before understanding the problem.**

Common mistakes to avoid:
- Writing defensive code with `isinstance()` checks before understanding root cause
- Adding try/except blocks that hide the real error
- Creating workarounds that mask the actual problem
- Making multiple changes at once (makes debugging impossible)

**Correct process:**
1. **Reproduce** - Get exact error messages, logs, commands
2. **Identify root cause** - Use error traces
3. **Verify understanding** - Explain what you think is happening and confirm with user
4. **Propose minimal fix** - Change one thing at a time
5. **Test and verify** - Confirm the fix works before moving on

### 3. Common Root Causes (Check These First)

Before writing any code, check these common issues:

**Docker Desktop Not Running** (Most common with `package_docker.py`)
- The script will fail with a generic uv warning about nested projects
- The real issue is Docker isn't running
- Users often get distracted by the uv warning (this was recently fixed in the script)
- **Always ask**: "Is Docker Desktop running?"

### 4. Help Users Help Themselves

Encourage users to:
- Read error messages carefully (especially logs)
- Test incrementally (don't deploy everything at once)

---

## Common Issues and Troubleshooting

### Issue 1: `package_docker.py` Fails

**Symptoms**: Script fails with uv warning about nested projects and perhaps an error message

**Root Cause (common)**: Docker Desktop is not running or a Docker mounts denied issue

**Diagnosis**:
1. Ask: "Is Docker Desktop running?"
2. Check: Can they run `docker ps` successfully?
3. Recent fix: The script now gives better error messages, but older versions were misleading

**Solution**: Start Docker Desktop, wait for it to fully initialize, then retry

**If the issue is a Mounts Denied error**: It fails to mount the /tmp directory into Docker as it doesn't have access to it. Going to Docker Desktop app, and adding the directory mentioned in the error to the shared paths (Settings → Resources → File Sharing) solved the problem for a user.

**Not the solution**: Changing uv project configurations (this is a red herring)

---

## Directory Structure

```
xxx/
├── images/ 
├── src/ 
│    └── xxx.xlsx
├── tests/ 
├── data/ 
│    └── xxx.xlsx
└── docker/ 
```

Project is in early stages. Primary implementation will include:
- Input spreadsheet handling (xxx)
- xxx
- xxx
- xxx
- xxx

---

## For Claude Code (AI Assistant)

When helping users:

0. **Prepare** - Read codebase and project plan to be fully briefed
1. **Establish context** - What's the goal?
2. **Get error details** - Actual messages, logs, console output
3. **Diagnose first** - Don't write code before understanding the problem
4. **Think incrementally** - One change at a time
5. **Verify understanding** - Explain what you think is wrong before fixing
6. **Keep it simple** - Avoid over-engineering solutions

**Remember**: Users are learning. The goal is to help them understand what went wrong and how to fix it, not just to make the error go away.

---

*This guide was created to help AI assistants (like Claude Code) effectively support users through the xxx project. Last updated: December 2025*

# Claude Code Guidelines by Sabrina Ramonov

## Implementation Best Practices

### 0 — Purpose  

These rules ensure maintainability, safety, and developer velocity. 
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex work.  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons.

---

### 2 — While Coding

- **C-1 (MUST)** Name functions with existing domain vocabulary for consistency.  
- **C-2 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-3 (SHOULD)** Prefer simple, composable, testable functions.
- **C-4 (SHOULD NOT)** Add comments except for critical caveats; rely on self‑explanatory code.
- **C-5 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability of an opaque block.

---

### 3 — Testing

- **T-1 (MUST)** ALWAYS separate pure-logic unit tests from DB-touching integration tests.
- **T-2 (SHOULD)** Prefer integration tests over heavy mocking.  
- **T-3 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-4 (SHOULD)** Test the entire structure in one assertion if possible

---

### 4 — Database

- **D-1** No guidelines yet.

---

### 5 — Code Organization

- **O-1** No guidelines yet.

---

### 6 — Tooling Gates

- **G-1** No guidelines yet.

---

### 7 - Git

- **GH-1 (MUST**) Use Conventional Commits format when writing commit messages: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT**) Refer to Claude or Anthropic in commit messages.

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? (number of independent paths, or, in a lot of cases, number of nesting if if-else as a proxy). If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust? Parsers, trees, stacks / queues, etc.
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead? Only care about non-trivial dependencies that can actually change or affect the function.
8. Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:
  - the refactored function is used in more than one place
  - the refactored function is easily unit testable while the original function is not AND you can't test it any other way
  - the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals such as 42 or "foo" directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect. Trivial asserts (e.g., expect(2).toBe(2)) are forbidden.
3. SHOULD ensure the test description states exactly what the final expect verifies. If the wording and assert don’t align, rename or rewrite.
4. SHOULD compare results to independent, pre-computed expectations or to properties of the domain, never to the function’s output re-used as the oracle.
5. SHOULD follow the same lint, type-safety, and style rules as prod code (prettier, ESLint, strict types).
6. SHOULD express invariants or axioms (e.g., commutativity, idempotence, round-trip) rather than single hard-coded cases whenever practical. 
7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable ids).
9. ALWAYS use strong assertions over weaker ones e.g. `expect(x).toEqual(1)` instead of `expect(x).toBeGreaterThanOrEqual(1)`.
10. SHOULD test edge cases, realistic input, unexpected input, and value boundaries.
11. SHOULD NOT test conditions that are caught by the type checker.

## Remember Shortcuts

Remember the following shortcuts which the user may invoke at any time.

### QNEW

When I type "qnew", this means:

```
Understand all BEST PRACTICES listed in CLAUDE.md.
Your code SHOULD ALWAYS follow these best practices.
```

### QPLAN
When I type "qplan", this means:
```
Analyze similar parts of the codebase and determine whether your plan:
- is consistent with rest of codebase
- introduces minimal changes
- reuses existing code
```

## QCODE

When I type "qcode", this means:

```
Implement your plan and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
```

### QCHECK

When I type "qcheck", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
2. CLAUDE.md checklist Writing Tests Best Practices.
3. CLAUDE.md checklist Implementation Best Practices.
```

### QCHECKF

When I type "qcheckf", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Functions Best Practices.
```

### QCHECKT

When I type "qcheckt", this means:

```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE.md checklist Writing Tests Best Practices.
```

### QUX

When I type "qux", this means:

```
Imagine you are a human UX tester of the feature you implemented. 
Output a comprehensive list of scenarios you would test, sorted by highest priority.
```

### QGIT

When I type "qgit", this means:

```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD structure commit message as follows:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
- commit SHOULD contain the following structural elements to communicate intent: 
fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.
```
