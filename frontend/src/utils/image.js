export class ImageUtils {
  static parseBase64(input) {
    if (!input) return null;
    if (input.startsWith('data:')) {
      const [meta, b64] = input.split(',', 2);
      const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      return { mime, base64: b64 };
    }
    return { mime: 'image/jpeg', base64: input };
  }

  static base64ToFile(base64, filename = 'image.jpg', mime = 'image/jpeg') {
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return new File([u8], filename, { type: mime });
  }
}