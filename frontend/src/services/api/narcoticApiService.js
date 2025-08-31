class NarcoticApiService {
  constructor(baseUrl = `${import.meta.env.VITE_API_URL}/api`) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async findSimilarNarcoticsWithBase64(vectorBase64, topK = 3, similarityThreshold = 0.1) {
    try {
      if (!vectorBase64) {
        throw new Error('Invalid base64 vector data');
      }

      const res = await fetch(`${this.baseUrl}/search-vector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector_base64: vectorBase64,
          top_k: topK,
          similarity_threshold: similarityThreshold,
        }),
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
  }
}

export { NarcoticApiService };