
import { Course, Question } from './types';

// ============================================================================
// 📝 QUESTIONS CONFIGURATION
// ============================================================================

export const QUESTIONS_12TH: Question[] = [
  {
    id: 1,
    text: "Of all your classes, which one feels the most like 'you'?",
    subtext: "(e.g., Math, Biology, English, History, Art, Code, etc.)",
    inputType: 'text',
    placeholder: "The subject I connect with most is...",
  },
  {
    id: 2,
    text: "It's Saturday, no homework. What's the one thing you're doing that makes you lose track of time?",
    subtext: "(e.g., Gaming, Coding, Drawing, Reading/Writing)",
    inputType: 'text',
    placeholder: "I usually find myself...",
  },
  {
    id: 3,
    text: "Which of these sounds like a better day at work?",
    inputType: 'choice',
    options: [
      { label: "(A) Solving a complex data puzzle.", value: "Solving Data Puzzles" },
      { label: "(B) Designing a creative presentation or product.", value: "Creative Design & Presentation" },
      { label: "(C) Persuading a team to follow your vision.", value: "Leadership & Strategy" },
      { label: "(D) Helping a person one-on-one.", value: "Helping Individuals" },
    ],
  },
  {
    id: 4,
    text: "You're most comfortable working with...",
    inputType: 'choice',
    options: [
      { label: "(A) Numbers and data.", value: "Numbers & Data" },
      { label: "(B) People and teams.", value: "People & Teams" },
      { label: "(C) Words and ideas.", value: "Words & Ideas" },
      { label: "(D) Hands-on tools and objects.", value: "Tools & Physical Objects" },
    ],
  },
  {
    id: 5,
    text: "Ultimately, what's most important in your future career?",
    inputType: 'choice',
    options: [
      { label: "(A) Building/creating something new and innovative.", value: "Innovation & Creation" },
      { label: "(B) Helping people and making a positive impact.", value: "Social Impact" },
      { label: "(C) Gaining deep knowledge and expertise.", value: "Deep Expertise" },
      { label: "(D) Achieving a position of leadership and influence.", value: "Leadership & Influence" },
    ],
  },
];

export const QUESTIONS_UG: Question[] = [
  {
    id: 1,
    text: "Why are you looking for a change right now?",
    subtext: "Be honest - is it for money, passion, or pivot?",
    inputType: 'text',
    placeholder: "I feel stuck because...",
  },
  {
    id: 2,
    text: "Which hard skills do you want to master next?",
    subtext: "What specific technical or soft skills are you aiming for?",
    inputType: 'text',
    placeholder: "e.g., AI/ML, Strategic Finance, Public Speaking, UI Design...",
  },
  {
    id: 3,
    text: "Choose your ideal career trajectory.",
    inputType: 'choice',
    options: [
      { label: "Climbing the Corporate Ladder (Executive)", value: "Corporate Executive" },
      { label: "Building my own Venture (Founder)", value: "Entrepreneurship" },
      { label: "Deep Research & Academia (Specialist)", value: "Research & Academia" },
      { label: "Social Impact & Community (Activist)", value: "Social Impact" },
    ],
  },
  {
    id: 4,
    text: "What is your preferred balance?",
    inputType: 'choice',
    options: [
      { label: "High Intensity / High Reward (Grind)", value: "High Growth & Intensity" },
      { label: "Stable / Predictable / 9-to-5", value: "Stability & Predictability" },
      { label: "Flexible / Creative / Freedom", value: "Flexibility & Creative Freedom" },
      { label: "Mission-Driven / Meaningful Work", value: "Purpose-Driven" },
    ],
  },
  {
    id: 5,
    text: "If you were to write a thesis or start a project today, what would the title be?",
    inputType: 'text',
    placeholder: "e.g., 'The Future of Renewable Energy' or 'Modern Marketing Psychology'...",
  },
];


// ============================================================================
// 🟢 USER DATA CONFIGURATION (CSV)
// ============================================================================
// FORMAT REQUIREMENT: id,name,category,description,keywords
// Keywords field is CRITICAL for the matching algorithm.
// ============================================================================

const RAW_CSV_12TH_COURSES = `id,name,category,description,keywords
c1,"B.Des in User Interface/User Experience (UI/UX)",Design,"Designing digital products with a focus on human interaction.","Creativity, Technology, Psychology, Design, Drawing"
c2,"B.Des in Game Design",Design,"Creating rules, stories, and visuals for interactive entertainment.","Creativity, Technology, Gaming, Storytelling, Logic"
c3,"B.E. / B.Tech Computer Science",Technology,"Software development, algorithms, and system architecture.","Technology, Logic, Analysis, Coding, Math"
c4,"Bachelor of Architecture (B.Arch)",Architecture,"Planning and designing physical spaces and structures.","Creativity, Engineering, Math, Design, Drawing"
c5,"B.Sc in Data Science / AI",Science,"Analyzing complex data sets to drive decision making.","Analysis, Logic, Math, Technology, Data"
c6,"BBA (Marketing / Finance)",Business,"Strategic market analysis, branding, and financial management.","Business, Leadership, Communication, Analysis, Money"
c7,"Bachelor of Social Work (BSW)",Social Science,"Supporting individuals and communities through social systems.","Empathy, Social, Humanities, Impact, People"
c8,"B.A. in Psychology",Social Science,"Study of mind, behavior, and mental health.","Psychology, Empathy, Humanities, Analysis, People"
c9,"B.E. Mechanical / Robotics",Engineering,"Design and manufacturing of mechanical systems and automation.","Engineering, Physics, Math, Technology, Logic"
c10,"B.A. English / Journalism",Humanities,"Critical analysis, advanced writing, and mass communication.","Communication, Writing, Humanities, Creativity, Media"
c11,"B.Sc Biotechnology",Science,"Using biological systems for technological applications.","Science, Biology, Research, Analysis, Technology"
c12,"Integrated Law (B.A. LL.B)",Law,"Legal studies, judiciary systems, and corporate law.","Law, Logic, Communication, Humanities, Reading"
c13,"B.Com (Honors)",Business,"Advanced accounting, taxation, and economics.","Business, Analysis, Math, Finance, Logic"
c14,"MBBS / Medicine",Medical,"Clinical practice and medical science.","Science, Biology, Empathy, Health, People"
c15,"B.Sc Environmental Science",Science,"Study of ecology, environment protection, and sustainability.","Science, Nature, Impact, Biology, Research"
c16,"B.A. Political Science",Humanities,"Governance, international relations, and political theory.","Humanities, Policy, Leadership, History, Communication"
c17,"Bachelor of Hotel Management (BHM)",Hospitality,"Hospitality operations, service management, and culinary arts.","Hospitality, People, Management, Communication, Food"
c18,"B.Des in Fashion Communication",Design,"Visual merchandising, fashion journalism, and styling.","Design, Creativity, Fashion, Media, Communication"
c19,"B.Sc in Supply Chain Management",Business,"Logistics, global trade, and operations.","Business, Logic, Management, Analysis, Engineering"
c20,"B.A. in Sociology",Humanities,"Study of social behavior, society, and structures.","Humanities, Research, People, Social, History"
`;

const RAW_CSV_UG_MASTERS = `id,name,category,description,keywords
m1,"MBA (General Management)",Management,"Broad business leadership, strategy, and operations.","Business, Leadership, Management, Strategy, Corporate"
m2,"MBA (Marketing & Brand Management)",Management,"Focus on consumer behavior, advertising, and digital marketing.","Marketing, Creativity, Psychology, Business, Media"
m3,"MBA (Finance & Fintech)",Management,"Investment banking, corporate finance, and financial technologies.","Finance, Analysis, Math, Technology, Business"
m4,"M.Sc / M.Tech in Data Science & AI",Technology,"Advanced machine learning, big data analytics, and AI development.","Technology, Analysis, AI, Logic, Coding"
m5,"Masters in Design (M.Des)",Design,"Advanced interaction design, product design, or visual communication.","Design, Creativity, Technology, UX, Psychology"
m6,"M.A. in Psychology (Clinical/Industrial)",Social Science,"Specialization in mental health or organizational behavior.","Psychology, Empathy, Research, People, HR"
m7,"Masters in Public Policy (MPP)",Policy,"Governance, policy analysis, and public administration.","Policy, Government, Social, Law, Analysis"
m8,"Master of Social Work (MSW)",Social Work,"Advanced community practice, NGO management, and social justice.","Social, Empathy, Impact, People, Justice"
m9,"Masters in Journalism & Mass Comm",Media,"Digital media, broadcasting, and strategic communication.","Media, Communication, Writing, Creativity, News"
m10,"M.Tech in Computer Science",Technology,"Deep technical research in algorithms, systems, or cybersecurity.","Technology, Coding, Research, Logic, Engineering"
m11,"LL.M (Master of Laws)",Law,"Specialized legal expertise in corporate, criminal, or international law.","Law, Logic, Policy, Research, Corporate"
m12,"Masters in Economics",Economics,"Econometrics, financial markets, and economic theory.","Economics, Math, Analysis, Finance, Research"
m13,"Project Management Certification / Degree",Management,"Agile methodologies, resource planning, and team leadership.","Management, Leadership, Organization, Business, People"
m14,"Masters in Supply Chain Management",Management,"Logistics, operations research, and global supply chain strategies.","Management, Logistics, Engineering, Analysis, Business"
m15,"MBA (Human Resources)",Management,"Talent acquisition, employee relations, and organizational culture.","HR, People, Psychology, Management, Corporate"
m16,"Masters in Sustainable Development",Social Science,"Sustainability strategies, green tech, and environmental policy.","Impact, Science, Policy, Environment, Social"
m17,"M.Des in Animation & VFX",Design,"Advanced visual storytelling, 3D modeling, and visual effects.","Design, Animation, Creativity, Technology, Art"
m18,"Masters in Public Health (MPH)",Health,"Epidemiology, health policy, and community health promotion.","Health, Science, Policy, Research, Impact"
m19,"M.A. in International Relations",Humanities,"Global politics, diplomacy, and foreign affairs.","Policy, History, Communication, Travel, Government"
`;

// ============================================================================
// 🛠️ CSV PARSER UTILITY
// ============================================================================

export const parseCoursesFromCSV = (csvData: string): Course[] => {
  const lines = csvData.trim().split('\n');
  const dataRows = lines.slice(1);
  
  return dataRows.map((line, index): Course | null => {
    // Robust Regex to handle commas inside quotes
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    
    if (!values || values.length < 4) return null;

    const clean = (val: string) => val ? val.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';
    
    // Parse keywords from 5th column if available
    const rawKeywords = clean(values[4] || '');
    const tags = rawKeywords ? rawKeywords.split(',').map(k => k.trim()) : [];

    return {
      id: clean(values[0] || `auto-${index}`),
      name: clean(values[1] || 'Unknown Course'),
      category: clean(values[2] || 'General'),
      description: clean(values[3] || 'No description provided'),
      tags: tags
    };
  }).filter((item): item is Course => item !== null);
};

export const COURSE_CATALOG = parseCoursesFromCSV(RAW_CSV_12TH_COURSES);
export const MASTERS_CATALOG = parseCoursesFromCSV(RAW_CSV_UG_MASTERS);
