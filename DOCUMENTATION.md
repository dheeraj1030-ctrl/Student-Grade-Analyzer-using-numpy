# Student Grade Analyzer — Detailed Documentation

Welcome to the **Student Grade Analyzer** documentation. This project is built using Python with **`numpy`**, **`json`**, and **`pathlib`** to manage, analyze, and persist student academic records efficiently, cleanly, and reliably.

---

## Table of Contents
1. [Project Overview & Core Libraries](#1-project-overview--core-libraries)
2. [Data Structure & Schema](#2-data-structure--schema)
3. [NumPy Concepts Used in this Project](#3-numpy-concepts-used-in-this-project)
4. [Line-by-Line & Function-by-Function Breakdown](#4-line-by-line--function-by-function-breakdown)
   - [Imports & Global Configuration](#imports--global-configuration)
   - [`load_data` and `save_data`](#load_data-and-save_data)
   - [`get_grade`](#get_grade)
   - [`get_valid_float`](#get_valid_float)
   - [`setup_subjects`](#setup_subjects)
   - [`add_student`](#add_student)
   - [`view_all_students`](#view_all_students)
   - [`view_highest_scorer`](#view_highest_scorer)
   - [`view_subject_analysis`](#view_subject_analysis)
   - [`main` and Application Lifecycle](#main-and-application-lifecycle)
5. [How to Run the Application](#5-how-to-run-the-application)
6. [Adherence to Minimalist & DRY Principles](#6-adherence-to-minimalist--dry-principles)
7. [Web Frontend Architecture & Folder Structure](#7-web-frontend-architecture--folder-structure)

---

## 1. Project Overview & Core Libraries

This application allows teachers, students, or administrators to:
- Define subjects.
- Enter student names and individual marks (0 to 100) per subject.
- Automatically calculate total marks, mean/average, and letter grades.
- Identify the highest scorer (topper) overall as well as toppers in each individual subject.
- Compute class-wide statistical measures (mean, min, max) for every subject using vectorized numerical computations.
- Automatically persist records to a structured JSON file.

### Libraries Chosen
- **`numpy`**: Provides fast, multidimensional array operations and vector math (`np.mean`, `np.sum`, `np.max`, `np.min`, `np.argmax`).
- **`json`**: Built-in serialization library for storing structured data in human-readable and portable format.
- **`pathlib`**: Modern, object-oriented filesystem path manipulation that works across Windows, macOS, and Linux without path-separator bugs.

---

## 2. Data Structure & Schema

The application stores data in `data/grades.json` with this clean structure:

```json
{
  "subjects": ["Mathematics", "Physics", "Computer Science"],
  "students": {
    "Aarav Sharma": [92.0, 88.5, 95.0],
    "Diya Patel": [78.0, 82.0, 80.0],
    "Rohan Gupta": [65.0, 70.0, 68.5],
    "Sneha Rao": [95.0, 91.0, 98.0]
  }
}
```

- `"subjects"`: Ordered list of subject names.
- `"students"`: Dictionary where the key is the student's name, and the value is a list of marks corresponding by index to the `"subjects"` list.

---

## 3. NumPy Concepts Used in this Project

### 1D Arrays (Student Level)
When calculating individual student metrics:
```python
marks_arr = np.array(mark_list, dtype=float)
total = np.sum(marks_arr)      # Sum of all subject marks
mean_score = np.mean(marks_arr) # Arithmetic mean / average
```

### 2D Matrix (Class Level)
When analyzing the whole class across all subjects, marks are converted into a 2D matrix of shape `(N, M)` where `N` is the number of students and `M` is the number of subjects:

$$\text{matrix} = \begin{bmatrix}
\text{Student}_0\text{ Subj}_0 & \text{Student}_0\text{ Subj}_1 & \dots \\
\text{Student}_1\text{ Subj}_0 & \text{Student}_1\text{ Subj}_1 & \dots \\
\vdots & \vdots & \ddots
\end{bmatrix}$$

- **Axis 1 (Horizontal / Rows)**: Operations across subjects for each student:
  - `np.sum(matrix, axis=1)`: Total marks for each student.
  - `np.mean(matrix, axis=1)`: Average marks for each student.
- **Axis 0 (Vertical / Columns)**: Operations across all students for each subject:
  - `np.mean(matrix, axis=0)`: Class average in each subject.
  - `np.max(matrix, axis=0)`: Highest score in each subject.
  - `np.min(matrix, axis=0)`: Lowest score in each subject.
- **`np.argmax(array)`**: Returns the **index** of the maximum value.
  - `np.argmax(totals)`: Finds the index of the top student overall.
  - `np.argmax(matrix, axis=0)`: Finds the index of the top student for every individual subject.

---

## 4. Line-by-Line & Function-by-Function Breakdown

### Imports & Global Configuration

```python
from pathlib import Path
import json
import numpy as np
```
- **Line 10 (`from pathlib import Path`)**: Imports Python's object-oriented path library.
- **Line 11 (`import json`)**: Imports the standard JSON module to serialize and deserialize data.
- **Line 12 (`import numpy as np`)**: Imports NumPy under its standard alias `np`.

```python
DATA_FILE = Path("data") / "grades.json"
```
- Defines the target storage path. Using the `/` operator on `Path` objects automatically uses the correct system path separators (`\` on Windows, `/` on Linux/macOS).

```python
GRADE_SCALE = [
    (90, "A+"),
    (80, "A"),
    (70, "B"),
    (60, "C"),
    (50, "D"),
    (0,  "F"),
]
```
- Centralized lookup table for letter grades. Each entry is a tuple `(threshold, grade)`. Storing this as a list of tuples enforces DRY (Don't Repeat Yourself) and makes altering grade cutoffs trivial.

---

### `load_data` and `save_data`

```python
def load_data(filepath: Path = DATA_FILE) -> dict:
    if filepath.exists():
        with filepath.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"subjects": [], "students": {}}
```
- **`if filepath.exists():`**: Checks whether `data/grades.json` already exists on disk.
- **`with filepath.open("r", encoding="utf-8") as f:`**: Safely opens the file for reading with automatic resource closure via Python's context manager.
- **`return json.load(f)`**: Parses the JSON file into a Python dictionary.
- **`return {"subjects": [], "students": {}}`**: Fallback: if the file does not exist, returns a fresh, empty dictionary structure to avoid crashes.

```python
def save_data(data: dict, filepath: Path = DATA_FILE) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with filepath.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
```
- **`filepath.parent.mkdir(parents=True, exist_ok=True)`**: Ensures that the `data/` folder exists before writing. If the folder already exists, `exist_ok=True` suppresses errors.
- **`with filepath.open("w", encoding="utf-8") as f:`**: Opens file in write mode.
- **`json.dump(data, f, indent=4)`**: Serializes the dictionary to disk with clean 4-space indentation.

---

### `get_grade`

```python
def get_grade(score: float) -> str:
    for threshold, grade in GRADE_SCALE:
        if score >= threshold:
            return grade
    return "F"
```
- Takes any average score (0 to 100) and loops through `GRADE_SCALE`.
- Returns the first matching grade whose minimum threshold is satisfied.
- Defaults to `"F"` if no condition matches.

---

### `get_valid_float`

```python
def get_valid_float(prompt: str, min_val: float = 0.0, max_val: float = 100.0) -> float:
    while True:
        user_input = input(prompt).strip()
        try:
            val = float(user_input)
            if min_val <= val <= max_val:
                return val
            print(f"  [!] Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("  [!] Invalid number. Please enter numeric digits.")
```
- Reusable, bulletproof input validator:
  - `while True:` keeps asking until valid input is given.
  - `float(user_input)` converts text into a floating-point number.
  - If a user inputs text like `"abc"`, `ValueError` is caught and a clean warning is displayed.
  - Validates that the mark is between `min_val` (0.0) and `max_val` (100.0).

---

### `setup_subjects`

```python
def setup_subjects(data: dict) -> None:
    ...
```
- Prompts the user to enter subject names separated by commas (e.g. `Math, Physics, English`).
- Strips whitespace and stores clean subject names into `data["subjects"]`.
- Calls `save_data(data)` to update the JSON file on disk immediately.

---

### `add_student`

```python
def add_student(data: dict) -> None:
    ...
```
- Ensures subjects exist before adding students; if none exist, directs the user to `setup_subjects()`.
- Takes the student's name.
- Prompts the user for marks in each subject sequentially using `get_valid_float()`.
- Stores the scores as a list in `data["students"][name]`.
- Persists changes to disk using `save_data(data)`.

---

### `view_all_students`

```python
def view_all_students(data: dict) -> None:
    ...
```
- Displays a formatted table with:
  - Student Name
  - Marks in each subject
  - Total marks (`np.sum(marks_arr)`)
  - Mean/average marks (`np.mean(marks_arr)`)
  - Letter grade (`get_grade(mean_score)`)
- Uses dynamic column width calculation (`col_w = max(12, max(...))`) so that long subject names never distort table columns.

---

### `view_highest_scorer`

```python
def view_highest_scorer(data: dict) -> None:
    ...
```
- **Overall Topper**:
  - Converts all student records into a 2D NumPy array: `matrix = np.array(list(students.values()), dtype=float)`.
  - Calculates row totals: `totals = np.sum(matrix, axis=1)`.
  - `top_idx = int(np.argmax(totals))` locates the index of the highest total.
  - Displays the student name, total score, percentage, and grade.
- **Subject-wise Toppers**:
  - `subject_top_indices = np.argmax(matrix, axis=0)` determines which student scored highest in each column (subject).
  - `subject_max_scores = np.max(matrix, axis=0)` gets the top score for each column.
  - Iterates through the subjects and outputs who scored highest in each one.

---

### `view_subject_analysis`

```python
def view_subject_analysis(data: dict) -> None:
    ...
```
- Analyzes class-level trends across each subject:
  - `subject_means = np.mean(matrix, axis=0)`: Average mark for each subject.
  - `subject_mins = np.min(matrix, axis=0)`: Lowest mark scored in each subject.
  - `subject_maxs = np.max(matrix, axis=0)`: Highest mark scored in each subject.
  - `overall_mean = float(np.mean(matrix))`: Overall average mark across all students and all subjects combined.

---

### `main` and Application Lifecycle

```python
def main() -> None:
    data = load_data()
    while True:
        ...
```
- Loads existing data at startup.
- Runs an interactive terminal menu with options `1` to `6`.
- Gracefully handles exit (`choice == "6"`), saving all changes to disk before terminating.

```python
if __name__ == "__main__":
    main()
```
- Standard Python entry point idiom: runs `main()` only when executed directly, allowing functions to be imported by test suites without launching the interactive loop.

---

## 5. How to Run the Application

To launch the application, open your terminal in this directory and execute:

```powershell
python grade_analyzer.py
```

### Menu Options
```text
=============================================
         STUDENT GRADE ANALYZER
=============================================
  1. Enter / Update Student Marks
  2. View All Students (Average, Grade)
  3. View Highest Scorer (Top Student)
  4. View Subject-wise Mean & Statistics
  5. Configure / Change Subjects
  6. Exit
=============================================
```

---

## 6. Adherence to Minimalist & DRY Principles

In accordance with our project's `minimalist` guidelines:
1. **Zero Unnecessary Lines**: No boilerplate wrapper classes, deep inheritance hierarchies, or unused imports.
2. **Standard Library & NumPy First**: Replaces custom loops with vectorized `numpy` operations (`mean`, `sum`, `argmax`, `max`, `min`).
3. **Single Source of Truth**:
   - `GRADE_SCALE` centrally handles all grade assignments.
   - `DATA_FILE` centrally handles file path configuration.
   - `load_data()` and `save_data()` isolate all file I/O.
4. **Explicit Input Validation**: Centralized in `get_valid_float()` to prevent repeated `try-except` blocks.

---

## 7. Web Frontend Architecture & Folder Structure

A modern, responsive, and minimalist web interface is provided in the `frontend/` directory.

### Folder Structure
```text
Student Grade Analyzer/
├── data/
│   └── grades.json            # Shared persistent JSON database
├── frontend/
│   ├── index.html             # Structure, layouts, semantic containers & dialogs
│   ├── css/
│   │   └── style.css          # CSS Variables, dark-slate theme, tables, cards, responsive media queries
│   └── js/
│       ├── analyzer.js        # Mathematical & statistical calculation engine (DRY, mirrors numpy)
│       ├── ui.js              # DOM presentation (renders tables, cards, badges, modals, toasts)
│       └── app.js             # Controller wiring events, state management, and backend sync
├── grade_analyzer.py          # Original CLI application with NumPy
├── server.py                  # Zero-dependency local web server syncing data/grades.json
└── DOCUMENTATION.md           # Project documentation
```

### Where to Make Changes Later

| Want to change... | File to edit | What to look for |
| :--- | :--- | :--- |
| **Theme colors, fonts, card spacing** | `frontend/css/style.css` | Edit CSS variables under `:root` at the top of the file (`--bg-main`, `--primary`, etc.). |
| **Grade thresholds or letter grades** | `frontend/js/analyzer.js` | Edit `GRADE_SCALE` constant at the top of `analyzer.js`. |
| **HTML tags, dialogs, titles** | `frontend/index.html` | Semantic IDs (`#tab-students`, `#modal-student`, etc.). |
| **Table formatting, badges, toast popups** | `frontend/js/ui.js` | `renderStudentTable()`, `renderSubjectCards()`, `openStudentModal()`. |
| **Search behavior, sorting, button clicks** | `frontend/js/app.js` | Event listeners in `bindEvents()`. |

### How to Launch the Web Frontend

#### Option 1: Live Sync Mode with Python (Recommended)
Runs the lightweight Python HTTP server (`server.py`) and syncs directly with `data/grades.json`:
```powershell
python server.py
```
Open **`http://localhost:8000`** in your browser.

#### Option 2: Standalone / Offline Mode
Directly double-click or open `frontend/index.html` in any web browser. The app will detect the offline environment and seamlessly save data to your browser's `localStorage`.
