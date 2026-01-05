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
      description: "Top 3 recommended courses/degrees. Can be from the reference dataset OR generic best-fit valid degrees.",
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING, description: "The degree type extracted from the name (e.g. 'B.Des', 'B.Tech', 'MBA', 'B.Sc')." },
          courseName: { type: Type.STRING, description: "The specific name of the course or degree program." },
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


  /* 
   * LOGIC UPDATE: 
   * We now have TWO distinct distinct instruction sets.
   * 1. MATCHING MODE (Custom Catalog): Strict vector scoring against provided list.
   * 2. GENERATION MODE (Default): Pure creative career counseling with NO restriction to a list.
   */
  const userProvidedCustomCatalog = customCourses && customCourses.length > 0;
  let systemInstruction = "";
  let prompt = "";
  let temperature = 0.5;
  let catalogString = "";

  // === MODE 1: STRICT MATCHING (User provided specific preferences) ===
  if (userProvidedCustomCatalog) {
    catalogString = catalog.map(c =>
      `ID: ${c.id} | Name: "${c.name}" | Category: ${c.category} | Tags: [${c.tags?.join(', ')}] | Description: ${c.description}`
    ).join("\n");

    systemInstruction = `
      You are Pathfinder AI, an advanced algorithmic career matching engine.
      Your task is to convert unstructured user text into structured data and perform a STRICT MATCH against the provided course database.

      ### 🧠 ALGORITHM:
      1.  **Extract Profile**: Analyze Q1-Q5 to build a user keyword profile.
      2.  **Scoring Engine**: 
          - Iterate through the provided "COURSE DATASET".
          - Score each course (0-100) based on tag overlap, category fit, and semantic relevance.
          - CRITICAL: You MUST use the *exact* \`Name\` string from the provided database.
      3.  **Explain**: Generate a reason for the match based on the user's specific answers.
      
      ### OUTPUT:
      - Valid JSON only.
    `;

    prompt = `
      TASK: Select the top 3 matches from the provided dataset for this user.

      === 1. STUDENT PROFILE ===
      LEVEL: ${isUG ? "Post-Graduation" : "Post-Class 12"}
      ANSWERS:
      ${formattedAnswers}

      === 2. STRICT COURSE DATASET ===
      ${catalogString}

      === 3. EXECUTION ===
      Score and Select. Return JSON.
    `;

    temperature = 0.2; // Low temp for strict matching
  }

  // === MODE 2: OPEN GENERATION (Dynamic / Default) ===
  else {
    // No catalog string used here to prevent anchoring bias.
    systemInstruction = `
      You are Pathfinder AI, a world-class career counselor and academic strategist.
      Your task is to analyze a student's psychometric profile and recommend the 3 BEST REAL-WORLD degrees or courses for them.

      ### 🧠 ALGORITHM:
      1.  **Deep Profile Analysis**: 
          - Look for "hidden" traits in their answers (e.g., mention of "Lego" + "Nature" -> Biomimicry Architecture).
          - Do NOT just look for surface-level keywords. Synthesize a "Professional Archetype".
      2.  **Global Search**: 
          - Ignore any pre-conceived lists. Search your entire knowledge base for degrees, certifications, or career paths that currently exist in universities worldwide.
          - Prioritize *emerging* fields (AI Ethics, Sustainable Fashion, Space Law) if the user's profile suggests it.
          - Ensure the recommendations are distinct from each other.
      3.  **Explain**: 
          - Sell the recommendation. Why will THIS specific person thrive there?

      ### OUTPUT:
      - Valid JSON only.
      - Ensure \`relevanceScore\` is high (85+) for strong fits.
    `;

    prompt = `
      TASK: Recommend the 3 best ${isUG ? "Master's/Postgrad degrees" : "Undergraduate degrees"} for this specific student.

      === STUDENT PROFILE ===
      LEVEL: ${isUG ? "Post-Graduation" : "Post-Class 12"}
      ANSWERS:
      ${formattedAnswers}

      === EXECUTION ===
      Think creatively. Suggest actionable, specific degrees. Return JSON.
    `;

    temperature = 0.9; // High temp for creativity
  }

  const attemptAnalysis = async (retryCount = 0): Promise<AnalysisResult> => {
    try {
      console.log(`🚀 STARTING AI ANALYSIS (Attempt ${retryCount + 1})`);
      console.log("API KEY PRESENT:", !!processEnvApiKey);
      console.log("Prompt Mode:", userProvidedCustomCatalog ? "Custom Catalog" : "Open Dynamic");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: temperature,
        },
      });

      const text = response.text;
      console.log("✅ RAW AI RESPONSE:", text);

      if (!text) throw new Error("No response text received from Gemini API.");

      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText) as AnalysisResult;

    } catch (error: any) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);

      const isQuotaError = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");

      // Retry up to 2 times for quota errors (wait 4000ms, then 8000ms)
      if (isQuotaError && retryCount < 2) {
        const delay = 4000 * Math.pow(2, retryCount);
        console.warn(`⚠️ Quota hit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptAnalysis(retryCount + 1);
      }

      throw error;
    }
  };

  try {
    return await attemptAnalysis();
  } catch (error) {
    console.error("Gemini Analysis Final Failure:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("⚠️ USING MOCK DATA DUE TO API ERROR ⚠️");
    return getMockAnalysisResult(level, errorMessage);
  }
};

const getMockAnalysisResult = (level: '12' | 'UG', errorMessage?: string): AnalysisResult => {
  const isUG = level === 'UG';

  const title = errorMessage
    ? `⚠️ API ERROR: ${errorMessage.substring(0, 50)}...`
    : "⚠️ SIMULATION MODE (API FAILED) ⚠️";

  return {
    archetype: {
      title: title,
      description: `[DIAGNOSTIC]: READ THIS. The app failed to connect to Gemini. \nError Details: ${errorMessage || "Unknown Error"}. \n\nFalling back to simulation data.`,
      drivers: {
        academic: "Computer Science & Design",
        passion: "Building & Creating",
        cognitive: "Structural Logic",
        domain: "Technology",
        motivation: "Innovation"
      }
    },
    visionBoard: {
      futureSelf: "Five years from now, you are leading a product team or running your own venture. Your workspace is a blend of code and canvas—whiteboards filled with diagrams and screens running complex simulations. You are the bridge between raw engineering and human experience.",
      keyThemes: ["Builder", "Innovator", "Tech-Artist"],
      quote: "The best way to predict the future is to invent it. – Alan Kay"
    },
    skillSignature: [
      { subject: "Logic & Algo", A: 85, fullMark: 100 },
      { subject: "Creativity", A: 90, fullMark: 100 },
      { subject: "Empathy", A: 75, fullMark: 100 },
      { subject: "Tech Fluency", A: 80, fullMark: 100 },
      { subject: "Leadership", A: 60, fullMark: 100 },
      { subject: "Entrepreneurship", A: 70, fullMark: 100 }
    ],
    recommendations: isUG ? [
      {
        degree: "M.Tech",
        courseName: "M.Tech in Computer Science",
        matchReason: "Matches your strong foundation in code and desire to build complex systems.",
        dataInsight: "Keyword overlap: Technology, Coding, Architecture",
        relevanceScore: 95
      },
      {
        degree: "MBA",
        courseName: "MBA (General Management)",
        matchReason: "To help you scale your ideas and lead teams effectively.",
        dataInsight: "Keyword overlap: Leadership, Strategy, Business",
        relevanceScore: 88
      },
      {
        degree: "M.Des",
        courseName: "Masters in Design (M.Des)",
        matchReason: "Perfect for ensuring your technical solutions are user-centric and beautiful.",
        dataInsight: "Keyword overlap: Design, Creativity, UX",
        relevanceScore: 85
      }
    ] : [
      {
        degree: "B.Tech",
        courseName: "B.E. / B.Tech Computer Science",
        matchReason: "The gold standard for builders. Gives you the raw tools to create anything.",
        dataInsight: "Keyword overlap: Technology, Logic, Code",
        relevanceScore: 95
      },
      {
        degree: "B.Des",
        courseName: "B.Des in User Interface/User Experience (UI/UX)",
        matchReason: "Blends your tech skills with your creative eye for human interaction.",
        dataInsight: "Keyword overlap: Design, Creativity, Technology",
        relevanceScore: 90
      },
      {
        degree: "B.Sc",
        courseName: "B.Sc in Data Science / AI",
        matchReason: "For the analytical side of your visionary brain, enabling smart systems.",
        dataInsight: "Keyword overlap: Analysis, Logic, AI",
        relevanceScore: 85
      }
    ],
    alternativePathways: [
      {
        focus: "Creative Tech",
        courseName: isUG ? "M.Des in Animation & VFX" : "B.Des in Game Design",
        insight: "If you want to lean purely into the creative/entertainment aspect."
      },
      {
        focus: "Business of Tech",
        courseName: isUG ? "MBA (Finance & Fintech)" : "BBA (Marketing / Finance)",
        insight: "If you decide to focus on the monetary/market side of innovation."
      }
    ],
    communityStats: {
      headline: "People like you often found startups or lead product teams.",
      topCareers: [
        { name: "Product Manager", percentage: 40 },
        { name: "Software Architect", percentage: 35 },
        { name: "UX Researcher", percentage: 25 }
      ],
      commonInterests: ["Generative Art", "Startup Culture", "Sci-Fi Literature", "Hackathons"]
    }
  };
};