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

export type ArticleSummary = {
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

export type ArticleAsset = {
  id: number;
  name: string;
  assetType: 'SCRIPT' | 'PROMPT' | 'IMAGE' | 'CONFIG' | 'FILE' | 'LINK';
  contentText?: string;
  fileName?: string;
  contentType?: string;
  externalUrl?: string;
  sortOrder: number;
};

export type ArticleLink = {
  id: number;
  linkType: 'EXTERNAL' | 'INTERNAL';
  title: string;
  url?: string;
  description: string;
  sortOrder: number;
};

export type ArticleDetail = ArticleSummary & {
  sourceUrl?: string;
  safetyMarkdown: string;
  bodyMarkdown: string;
  assets: ArticleAsset[];
  links: ArticleLink[];
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

export type DeveloperToolSpec = {
  name: string;
  method: string;
  path: string;
  scope: string;
  risk: string;
  description: string;
};

export type DeveloperManagedObject = {
  key: 'agent' | 'skill' | 'article';
  name: 'Agent' | 'Skill' | '文章';
  description: string;
  scopes: string[];
  tools: string[];
};

export type DeveloperSkillManifest = {
  schemaVersion?: string;
  apiVersion?: string;
  apiBasePath?: string;
  name: string;
  description: string;
  auth: {
    headers: string[];
  };
  requiredScopes?: string[];
  managedObjects?: DeveloperManagedObject[];
  tools: string[];
  toolSpecs?: DeveloperToolSpec[];
  examples: string[];
  installPrompt: string;
};

export type DeveloperAuditEvent = {
  id: number;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detail: string;
  createdAt?: string;
};

export type DeveloperHandoffSignal = {
  key: string;
  title: string;
  status: string;
  description: string;
  action: string;
};

export type DeveloperDashboard = {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  expiredKeys: number;
  expiringSoonKeys: number;
  recentlyUsedKeys: number;
  requiredScopes: string[];
  missingRequiredScopes: string[];
  handoffSignals: DeveloperHandoffSignal[];
  recentEvents: DeveloperAuditEvent[];
};

export type AdminOverview = {
  users: number;
  agents: number;
  skills: number;
  models: number;
  datasets: number;
  finetuneJobs: number;
  articles: number;
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
