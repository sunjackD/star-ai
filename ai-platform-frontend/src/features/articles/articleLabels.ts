const ARTICLE_ASSET_TYPE_LABELS: Record<string, string> = {
  SCRIPT: '脚本',
  PROMPT: '提示词',
  IMAGE: '图片',
  CONFIG: '配置',
  FILE: '文件',
  LINK: '链接'
};

const ARTICLE_LINK_TYPE_LABELS: Record<string, string> = {
  EXTERNAL: '外部链接',
  INTERNAL: '站内链接'
};

export function articleAssetTypeLabel(assetType: string): string {
  return ARTICLE_ASSET_TYPE_LABELS[assetType] ?? assetType;
}

export function articleLinkTypeLabel(linkType: string): string {
  return ARTICLE_LINK_TYPE_LABELS[linkType] ?? linkType;
}
