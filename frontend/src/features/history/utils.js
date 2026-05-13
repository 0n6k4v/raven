import { AuthPolicy, AUTH_DEPARTMENTS } from '../auth/utils';
import { HistoryItemEntity } from './entities';

export const HISTORY_CONSTANTS = {
  DEPARTMENT: AUTH_DEPARTMENTS,
  VIEW_TYPE: {
    NARCOTIC_ADMIN: 'NARCOTIC_ADMIN',
    GENERAL_USER: 'GENERAL_USER',
    FORBIDDEN: 'FORBIDDEN',
  },
  ROW_OPTIONS: [5, 10, 20],
};

export const HistoryAccessPolicy = {
  determineViewType: (user) => {
    if (!user || !user.isLoggedIn) return HISTORY_CONSTANTS.VIEW_TYPE.FORBIDDEN;

    const isNarcoticAdmin = AuthPolicy.isDepartmentAdmin(user, HISTORY_CONSTANTS.DEPARTMENT.NARCOTICS);

    if (isNarcoticAdmin) {
      return HISTORY_CONSTANTS.VIEW_TYPE.NARCOTIC_ADMIN;
    }

    if (user.isUser || AuthPolicy.isAdminLevel(user)) {
      return HISTORY_CONSTANTS.VIEW_TYPE.GENERAL_USER;
    }

    return HISTORY_CONSTANTS.VIEW_TYPE.FORBIDDEN;
  },

  getFetchParams: (user, evidence) => {
    if (!user) return null;

    const userId = user.userId;
    const roleId = user.roleId;
    const department = user.department;

    const exhibitId = evidence?.exhibit_id;
    const category = evidence?.category || evidence?.exhibit?.category;

    if (exhibitId) {
      if (user.isSuperAdmin) return { exhibitId };

      if (user.isAdmin) {
        const isFirearmDept = department === HISTORY_CONSTANTS.DEPARTMENT.FIREARMS && 
                              (category === "ปืน" || category === "อาวุธปืน");
        const isDrugDept = department === HISTORY_CONSTANTS.DEPARTMENT.NARCOTICS && 
                           category === "ยาเสพติด";
        
        if (isFirearmDept || isDrugDept) return { exhibitId };
      }

      return { exhibitId, userId };
    }

    return userId ? { userId } : null;
  },

  hasLabelPermission: (onLabelItem) => typeof onLabelItem === 'function',
  canPerformAction: (isAdmin, callback) => isAdmin && typeof callback === 'function',
  canShowAdminMenu: ({ isAdmin, hasActions, hasLabelAction }) => {
    return isAdmin && !hasLabelAction && hasActions;
  }
};

export const HistoryFilterService = {
  applyFilters: (data, filters) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const { categories, dateRange, customDate, province, district, subdistrict } = filters;

    return data.filter(item => {
      const entity = item instanceof HistoryItemEntity ? item : new HistoryItemEntity(item);
      
      if (categories?.length && !categories.includes(entity.category)) return false;

      if (dateRange || customDate) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const rawDate = entity.exhibit?.discovery_date || entity.exhibit?.date || entity.exhibit?.created_at;

        if (dateRange) {
          let start = new Date();
          start.setHours(0, 0, 0, 0);
          switch (dateRange) {
            case 'today': break;
            case 'last7days': start.setDate(today.getDate() - 7); break;
            case 'last1month': start.setMonth(today.getMonth() - 1); break;
            case 'last6months': start.setMonth(today.getMonth() - 6); break;
            case 'last1year': start.setFullYear(today.getFullYear() - 1); break;
            default: start = null;
          }
          if (start) {
            const d = rawDate ? new Date(rawDate) : null;
            if (!d || d < start || d > today) return false;
          }
        } else if (customDate && rawDate !== customDate) {
          return false;
        }
      }

      const locationMatch = (entityKey, filterVal) => {
        if (!filterVal) return true;
        const val = entity[entityKey];
        return val && val.toLowerCase().includes(filterVal.toLowerCase());
      };

      return locationMatch('province_name', province) && 
             locationMatch('district_name', district) && 
             locationMatch('subdistrict_name', subdistrict);
    });
  },

  generateLabels: (applied) => {
    const labels = [];
    if (!applied) return labels;

    if (applied.categories?.length) {
      applied.categories.forEach(c => labels.push({ type: 'category', value: c, label: c }));
    }

    if (applied.dateRange) {
      const map = { 
        today: 'วันนี้', last7days: '7 วันล่าสุด', last1month: '1 เดือนล่าสุด', 
        last6months: '6 เดือนล่าสุด', last1year: '1 ปีล่าสุด' 
      };
      labels.push({ type: 'date', value: applied.dateRange, label: map[applied.dateRange] || applied.dateRange });
    } else if (applied.customDate) {
      labels.push({ type: 'date', value: 'custom', label: `วันที่: ${applied.customDate}` });
    }

    const locTypes = { province: 'จ.', district: 'อ.', subdistrict: 'ต.' };
    Object.keys(locTypes).forEach(key => {
      if (applied[key]) {
        labels.push({ type: 'location', value: key, label: `${locTypes[key]}${applied[key]}` });
      }
    });

    return labels;
  }
};

// 4. Formatters
export const HistoryFormatter = {
  formatPaginationInfo: (first, last, total) => 
    `${total === 0 ? 0 : first + 1}-${Math.min(last, total)} จาก ${total}`
};