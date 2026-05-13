export class NarcoticEntity {
  constructor(data) {
    const d = data || {};

    this.id = d.id || null;
    this.exhibit_id = d.exhibit_id || null;
    this.form_id = d.form_id || null;
    this.narcoticId = d.id || null;

    this.drug_type = d.drug_type || '-';
    this.drug_category = d.drug_category || '-';
    this.characteristics = d.characteristics || '-';
    this.consumption_method = d.consumption_method || '-';
    this.effect = d.effect || '-';

    this.weight_grams = d.weight_grams ?? null;

    this.imageUrl = this._extractImageUrl(d.example_images || []);
    this.example_images = this.example_images || [];

    this.exhibit = d.exhibit || {};
    this.pill_info = d.pill_info || {};
    this.drug_form = d.drug_form || {};
  }

  _extractImageUrl(images) {
    if (Array.isArray(images) && images.length > 0) {
      return images[0].image_url || images[0].url || '';
    }
    return '';
  }

  get confidencePercent() {
    return Math.max(0, Math.min(100, Math.round(this.confidenceRaw * 100)));
  }

  static fromApiResponse(data) {
    return new NarcoticEntity(data);
  }
}
