export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  themePreference: ThemeName;
  roles: string[];
};

export type AuthResponse = {
  token: string;
  profile: UserProfile;
};

export type ThemeName = 'minimal-reference' | 'minimal-modern';

export type Agent = {
  id: number;
  name: string;
  category: string;
  description: string;
  guideMarkdown: string;
  officialUrl?: string;
  viewCount: number;
  likeCount: number;
};

export type SkillCategory = {
  id: number;
  name: string;
  description: string;
};

export type Skill = {
  id: number;
  name: string;
  category: SkillCategory;
  description: string;
  tags: string;
  author: string;
  sourceCode: string;
  usageMarkdown: string;
  viewCount: number;
  downloadCount: number;
  starCount: number;
};

export type AiModel = {
  id: number;
  name: string;
  provider: string;
  modelType: string;
  capabilities: string;
  pricing: string;
  endpoint: string;
};

export type FinetuneJob = {
  id: number;
  name: string;
  baseModel: string;
  status: string;
  progress: number;
  configJson: string;
};

export type ApiKey = {
  id: number;
  name: string;
  keyPrefix: string;
  plainKey?: string;
  scopes: string[];
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
};

export type AdminOverview = {
  users: number;
  agents: number;
  skills: number;
};

