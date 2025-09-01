class NarcoticHistoryApiService {
  constructor() {
    this.BASE_URL = (`${import.meta.env.VITE_API_URL}/api` || '');
  }

  async getAllNarcoticHistories() {
    const url = `${this.BASE_URL}/history/narcotics`;
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text().catch(() => '');
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { /* non-json body */ }
    if (!resp.ok) {
      const detail = json ?? text ?? resp.statusText ?? `HTTP ${resp.status}`;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    return json?.data ?? json;
  }

  async getNarcoticHistoryById(historyId) {
    const url = `${this.BASE_URL}/history/narcotics/${historyId}`;
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    return json?.data ?? json;
  }

  async createNarcoticHistory(historyData) {
    const url = `${this.BASE_URL}/history`;
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(historyData),
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    return json?.data ?? json;
  }

  async updateNarcoticHistory(historyId, historyData) {
    const url = `${this.BASE_URL}/history/${historyId}`;
    const resp = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(historyData),
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    return json?.data ?? json;
  }

  async deleteNarcoticHistory(historyId) {
    const url = `${this.BASE_URL}/history/${historyId}`;
    const resp = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    return json?.data ?? json;
  }

  async getNarcoticHistoriesByExhibit(exhibitId) {
    const url = `${this.BASE_URL}/history/exhibit/${exhibitId}`;
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    const payload = json?.data ?? json;
    if (!Array.isArray(payload)) return [];
    return payload.filter(history => history.exhibit?.category === 'ยาเสพติด');
  }

  async getNarcoticHistoriesByUser(userId) {
    const url = `${this.BASE_URL}/history?user_id=${encodeURIComponent(userId)}`;
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text().catch(() => '');
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      const msg = json?.detail || json?.message || resp.statusText || `HTTP ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = json;
      throw err;
    }
    const payload = json?.data ?? json;
    if (!Array.isArray(payload)) return [];
    return payload.filter(history => history.exhibit?.category === 'ยาเสพติด');
  }
}

export default new NarcoticHistoryApiService();