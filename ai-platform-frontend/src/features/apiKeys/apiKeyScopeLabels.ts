export const API_KEY_SCOPE_OPTIONS = [
  { value: 'skills:read', label: '读取 Skill', description: '查询 Skill、分类和元数据' },
  { value: 'skills:import', label: '导入 Skill', description: '创建文本 Skill、上传文件包和远程导入' },
  { value: 'skills:write', label: '维护 Skill', description: '更新、替换、删除和记录远程地址' },
  { value: 'skills:download', label: '下载 Skill', description: '下载 Skill 源码文件或 zip 包' },
  { value: 'agents:read', label: '读取 Agent', description: '查询 Agent 入口、说明和状态' },
  { value: 'agents:write', label: '维护 Agent', description: '创建和更新 Agent' },
  { value: 'articles:read', label: '读取文章', description: '查询文章正文和元数据' },
  { value: 'articles:write', label: '维护文章', description: '创建和更新文章' }
];

export function apiKeyScopeLabel(scope: string): string {
  return API_KEY_SCOPE_OPTIONS.find((item) => item.value === scope)?.label ?? scope;
}
