export const DEFAULT_ROLE_NAMES = ['VIEWER', 'DEVELOPER', 'ADMIN'];

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  VIEWER: '查看者',
  DEVELOPER: '开发者',
  ADMIN: '管理员'
};

export function roleOption(roleName: string): { label: string; value: string } {
  return {
    label: roleDisplayName(roleName),
    value: roleName
  };
}

export function roleDisplayName(roleName: string): string {
  return ROLE_DISPLAY_NAMES[roleName] ?? roleName;
}
