const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const findSimilarNarcotics = async (vector, topK = 3) => {
  try {
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new Error('Invalid vector data');
    }

    const float32Array = new Float32Array(vector);
    const bytes = new Uint8Array(float32Array.buffer);
    const base64 = btoa(String.fromCharCode.apply(null, bytes));

    const res = await fetch(`${BASE_URL}/search-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector_base64: base64,
        top_k: topK,
        similarity_threshold: 0.1
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error finding similar narcotics:', error);
    throw error;
  }
};

export const findSimilarNarcoticsWithBase64 = async (vectorBase64, topK = 3) => {
  try {
    if (!vectorBase64) {
      throw new Error('Invalid base64 vector data');
    }

    const res = await fetch(`${BASE_URL}/search-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector_base64: vectorBase64,
        top_k: topK,
        similarity_threshold: 0.1
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error finding similar narcotics with base64:', error);
    throw error;
  }
};

export const fetchNarcoticById = async (id) => {
  try {
    if (!id) {
      throw new Error('ไม่ได้ระบุ ID ของยาเสพติด');
    }

    const res = await fetch(`${BASE_URL}/narcotics/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching narcotic by ID:', error);
    throw error;
  }
};

export const prepareSimilarNarcoticsForDisplay = (similarNarcotics) => {
  if (!similarNarcotics || !Array.isArray(similarNarcotics) || similarNarcotics.length === 0) {
    return [{
      label: 'ยาเสพติดประเภทไม่ทราบชนิด',
      displayName: 'ยาเสพติดประเภทไม่ทราบชนิด',
      confidence: 0,
      isUnknownDrug: true,
      characteristics: 'ไม่ทราบอัตลักษณ์',
      exhibit_id: 94,
      drug_type: 'ไม่ทราบชนิด',
      drug_category: 'ไม่ทราบประเภท'
    }];
  }

  const formattedCandidates = similarNarcotics.map(narcotic => ({
    label: narcotic.characteristics || 'ยาเสพติดไม่ทราบลักษณะ',
    displayName: narcotic.characteristics || 'ยาเสพติดไม่ทราบลักษณะ',
    confidence: narcotic.similarity || 0,
    narcotic_id: narcotic.narcotic_id,
    drug_type: narcotic.drug_type || 'ยาเสพติดไม่ทราบชนิด',
    drug_category: narcotic.drug_category || 'ยาเสพติดไม่ทราบประเภท',
    characteristics: narcotic.characteristics || 'ไม่ทราบอัตลักษณ์',
    similarity: narcotic.similarity || 0
  }));

  formattedCandidates.push({
    label: 'ยาเสพติดประเภทไม่ทราบชนิด',
    displayName: 'ยาเสพติดประเภทไม่ทราบชนิด',
    confidence: 0,
    isUnknownDrug: true,
    characteristics: 'ไม่ทราบอัตลักษณ์',
    exhibit_id: 94,
    drug_type: 'ไม่ทราบชนิด',
    drug_category: 'ไม่ทราบประเภท'
  });

  return formattedCandidates;
};