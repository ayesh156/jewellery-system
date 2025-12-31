/**
 * Pawning Interest Calculation Utilities
 * Sri Lankan Gold Loan Interest Logic
 * 
 * Interest Rules:
 * 1. If even 1 day passes, 5% interest is applied (first month)
 * 2. For each additional complete month, add another 5%
 * 3. After the first month, remaining days are prorated at daily rate
 * 4. Interest rate is configurable
 * 
 * Partial Payment Enhancement:
 * - Supports time-precise calculations (down to hours/minutes)
 * - When customer pays early, interest is calculated up to that exact moment
 * - Remaining interest tracked from payment time to maturity
 */

import type { InterestCalculation, PreciseInterestCalculation, InterestPayment } from '../types';

// Default interest configuration
export const DEFAULT_INTEREST_RATE = 5; // 5% per month
export const DAYS_IN_MONTH = 30; // Standard month for calculation
export const HOURS_IN_DAY = 24;
export const MINUTES_IN_HOUR = 60;

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to midnight for accurate day counting
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Calculate interest for a pawned item
 * 
 * Logic:
 * - Days 1-30: First month (fixed 5% even for 1 day)
 * - Days 31-60: Second month (another 5% = 10% total)
 * - Days 61-90: Third month (another 5% = 15% total)
 * - After complete months, remaining days are prorated
 * 
 * Example for 45 days with Rs. 100,000 principal at 5% rate:
 * - First month (30 days): 5% = Rs. 5,000
 * - Remaining 15 days: (5% / 30) × 15 = 2.5% = Rs. 2,500
 * - Total interest: Rs. 7,500
 * - Total payable: Rs. 107,500
 */
export function calculatePawnInterest(
  principalAmount: number,
  pawnDate: string | Date,
  redemptionDate: string | Date,
  interestRatePerMonth: number = DEFAULT_INTEREST_RATE
): InterestCalculation {
  const startDate = new Date(pawnDate);
  const endDate = new Date(redemptionDate);
  
  const daysElapsed = getDaysBetween(startDate, endDate);
  
  // If no days have passed, no interest
  if (daysElapsed === 0) {
    return {
      principalAmount,
      daysElapsed: 0,
      monthsCompleted: 0,
      remainingDays: 0,
      firstMonthInterest: 0,
      additionalMonthsInterest: 0,
      proratedDailyInterest: 0,
      totalInterest: 0,
      totalPayable: principalAmount,
      interestRatePerMonth,
      dailyRate: interestRatePerMonth / DAYS_IN_MONTH,
    };
  }
  
  // Calculate months and remaining days
  const monthsCompleted = Math.floor(daysElapsed / DAYS_IN_MONTH);
  const remainingDays = daysElapsed % DAYS_IN_MONTH;
  
  // Calculate rate as decimal
  const monthlyRate = interestRatePerMonth / 100;
  const dailyRate = monthlyRate / DAYS_IN_MONTH;
  
  let firstMonthInterest = 0;
  let additionalMonthsInterest = 0;
  let proratedDailyInterest = 0;
  
  if (daysElapsed >= 1) {
    // First month interest (fixed 5% even for 1 day)
    firstMonthInterest = principalAmount * monthlyRate;
    
    if (monthsCompleted >= 1) {
      // Additional complete months (excluding first month)
      const additionalMonths = monthsCompleted - 1;
      additionalMonthsInterest = principalAmount * monthlyRate * additionalMonths;
      
      // Pro-rated interest for remaining days after complete months
      if (remainingDays > 0) {
        proratedDailyInterest = principalAmount * dailyRate * remainingDays;
      }
    } else {
      // Less than a month - just first month interest applies
      // No pro-rating needed for first month (full 5% applies)
    }
  }
  
  const totalInterest = firstMonthInterest + additionalMonthsInterest + proratedDailyInterest;
  const totalPayable = principalAmount + totalInterest;
  
  return {
    principalAmount,
    daysElapsed,
    monthsCompleted,
    remainingDays: monthsCompleted >= 1 ? remainingDays : daysElapsed,
    firstMonthInterest,
    additionalMonthsInterest,
    proratedDailyInterest,
    totalInterest,
    totalPayable,
    interestRatePerMonth,
    dailyRate: dailyRate * 100, // Return as percentage for display
  };
}

/**
 * Format interest breakdown for display
 */
export function formatInterestBreakdown(calc: InterestCalculation): string[] {
  const breakdown: string[] = [];
  
  if (calc.daysElapsed === 0) {
    breakdown.push('No interest (same day redemption)');
    return breakdown;
  }
  
  breakdown.push(`Days elapsed: ${calc.daysElapsed} day(s)`);
  
  if (calc.firstMonthInterest > 0) {
    breakdown.push(
      `First month interest (${calc.interestRatePerMonth}%): Rs. ${calc.firstMonthInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  if (calc.monthsCompleted > 1) {
    const additionalMonths = calc.monthsCompleted - 1;
    breakdown.push(
      `Additional ${additionalMonths} month(s) @ ${calc.interestRatePerMonth}%: Rs. ${calc.additionalMonthsInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  if (calc.proratedDailyInterest > 0) {
    breakdown.push(
      `Pro-rated interest (${calc.remainingDays} days @ ${calc.dailyRate.toFixed(4)}%/day): Rs. ${calc.proratedDailyInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  return breakdown;
}

/**
 * Calculate estimated interest for a future date
 */
export function estimateInterestForPeriod(
  principalAmount: number,
  months: number,
  interestRatePerMonth: number = DEFAULT_INTEREST_RATE
): { totalInterest: number; totalPayable: number; effectiveRate: number } {
  const monthlyRate = interestRatePerMonth / 100;
  const totalInterest = principalAmount * monthlyRate * months;
  const totalPayable = principalAmount + totalInterest;
  const effectiveRate = interestRatePerMonth * months;
  
  return {
    totalInterest,
    totalPayable,
    effectiveRate,
  };
}

/**
 * Check if a pawn ticket is overdue
 */
export function isPawnOverdue(maturityDate: string | Date, gracePeriodDays: number = 0): boolean {
  const maturity = new Date(maturityDate);
  const today = new Date();
  
  maturity.setDate(maturity.getDate() + gracePeriodDays);
  maturity.setHours(23, 59, 59, 999);
  
  return today > maturity;
}

/**
 * Calculate days until maturity (or days overdue if negative)
 */
export function getDaysUntilMaturity(maturityDate: string | Date): number {
  const maturity = new Date(maturityDate);
  const today = new Date();
  
  maturity.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = maturity.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate Loan-to-Value amount
 * @param valuedAmount - Total appraised value of items
 * @param ltvRatio - Loan to value ratio (e.g., 0.70 for 70%)
 */
export function calculateLoanAmount(valuedAmount: number, ltvRatio: number = 0.70): number {
  return Math.floor(valuedAmount * ltvRatio);
}

/**
 * Calculate gold value based on weight and market rate
 * @param weightGrams - Weight in grams
 * @param ratePerGram - Current market rate per gram
 * @param purity - Purity percentage (e.g., 91.6 for 22K)
 */
export function calculateGoldValue(
  weightGrams: number,
  ratePerGram: number,
  purity: number = 100
): number {
  const pureGoldWeight = weightGrams * (purity / 100);
  return pureGoldWeight * ratePerGram;
}

/**
 * Get purity percentage for a given karat
 */
export function getKaratPurity(karat: string): number {
  const karatPurities: Record<string, number> = {
    '24K': 99.9,
    '22K': 91.67,
    '21K': 87.5,
    '18K': 75.0,
    '14K': 58.33,
    '10K': 41.67,
    '9K': 37.5,
  };
  
  return karatPurities[karat] || 100;
}

/**
 * Generate a unique pawn ticket number
 */
export function generateTicketNumber(prefix: string = 'PWN'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Calculate maturity date based on loan period
 */
export function calculateMaturityDate(pawnDate: string | Date, months: number = 3): Date {
  const date = new Date(pawnDate);
  date.setMonth(date.getMonth() + months);
  return date;
}

// ==========================================
// TIME-PRECISE INTEREST CALCULATIONS
// For Partial Interest Payments
// ==========================================

/**
 * Get the precise time difference between two datetimes
 * Returns days, hours, and minutes elapsed
 */
export function getPreciseTimeDifference(
  startDateTime: string | Date,
  endDateTime: string | Date
): { totalMinutes: number; days: number; hours: number; minutes: number } {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes % (60 * 24);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;
  
  return { totalMinutes, days, hours, minutes };
}

/**
 * Calculate interest for a precise time period (down to hours)
 * 
 * This is used when a customer makes a partial interest payment BEFORE maturity.
 * Example: Maturity at 12:30, customer pays at 6:30 - calculate interest up to 6:30
 * 
 * Logic:
 * - Calculate full days normally using standard rules
 * - For partial days (hours), pro-rate the daily rate
 */
export function calculatePreciseInterest(
  principalAmount: number,
  startDateTime: string | Date,
  endDateTime: string | Date,
  interestRatePerMonth: number = DEFAULT_INTEREST_RATE,
  previousPayments: InterestPayment[] = []
): PreciseInterestCalculation {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  
  // Get precise time difference
  const timeDiff = getPreciseTimeDifference(start, end);
  
  // Calculate total hours elapsed
  const totalHours = timeDiff.days * 24 + timeDiff.hours + (timeDiff.minutes / 60);
  
  // If no time has passed, no interest
  if (totalHours <= 0) {
    const previousPaymentsTotal = previousPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    return {
      principalAmount,
      daysElapsed: 0,
      monthsCompleted: 0,
      remainingDays: 0,
      firstMonthInterest: 0,
      additionalMonthsInterest: 0,
      proratedDailyInterest: 0,
      totalInterest: 0,
      totalPayable: principalAmount,
      interestRatePerMonth,
      dailyRate: interestRatePerMonth / DAYS_IN_MONTH,
      hoursElapsed: 0,
      minutesElapsed: 0,
      calculatedFrom: start.toISOString(),
      calculatedTo: end.toISOString(),
      fullDaysInterest: 0,
      partialDayInterest: 0,
      previousPaymentsTotal,
      outstandingInterest: 0,
    };
  }
  
  // Calculate rates
  const monthlyRate = interestRatePerMonth / 100;
  const dailyRate = monthlyRate / DAYS_IN_MONTH;
  const hourlyRate = dailyRate / HOURS_IN_DAY;
  
  // Get full days and remaining hours
  const fullDays = timeDiff.days;
  const remainingHours = timeDiff.hours + (timeDiff.minutes / 60);
  
  // Calculate interest using standard rules for full days
  const monthsCompleted = Math.floor(fullDays / DAYS_IN_MONTH);
  const remainingDaysAfterMonths = fullDays % DAYS_IN_MONTH;
  
  let firstMonthInterest = 0;
  let additionalMonthsInterest = 0;
  let proratedDailyInterest = 0;
  let fullDaysInterest = 0;
  let partialDayInterest = 0;
  
  // Interest calculation logic
  if (fullDays >= 1 || remainingHours > 0) {
    // If any time has passed, first month interest applies
    firstMonthInterest = principalAmount * monthlyRate;
    
    if (monthsCompleted >= 1) {
      // Additional complete months (excluding first month)
      const additionalMonths = monthsCompleted - 1;
      additionalMonthsInterest = principalAmount * monthlyRate * additionalMonths;
      
      // Pro-rated interest for remaining full days after complete months
      if (remainingDaysAfterMonths > 0) {
        proratedDailyInterest = principalAmount * dailyRate * remainingDaysAfterMonths;
      }
    }
    
    // Calculate full days interest (for breakdown display)
    fullDaysInterest = firstMonthInterest + additionalMonthsInterest + proratedDailyInterest;
    
    // Calculate partial day interest (remaining hours)
    // This is the key addition for time-precise calculations
    if (remainingHours > 0) {
      partialDayInterest = principalAmount * hourlyRate * remainingHours;
    }
  }
  
  const totalInterest = fullDaysInterest + partialDayInterest;
  
  // Calculate previous payments
  const previousPaymentsTotal = previousPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const outstandingInterest = Math.max(0, totalInterest - previousPaymentsTotal);
  
  const totalPayable = principalAmount + outstandingInterest;
  
  return {
    principalAmount,
    daysElapsed: fullDays,
    monthsCompleted,
    remainingDays: remainingDaysAfterMonths,
    firstMonthInterest,
    additionalMonthsInterest,
    proratedDailyInterest,
    totalInterest,
    totalPayable,
    interestRatePerMonth,
    dailyRate: dailyRate * 100,
    hoursElapsed: Math.floor(totalHours),
    minutesElapsed: timeDiff.minutes,
    calculatedFrom: start.toISOString(),
    calculatedTo: end.toISOString(),
    fullDaysInterest,
    partialDayInterest,
    previousPaymentsTotal,
    outstandingInterest,
  };
}

/**
 * Calculate remaining interest from a specific datetime to maturity
 * 
 * Used when: Customer pays interest at 6:30, track remaining interest from 6:30 to maturity (12:30)
 */
export function calculateRemainingInterestToMaturity(
  principalAmount: number,
  lastPaidToDateTime: string | Date,
  maturityDateTime: string | Date,
  interestRatePerMonth: number = DEFAULT_INTEREST_RATE
): {
  remainingInterest: number;
  timeRemaining: { days: number; hours: number; minutes: number };
  breakdown: string[];
} {
  const timeDiff = getPreciseTimeDifference(lastPaidToDateTime, maturityDateTime);
  
  if (timeDiff.totalMinutes <= 0) {
    return {
      remainingInterest: 0,
      timeRemaining: { days: 0, hours: 0, minutes: 0 },
      breakdown: ['Interest fully paid to maturity'],
    };
  }
  
  const monthlyRate = interestRatePerMonth / 100;
  const dailyRate = monthlyRate / DAYS_IN_MONTH;
  const hourlyRate = dailyRate / HOURS_IN_DAY;
  const minuteRate = hourlyRate / MINUTES_IN_HOUR;
  
  // Calculate remaining interest
  const daysInterest = principalAmount * dailyRate * timeDiff.days;
  const hoursInterest = principalAmount * hourlyRate * timeDiff.hours;
  const minutesInterest = principalAmount * minuteRate * timeDiff.minutes;
  
  const remainingInterest = daysInterest + hoursInterest + minutesInterest;
  
  const breakdown: string[] = [];
  if (timeDiff.days > 0) {
    breakdown.push(`${timeDiff.days} day(s): Rs. ${daysInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
  }
  if (timeDiff.hours > 0) {
    breakdown.push(`${timeDiff.hours} hour(s): Rs. ${hoursInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
  }
  if (timeDiff.minutes > 0) {
    breakdown.push(`${timeDiff.minutes} minute(s): Rs. ${minutesInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
  }
  
  return {
    remainingInterest,
    timeRemaining: {
      days: timeDiff.days,
      hours: timeDiff.hours,
      minutes: timeDiff.minutes,
    },
    breakdown,
  };
}

/**
 * Generate interest receipt number
 */
export function generateInterestReceiptNumber(prefix: string = 'INT'): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Format time elapsed for display
 */
export function formatTimeElapsed(days: number, hours: number, minutes: number): string {
  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.length > 0 ? parts.join(', ') : 'Less than a minute';
}

/**
 * Format precise interest breakdown for display
 */
export function formatPreciseInterestBreakdown(calc: PreciseInterestCalculation): string[] {
  const breakdown: string[] = [];
  
  if (calc.daysElapsed === 0 && calc.hoursElapsed === 0) {
    breakdown.push('No interest (same time redemption)');
    return breakdown;
  }
  
  // Time elapsed
  const timeStr = formatTimeElapsed(calc.daysElapsed, calc.hoursElapsed % 24, calc.minutesElapsed);
  breakdown.push(`Time elapsed: ${timeStr}`);
  
  // Full days interest breakdown
  if (calc.firstMonthInterest > 0) {
    breakdown.push(
      `First month interest (${calc.interestRatePerMonth}%): Rs. ${calc.firstMonthInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  if (calc.monthsCompleted > 1) {
    const additionalMonths = calc.monthsCompleted - 1;
    breakdown.push(
      `Additional ${additionalMonths} month(s) @ ${calc.interestRatePerMonth}%: Rs. ${calc.additionalMonthsInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  if (calc.proratedDailyInterest > 0) {
    breakdown.push(
      `Pro-rated interest (${calc.remainingDays} days): Rs. ${calc.proratedDailyInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  if (calc.partialDayInterest > 0) {
    breakdown.push(
      `Partial day interest (${calc.hoursElapsed % 24}h ${calc.minutesElapsed}m): Rs. ${calc.partialDayInterest.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  // Previous payments
  if (calc.previousPaymentsTotal > 0) {
    breakdown.push(
      `Less: Previous interest payments: Rs. ${calc.previousPaymentsTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
    );
  }
  
  return breakdown;
}
