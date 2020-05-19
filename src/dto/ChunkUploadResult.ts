export interface ChunkUploadResult {
  status: boolean;
  message: string;
}

// 自定义类型判断
export function isChunkUploadResult(result: any): result is ChunkUploadResult {
  return (
    result.status &&
    typeof result.status === "boolean" &&
    result.message !== undefined &&
    typeof result.message === "string"
  );
}
