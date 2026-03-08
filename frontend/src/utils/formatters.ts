/**
 * Utility functions for formatting data in the Jewellery System
 */

/**
 * Format currency values (Sri Lankan Rupees)
 */
export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format currency in compact form for smaller spaces
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `Rs. ${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format weight in grams
 */
export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(3)} kg`;
  }
  return `${grams.toFixed(3)} g`;
};

/**
 * Format weight in troy ounces (commonly used for precious metals)
 */
export const formatTroyOunces = (grams: number): string => {
  const troyOunces = grams / 31.1035;
  return `${troyOunces.toFixed(3)} oz t`;
};

/**
 * Format carat weight for gemstones
 */
export const formatCarat = (carats: number): string => {
  return `${carats.toFixed(2)} ct`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Sri Lankan phone numbers
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Format with country code
  if (cleaned.length === 11 && cleaned.startsWith('94')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Generate invoice number
 */
export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
};

/**
 * Generate GRN number
 */
export const generateGRNNumber = (prefix: string = 'GRN'): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
};

/**
 * Calculate gold price based on weight and karat
 */
export const calculateGoldPrice = (
  weightGrams: number,
  karatPurity: number,
  pricePerGram24K: number
): number => {
  const purityFactor = karatPurity / 24;
  return weightGrams * pricePerGram24K * purityFactor;
};

/**
 * Get karat purity percentage
 */
export const getKaratPurity = (karat: string): number => {
  const karatMap: Record<string, number> = {
    '24K': 99.9,
    '22K': 91.7,
    '21K': 87.5,
    '18K': 75.0,
    '14K': 58.5,
    '10K': 41.7,
    '9K': 37.5,
  };
  return karatMap[karat] || 0;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Format metal type for display
 */
export const formatMetalType = (metalType: string): string => {
  const metalMap: Record<string, string> = {
    'gold': 'Gold',
    'silver': 'Silver',
    'platinum': 'Platinum',
    'palladium': 'Palladium',
    'white-gold': 'White Gold',
    'rose-gold': 'Rose Gold',
  };
  return metalMap[metalType] || capitalizeWords(metalType.replace('-', ' '));
};
