/**
 * analyzer.js
 * Core statistical calculations and grade evaluation engine.
 * Mirrors the numpy-based mathematics in grade_analyzer.py:
 * - Grade boundary lookup (Single Source of Truth)
 * - Student total and arithmetic mean
 * - Class-wide subject statistics (mean, min, max, topper)
 * - Overall class topper identification
 */

// Centralized grade scale: [minimum score required, letter grade]
const GRADE_SCALE = [
  [90, "A+"],
  [80, "A"],
  [70, "B"],
  [60, "C"],
  [50, "D"],
  [0,  "F"],
];

/**
 * Determine letter grade from percentage / average score.
 * @param {number} score
 * @returns {string} Letter grade
 */
function getGrade(score) {
  for (const [threshold, grade] of GRADE_SCALE) {
    if (score >= threshold) return grade;
  }
  return "F";
}

/**
 * Calculate totals, mean, and grade for an individual student.
 * @param {string} name
 * @param {number[]} marks
 * @returns {object} Calculated student metrics
 */
function calculateStudent(name, marks) {
  const validMarks = marks.map(m => Number(m) || 0);
  const total = validMarks.reduce((acc, val) => acc + val, 0);
  const mean = validMarks.length > 0 ? total / validMarks.length : 0;
  return {
    name,
    marks: validMarks,
    total: parseFloat(total.toFixed(1)),
    mean: parseFloat(mean.toFixed(2)),
    grade: getGrade(mean)
  };
}

/**
 * Compute class-wide statistics across all subjects and overall topper.
 * Vectorized/aggregated analysis identical to 2D numpy matrix operations.
 * @param {object} data - { subjects: string[], students: { [name: string]: number[] } }
 * @returns {object} Analytics summary
 */
function calculateClassAnalytics(data) {
  const subjects = data.subjects || [];
  const students = data.students || {};
  const studentNames = Object.keys(students);
  const totalStudents = studentNames.length;
  const totalSubjects = subjects.length;

  if (totalStudents === 0 || totalSubjects === 0) {
    return {
      totalStudents: 0,
      totalSubjects,
      overallMean: 0,
      topper: null,
      subjectStats: []
    };
  }

  // Calculate metrics for each student
  const studentList = studentNames.map(name => calculateStudent(name, students[name]));

  // Find top overall performer (np.argmax of totals)
  let topper = studentList[0];
  let classSumTotal = 0;
  let totalEntries = 0;

  for (const st of studentList) {
    if (st.total > topper.total) {
      topper = st;
    }
    classSumTotal += st.total;
    totalEntries += st.marks.length;
  }

  const overallMean = totalEntries > 0 ? parseFloat((classSumTotal / totalEntries).toFixed(2)) : 0;

  // Compute column statistics for each subject (mean, min, max, argmax/topper)
  const subjectStats = subjects.map((subj, colIdx) => {
    let colSum = 0;
    let minScore = Infinity;
    let maxScore = -Infinity;
    let topScorer = "";

    studentList.forEach(st => {
      const score = st.marks[colIdx] ?? 0;
      colSum += score;
      if (score < minScore) minScore = score;
      if (score > maxScore) {
        maxScore = score;
        topScorer = st.name;
      }
    });

    return {
      subject: subj,
      mean: parseFloat((colSum / totalStudents).toFixed(2)),
      min: minScore === Infinity ? 0 : parseFloat(minScore.toFixed(1)),
      max: maxScore === -Infinity ? 0 : parseFloat(maxScore.toFixed(1)),
      topperName: topScorer || "N/A"
    };
  });

  return {
    totalStudents,
    totalSubjects,
    overallMean,
    topper,
    subjectStats,
    studentsCalculated: studentList
  };
}

