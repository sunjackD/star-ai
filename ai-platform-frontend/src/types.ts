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

export type SetupStatus = {
  setupRequired: boolean;
};

export type SetupAdminRequest = {
  username: string;
  email: string;
  displayName: string;
  password: string;
};

export type ThemeName = 'minimal-reference' | 'minimal-modern';

export type PlatformConfig = {
  siteName: string;
  siteSubtitle: string;
  defaultTheme: ThemeName;
  allowPublicRegistration: boolean;
  themeOptions: { value: ThemeName; label: string }[];
};

export type AdminSettings = {
  siteName: string;
  siteSubtitle: string;
  defaultTheme: ThemeName;
  allowPublicRegistration: boolean;
  defaultUserRole: string;
  apiKeyDefaultExpireDays: number;
};

export type Agent = {
  id: number;
  name: string;
  category: string;
  description: string;
  icon?: string;
  guideMarkdown: string;
  officialUrl?: string;
  viewCount: number;
  likeCount: number;
  status: string;
};

export type SkillCategory = {
  id: number;
  name: string;
  description: string;
};

export type SkillArtifactType = 'TEXT' | 'FILE';

export type Skill = {
  id: number;
  name: string;
  category: SkillCategory;
  description: string;
  tags: string;
  author: string;
  icon?: string;
  sourceCode: string;
  usageMarkdown: string;
  viewCount: number;
  downloadCount: number;
  starCount: number;
  artifactType?: SkillArtifactType;
  artifactPath?: string;
  artifactFileName?: string;
  artifactSize?: number;
  status: string;
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
  dataset?: Dataset;
  status: string;
  progress: number;
  configJson: string;
};

export type Dataset = {
  id: number;
  name: string;
  filePath: string;
  recordCount: number;
  format: string;
};

export type RedirectLink = {
  id: number;
  name: string;
  url: string;
  category: string;
  sortOrder: number;
  description: string;
  icon?: string;
  status: string;
};

export type BestPracticeSummary = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  coverIcon?: string;
  status: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BestPracticeStep = {
  id: number;
  title: string;
  description: string;
  checklistMarkdown: string;
  acceptanceMarkdown: string;
  requiredStep: boolean;
  sortOrder: number;
};

export type BestPracticeArtifact = {
  id: number;
  name: string;
  artifactType: 'SCRIPT' | 'PROMPT' | 'IMAGE' | 'CONFIG' | 'FILE' | 'LINK';
  contentText?: string;
  fileName?: string;
  contentType?: string;
  externalUrl?: string;
  sortOrder: number;
};

export type BestPracticeRelatedResource = {
  id: number;
  resourceType: 'SKILL' | 'MODEL' | 'DATASET' | 'FINETUNE_JOB' | 'REDIRECT_LINK';
  resourceId?: number;
  title: string;
  url?: string;
  description: string;
  sortOrder: number;
};

export type BestPracticeDetail = BestPracticeSummary & {
  sourceUrl?: string;
  outcomeMarkdown: string;
  prerequisitesMarkdown: string;
  safetyMarkdown: string;
  bodyMarkdown: string;
  steps: BestPracticeStep[];
  artifacts: BestPracticeArtifact[];
  relatedResources: BestPracticeRelatedResource[];
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
  models: number;
  datasets: number;
  finetuneJobs: number;
  bestPractices: number;
  links: number;
  apiKeys: number;
  auditLogs: number;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  status: string;
  themePreference: ThemeName;
  roles: string[];
};

export type Role = {
  id: number;
  name: string;
};

export type AuditLog = {
  id: number;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detail: string;
};
