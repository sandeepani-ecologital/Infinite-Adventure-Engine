export interface GameState {
  inventory: string[];
  currentQuest: string;
  history: ChatMessage[];
  currentImage?: string;
  isGeneratingImage: boolean;
  isGeneratingStory: boolean;
  gameOver: boolean;
  imageSize: '1K' | '2K' | '4K';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface StoryResponse {
  narrative: string;
  inventory: string[];
  quest: string;
  choices: string[];
  imagePrompt: string;
}

export enum GameActionType {
  START = 'START',
  CHOICE = 'CHOICE',
  CUSTOM = 'CUSTOM'
}
