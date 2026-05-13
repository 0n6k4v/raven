import { NarcoticEntity } from "./entities";
import { ImageUtils } from "../../utils/image";
import { 
  NARCOTIC_CONSTANTS, 
  NarcoticAccessPolicy, 
  NarcoticPayloadBuilder 
} from "./utils";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export class NarcoticService {
  static constants = NARCOTIC_CONSTANTS;

  static canManage = NarcoticAccessPolicy.canManageCatalog;

  static async _request(endpoint, options = {}) {
    const defaultHeaders = { 'Accept': 'application/json' };

    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include',
    };

    const res = await fetch(`${API_URL}${endpoint}`, config);

    const text = await res.text();
    const responseData = text ? (text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : text) : null;

    if (!res.ok) {
      const error = new Error(responseData?.message || responseData?.detail || 'API Request Failed');
      error.status = res.status;
      error.data = responseData;
      throw error;
    }

    return responseData;
  }

  static async fetchAll(signal) {
    const data = await this._request('/narcotics', { signal, method: 'GET' });
    return (Array.isArray(data) ? data : []).map(NarcoticEntity.fromApiResponse);
  }

  static async fetchDrugForms() {
    return this._request('/drug-forms', { method: 'GET' });
  }

  static async delete(id) {
    return this._request(`/narcotics/${id}`, { method: 'DELETE' });
  }

  static async createExhibit(category, subcategory) {
    return this._request('/exhibits', {
      method: 'POST',
      body: JSON.stringify({ category, subcategory })
    });
  }

  static async createNarcotic(payload) {
    return this._request('/narcotic', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async createPill(payload) {
    return this._request('/narcotics/pill', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async uploadImage(exhibitId, narcoticId, file, description, priority) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('priority', String(priority));
    formData.append('image_type', 'example');

    return this._request(`/exhibits/${exhibitId}/narcotic/${narcoticId}/images`, {
      method: 'POST',
      body: formData
    });
  }

  // --------------------------------------------------------------------------
  // COMPLEX BUSINESS LOGIC
  // --------------------------------------------------------------------------

  static async processImageVector(file, narcoticId, imageId) {
    try {
      const classifyForm = new FormData();
      classifyForm.append('image', file);
      const classifyData = await this._request('/object-classify', { method: 'POST', body: classifyForm });

      const croppedBase64 = 
        classifyData?.objects?.[0]?.cropped_base64 ?? 
        classifyData?.objects?.find(o => o.cropped_base64)?.cropped_base64 ?? 
        classifyData?.cropped_base64;

      if (!croppedBase64) {
        console.warn(`[Vector] No cropped image found for image ${imageId}`);
        return null;
      }

      const parsed = ImageUtils.parseBase64(croppedBase64);
      const croppedFile = ImageUtils.base64ToFile(parsed.base64, `cropped_${imageId}.jpg`, parsed.mime);

      const convertForm = new FormData();
      convertForm.append('image', croppedFile);
      const convertResult = await this._request('/convert_image_ref_to_vector', { method: 'POST', body: convertForm });

      let vectorPayloadList = null;
      const vb = convertResult.vector_base64;

      if (Array.isArray(vb)) {
        vectorPayloadList = vb.map(Number);
      } else if (typeof vb === 'string') {
        const b64 = vb.includes(',') ? vb.split(',')[1] : vb;
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        vectorPayloadList = Array.from(new Float32Array(bytes.buffer));
      }

      if (!vectorPayloadList) {
        console.warn(`[Vector] Failed to parse vector data for image ${imageId}`);
        return null;
      }

      return await this._request('/narcotics/images/vector/save', {
        method: 'POST',
        body: JSON.stringify({
          narcotic_id: narcoticId,
          image_id: imageId,
          vector_data: vectorPayloadList
        })
      });

    } catch (error) {
      console.error(`[Vector] Process failed for image ${imageId}:`, error);
      return null;
    }
  }

  static async createFullNarcoticFlow({ formData, pillData, evidenceType, actualImages }) {
    const exhibit = await this.createExhibit('ยาเสพติด', formData.drug_type);
    
    const isPill = NarcoticService.constants.PILL_TYPES.includes(evidenceType);
    
    const narcoticPayload = NarcoticPayloadBuilder.toNarcotic(formData, exhibit.id, isPill, pillData);
    const narcotic = await this.createNarcotic(narcoticPayload);

    if (isPill) {
      const pillPayload = NarcoticPayloadBuilder.toPill(narcotic.id, pillData);
      await this.createPill(pillPayload);
    }

    if (actualImages?.length > 0) {
      await Promise.all(actualImages.map(async (file, index) => {
        const uploadRes = await this.uploadImage(
          exhibit.id, 
          narcotic.id, 
          file, 
          `รูปภาพ ${formData.drug_type} #${index + 1}`, 
          index
        );

        const imageId = uploadRes.data?.id || uploadRes.id;
        
        if (imageId) {
          await this.processImageVector(file, narcotic.id, imageId);
        }
      }));
    }

    return narcotic;
  }
}