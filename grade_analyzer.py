"""
Student Grade Analyzer
A minimalist, numpy-powered application to record, analyze, and persist student grades.
Uses:
- numpy: For statistical calculations (mean, sum, max, argmax, min).
- json: For storing and retrieving student records in a structured format.
- pathlib: For robust, cross-platform file and directory handling.
"""

from pathlib import Path
import json
import numpy as np

# Path to the JSON data file using pathlib for cross-platform compatibility
DATA_FILE = Path("data") / "grades.json"

# Grade boundary scale: (minimum score required, grade letter)
GRADE_SCALE = [
    (90, "A+"),
    (80, "A"),
    (70, "B"),
    (60, "C"),
    (50, "D"),
    (0,  "F"),
]


def load_data(filepath: Path = DATA_FILE) -> dict:
    """Load student grade records from JSON file. Returns empty structure if missing."""
    if filepath.exists():
        with filepath.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"subjects": [], "students": {}}


def save_data(data: dict, filepath: Path = DATA_FILE) -> None:
    """Save student grade records to JSON file, automatically creating directories if needed."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with filepath.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


def get_grade(score: float) -> str:
    """Determine letter grade from a percentage or average score using the grade scale."""
    for threshold, grade in GRADE_SCALE:
        if score >= threshold:
            return grade
    return "F"


def get_valid_float(prompt: str, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Prompt user for a numeric float within the [min_val, max_val] range with validation."""
    while True:
        user_input = input(prompt).strip()
        try:
            val = float(user_input)
            if min_val <= val <= max_val:
                return val
            print(f"  [!] Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("  [!] Invalid number. Please enter numeric digits.")


def setup_subjects(data: dict) -> None:
    """Prompt user to define the list of subjects for grading."""
    print("\n--- Setup Subjects ---")
    current = data.get("subjects", [])
    if current:
        print(f"Current subjects: {', '.join(current)}")
        choice = input("Do you want to replace subjects? (y/N): ").strip().lower()
        if choice != "y":
            return

    raw = input("Enter subject names separated by commas (e.g. Math, Science, English): ").strip()
    subjects = [s.strip() for s in raw.split(",") if s.strip()]
    if subjects:
        data["subjects"] = subjects
        # Reset existing marks if subjects structure changes
        if data["students"]:
            print("  [!] Subjects updated. Existing students will need marks updated for new subjects.")
        save_data(data)
        print(f"[✓] Subjects set: {', '.join(subjects)}")
    else:
        print("[!] No subjects entered. Keeping previous list.")


def add_student(data: dict) -> None:
    """Add a new student or update marks for an existing student across all subjects."""
    if not data["subjects"]:
        print("\n[!] Please set up subjects first before adding students.")
        setup_subjects(data)
        if not data["subjects"]:
            return

    print("\n--- Add / Update Student ---")
    name = input("Enter student name: ").strip()
    if not name:
        print("[!] Student name cannot be empty.")
        return

    marks = []
    print(f"Enter marks (0 - 100) for {name}:")
    for subject in data["subjects"]:
        score = get_valid_float(f"  Marks for {subject}: ")
        marks.append(score)

    # Store student marks as a list (JSON-serializable)
    data["students"][name] = marks
    save_data(data)
    print(f"[✓] Successfully saved marks for {name}.")


def view_all_students(data: dict) -> None:
    """Display all students with their subject marks, total, mean/average, and final grade."""
    students = data["students"]
    subjects = data["subjects"]

    if not students:
        print("\n[!] No student records found. Please add students first.")
        return

    # Calculate dynamic column width based on the longest subject name
    col_w = max(12, max((len(s) for s in subjects), default=10) + 2)
    total_w = 16 + (col_w * len(subjects)) + 10 + 12 + 8

    print("\n" + "=" * total_w)
    print("STUDENT GRADE REPORT".center(total_w))
    print("=" * total_w)

    # Header row
    subj_headers = "".join([f"{s:>{col_w}}" for s in subjects])
    print(f"{'Name':<16}{subj_headers}{'Total':>10}{'Mean/Avg':>12}{'Grade':>8}")
    print("-" * total_w)

    for name, mark_list in students.items():
        # Convert student marks to numpy array for fast, idiomatic calculations
        marks_arr = np.array(mark_list, dtype=float)
        total = float(np.sum(marks_arr))
        mean_score = float(np.mean(marks_arr))
        grade = get_grade(mean_score)

        marks_str = "".join([f"{m:>{col_w}.1f}" for m in marks_arr])
        print(f"{name:<16}{marks_str}{total:>10.1f}{mean_score:>12.2f}{grade:>8}")

    print("=" * total_w)


def view_highest_scorer(data: dict) -> None:
    """Identify and display the student with the highest total and average marks using numpy."""
    students = data["students"]
    subjects = data["subjects"]

    if not students:
        print("\n[!] No student records found.")
        return

    names = list(students.keys())
    # Construct a 2D numpy matrix where rows = students, columns = subjects
    matrix = np.array(list(students.values()), dtype=float)

    # Calculate total marks per student along rows (axis=1)
    totals = np.sum(matrix, axis=1)
    means = np.mean(matrix, axis=1)

    # np.argmax returns the index of the highest value in the array
    top_idx = int(np.argmax(totals))
    highest_name = names[top_idx]
    highest_total = totals[top_idx]
    highest_mean = means[top_idx]
    highest_grade = get_grade(highest_mean)

    print("\n" + "*" * 50)
    print("               TOP PERFORMER (OVERALL)")
    print("*" * 50)
    print(f"  Student Name : {highest_name}")
    print(f"  Total Marks  : {highest_total:.1f} / {len(subjects) * 100}")
    print(f"  Average/Mean : {highest_mean:.2f}%")
    print(f"  Final Grade  : {highest_grade}")
    print("*" * 50)

    # Subject-wise toppers using numpy argmax along columns (axis=0)
    if len(names) > 1 and len(subjects) > 0:
        print("\n--- Subject-Wise Highest Scorers ---")
        subject_top_indices = np.argmax(matrix, axis=0)
        subject_max_scores = np.max(matrix, axis=0)
        for i, subj in enumerate(subjects):
            scorer = names[subject_top_indices[i]]
            score = subject_max_scores[i]
            print(f"  {subj:<15}: {scorer} with {score:.1f} marks")


def view_subject_analysis(data: dict) -> None:
    """Compute and display statistical measures (Mean, Min, Max) per subject using numpy."""
    students = data["students"]
    subjects = data["subjects"]

    if not students:
        print("\n[!] No student records found.")
        return

    # Convert all student marks into a 2D numpy array
    matrix = np.array(list(students.values()), dtype=float)

    # Compute statistics along axis=0 (columns = subjects)
    subject_means = np.mean(matrix, axis=0)
    subject_mins = np.min(matrix, axis=0)
    subject_maxs = np.max(matrix, axis=0)

    print("\n" + "=" * 55)
    print("            SUBJECT-WISE STATISTICAL ANALYSIS")
    print("=" * 55)
    print(f"{'Subject':<18}{'Mean (Avg)':>12}{'Lowest':>12}{'Highest':>12}")
    print("-" * 55)

    for i, subj in enumerate(subjects):
        print(f"{subj:<18}{subject_means[i]:>12.2f}{subject_mins[i]:>12.1f}{subject_maxs[i]:>12.1f}")

    # Overall class average across all students and all subjects
    overall_mean = float(np.mean(matrix))
    print("-" * 55)
    print(f"Overall Class Mean Across All Subjects: {overall_mean:.2f}%")
    print("=" * 55)


def main() -> None:
    """Main application loop with interactive menu."""
    data = load_data()

    while True:
        print("\n" + "=" * 45)
        print("         STUDENT GRADE ANALYZER")
        print("=" * 45)
        print("  1. Enter / Update Student Marks")
        print("  2. View All Students (Average, Grade)")
        print("  3. View Highest Scorer (Top Student)")
        print("  4. View Subject-wise Mean & Statistics")
        print("  5. Configure / Change Subjects")
        print("  6. Exit")
        print("=" * 45)

        choice = input("Enter your choice (1-6): ").strip()

        if choice == "1":
            add_student(data)
        elif choice == "2":
            view_all_students(data)
        elif choice == "3":
            view_highest_scorer(data)
        elif choice == "4":
            view_subject_analysis(data)
        elif choice == "5":
            setup_subjects(data)
        elif choice == "6":
            save_data(data)
            print("\n[✓] Data saved. Thank you for using Student Grade Analyzer!")
            break
        else:
            print("[!] Invalid option. Please enter a number between 1 and 6.")


if __name__ == "__main__":
    main()
