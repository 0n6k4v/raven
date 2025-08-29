export const parseDateBE = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const yearBE = parseInt(parts[2], 10);
  const yearCE = yearBE - 543;

  if (isNaN(day) || isNaN(month) || isNaN(yearCE)) return null;

  const date = new Date(Date.UTC(yearCE, month, day));
  if (date.getUTCFullYear() !== yearCE || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null;
  }
  return date;
};

export const formatDateToBE = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return '-';
    }

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const yearCE = date.getUTCFullYear();

    if (yearCE < 1900 || yearCE > 2100) {
      console.warn(`Suspicious year value: ${yearCE} from ${dateString}`);
      return '-';
    }

    const yearBE = yearCE + 543;
    return `${day}/${month}/${yearBE}`;
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return '-';
  }
};