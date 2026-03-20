
export interface ScriptParts {
  [key: string]: string;
}

export interface GeneratedImage {
  url: string;
  loading: boolean;
  error?: string;
  customPrompt?: string;
  regenNote?: string;
  pose?: string;
}

export interface VideoPromptState {
  text: string;
  loading: boolean;
  visible: boolean;
  translatedText?: string;
  translating?: boolean;
}

export interface TimelapseSegment {
  id: number;
  content: string;
  image: GeneratedImage;
  videoPrompt: VideoPromptState;
}

export interface AnalyzedCharacter {
  name: string;
  description: string;
}

export interface Personification2Segment {
  id: number;
  content: string;
  characterIdea: string;
  speaker: string; // Thay đổi từ union type sang string để chứa tên nhân vật linh hoạt
  image: GeneratedImage;
  videoPrompt: VideoPromptState;
}

export interface FashionScenarioPart {
  id: number;
  outfitIndex: number;
  poseDescription: string;
  vibeDescription: string;
}

export interface FashionImageItem {
  id: string;
  outfitIndex: number;
  url: string;
  loading: boolean;
  error?: string;
  regenNote: string;
  videoPrompt: string;
  isPromptLoading: boolean;
  isPromptVisible: boolean;
  scenarioPart?: string;
}

export interface CarouselItem {
  id: number;
  content: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
  regenerateNote: string;
  textPosition: 'Top' | 'Bottom' | 'Split';
  textColor: string;
  fontSize: number;
  videoPrompt?: VideoPromptState;
}

export interface PovScriptSegment {
  id: number;
  content: string;
  image: GeneratedImage;
  videoPrompt: VideoPromptState;
}

export interface User {
  u: string;
  p: string;
}

export const VALID_USERS: User[] = [
  { u: 'hvk1', p: '123456' },
  { u: 'hvk2', p: '123123' },
  { u: 'hvk3', p: 'zxczxc' },
  { u: 'admin', p: 'zxc' }
];

export interface PersonificationSegment {
  id: number;
  content: string;
  image: GeneratedImage;
  videoPrompt: VideoPromptState;
}

export interface VideoPovState {
  videoFile: File | null;
  videoPreviewUrl: string | null;
  originalScriptInput: string;
  analysis: string;
  isAnalyzing: boolean;
  style: string;
  gender: string;
  voice: string;
  characterDescription: string;
  contextNote: string;
  segmentCount: number;
  faceFile: File | null;
  facePreviewUrl: string | null;
  isGeneratingScript: boolean;
  segments: PovScriptSegment[];
}

export type ScriptPartKey = string;

export interface Shopee8sProduct {
  id: number;
  name: string;
  usp: string;
  background: string;
  action: string;
  file: File | null;
  previewUrl: string | null;
  script: ScriptParts | null;
  images: { [key: string]: GeneratedImage };
  videoPrompts: { [key: string]: VideoPromptState };
  isLoading: boolean;
}

export interface VuaTvState {
  puzzle: string;
  answer: string;
  headerTitle: string;
  headerColor: string;
  titleFontSize: number;
  puzzleFontSize: number;
  faceFile: File | null;
  facePreview: string | null;
  faceDescription: string;
  imageStyle: 'Realistic' | '3D';
  regenNote: string;
  generatedImageUrl: string;
  isLoading: boolean;
  videoPrompt: string;
  isVideoPromptLoading: boolean;
  isVideoPromptVisible: boolean;
}

export interface DhbcPhrase {
  phrase: string;
  hint: string;
}

export interface DhbcState {
  phrase: string;
  hint: string;
  headerTitle: string;
  headerColor: string;
  headerFontSize: number;
  footerColor: string;
  faceFile: File | null;
  facePreview: string | null;
  faceDescription: string;
  imageStyle: 'Realistic' | '3D';
  regenNote: string;
  generatedImageUrl: string;
  isLoading: boolean;
  videoPrompt: string;
  isVideoPromptLoading: boolean;
  isVideoPromptVisible: boolean;
  suggestedPhrases: DhbcPhrase[];
  isSuggesting: boolean;
}
