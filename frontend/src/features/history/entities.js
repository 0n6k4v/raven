import { formatDateToBE } from "../../utils/date";

export class HistoryItemEntity {
  constructor(item) {
    this.ai_confidence = item?.ai_confidence;

    this.discoverer_by = item?.discoverer_by;
    this.discoverer_name = item?.discoverer_name;
    this.discovery_date = item?.discovery_date;
    this.discovery_time = item?.discovery_time;
    this.district_name = item?.district_name;

    this.exhibit = item?.exhibit || {};
    this.exhibit_id = item?.exhibit_id;

    this.id = item?.id || null;

    this.latitude = item?.latitude;
    this.longitude = item?.longitude;
    this.modified_at = item?.modified_at;
    this.modified_by = item?.modified_by;
    this.modifier_name = item?.modifier_name;
    this.photo_url = item?.photo_url;
    this.province_name = item?.province_name;
    this.quantity = item?.quantity;
    this.subdistrict_id = item?.subdistrict_id;
    this.subdistrict_name = item?.subdistrict_name;
  }

  // ============================================================================
  // INTERNAL LOGIC METHODS
  // ============================================================================

  _parseTime(item) {
    const timeSource = item?.discovery_time || item?.modified_at || '';
    if (timeSource.includes('T')) {
      return timeSource.split('T')[1].substring(0, 5);
    }
    return timeSource.substring(0, 5);
  }

  _determineDisplayName(item) {
    if (item?.name) return item.name;
    const firearm = (Array.isArray(this.exhibit.firearms) ? this.exhibit.firearms[0] : this.exhibit.firearm) || {};
    if (firearm.brand || firearm.model || firearm.series) {
      return [firearm.brand, firearm.series, firearm.model].filter(Boolean).join(' ');
    }
    const narcotic = (Array.isArray(this.exhibit.narcotics) ? this.exhibit.narcotics[0] : this.exhibit.narcotic) || {};
    const drugName = narcotic.characteristics || 
                     (narcotic.drug_type && narcotic.drug_type !== 'Unknown' ? narcotic.drug_type : null) || 
                     this.exhibit.subcategory || narcotic.drug_category;
    if (drugName) return drugName;
    return this.exhibit.subcategory || this.exhibit.category || 'วัตถุพยานไม่ทราบชนิด';
  }

  _pickBestImage(item) {
    if (item?.photo_url || item?.image) return item.photo_url || item.image;
    const gallery = this.exhibit.images || [];
    if (Array.isArray(gallery) && gallery.length > 0) {
      return [...gallery].sort((a, b) => (a.priority || 999) - (b.priority || 999))[0]?.image_url || '';
    }
    return '';
  }

  _buildFullLocationString(item) {
    const mainParts = [
      item?.subdistrict_name && `ต.${item.subdistrict_name}`,
      item?.district_name && `อ.${item.district_name}`,
      item?.province_name && `จ.${item.province_name}`
    ].filter(Boolean);
    return mainParts.join(', ') || item?.location || 'ไม่ระบุสถานที่';
  }

  _getSafeTimestamp(dateStr) {
    try {
      const d = dateStr ? new Date(dateStr) : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    } catch { return 0; }
  }

  _confidencePercent(item) {
    return Math.max(0, Math.min(100, Math.round(item.ai_confidence * 100)));
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get key() { 
    const name = this._determineDisplayName(this);
    const dateSource = this.discovery_time || this.modified_at;
    const timestamp = this._getSafeTimestamp(dateSource);
    return this.id ?? `${name}-${timestamp}`; 
  }

  get image() { return this._pickBestImage(this); }
  
  get time() { 
    return this._parseTime(this); 
  }

  get date() {
    const dateSource = this.discovery_date;
    return dateSource ? formatDateToBE(dateSource) : ''; 
  }

  get category() { return this.exhibit.category || 'ไม่ระบุหมวดหมู่'; }

  get altText() { return this._determineDisplayName(this) || 'รูปภาพวัตถุพยาน'; }

  static fromApi(item) {
    return new HistoryItemEntity(item);
  }
}