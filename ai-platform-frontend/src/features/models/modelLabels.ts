const MODEL_TYPE_LABELS: Record<string, string> = {
  LLM: '大语言模型',
  CHAT: '对话模型',
  EMBEDDING: '向量嵌入',
  RERANK: '重排序',
  IMAGE: '图像模型',
  AUDIO: '音频模型',
  MULTIMODAL: '多模态模型'
};

export function modelTypeLabel(modelType: string): string {
  return MODEL_TYPE_LABELS[modelType] ?? modelType;
}
