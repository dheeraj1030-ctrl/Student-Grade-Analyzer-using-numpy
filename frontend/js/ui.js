/**
 * ui.js
 * DOM rendering and UI presentation module.
 * Responsible for updating table rows, statistics cards, modals, and toasts.
 */

const UI = {
  /**
   * Return CSS class corresponding to a letter grade.
   */
  getGradeClass(grade) {
    if (grade === "A+") return "grade-A-plus";
    return `grade-${grade}`;
  },

  /**
   * Update top overview metric cards.
   */
  renderMetrics(analytics) {
    document.getElementById("stat-total-students").textContent = analytics.totalStudents;
    document.getElementById("stat-total-subjects").textContent = analytics.totalSubjects;
    document.getElementById("stat-class-average").textContent = `${analytics.overallMean}%`;

    const topperNameEl = document.getElementById("stat-topper-name");
    const topperScoreEl = document.getElementById("stat-topper-score");

    if (analytics.topper) {
      topperNameEl.textContent = analytics.topper.name;
      topperScoreEl.textContent = `Avg: ${analytics.topper.mean}% (Grade ${analytics.topper.grade})`;
    } else {
      topperNameEl.textContent = "None";
      topperScoreEl.textContent = "No data available";
    }
  },

  /**
   * Render the student grade data table.
   */
  renderStudentTable(subjects, calculatedStudents, filterQuery = "") {
    const theadRow = document.getElementById("table-header-row");
    const tbody = document.getElementById("students-table-body");
    const emptyState = document.getElementById("no-students-placeholder");

    // Filter students by search input
    const query = filterQuery.toLowerCase().trim();
    const filtered = calculatedStudents.filter(st => st.name.toLowerCase().includes(query));

    // Render Table Headers
    let headerHTML = `<th data-sort="name">Student Name ⬍</th>`;
    subjects.forEach((subj, idx) => {
      headerHTML += `<th class="numeric" data-sort="subj-${idx}">${subj}</th>`;
    });
    headerHTML += `
      <th class="numeric" data-sort="total">Total ⬍</th>
      <th class="numeric" data-sort="mean">Mean ⬍</th>
      <th data-sort="grade">Grade ⬍</th>
      <th style="text-align: right;">Actions</th>
    `;
    theadRow.innerHTML = headerHTML;

    // Render Table Rows
    if (filtered.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    tbody.innerHTML = filtered.map(st => {
      const marksCells = subjects.map((_, i) => {
        const val = st.marks[i] !== undefined ? st.marks[i].toFixed(1) : "-";
        return `<td class="numeric">${val}</td>`;
      }).join("");

      return `
        <tr>
          <td><strong>${st.name}</strong></td>
          ${marksCells}
          <td class="numeric"><strong>${st.total.toFixed(1)}</strong></td>
          <td class="numeric">${st.mean.toFixed(2)}%</td>
          <td><span class="badge-grade ${UI.getGradeClass(st.grade)}">${st.grade}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn btn-secondary btn-sm" data-action="edit" data-name="${st.name}">Edit</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-name="${st.name}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  /**
   * Render subject analytics cards.
   */
  renderSubjectCards(subjectStats) {
    const container = document.getElementById("subject-cards-container");
    if (!subjectStats || subjectStats.length === 0) {
      container.innerHTML = `<p class="empty-state">No subjects configured.</p>`;
      return;
    }

    container.innerHTML = subjectStats.map(stat => `
      <div class="subject-card">
        <div class="subject-card-header">
          <h3 class="subject-card-title">${stat.subject}</h3>
          <span class="badge-grade ${UI.getGradeClass(getGrade(stat.mean))}">${getGrade(stat.mean)}</span>
        </div>

        <div class="subject-stats-list">
          <div class="stat-box">
            <span class="stat-box-label">Mean</span>
            <span class="stat-box-val">${stat.mean}%</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-label">Lowest</span>
            <span class="stat-box-val">${stat.min}</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-label">Highest</span>
            <span class="stat-box-val">${stat.max}</span>
          </div>
        </div>

        <div class="subject-topper-pill">
          <span>🥇 Top Scorer:</span>
          <strong>${stat.topperName} (${stat.max})</strong>
        </div>

        <div class="progress-bar-bg" title="Subject Class Average: ${stat.mean}%">
          <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(0, stat.mean))}%"></div>
        </div>
      </div>
    `).join("");
  },

  /**
   * Populate modal for adding or editing a student.
   */
  openStudentModal(subjects, student = null) {
    const modal = document.getElementById("modal-student");
    const titleEl = document.getElementById("modal-student-title");
    const originalNameInput = document.getElementById("edit-original-name");
    const nameInput = document.getElementById("student-name");
    const marksContainer = document.getElementById("student-marks-fields");

    if (student) {
      titleEl.textContent = `Edit Marks: ${student.name}`;
      originalNameInput.value = student.name;
      nameInput.value = student.name;
    } else {
      titleEl.textContent = "Add Student Marks";
      originalNameInput.value = "";
      nameInput.value = "";
    }

    marksContainer.innerHTML = subjects.map((subj, idx) => {
      const val = student && student.marks[idx] !== undefined ? student.marks[idx] : "";
      return `
        <div>
          <label style="font-size: 11px;">${subj}</label>
          <input type="number" min="0" max="100" step="0.5" required
                 name="mark_${idx}" data-idx="${idx}" value="${val}" placeholder="0-100">
        </div>
      `;
    }).join("");

    modal.classList.remove("hidden");
    nameInput.focus();
  },

  /**
   * Display toast notification.
   */
  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  },

  /**
   * Update sync indicator status.
   */
  setSyncStatus(status, label) {
    const badge = document.getElementById("sync-status");
    const text = document.getElementById("sync-text");
    badge.className = `status-badge status-${status}`;
    text.textContent = label;
  }
};

