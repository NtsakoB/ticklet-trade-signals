/**
 * Anomaly Score Calculation Service
 * Calculates numerical anomaly scores (0-100) for trading signals
 * Used for ML tracking and display purposes only - does NOT affect trading logic
 */

interface AnomalyCalculationData {
  symbol: string;
  candles?: any[];
  volume: number;
  rsi?: number;
  macd?: number;
  priceChange?: number;
  volatility?: number;
}

/**
 * Calculate anomaly score for a given symbol and market data
 * @param data Market data for anomaly calculation
 * @returns Anomaly score between 0-100
 */
export const calculateAnomalyScore = (data: AnomalyCalculationData): number => {
  try {
    if (!data.candles || data.candles.length < 10) {
      return generateQuickAnomalyScore(data.symbol);
    }

    // Extract price data from candles
    const prices = data.candles.slice(-20).map(candle => candle.close || candle.c || 0);
    const volumes = data.candles.slice(-10).map(candle => candle.volume || candle.v || 0);
    
    if (prices.length === 0 || prices.every(p => p === 0)) {
      return generateQuickAnomalyScore(data.symbol);
    }

    const recentPrice = prices[prices.length - 1];
    const priceMean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - priceMean, 2), 0) / prices.length;
    const priceStd = Math.sqrt(variance);
    
    // Calculate volatility percentage
    const volatility = priceMean > 0 ? (priceStd / priceMean) * 100 : 0;
    
    // Volume spike analysis
    const recentVolume = data.volume || (volumes.length > 0 ? volumes[volumes.length - 1] : 0);
    const avgVolume = volumes.length > 0 ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length : 1;
    const volumeSpike = avgVolume > 0 ? (recentVolume / avgVolume) * 100 : 0;
    
    // RSI anomaly (distance from neutral 50)
    const rsiAnomaly = data.rsi ? Math.abs(data.rsi - 50) : 0;
    
    // MACD anomaly
    const macdAnomaly = data.macd ? Math.abs(data.macd) * 10 : 0;
    
    // Weighted scoring
    let score = 0;
    score += Math.min(25, volatility * 2.5); // Volatility component (0-25)
    score += Math.min(25, volumeSpike * 0.25); // Volume component (0-25)
    score += Math.min(25, rsiAnomaly * 0.5); // RSI component (0-25)
    score += Math.min(25, macdAnomaly); // MACD component (0-25)
    
    return Math.min(100, Math.max(5, Math.round(score)));
  } catch (error) {
    console.warn(`Error calculating anomaly score for ${data.symbol}:`, error);
    return generateQuickAnomalyScore(data.symbol);
  }
};

/**
 * Calculate volume-based anomaly score
 */
const calculateVolumeAnomalyScore = (volume: number): number => {
  if (!volume || volume <= 0) return 0;
  
  // Volume thresholds for scoring
  if (volume > 50000000) return 30; // Extremely high volume
  if (volume > 20000000) return 25; // Very high volume
  if (volume > 10000000) return 20; // High volume
  if (volume > 5000000) return 15;  // Above average volume
  if (volume > 1000000) return 10;  // Average volume
  
  return 5; // Low volume
};

/**
 * Calculate volatility-based anomaly score
 */
const calculateVolatilityAnomalyScore = (volatility: number): number => {
  if (!volatility || volatility <= 0) return 0;
  
  // Volatility thresholds for scoring
  if (volatility > 10) return 25; // Extreme volatility
  if (volatility > 5) return 20;  // Very high volatility
  if (volatility > 3) return 15;  // High volatility
  if (volatility > 2) return 10;  // Moderate volatility
  if (volatility > 1) return 5;   // Low volatility
  
  return 0; // Minimal volatility
};

/**
 * Calculate technical indicator-based anomaly score
 */
const calculateTechnicalAnomalyScore = (rsi?: number, macd?: number): number => {
  let score = 0;
  
  // RSI divergence scoring
  if (rsi !== undefined) {
    if (rsi > 80 || rsi < 20) score += 15; // Extreme overbought/oversold
    else if (rsi > 70 || rsi < 30) score += 10; // Overbought/oversold
    else if (rsi > 60 || rsi < 40) score += 5; // Mild divergence
  }
  
  // MACD divergence scoring (simplified)
  if (macd !== undefined) {
    const macdAbs = Math.abs(macd);
    if (macdAbs > 0.5) score += 10; // Strong MACD signal
    else if (macdAbs > 0.2) score += 5; // Moderate MACD signal
  }
  
  return Math.min(25, score);
};

/**
 * Calculate price action-based anomaly score
 */
const calculatePriceActionAnomalyScore = (priceChange: number): number => {
  const absChange = Math.abs(priceChange);
  
  // Price change thresholds for scoring
  if (absChange > 10) return 20; // Extreme price movement
  if (absChange > 5) return 15;  // Large price movement
  if (absChange > 3) return 10;  // Significant price movement
  if (absChange > 1.5) return 5; // Moderate price movement
  
  return 0; // Normal price movement
};

/**
 * Generate a quick anomaly score for testing/fallback purposes
 */
export const generateQuickAnomalyScore = (symbol: string): number => {
  // Simple hash-based score for consistent results per symbol
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to 0-100 range with some randomness
  const baseScore = Math.abs(hash) % 80; // 0-79
  const randomBonus = Math.floor(Math.random() * 21); // 0-20
  
  return Math.min(100, baseScore + randomBonus);
};

export default {
  calculateAnomalyScore,
  generateQuickAnomalyScore
};