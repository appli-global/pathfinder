
export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: number;
  text: string;
  subtext?: string;
  inputType?: 'choice' | 'text';
  options?: Option[];
  placeholder?: string;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  tags?: string[]; // New: Keywords for better matching
}

// The structure expected from the Gemini API response
export interface AnalysisResult {
  archetype: {
    title: string;
    description: string;
    drivers: {
      academic: string;
      passion: string;
      cognitive: string;
      domain: string;
      motivation: string;
    };
  };
  visionBoard: {
    futureSelf: string; // A vivid description of their future professional life
    keyThemes: string[]; // 3-4 words like "Innovation", "Global", "Creation"
    quote: string; // An inspiring quote matching their archetype
  };
  skillSignature: {
    subject: string; // e.g., "Creativity", "Logic", "Social"
    A: number; // Value 0-100
    fullMark: number;
  }[];
  recommendations: {
    degree: string; // NEW: The degree type (e.g. B.Tech, MBA)
    courseName: string;
    matchReason: string;
    dataInsight: string;
    relevanceScore: number; // 0-100
  }[];
  alternativePathways: {
    focus: string;
    courseName: string;
    insight: string;
  }[];
  communityStats: {
    headline: string;
    topCareers: {
      name: string;
      percentage: number;
    }[];
    commonInterests: string[];
  };
}

export type AnswerMap = Record<number, string>;
