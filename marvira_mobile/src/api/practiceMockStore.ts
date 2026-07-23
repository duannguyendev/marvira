import { CreateQuestionInput, PracticeQuestion } from '../types';
import { mockUser, delay } from './mockData';
import { practiceStorage } from '../services/practiceStorage';

const seedQuestions: PracticeQuestion[] = [
  {
    id: 'pq-1',
    text: 'What is the capital of France?',
    type: 'TEXT',
    answer: 'Paris',
    points: 10,
    explanation: 'Paris has been the capital of France since 987 AD.',
    authorId: 'system',
    authorName: 'Marvira',
    source: 'community',
    isPublished: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pq-2',
    text: 'The Earth is flat.',
    type: 'TRUE_FALSE',
    answer: 'False',
    points: 5,
    authorId: 'system',
    authorName: 'Marvira',
    source: 'community',
    isPublished: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pq-3',
    text: 'Which planet is known as the Red Planet?',
    type: 'MULTIPLE_CHOICE',
    answer: 'Mars',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    points: 10,
    authorId: 'system',
    authorName: 'Marvira',
    source: 'community',
    isPublished: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pq-4',
    text: 'What year did the first iPhone launch?',
    type: 'TEXT',
    answer: '2007',
    points: 15,
    authorId: mockUser.id,
    authorName: mockUser.name,
    source: 'community',
    isPublished: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pq-5',
    text: 'What is the name of the statue in the center of City Square?',
    type: 'TEXT',
    answer: 'Liberty',
    points: 10,
    authorId: mockUser.id,
    authorName: mockUser.name,
    source: 'event',
    eventId: '1',
    eventTitle: 'Downtown Adventure',
    placeId: 'place-1-1',
    isPublished: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let questions: PracticeQuestion[] = [...seedQuestions];

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function isAnswerCorrect(question: PracticeQuestion, answer: string): boolean {
  return normalizeAnswer(question.answer) === normalizeAnswer(answer);
}

export const practiceMockStore = {
  async getQuestions(): Promise<PracticeQuestion[]> {
    await delay(400);
    return [...questions];
  },

  async getQuestionById(id: string): Promise<PracticeQuestion | undefined> {
    await delay(300);
    return questions.find(q => q.id === id);
  },

  async getPublishedCommunityQuestions(): Promise<PracticeQuestion[]> {
    await delay(400);
    return questions.filter(q => q.source === 'community' && q.isPublished);
  },

  async getMyQuestions(userId: string): Promise<PracticeQuestion[]> {
    await delay(400);
    return questions.filter(q => q.authorId === userId);
  },

  async createQuestion(
    userId: string,
    userName: string,
    input: CreateQuestionInput,
  ): Promise<PracticeQuestion> {
    await delay(600);
    const question: PracticeQuestion = {
      id: `pq-${Date.now()}`,
      text: input.question,
      type: input.type,
      answer: input.answer,
      options: input.options,
      points: input.points ?? 10,
      authorId: userId,
      authorName: userName,
      source: 'community',
      isPublished: true,
      createdAt: new Date().toISOString(),
    };
    questions = [question, ...questions];
    return question;
  },

  async updateQuestion(
    id: string,
    userId: string,
    input: CreateQuestionInput,
  ): Promise<PracticeQuestion> {
    await delay(500);
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) {
      throw new Error('Question not found');
    }
    if (questions[index].authorId !== userId) {
      throw new Error('Not authorized to edit this question');
    }
    const updated: PracticeQuestion = {
      ...questions[index],
      text: input.question,
      type: input.type,
      answer: input.answer,
      options: input.options,
      points: input.points ?? questions[index].points,
    };
    questions[index] = updated;
    return updated;
  },

  async deleteQuestion(id: string, userId: string): Promise<void> {
    await delay(400);
    const question = questions.find(q => q.id === id);
    if (!question) {
      throw new Error('Question not found');
    }
    if (question.authorId !== userId) {
      throw new Error('Not authorized to delete this question');
    }
    questions = questions.filter(q => q.id !== id);

    const favoriteIds = await practiceStorage.getFavoriteQuestionIds();
    if (favoriteIds.has(id)) {
      favoriteIds.delete(id);
      await practiceStorage.setFavoriteQuestionIds(favoriteIds);
    }

    const completedIds = await practiceStorage.getTrainingCompletedIds();
    if (completedIds.has(id)) {
      completedIds.delete(id);
      await practiceStorage.setTrainingCompletedIds(completedIds);
    }
  },

  async submitTrainingAnswer(
    questionId: string,
    answer: string,
  ): Promise<{
    isCorrect: boolean;
    message: string;
    explanation?: string | null;
  }> {
    await delay(500);
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = isAnswerCorrect(question, answer);
    if (isCorrect) {
      const completedIds = await practiceStorage.getTrainingCompletedIds();
      completedIds.add(questionId);
      await practiceStorage.setTrainingCompletedIds(completedIds);
    }

    return {
      isCorrect,
      message: isCorrect ? 'Correct!' : 'Incorrect, try again!',
      explanation: isCorrect ? (question.explanation ?? null) : null,
    };
  },

  isAnswerCorrect,
};
