// src/types/index.ts
export interface Subject {
    _id: string;
    name: string;
    code: string;
    description?: string;
    status: boolean;
    chapterCount?: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Chapter {
    _id: string;
    name: string;
    code: string;
    description?: string;
    subjectId: string | Subject;
    sequence: number;
    status: boolean;
    topicCount?: number;
    questionCount?: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Topic {
    _id: string;
    name: string;
    code: string;
    description?: string;
    chapterId: string | Chapter;
    subjectId: string | Subject;
    sequence: number;
    questionCount?: number;
    status: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface QuestionOption {
    optionText: string;
    isCorrect: boolean;
  }
  
  export interface Question {
    _id: string;
    questionText: string;
    questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'DESCRIPTIVE';
    options: QuestionOption[];
    correctAnswer?: string;
    explanation?: string;
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
    marks: {
      correct: number;
      negative: number;
    };
    topicId: string | Topic;
    chapterId: string | Chapter;
    subjectId: string | Subject;
    tags: string[];
    status: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PaginationResponse<T> {
    data: T[];
    total: number;
    limit: number;
    page: number;
  }