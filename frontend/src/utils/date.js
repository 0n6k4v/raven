export const parseDateBE = (dateString) => {
  if (!dateString) return null;

  const str = String(dateString);
  const parts = str.split('/');
  
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (year > 2400) {
      year = year - 543;
    }
    
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) {
       return null; 
    }
    
    return date;
  }

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDateToBE = (dateString) => {
  if (!dateString) return '-';

  const beFormatRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = String(dateString).match(beFormatRegex);

  if (match) {
    const year = parseInt(match[3], 10);
    if (year > 2400) {
      return dateString;
    }
  }

  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const yearCE = date.getUTCFullYear();

    if (yearCE < 1900 || yearCE > 2200) {
      return `${day}/${month}/${yearCE + 543}`; 
    }

    const yearBE = yearCE + 543;
    return `${day}/${month}/${yearBE}`;
    
  } catch (error) {
    return '-';
  }
};