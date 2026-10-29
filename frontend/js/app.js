/**
 * app.js
 * Main application controller.
 * Orchestrates application state, event handlers, and data persistence
 * (syncing with Python backend API or gracefully falling back to localStorage).
 */

// Default fallback data matching grades.json
const DEFAULT_DATA = {
  subjects: ["Mathematics", "Physics", "Computer Science"],
  students: {
    "Aarav Sharma": [92.0, 88.5, 95.0],
    "Diya Patel": [78.0, 82.0, 80.0],
    "Rohan Gupta": [65.0, 70.0, 68.5],
    "Sneha Rao": [95.0, 91.0, 98.0],
    "Dheeraj": [67.0, 89.0, 100.0],
    "Kritika": [87.0, 65.0, 78.0]
  }
};

const App = {
  data: { subjects: [], students: {} },
  isOnline: false,
  sortCol: "name",
  sortAsc: true,
  searchQuery: "",

  /**
   * Initialize application.
   */
  async init() {
    this.bindEvents();
    await this.loadData();
    this.refreshView();
  },

  /**
   * Load grade data from Python API server, or fallback to localStorage.
   */
  async loadData() {
    try {
      const res = await fetch("/api/grades", { cache: "no-store" });
      if (res.ok) {
        this.data = await res.json();
        this.isOnline = true;
        UI.setSyncStatus("online", "Connected to grades.json");
        return;
      }
    } catch {
      // API unreachable: gracefully fallback to localStorage
    }

    this.isOnline = false;
    UI.setSyncStatus("local", "Offline (Local Storage)");
    const saved = localStorage.getItem("grade_analyzer_data");
    this.data = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  },

  /**
   * Persist changes back to Python API or localStorage.
   */
  async saveData() {
    localStorage.setItem("grade_analyzer_data", JSON.stringify(this.data));

    if (this.isOnline) {
      try {
        await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.data)
        });
      } catch (err) {
        UI.showToast("Failed to save to Python server.", "error");
      }
    }
  },

  /**
   * Recalculate and re-render all views.
   */
  refreshView() {
    const analytics = calculateClassAnalytics(this.data);
    let students = analytics.studentsCalculated || [];

    // Sort students based on active sort column
    students.sort((a, b) => {
      let valA, valB;
      if (this.sortCol === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (this.sortCol === "total") {
        valA = a.total;
        valB = b.total;
      } else if (this.sortCol === "mean") {
        valA = a.mean;
        valB = b.mean;
      } else if (this.sortCol === "grade") {
        valA = a.mean; // Sort grade by mean score
        valB = b.mean;
      } else if (this.sortCol.startsWith("subj-")) {
        const idx = parseInt(this.sortCol.split("-")[1], 10);
        valA = a.marks[idx] ?? 0;
        valB = b.marks[idx] ?? 0;
      }

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    UI.renderMetrics(analytics);
    UI.renderStudentTable(this.data.subjects, students, this.searchQuery);
    UI.renderSubjectCards(analytics.subjectStats);
  },

  /**
   * Bind DOM event listeners.
   */
  bindEvents() {
    // Tab Navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
      });
    });

    // Search filter
    document.getElementById("student-search").addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      this.refreshView();
    });

    // Table sorting on header click
    document.getElementById("table-header-row").addEventListener("click", (e) => {
      const th = e.target.closest("th");
      if (!th || !th.dataset.sort) return;
      if (this.sortCol === th.dataset.sort) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortCol = th.dataset.sort;
        this.sortAsc = true;
      }
      this.refreshView();
    });

    // Table row actions (Edit / Delete)
    document.getElementById("students-table-body").addEventListener("click", (e) => {
      const target = e.target;
      const action = target.dataset.action;
      const name = target.dataset.name;
      if (!action || !name) return;

      if (action === "edit") {
        const studentMarks = this.data.students[name] || [];
        UI.openStudentModal(this.data.subjects, { name, marks: studentMarks });
      } else if (action === "delete") {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
          delete this.data.students[name];
          this.saveData();
          this.refreshView();
          UI.showToast(`Deleted student: ${name}`, "success");
        }
      }
    });

    // Modal Triggers: Add Student
    document.getElementById("btn-open-add-student").addEventListener("click", () => {
      if (!this.data.subjects || this.data.subjects.length === 0) {
        UI.showToast("Please configure subjects first.", "error");
        document.getElementById("btn-open-subjects").click();
        return;
      }
      UI.openStudentModal(this.data.subjects);
    });

    // Modal Triggers: Manage Subjects
    document.getElementById("btn-open-subjects").addEventListener("click", () => {
      document.getElementById("subjects-input").value = this.data.subjects.join(", ");
      document.getElementById("modal-subjects").classList.remove("hidden");
    });

    // Modal Close buttons
    document.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.getElementById(btn.dataset.close).classList.add("hidden");
      });
    });

    // Student Form Submit
    document.getElementById("form-student").addEventListener("submit", (e) => {
      e.preventDefault();
      const originalName = document.getElementById("edit-original-name").value.trim();
      const newName = document.getElementById("student-name").value.trim();
      if (!newName) return;

      const marks = [];
      const inputs = document.querySelectorAll("#student-marks-fields input");
      inputs.forEach(input => {
        const val = parseFloat(input.value);
        marks.push(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
      });

      // If renamed, remove old key
      if (originalName && originalName !== newName) {
        delete this.data.students[originalName];
      }

      this.data.students[newName] = marks;
      this.saveData();
      this.refreshView();
      document.getElementById("modal-student").classList.add("hidden");
      UI.showToast(`Saved records for ${newName}`, "success");
    });

    // Subjects Form Submit
    document.getElementById("form-subjects").addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = document.getElementById("subjects-input").value;
      const subjects = raw.split(",").map(s => s.trim()).filter(Boolean);

      if (subjects.length === 0) {
        UI.showToast("At least one subject is required.", "error");
        return;
      }

      this.data.subjects = subjects;
      this.saveData();
      this.refreshView();
      document.getElementById("modal-subjects").classList.add("hidden");
      UI.showToast("Subjects updated successfully.", "success");
    });
  }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());

