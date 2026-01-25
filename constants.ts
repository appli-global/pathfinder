import { Course, Question } from './types';
// @ts-ignore
import RAW_COURSE_DATA from './courses_weights.csv?raw';

export const SKILL_COLUMNS = [
  "Critical Thinking", "Analytical Reasoning", "Problem Solving", "Logical Reasoning",
  "Research Skills", "Data Interpretation", "Quantitative Analysis", "Decision Making",
  "Creativity & Innovation", "Strategic Thinking", "Written Communication", "Verbal Communication",
  "Presentation Skills", "Public Speaking", "Negotiation", "Teamwork",
  "Cross-Cultural Communication", "Interpersonal Skills", "Conflict Resolution", "Emotional Intelligence",
  "Self-Learning", "Adaptability", "Curiosity", "Growth Mindset", "Time Management",
  "Attention to Detail", "Organization Skills", "Resilience", "Self-Motivation",
  "Business Management", "Economics", "Psychology", "Sociology", "Political Science",
  "Environmental Studies", "Biology", "Chemistry", "Physics", "Mathematics",
  "Computer Literacy", "Statistics", "Finance & Accounting", "Marketing & Branding",
  "Human Resource Management", "Digital Literacy", "Sustainability Awareness",
  "Global Awareness", "Leadership", "Project Management", "Ethical Reasoning",
  "Social Responsibility", "Cultural Awareness"
];

export const QUESTIONS_12TH: Question[] = [
  {
    id: 1,
    text: "Which subject is totally your vibe?",
    subtext: "(e.g., Math, Biology, English, History, Art, Code, etc.)",
    inputType: 'text',
    options: [] // Open text
  },
  {
    id: 2,
    text: "It's Saturday, no homework. What's the one thing you're doing that makes you lose track of time?",
    subtext: "(e.g., Gaming, Coding, Drawing, Reading/Writing)",
    inputType: 'text',
    options: []
  },
  {
    id: 3,
    text: "Which of these sounds like a better day at work?",
    inputType: 'choice',
    options: [
      { label: "Solving a complex data puzzle.", value: "Data Puzzle" },
      { label: "Designing a creative presentation or product.", value: "Creative Design" },
      { label: "Persuading a team to follow your vision.", value: "Team Vision" },
      { label: "Helping a person one-on-one.", value: "Helping One-on-One" }
    ]
  },
  {
    id: 4,
    text: "You're most comfortable working with...",
    inputType: 'choice',
    options: [
      { label: "Numbers and data.", value: "Numbers & Data" },
      { label: "People and teams.", value: "People & Teams" },
      { label: "Words and ideas.", value: "Words & Ideas" },
      { label: "Hands-on tools and objects.", value: "Tools & Objects" }
    ]
  },
  {
    id: 5,
    text: "Ultimately, what's most important in your future career?",
    inputType: 'choice',
    options: [
      { label: "Building/creating something new and innovative.", value: "Innovation" },
      { label: "Helping people and making a positive impact.", value: "Impact" },
      { label: "Gaining deep knowledge and expertise.", value: "Expertise" },
      { label: "Achieving a position of leadership and influence.", value: "Leadership" }
    ]
  }
];

export const QUESTIONS_UG: Question[] = [
  {
    id: 1,
    text: "Why are you looking for a change right now? (Be honest - is it for money, passion, or pivot?)",
    inputType: 'text',
    options: []
  },
  {
    id: 2,
    text: "Which hard skills do you want to master next? (What specific technical or soft skills are you aiming for?)",
    inputType: 'text',
    options: []
  },
  {
    id: 3,
    text: "Looking 3-5 years ahead, what specific job title or role do you see yourself in?",
    inputType: 'text',
    options: []
  },
  {
    id: 4,
    text: "Describe your ideal work environment (e.g. fast-paced startup, structured corporate, remote research, etc).",
    inputType: 'text',
    options: []
  },
  {
    id: 5,
    text: "If you had to write a thesis or lead a capstone project today, what specific topic would it cover?",
    inputType: 'text',
    options: []
  }
];

const UG_DEGREES = new Set([
  'B.Arch', 'B.Com', 'B.Des', 'B.E', 'B.Nursing', 'B.Pharm', 'B.Plan', 'B.Sc',
  'B.Voc', 'BA', 'BAMS', 'BBA', 'BBM', 'BCA', 'BDS', 'BFA', 'BHA', 'BHM',
  'BMIT', 'BMLT', 'BMS', 'BOT', 'BPT', 'BSW', 'BTTM', 'BVA', 'BYNS', 'MBBS',
  'B.Com LLB', 'BA LLB', 'BBA LLB', 'BMS LLB (Honours)'
]);

const PG_DEGREES = new Set([
  'LL.B', 'M.Arch', 'M.Com', 'M.Pharm', 'M.Tech', 'MA', 'MBA', 'MCA', 'Mca2',
  'Msc', 'P.B.B.Sc', 'B.Ed'
]);

const parseCoursesFromCSV = (csvData: string): Course[] => {
  const lines = csvData.trim().split('\n');
  const courses: Course[] = [];

  // Skip header if present (starts with Sheet)
  const startIndex = lines[0].startsWith('Sheet') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Robust CSV parser handles quotes and empty fields (buffer state machine)
    const values: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];

      if (char === '"') {
        if (insideQuotes && line[c + 1] === '"') {
          // Escaped quote (double "")
          currentVal += '"';
          c++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim()); // Push last value

    const safeValues = values; // Use parsed values directly

    if (safeValues.length < 4) continue;

    // Col 0: SheetDegree (Code)
    // Col 1: Degree Name
    // Col 2: Specialization
    // Col 3+: Weights
    const degreeCode = safeValues[0];
    const degreeName = safeValues[1];
    const specialization = safeValues[2];

    // SKIP HEADER ROWS (Crucial Fix)
    if (
      degreeCode.toLowerCase().includes('sheet') ||
      degreeCode.toLowerCase().includes('degree') ||
      degreeName.toLowerCase() === 'degree'
    ) {
      continue;
    }

    // Skill weights start at index 3
    // We Map them to SKILL_COLUMNS
    const weights: Record<string, number> = {};
    const weightValues = safeValues.slice(3); // All remaining columns

    SKILL_COLUMNS.forEach((skill, index) => {
      if (index < weightValues.length) {
        const val = parseFloat(weightValues[index]);
        if (!isNaN(val) && val > 0) {
          weights[skill] = val;
        }
      }
    });

    // Extract top 5 skills as tags
    const sortedSkills = Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8) // Take top 8 for better matching content
      .map(([skill]) => skill);

    // Construct a rich description
    const desc = `${degreeName} with a specialization in ${specialization}. Key focus areas include ${sortedSkills.slice(0, 3).join(', ')}.`;

    const course: Course = {
      id: `${degreeCode}-${i}`,
      name: specialization === 'General' ? degreeName : `${degreeName} - ${specialization}`,
      category: degreeCode === 'Mca2' ? 'MCA' : degreeCode,
      description: desc,
      tags: sortedSkills,
      weights: weights
    };

    courses.push(course);
  }

  return courses;
};

const ALL_COURSES = parseCoursesFromCSV(RAW_COURSE_DATA);

// Filter lists logic - INCLUSIVE STRATEGY
// We want to ensure EVERY course finds a home unless strictly excluded.

const EXCLUDED_TERMS = ['degree']; // Terms that definitely indicate a bad row

export const COURSE_CATALOG = ALL_COURSES.filter(c => {
  const cat = c.category.toUpperCase();
  const name = c.name.toLowerCase();

  // Exclude obviously bad rows
  if (EXCLUDED_TERMS.some(term => name === term)) return false;

  // If it's explicitly PG, skip it (it goes to Masters)
  if (PG_DEGREES.has(cat) || (cat.startsWith('M') && cat !== 'MBBS')) return false;

  // Otherwise, if it's explicitly UG, keep it
  if (UG_DEGREES.has(cat)) return true;

  // CATCH-ALL FOR "ORPHANS":
  // If it doesn't start with M (Masters) and isn't explicitly PG, we assume it's UG-accessible
  // This captures weird codes or general courses.
  if (!cat.startsWith('M')) return true;

  return false;
});

export const MASTERS_CATALOG = ALL_COURSES.filter(c => {
  const cat = c.category.toUpperCase();

  // Explicit PG Check
  if (PG_DEGREES.has(cat)) return true;

  // Heuristic PG Check
  if (cat.startsWith('M') && cat !== 'MBBS') return true;

  // Note: We don't need a catch-all here because the UG catch-all above grabs everything else.
  // This ensures mutual exclusivity mostly, but prioritizes UG for ambiguity.
  return false;
});

// A Set of all valid course names for strict validation
export const VALID_COURSE_NAMES = new Set(ALL_COURSES.map(c => c.name));
