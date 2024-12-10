// Format currency amounts
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  
  return `${Number(value).toFixed(decimals)}%`;
};

// Format large numbers with abbreviations
export const formatNumber = (num) => {
  if (!num) return '0';
  
  const abbreviations = ['', 'K', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (order < 0 || order >= abbreviations.length) {
    return num.toString();
  }
  
  const value = num / Math.pow(10, order * 3);
  return `${value.toFixed(1)}${abbreviations[order]}`;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format duration in hours:minutes
export const formatDuration = (minutes) => {
  if (!minutes) return '0:00';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

// Format status with consistent naming
export const formatStatus = (status) => {
  if (!status) return '';
  
  const statusMap = {
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'pending': 'Pending',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status.toLowerCase()] || status;
};
