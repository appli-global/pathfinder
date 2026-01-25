import { GoogleGenAI, Type, Schema } from "@google/genai";
import { COURSE_CATALOG, MASTERS_CATALOG, SKILL_COLUMNS, VALID_COURSE_NAMES } from "../constants";
import { AnalysisResult, AnswerMap, Course } from "../types";

const processEnvApiKey = process.env.API_KEY;

if (!processEnvApiKey) {
  console.warn("⚠️ API_KEY is missing. The app will run in SIMULATION MODE.");
}

// Safely initialize AI only if key exists, otherwise null
const ai = processEnvApiKey ? new GoogleGenAI({ apiKey: processEnvApiKey }) : null;

// --- SCHEMAS ---

const VECTOR_SCHEMA: Schema = {
  type: Type.OBJECT,
  description: "A mapping of skill traits to relevance scores (0-1) based on user profile.",
  properties: {
    weights: {
      type: Type.OBJECT,
      properties: Object.fromEntries(SKILL_COLUMNS.map(skill => [skill, { type: Type.NUMBER }])),
      required: [], // All optional, but model should fill relevant ones
    }
  },
  required: ["weights"]
};

const FINAL_RESPONSE_SCHEMA: Schema = {
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
      description: "Final top 3 selection from the provided candidate list. MUST be EXACT strings from the list.",
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          courseName: { type: Type.STRING },
          matchReason: { type: Type.STRING },
          dataInsight: { type: Type.STRING },
          relevanceScore: { type: Type.INTEGER },
        },
        required: ["degree", "courseName", "matchReason", "dataInsight", "relevanceScore"],
      },
    },
    alternativePathways: {
      type: Type.ARRAY,
      description: "2-3 alternative career paths from the provided candidate list.",
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
        headline: { type: Type.STRING },
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
    audioScript: { type: Type.STRING, description: "A 30-45 second conversational script. Speak like a mentor, not a machine. Use contractions ('You're', 'We've'), warm tone, and short sentences. No 'Based on your inputs'. Just jump in." },
  },
  required: ["archetype", "visionBoard", "skillSignature", "recommendations", "alternativePathways", "communityStats", "audioScript"],
};



// --- DETERMINISTIC CALIBRATION LAYER ---
// Map explicit answers to specific CSV columns to ensure "Scientific" accuracy.
const TRAIT_MAP: Record<string, string[]> = {
  // Q3: Work Day Preference
  "Data Puzzle": ["Problem Solving", "Analytical Reasoning", "Logical Reasoning", "Quantitative Analysis"],
  "Creative Design": ["Creativity & Innovation", "Digital Literacy", "Presentation Skills", "Design Thinking"], // 'Design Thinking' if available, else mapped to closest
  "Team Vision": ["Leadership", "Strategic Thinking", "Teamwork", "Public Speaking"],
  "Helping One-on-One": ["Interpersonal Skills", "Emotional Intelligence", "Social Responsibility", "Psychology"],

  // Q4: Comfort Zone
  "Numbers & Data": ["Quantitative Analysis", "Data Interpretation", "Statistics", "Finance & Accounting", "Mathematics"],
  "People & Teams": ["Teamwork", "Human Resource Management", "Conflict Resolution", "Cross-Cultural Communication"],
  "Words & Ideas": ["Written Communication", "Verbal Communication", "Research Skills", "Critical Thinking"],
  "Tools & Objects": ["Computer Literacy", "Project Management", "Digital Literacy"],

  // Q5: Motivation
  "Innovation": ["Creativity & Innovation", "Self-Learning", "Curiosity", "Entrepreneurship"],
  "Impact": ["Social Responsibility", "Ethical Reasoning", "Sustainability Awareness", "Environmental Studies"],
  "Expertise": ["Research Skills", "Attention to Detail", "Self-Motivation"],
  "Leadership": ["Leadership", "Decision Making", "Business Management", "Negotiation"]
};

const calculateBaseVector = (answers: AnswerMap): Record<string, number> => {
  const vector: Record<string, number> = {};

  Object.values(answers).forEach(ans => {
    // Check if the answer (or part of it) matches our keys
    const traits = TRAIT_MAP[ans] || [];
    traits.forEach(trait => {
      // 1.0 is a strong signal for an explicit choice
      vector[trait] = (vector[trait] || 0) + 1.0;
    });
  });

  return vector;
};

// --- HYBRID ENGINE STEPS ---

// Helper: Robustly extract text from Gemini response
const extractTextFromResponse = (response: any): string => {
  try {
    // 1. Try standard helper method
    if (typeof response.text === 'function') {
      return response.text();
    }
    // 2. Try candidates array (Google GenAI SDK standard structure)
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || "{}";
      }
    }
    // 3. Fallback to raw text property if it exists
    if (typeof response.text === 'string') {
      return response.text;
    }
    console.warn("Gemini Response contained no text:", JSON.stringify(response));
    return "{}";
  } catch (e) {
    console.error("Error extracting text from Gemini response:", e);
    return "{}";
  }
};

// Step 1: Extract User Vector AND Search Keywords using LLM
const extractUserVector = async (formattedAnswers: string): Promise<{ weights: Record<string, number>, keywords: string[] }> => {
  const prompt = `
      TASK: Analyze the user's career profile to build a comprehensive "Psychometric Application Vector".
      
      USER PROFILE:
      ${formattedAnswers}

      TRAIT LIST:
      ${SKILL_COLUMNS.join(', ')}

      INSTRUCTIONS:
      1. **Explicit Subject Priority**: If the user mentions specific subjects (e.g. "Math", "Biology"), add them to 'searchKeywords'.
      2. **Psychometric Scoring (0.0 - 1.0)**:
         - **High Weight (0.85 - 1.0)**: Traits explicitly demanded by the user's answers.
         - **Medium Weight (0.4 - 0.7)**: Traits *inferred* from the user's vibe, flow state, or ideal work day. (e.g. "Gaming" -> Problem Solving + Digital Literacy).
         - **Low Weight (0.0)**: Traits clearly irrelevant.
      3. **Goal**: Create a rich, nuanced profile, not just a keyword match. The user wants to feel "understood".
      4. **Output**: JSON with 'weights' object and 'searchKeywords' array.
    `;

  if (!ai) throw new Error("API Key missing - Simulation Mode");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert career psychologist. Output strictly valid JSON.",
      responseMimeType: "application/json",
      responseSchema: VECTOR_SCHEMA,
      temperature: 0.2, // Slightly higher temp for inference
    },
  });

  // Safe text extraction
  const jsonText = extractTextFromResponse(response);
  const data = JSON.parse(jsonText);
  return { weights: data.weights, keywords: data.searchKeywords || [] };
};

// Step 2: Scout/Score Courses (Client-Side Math + Keyword Search)
const scoutCourses = (userVector: Record<string, number>, keywords: string[], catalog: Course[]): Course[] => {
  const scored = catalog.map(course => {
    // SCORING WEIGHTS
    // 1. Keyword Match: +10.0 per keyword (Nice to have, but not overwhelming)
    // 2. Trait Match: Sum of (userWeight * courseWeight) * 1000. 
    //    Typical course weight ~0.02. Typical user weight ~0.9. Product ~0.018.
    //    With 20 traits, total sum could be ~0.36. 
    //    Multiply by 1000 => 360 points.
    //    This makes personality match (360) > keyword match (10-20).

    let score = 0;
    let peakMatch = 0;
    let matchedKeywords = 0;

    // 1. KEYWORD SEARCH BONUS (The "Search Engine" Logic - DOWNGRADED)
    // Now a helping hand, not a kingmaker.
    const normalizedName = course.name.toLowerCase();
    keywords.forEach(kw => {
      const cleanKw = kw.toLowerCase().trim();
      if (cleanKw.length > 2 && normalizedName.includes(cleanKw)) {
        score += 15.0;
        matchedKeywords++;
      }
    });

    // 2. DOT PRODUCT (The "Personality" Logic - UPGRADED)
    // We want this to be the primary driver.
    if (course.weights) {
      for (const [skill, weight] of Object.entries(course.weights)) {
        const userW = userVector[skill] || 0;

        // Only count if both exist to avoid noise
        if (userW > 0.1 && weight > 0) {
          const matchVal = (userW * weight);
          score += (matchVal * 1500.0); // Big multiplier to make this the dominant number

          if (matchVal > peakMatch) peakMatch = matchVal;
        }
      }
    }

    // 3. SPIKE BONUS (The "Niche" Logic)
    // Reward single high-affinity matches (e.g. user loves Art, course is purely Art)
    score += (peakMatch * 3000.0);

    return { ...course, tempScore: score };
  });

  return scored.sort((a, b) => (b as any).tempScore - (a as any).tempScore);
};

// Step 3: Final Narrative and Selection
const generateFinalReport = async (
  topCourses: Course[],
  formattedAnswers: string,
  isUG: boolean
): Promise<AnalysisResult> => {
  // Pass top 150 candidates to LLM to ensure broad consideration
  const coursesContext = topCourses.slice(0, 150).map(c =>
    `ID:${c.id}|Name:"${c.name}"|Score:${(c as any).tempScore?.toFixed(1)}|Category:${c.category}`
  ).join("\n");

  const prompt = `
    TASK: Select the final 3 Recommendations and 3 Alternative Pathways from the TOP 20 mathematically ranked candidates below.
    
    USER PROFILE:
    ${formattedAnswers}

    TOP 20 CANDIDATES (Ranked by Math Score):
    ${coursesContext}

    INSTRUCTIONS:
    1. **Strict Selection**: You MUST pick courses *only* from the provided list. Use exact names. Do NOT invent or Hallucinate new course names.
    2. **Selection Logic**:
       - Pick the top scoring ones for 'recommendations'.
       - Pick diverse/niche ones for 'alternativePathways'.
    3. **Archetype**: Assign a creative "Archetype" title (e.g. "The Eco-Strategist").
    4. **Narrative**: Explain *why* these specific courses fit the user's answers.
    5. **Audio Script**: Write a script for the text-to-speech engine. 
       - **Tone**: Warm, conversational, human. Use contractions (You're, It's, Let's). Avoid robotic phrases.
       - **Structure**:
         1. **Hook**: Direct, personal opening.
         2. **The Why**: Connect 2 specific drivers to the course.
         3. **The Vision**: End with their future self.
       - **Example**: "Hey there, [Archetype]. valid. It's clear you love [Driver A] and [Driver B], which is exactly why [Course Name] is such a strong fit. Imagine yourself [Vision Highlight]. That's the future waiting for you. Let's make it happen."
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a career counselor. Output strictly valid JSON matching the provided schema. You must ONLY select course names from the provided list.",
      responseMimeType: "application/json",
      responseSchema: FINAL_RESPONSE_SCHEMA,
    },
  });

  const text = extractTextFromResponse(response);
  const result = JSON.parse(text) as AnalysisResult;

  // --- STRICT VALIDATION LAYER ---
  // Ensure every recommended course actually exists in our CSV data.
  // If the LLM hallucinates a name, we replace it with the highest-ranked valid course.

  const validateAndFixCourse = (cName: string, fallback: Course): string => {
    if (VALID_COURSE_NAMES.has(cName)) return cName;
    console.warn(`⚠️ LLM Hallucinated Course: "${cName}".Replacing with: "${fallback.name}"`);
    return fallback.name;
  };

  // Fix Recommendations
  result.recommendations = result.recommendations.map((rec, i) => {
    // Fallback logic: Use the top ranked courses from our mathematical scout as safety nets
    const fallback = topCourses[i] || topCourses[0];
    return {
      ...rec,
      courseName: validateAndFixCourse(rec.courseName, fallback),
      relevanceScore: Math.min(rec.relevanceScore, 100) // Ensure score max is 100
    };
  });

  // Fix Alternatives
  result.alternativePathways = result.alternativePathways.map((alt, i) => {
    // Use slightly lower ranked courses for alternatives to ensure diversity
    const fallback = topCourses[i + 3] || topCourses[topCourses.length - 1];
    return {
      ...alt,
      courseName: validateAndFixCourse(alt.courseName, fallback)
    };
  });

  return result;
};


// --- MAIN FUNCTION ---

export const analyzeCareerPath = async (
  answers: AnswerMap,
  level: '12' | 'UG'
): Promise<AnalysisResult> => {
  const isUG = level === 'UG';
  const catalog = isUG ? MASTERS_CATALOG : COURSE_CATALOG;

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
      const context = qContext[id as keyof typeof qContext] || `Question ${id} `;
      return `[${context}]: "${ans}"`;
    })
    .join("\n");


  try {
    console.log("🚀 STARTING HYBRID ENGINE ANALYSIS");

    // 1. Extract User Vector + Keywords (Hybrid Logic)
    // A. AI Extraction (Semantic)
    const { weights: aiWeights, keywords } = await extractUserVector(formattedAnswers);

    // B. Deterministic Extraction (Scientific)
    const baseWeights = calculateBaseVector(answers);

    // C. Merge (Weighted Average: 60% Explicit Choice, 40% AI Nuance)
    const finalVector: Record<string, number> = {};
    const allSkills = new Set([...Object.keys(aiWeights), ...Object.keys(baseWeights)]);

    allSkills.forEach(skill => {
      const aiVal = aiWeights[skill] || 0;
      const baseVal = baseWeights[skill] || 0;
      // Formula: Explicit choices get a 1.5x multiplier to ensure they dominate
      finalVector[skill] = (aiVal * 0.4) + (baseVal * 1.5);
    });

    console.log("✅ User Vector Extracted:", Object.entries(finalVector).filter(([, v]) => v > 0.5).map(([k, v]) => `${k}:${v.toFixed(2)} `).join(", "));

    // 2. Scout & Score specific Catalog (Client-Side)
    const scoredCourses = scoutCourses(finalVector, keywords, catalog);
    console.log("✅ Top 5 Mathematical Matches:", scoredCourses.slice(0, 5).map(c => c.name).join(", "));

    // 3. Final Report
    console.log("...Step 3: Generating Narrative");
    const finalResult = await generateFinalReport(scoredCourses, formattedAnswers, isUG) as any;
    console.log("✅ Analysis Complete.");

    return finalResult;

  } catch (error) {
    console.error("Hybrid Engine Failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return getMockAnalysisResult(level, errorMessage);
  }
};

const getMockAnalysisResult = (level: '12' | 'UG', errorMessage?: string): AnalysisResult => {
  const isUG = level === 'UG';

  const title = "⚠️ SIMULATION MODE (API FAILED)";

  return {
    archetype: {
      title: title,
      description: `[DIAGNOSTIC]: READ THIS.The app failed to connect to Gemini.\nError Details: ${errorMessage || "Unknown Error"}.\n\nFalling back to simulation data.`,
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
    },
    audioScript: "Hey, Future Innovator. It's clear you've got a massive drive to build and create. That's why Computer Science is such a perfect match—it gives you the structural logic you need to turn those big ideas into reality. You're not just looking for a degree; you're building a foundation to lead the tech world. Let's see what you can build."
  };
};