export class UserEntity {
  constructor(data) {
    this.id = data?.id ?? null;
    this.userId = data?.user_id ?? ''; 
    this.title = data?.title ?? '';
    this.firstName = data?.firstname ?? '';
    this.lastName = data?.lastname ?? '';
    this.email = data?.email ?? '';
    this.department = data?.department ?? '';
    
    this.role = data?.role?.role_name ?? (typeof data?.role === 'string' ? data.role : '');
    
    this.roleId = data?.role?.id ?? null;
    
    this.avatarUrl = data?.profile_image_url ?? null;
    
    this.isActive = data?.is_active ?? true;
  }

  static fromApiJson(json) {
    if (!json) return null;
    return new UserEntity(json);
  }
  
  get initials() {
    return this.firstName ? this.firstName.charAt(0).toUpperCase() : "";
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get displayTitleName() {
    return `${this.title} ${this.firstName} ${this.lastName}`.trim();
  }

  get isLoggedIn() {
    return !!this.id;
  }

  get isSuperAdmin() { return this.roleId === 1; }
  get isAdmin() { return this.roleId === 2; }
  get isUser() { return this.roleId === 3; }
}