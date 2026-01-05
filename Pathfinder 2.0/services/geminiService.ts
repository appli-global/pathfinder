import { GoogleGenAI, Type, Schema } from "@google/genai";
import { COURSE_CATALOG, MASTERS_CATALOG } from "../constants";
import { AnalysisResult, AnswerMap, Course } from "../types";

const processEnvApiKey = process.env.API_KEY;

if (!processEnvApiKey) {
  console.error("API_KEY is missing from process.env");
}

const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    archetype: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for the user's professional persona" },
        description: { type: Type.STRING, description: "A paragraph describing who they are based on the answers." },
        drivers: {
          type: Type.OBJECT,
          properties: {
            academic: { type: Type.STRING },
            passion: { type: Type.STRING },
            cognitive: { type: Type.STRING },
            domain: { type: Type.STRING },
            motivation: { type: Type.STRING },
          },
          required: ["academic", "passion", "cognitive", "domain", "motivation"],
        },
      },
      required: ["title", "description", "drivers"],
    },
    visionBoard: {
      type: Type.OBJECT,
      description: "A visualization of the user's future career life.",
      properties: {
        futureSelf: { type: Type.STRING, description: "A vivid, inspiring paragraph describing a 'Day in the Life' of this person 5 years from now." },
        keyThemes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 single words representing their future (e.g., 'Leadership', 'Design', 'Impact')." },
        quote: { type: Type.STRING, description: "A famous or generated inspiring quote that fits their personality." }
      },
      required: ["futureSelf", "keyThemes", "quote"]
    },
    skillSignature: {
      type: Type.ARRAY,
      description: "Numerical representation of skills for a radar chart. Return exactly 6 key dimensions.",
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: "Dimension name (e.g. Creativity, Logic, Empathy)" },
          A: { type: Type.INTEGER, description: "Score from 0 to 100" },
          fullMark: { type: Type.INTEGER, description: "Always 100" },
        },
        required: ["subject", "A", "fullMark"],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: "Top 3 recommended courses/degrees. MUST use exact course names from the provided catalog.",
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING, description: "The degree type extracted from the name (e.g. 'B.Des', 'B.Tech', 'MBA', 'B.Sc')." },
          courseName: { type: Type.STRING, description: "Must match the exact name from the dataset." },
          matchReason: { type: Type.STRING, description: "Why this fits the archetype, referencing specific user answers." },
          dataInsight: { type: Type.STRING, description: "Technical explanation of the skill match (e.g. 'Matches expanded tags from Q2')." },
          relevanceScore: { type: Type.INTEGER, description: "0-100" },
        },
        required: ["degree", "courseName", "matchReason", "dataInsight", "relevanceScore"],
      },
    },
    alternativePathways: {
      type: Type.ARRAY,
      description: "2-3 alternative career paths.",
      items: {
        type: Type.OBJECT,
        properties: {
          focus: { type: Type.STRING },
          courseName: { type: Type.STRING },
          insight: { type: Type.STRING },
        },
        required: ["focus", "courseName", "insight"],
      },
    },
    communityStats: {
      type: Type.OBJECT,
      description: "Simulated statistics for people with this specific archetype.",
      properties: {
        headline: { type: Type.STRING, description: "A catchy header about this cohort, e.g., 'People like you often thrive in...'" },
        topCareers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              percentage: { type: Type.INTEGER },
            },
            required: ["name", "percentage"],
          },
        },
        commonInterests: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["headline", "topCareers", "commonInterests"],
    },
  },
  required: ["archetype", "visionBoard", "skillSignature", "recommendations", "alternativePathways", "communityStats"],
};

export const analyzeCareerPath = async (
  answers: AnswerMap, 
  level: '12' | 'UG',
  customCourses?: Course[]
): Promise<AnalysisResult> => {
  const isUG = level === 'UG';
  
  const catalog = customCourses && customCourses.length > 0 ? customCourses : (isUG ? MASTERS_CATALOG : COURSE_CATALOG);
  
  // Context mapping aligns with constants.ts questions
  const qContext = isUG ? {
    1: "Reason for Change (Drive)",
    2: "Desired Hard Skills (CRITICAL - Extract keywords here)",
    3: "Ideal Career Track",
    4: "Work-Life Preference",
    5: "Specific Thesis/Interest Topic (Latent Interest)"
  } : {
    1: "Favorite Class (Academic Identity)",
    2: "Saturday Activity (Flow State / Keyword Source)",
    3: "Ideal Work Day (Task Preference)",
    4: "Comfort Zone (Modality)",
    5: "Career Motivation (Core Values)"
  };

  const formattedAnswers = Object.entries(answers)
    .map(([qId, ans]) => {
      const id = parseInt(qId);
      const context = qContext[id as keyof typeof qContext] || `Question ${id}`;
      return `[${context}]: "${ans}"`;
    })
    .join("\n");

  const catalogString = catalog.map(c => 
    `ID: ${c.id} | Name: "${c.name}" | Category: ${c.category} | Tags: [${c.tags?.join(', ')}] | Description: ${c.description}`
  ).join("\n");

  const systemInstruction = `
    You are Pathfinder AI, an advanced algorithmic career matching engine.
    Your task is to convert unstructured user text into structured data and perform a match against the course database based on SEMANTIC RELEVANCE and TAG OVERLAP.

    ### 🧠 THINKING ALGORITHM (Execute this logic step-by-step):
    
    1.  **PROFILE VECTORIZATION (User Data Extraction)**:
        -   **Analyze Q1 (Academic Identity) & Q2 (Flow State)**:
            -   Extract specific skills and interests from the raw text.
            -   **EXPAND** these concepts into related keywords (Synonyms/Industry Terms).
            -   *Example*: "Lego" -> [Construction, Engineering, Architecture, Design, 3D Modeling].
            -   *Example*: "Debating" -> [Law, Politics, Communication, Public Speaking, Logic].
            -   *Example*: "Coding" -> [Computer Science, Logic, Software, AI, Technology].
        -   **Map Q3 (Work Day) & Q4 (Comfort Zone)**:
            -   Identify the *Work Modality*: (Data-Driven, People-Oriented, Creative, or Hands-on).
            -   *Constraint*: If a course is purely "Data" (e.g., Data Science) but user selected "People and teams", lowers its score unless they *also* mentioned Tech keywords in Q1/Q2.
        -   **Analyze Q5 (Core Values)**:
            -   Use this as a tie-breaker. (Innovation vs. Impact vs. Money/Leadership).

    2.  **SCORING ENGINE (0-100 Scale)**:
        -   Iterate through every course in the database. Start at 0.
        -   **Keyword Overlap (+50 pts)**:
            -   Compare *User Expanded Keywords* with *Course Tags*.
            -   Add +15 pts per strong match (capped at 50).
        -   **Category Alignment (+30 pts)**:
            -   Does the *Course Category* match the User's Q3/Q4 preferences? (e.g. User "Creative Design" -> Category "Design" or "Architecture").
        -   **Value Fit (+20 pts)**:
            -   Does the course *Description* align with Q5? (e.g. "Social Work" aligns with "Helping people").
        -   **Keyword Penalty (-20 pts)**:
            -   If the course tags contain a hard skill that contradicts the user's Q4 choice (e.g. Course has "Math" but user chose "Words and Ideas" and didn't mention math in Q1/Q2).

    3.  **SELECTION & REFINEMENT**:
        -   Sort courses by Final Score.
        -   Select the top 3 unique courses.
        -   **CRITICAL RULE**: You MUST use the *exact* \`Name\` string from the provided database. Do not paraphrase.

    4.  **EXPLAINABILITY**:
        -   In the output, the \`matchReason\` must explicitly mention which user input triggered the match. (e.g. "Matches your interest in [Expanded Keyword] from Question 2...")
        -   \`dataInsight\`: Mention the specific tags that overlapped.

    ### OUTPUT FORMAT:
    - Return ONLY valid JSON.
    - **IMPORTANT**: Do not use Markdown formatting (like **, *, \`) in the JSON string values. Return plain text only.
  `;

  const prompt = `
    TASK: Recommend the best ${isUG ? "Master's/Postgrad Degrees" : "Undergraduate Degrees"} based on the profile below.

    === 1. STUDENT PROFILE ===
    LEVEL: ${isUG ? "Post-Graduation" : "Post-Class 12"}
    
    USER ANSWERS:
    ${formattedAnswers}

    === 2. AVAILABLE COURSE DATASET ===
    ${catalogString}

    === 3. EXECUTION ===
    Extract tags. Expand concepts. Score courses. Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig: {
          thinkingBudget: 10240, 
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};