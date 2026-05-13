export class EvidenceMeterService {
  static RADIUS = 45;

  static get circumference() {
    return 2 * Math.PI * this.RADIUS;
  }

  static calculateOffset(percent) {
    const circum = this.circumference;
    return circum - (circum * (percent / 100));
  }

  static toPercentage(decimalScore) {
    if (typeof decimalScore !== 'number') return 0;
    return Math.max(0, Math.min(100, Math.round(decimalScore * 100)));
  }
}

export class StorageService {
  static getAnalysisImage() {
    try { return localStorage.getItem('analysisImage') || ''; }
    catch { return ''; }
  }
}