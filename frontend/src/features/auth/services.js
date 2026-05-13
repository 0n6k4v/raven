import { UserEntity } from './entities';

// ============================================================================
// INFRASTRUCTURE LAYER - API Configuration & Services
// ============================================================================

const API_CONFIG = {
  BASE_URL: `${import.meta.env.VITE_API_URL}`,
  ENDPOINTS: {
    ME: '/api/me',
    TOKEN: '/api/token',
    LOGOUT: '/api/logout',
    USERS: '/api/users',
    ROLES: '/api/roles',
  },
  HEADERS: {
    FORM_URLENCODED: 'application/x-www-form-urlencoded',
  },
};

export class AuthenticationService {
  static async login(email, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOKEN}`, {
        method: 'POST',
        headers: { 
          'Content-Type': API_CONFIG.HEADERS.FORM_URLENCODED 
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : 'ข้อมูลไม่ถูกต้อง');
      }

      return { 
        success: true, 
        user: UserEntity.fromApiJson(data.user) 
      };
    } catch (error) {
      console.error('[AuthenticationService] Login failed:', error);
      return { success: false, error: error.message };
    }
  }

  static async fetchCurrentUser(signal = null) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ME}`, {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return null;
        throw new Error(`Session error: ${response.status}`);
      }

      const data = await response.json();
      return UserEntity.fromApiJson(data);
    } catch (error) {
      if (error.name === 'AbortError') return null;
      console.error('[AuthenticationService] Fetch user failed:', error);
      return null;
    }
  }

  static async logout() {
    try {
      await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AuthenticationService] Logout API failed:', error);
    }
  }

  static redirectToHome() {
    window.location.href = '/home';
  }

  static redirectToLogin() {
    window.location.href = '/login';
  }
}

export class UserManagementService {
  static async fetchAll(signal = null) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/list`, { 
      signal,
      credentials: 'include' 
    });
    
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    
    const data = await response.json();
    const rawUsers = Array.isArray(data) ? data : (data.users || []);

    return rawUsers.map(u => UserEntity.fromApiJson(u));
  }

  static async fetchById(id, signal = null) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${id}`, { 
      signal,
      credentials: 'include' 
    });
    
    if (!response.ok) throw new Error('ไม่พบข้อมูลผู้ใช้งาน');
    
    const data = await response.json();
    return UserEntity.fromApiJson(data);
  }

  static async fetchRoles(signal = null) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROLES}`, { 
      signal,
      credentials: 'include' 
    });
    
    if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลสิทธิ์การใช้งานได้');
    
    return response.json();
  }

  static async createUser(formData) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/create`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'การสร้างผู้ใช้ล้มเหลว');
    }

    return response.json();
  }

  static async updateUser(id, formData) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${id}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'การอัปเดตข้อมูลล้มเหลว');
    }

    return response.json();
  }

  static async deleteUser(id) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'ลบผู้ใช้ไม่สำเร็จ');
    }
    
    return true;
  }
}