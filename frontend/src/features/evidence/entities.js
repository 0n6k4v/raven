export class FirearmEntity {
  constructor(data) {
    const d = data || {};

    this.id = d.id || null;
    this.exhibit_id = d.exhibit_id || null;

    this.brand = d.brand || '-';
    this.mechanism = d.mechanism || '-';
    this.model = d.model || '-';
    this.series = d.series || '-';
    this.normalized_name = d.normalized_name || '-';

    this.exhibit = d.exhibit || {};
    this.example_images = Array.isArray(d.example_images) ? d.example_images : [];
    this.images = Array.isArray(d.images) ? d.images : [];

    this.confidenceRaw = d.confidence || d.confidence_score || 0;
  }

  get displayName() {
    const parts = [this.series, this.model].filter(
      (val) => val && val !== '-'
    );
    return parts.length > 0 ? parts.join(' ') : 'ไม่ทราบรุ่น';
  }

  get confidencePercent() {
    const raw = typeof this.confidenceRaw === 'number' ? this.confidenceRaw : 0;
    return Math.max(0, Math.min(100, Math.round(raw * 100)));
  }

  get mainImageUrl() {
    if (this.images.length > 0) return this.images[0].url || this.images[0].image_url || '';
    if (this.example_images.length > 0) return this.example_images[0].url || this.example_images[0].image_url || '';
    return '';
  }

  static fromApi(json) {
    return new FirearmEntity(json);
  }
}