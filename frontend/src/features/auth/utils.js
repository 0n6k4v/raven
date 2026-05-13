export const AUTH_ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  USER: 3,
};

export const AUTH_DEPARTMENTS = {
  NARCOTICS: 'กลุ่มงานยาเสพติด',
  FIREARMS: 'กลุ่มงานอาวุธปืน',
};

export const AuthPolicy = {
  isAuthenticated: (user) => {
    return !!(user && user.isLoggedIn && user.isActive);
  },

  isDepartmentAdmin: (user, requiredDepartment) => {
    if (!user) return false;
    
    if (user.isSuperAdmin) return true;

    const isRoleMatch = user.isAdmin;
    const isDeptMatch = user.department?.trim() === requiredDepartment;

    return isRoleMatch && isDeptMatch;
  },

  isAdminLevel: (user) => {
    if (!user) return false;
    return user.isSuperAdmin || user.isAdmin;
  },

  canManageUsers: (user) => {
    return !!(user && user.isSuperAdmin);
  }
};