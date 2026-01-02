# Block 7: FSRS Optimization (Data Infrastructure)

**Status**: ⚠️ Partial (Data Layer Complete, Optimization Script Ready)
**Date**: January 2, 2026
**Component**: Analytics & Optimization

## 1. Overview

The goal of Block 7 is to personalize the memory algorithm for the user. We have implemented the **Data Collection** layer (Revlog) which records the necessary history to run the optimization. The optimization itself is offloaded to a Python sidecar process to leverage the official `fsrs-optimizer` library.

## 2. Key Technical Decisions

**A. The "Revlog" (Attempts Table)**

* **Schema**: `attempts` table stores `card_id`, `rating`, `duration`, `state`, and `created_at`.
* **Integration**: The `ReviewCard` service (Block 2) was updated to atomically write to this table during every review.
* **Validation**: Verified via unit tests that every review creates exactly one Attempt log.

**B. Python Sidecar Strategy**

* **Why**: Porting the complex gradient descent math to Go/CGO is error-prone and hard to maintain. Python has the official, maintained library.
* **Mechanism**:
    1. Go `OptimizerService` fetches attempts from Postgres.
    2. Exports data to `revlog_export.json` (Temp file).
    3. Executes `python scripts/optimizer.py revlog_export.json`.
    4. Parses the JSON output (New Weights) and returns them.
* **Environment**: Requires a local python environment (`.conda`) with `fsrs-optimizer` installed.

## 3. Artifacts Created

| File | Purpose |
| :--- | :--- |
| `internal/data/schema/attempt.go` | The immutable history log schema. |
| `internal/app/service/optimizer.go` | Go service handling data export and script execution. |
| `scripts/optimizer.py` | Python script wrapping the FSRS optimizer. |
| `requirements.txt` | Python dependencies. |

⚠️ Environment Note: The Python optimizer requires a stable Python version (3.10/3.11) with pre-built wheels for SciPy. Building from source on Windows/Python 3.14 is currently failing. Installation is deferred until the runtime environment is standardized.
