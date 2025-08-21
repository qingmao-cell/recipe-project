/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param maxSize 短边最大尺寸，默认1280px
 * @param quality JPEG压缩质量，0-1之间，默认0.8
 * @returns 压缩后的Blob对象
 */
export async function compressImage(
  file: File,
  maxSize: number = 1280,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("无法获取canvas context"));
      return;
    }

    img.onload = () => {
      try {
        // 计算压缩后的尺寸，保持宽高比
        const { width, height } = img;
        const shortSide = Math.min(width, height);

        let newWidth = width;
        let newHeight = height;

        // 只有当短边大于maxSize时才压缩
        if (shortSide > maxSize) {
          const scale = maxSize / shortSide;
          newWidth = Math.round(width * scale);
          newHeight = Math.round(height * scale);
        }

        // 设置canvas尺寸
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 清除canvas并绘制压缩后的图片
        ctx.clearRect(0, 0, newWidth, newHeight);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // 转换为JPEG格式的Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("图片压缩失败"));
            }
          },
          "image/jpeg",
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("图片加载失败"));
    };

    // 加载图片
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 获取压缩后的文件信息
 * @param originalFile 原始文件
 * @param compressedBlob 压缩后的Blob
 * @returns 压缩信息
 */
export function getCompressionInfo(originalFile: File, compressedBlob: Blob) {
  const originalSize = originalFile.size;
  const compressedSize = compressedBlob.size;
  const compressionRatio = (
    ((originalSize - compressedSize) / originalSize) *
    100
  ).toFixed(1);

  return {
    originalSize,
    compressedSize,
    compressionRatio: `${compressionRatio}%`,
    sizeDiff: originalSize - compressedSize,
  };
}
