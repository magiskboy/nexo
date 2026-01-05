# Agent Packaging Architecture Design

## 1. Terminology

- **Agent**: Previously "Specialist". A standalone package extending the system's capabilities.
- **Agent Package**: A `.zip` archive containing the Agent's code, manifest, and resources.
- **Hub**: A registry (remote or local) listing available Agents.
- **Runtime**: The environment (Python + MCP) where the Agent executes.

## 2. Package Specification

### 2.1. File Structure

The Agent Package MUST be a flat `.zip` file. When extracted, it MUST adhere to the following structure. Root directory name in the zip is ignored (or flattened), the contents are extracted to the installation target.

```text
/ (Installation Root)
├── manifest.yaml        # REQUIRED: Metadata
├── icon.png             # REQUIRED: 512x512 PNG
├── README.md            # OPTIONAL: User-facing documentation
├── .env.example         # OPTIONAL: Template for environment variables
├── tools/               # REQUIRED: Executable code
│   ├── main.py          # REQUIRED: Entry point
│   ├── requirements.txt # REQUIRED: Python dependencies (standard format)
│   └── ...              # Other python files
└── instructions/        # REQUIRED: Prompts
    ├── persona.md       # REQUIRED: Base system prompt
    └── ...              # Other prompt assets
```

### 2.2. Manifest Specification (`manifest.yaml`)

Format: YAML
Encoding: UTF-8

| Field            | Type   | Required | Description                     | Constraints                                                                                         |
| ---------------- | ------ | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `schema_version` | int    | Yes      | Version of this manifest schema | Currently `1`                                                                                       |
| `id`             | string | Yes      | Unique identifier               | Reverse domain notation, lowercase, `[a-z0-9_.]`. Max 64 chars. Regex: `^[a-z0-9]+(\.[a-z0-9_]+)+$` |
| `name`           | string | Yes      | Display name                    | Max 32 chars.                                                                                       |
| `description`    | string | Yes      | Short description               | Max 200 chars.                                                                                      |
| `author`         | string | Yes      | Author name/email               |                                                                                                     |
| `homepage`       | url    | No       | Project website                 |                                                                                                     |
| `repository`     | url    | No       | Source code repo                |                                                                                                     |
| `license`        | string | No       | License name                    | e.g. "MIT", "Apache-2.0"                                                                            |
| `permissions`    | list   | No       | Requested permissions           | Future use.                                                                                         |

**Conventions:**

- **Entrypoint**: The system will ALWAYS look for `tools/main.py`.
- **Runtime**: The system assumes a standard Python environment managed by `uv`.
- **Version**: Versioning is managed by the installation source (Git commit/tag or Zip metadata), not the manifest.

**Example `manifest.yaml`:**

```yaml
schema_version: 1
id: com.nexo.agents.seo_audit
name: SEO Audit Master
description: Analyzes websites for on-page SEO performance.
author: Nexo Team
```

## 3. Storage Layout

The application will store agents in the user's data directory (relative to the `app_data_dir` provided by Tauri).

```text
$APP_DATA/
├── agents/                      # Installation Directory
│   ├── com.nexo.agents.seo_audit/
│   │   ├── current -> v1.0.2/   # Symlink to active version (managed by manager)
│   │   ├── v1.0.2/              # Extracted content
│   │   │   ├── manifest.yaml
│   │   │   ├── .venv/           # Virtual Environment for this specific version
│   │   │   └── ...
│   │   └── v1.0.1/              # Previous version (kept for rollback)
│   └── ...
├── tmp/                         # Temporary download/extraction area
└── cache/                       # UV/Pip Cache (shared)
```

**Rationale:**

- **Versioning:** Keeping versions allows atomic upgrades and rollback.
- **Isolation:** Each version has its own `.venv` to ensure reproducibility and avoid dependency conflicts between versions (if deps changed).

## 4. Management Logic (AgentManager)

The `AgentManager` in Rust (Tauri backend) is responsible for the lifecycle.

### 4.1. Installation Sources & Strategies

The `AgentManager` must support polymorphic installation sources.

#### A. Local Zip File (`.zip`)

**Use Case:** Installing an agent downloaded manually or distributed offline.

1.  **Input:** Absolute file path to `.zip`.
2.  **Process:**
    - Calculate SHA256 (for integrity/caching).
    - Extract to `$APP_DATA/tmp/<sha256>_extracted`.
    - **Validate:** Ensure `manifest.yaml` exists at root.
    - Proceed to **Standard Installation Logic** (see 4.2).

#### B. Git Repository + Subpath

**Use Case:** Installing directly from a community repo (e.g., `github.com/nexo-agents/community` containing multiple agents).

1.  **Input:**
    - `repo_url`: (e.g., `https://github.com/user/monorepo.git`)
    - `revision`: (Optional) Can be a **Branch**, **Tag**, or **Commit Hash**.
      - Default: `HEAD` (Default branch of the repo).
    - `sub_path`: (Optional) Path inside the repo (e.g., `agents/coder`).
2.  **Process:**
    - **Clone:**
      - Clone the repository to `$APP_DATA/tmp/git/<repo_safe_name>`.
      - Checkout the specific `revision` (Branch/Tag/Commit).
    - **Resolve Path:**
      - Target directory = `$CloneDir` / `sub_path`.
    - **Identify Version:**
      - Use the short commit hash (first 7 chars) as the effective version for display/tracking.
    - **Validate:**
      - Check if `manifest.yaml` exists in Target Directory.
    - **Package:** (Optional step if we want to store zips)
      - We can zip the Target Directory contents to create a standard artifact.
      - EQUIVALENT: Treat the Target Directory as an "Extracted Zip" and move it to installation.
    - Proceed to **Standard Installation Logic** (see 4.2).

### 4.2. Standard Installation Logic (Common Pipeline)

Input: An `Extracted Directory` containing `manifest.yaml`.

1.  **Validation**:
    - **Security Check**: Verify no paths escape the directory (Zip Slip vulnerability).
    - **Manifest Check**: Parse `manifest.yaml`, validate schema, regex check `id` and `version`.

2.  **Preparation**:
    - **Version determination**:
      - If Git: Use commit hash.
      - If Zip: Use hash of the zip file or timestamp.
    - Target Path: `$APP_DATA/agents/<id>/<version_ref>`.
    - If Target Path exists: Error (Already installed) or Confirm Overwrite.

3.  **Environment Setup**:
    - Command: `uv venv .venv` inside the target directory.
    - Command: `uv pip install -r requirements.txt` using the created venv.
    - _Optimization_: Use a shared cache for `uv` to speed up installs.

4.  **Finalize**:
    - atomic Move: `Extracted Directory` -> `$APP_DATA/agents/<id>/<version_ref>`.
    - Link: Update `current` symlink to point to `<version_ref>`.
    - Emit Event: `agent://installed` { id, version: <version_ref> }.
    - Cleanup: Remove zip in tmp.

### 4.3. Uninstallation

1.  Remove `current` symlink.
2.  Delete `$APP_DATA/agents/<id>` directory recursively.
3.  Emit Event: `agent://uninstalled` { id }.

### 4.4. Update

Same as Installation, but detected as "Update" if `id` exists.

1.  Install new version side-by-side.
2.  Run generic validation/test (optional: check `main.py` is runnable).
3.  Update `current` symlink.
4.  (Optional) Keep old version for N days or X versions.

## 5. Runtime Execution

The Runtime Service invokes the agent using the `current` symlink.

**Command Construction:**

```bash
# CWD: $APP_DATA/agents/<id>/current/tools
$APP_DATA/agents/<id>/current/.venv/bin/python main.py
```

- **Environment Wrapper**: The runtime MUST execute the python binary _inside_ the venv.
- **Stdio**: Connected to Rust backend's MCP Client implementation.
- **Environment Variables**:
  - `NEXO_AGENT_ID`: `<id>`
  - `NEXO_AGENT_VERSION`: `<version>`
  - `NEXO_HOST_VERSION`: <app_version>
  - User-configured Env Vars (API Keys) injected at runtime.

## 6. Security Considerations

- **Zip Slip**: Rust `zip` crate usage must strictly validate filenames to prevent `../../` traversal.
- **Manifest Injection**: Detailed validation of `id` to prevent filesystem exploits (e.g. `id` cannot contain `/` or `\`).
- **Dependencies**: `uv` ensures lockfile compliance if provided (future enhancement: enforce `uv.lock`). For now, `requirements.txt` is trusted but sandboxed in venv.
- **Execution**: Agents run with the user's privileges. Protocol-level restrictions (MCP headers) can enable capability granting in the future.
