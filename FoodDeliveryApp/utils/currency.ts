/**
 * Utility functions for currency formatting
 */

/**
 * Format price in Indian Rupees
 * @param price - The price to format
 * @returns Formatted price string in Indian Rupees
 */
export const formatPriceInRupees = (price: number): string => {
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format as Indian Rupees with proper locale
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(numericPrice);
};

/**
 * Format price without currency symbol (just the number part)
 * @param price - The price to format
 * @returns Formatted price string without currency symbol
 */
export const formatPriceNumber = (price: number): string => {
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format as number with Indian locale
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
  }).format(numericPrice);
};