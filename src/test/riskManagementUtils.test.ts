import { describe, it, expect } from 'vitest';
import {
  calculatePositionSize,
  calculateTrailingStopLoss,
  dynamicScaleOutStrategy,
  calculatePortfolioRisk,
  calculateVolatility,
  calculateCorrelation
} from '../utils/riskManagementUtils';
import { TradingPosition } from '../types/token.types';

describe('Risk Management Utilities', () => {
  // Test position size calculation
  describe('calculatePositionSize', () => {
    it('should calculate position size based on risk parameters', () => {
      // Test fixed position sizing
      const fixedSize = calculatePositionSize(
        10000, // Available capital
        2,     // Risk per trade (%)
        10,    // Stop loss (%)
        0,     // Volatility
        'fixed'
      );

      // Expected size: 10000 * 0.02 / 0.1 = 2000
      expect(fixedSize).toBeCloseTo(2000, 0);

      // Test volatility adjusted position sizing
      const volatilityAdjustedSize = calculatePositionSize(
        10000, // Available capital
        2,     // Risk per trade (%)
        10,    // Stop loss (%)
        50,    // Volatility (50%)
        'volatility_adjusted'
      );

      // With 50% volatility, position should be smaller than fixed size
      expect(volatilityAdjustedSize).toBeLessThan(fixedSize);

      // Test kelly criterion position sizing
      const kellySize = calculatePositionSize(
        10000, // Available capital
        2,     // Risk per trade (%)
        10,    // Stop loss (%)
        0,     // Volatility
        'kelly_criterion'
      );

      // Kelly should return a valid position size
      expect(kellySize).toBeGreaterThan(0);
      expect(kellySize).toBeLessThanOrEqual(10000);
    });

    it('should handle edge cases', () => {
      // Test with zero capital
      const zeroCapital = calculatePositionSize(0, 2, 10, 0, 'fixed');
      expect(zeroCapital).toBe(0);

      // Test with very high volatility
      const highVolatility = calculatePositionSize(10000, 2, 10, 100, 'volatility_adjusted');
      expect(highVolatility).toBeGreaterThan(0); // Should still return a positive value

      // Test with very small stop loss
      const smallStopLoss = calculatePositionSize(10000, 2, 0.1, 0, 'fixed');
      expect(smallStopLoss).toBeGreaterThan(0);
    });
  });

  // Test trailing stop loss calculation
  describe('calculateTrailingStopLoss', () => {
    it('should calculate trailing stop loss price', () => {
      // Test when price is in profit
      const trailingStop1 = calculateTrailingStopLoss(
        100, // Entry price
        150, // Current price
        150, // Highest price
        10   // Trailing distance (%)
      );

      // Expected: 150 * 0.9 = 135
      expect(trailingStop1).toBeCloseTo(135, 0);

      // Test when price has pulled back from highest
      const trailingStop2 = calculateTrailingStopLoss(
        100, // Entry price
        130, // Current price
        150, // Highest price
        10   // Trailing distance (%)
      );

      // Expected: 150 * 0.9 = 135 (based on highest price, not current)
      expect(trailingStop2).toBeCloseTo(135, 0);

      // Test when price is below entry
      const trailingStop3 = calculateTrailingStopLoss(
        100, // Entry price
        90,  // Current price
        100, // Highest price
        10   // Trailing distance (%)
      );

      // Expected: 100 * 0.9 = 90 (based on entry price)
      expect(trailingStop3).toBeCloseTo(90, 0);
    });
  });

  // Test dynamic scale-out strategy
  describe('dynamicScaleOutStrategy', () => {
    it('should apply scale-out strategy based on profit levels', () => {
      // Create a test position
      const position: TradingPosition = {
        contractAddress: 'test-contract',
        tokenName: 'Test Token',
        tokenSymbol: 'TEST',
        entryPrice: 100,
        entryTime: new Date().toISOString(),
        initialInvestment: 1000,
        currentAmount: 1000,
        currentPrice: 100,
        lastUpdateTime: new Date().toISOString(),
        securedInitial: false,
        scaleOutHistory: [],
        source: 'test',
        status: 'active',
        pnl: 0,
        roi: 0,
        notes: 'Test position'
      };

      // Test with 50% profit (no scale-out yet)
      const position50pct = dynamicScaleOutStrategy(position, 150);
      expect(position50pct.securedInitial).toBe(false);
      expect(position50pct.scaleOutHistory.length).toBe(0);

      // Test with 100% profit (first scale-out)
      const position100pct = dynamicScaleOutStrategy(position, 200);
      expect(position100pct.securedInitial).toBe(true);
      expect(position100pct.scaleOutHistory.length).toBe(1);

      // Test with 300% profit (second scale-out)
      const position300pct = dynamicScaleOutStrategy(position, 400);
      expect(position300pct.securedInitial).toBe(true);
      expect(position300pct.scaleOutHistory.length).toBe(2);
    });
  });

  // Test portfolio risk calculation
  describe('calculatePortfolioRisk', () => {
    it('should calculate portfolio risk metrics', () => {
      // Create test positions
      const positions: TradingPosition[] = [
        {
          contractAddress: 'contract-1',
          tokenName: 'Token 1',
          tokenSymbol: 'TKN1',
          entryPrice: 100,
          entryTime: new Date().toISOString(),
          initialInvestment: 1000,
          currentAmount: 1500,
          currentPrice: 150,
          lastUpdateTime: new Date().toISOString(),
          securedInitial: false,
          scaleOutHistory: [],
          source: 'test',
          status: 'active',
          pnl: 500,
          roi: 50,
          notes: 'Test position 1'
        },
        {
          contractAddress: 'contract-2',
          tokenName: 'Token 2',
          tokenSymbol: 'TKN2',
          entryPrice: 200,
          entryTime: new Date().toISOString(),
          initialInvestment: 2000,
          currentAmount: 2200,
          currentPrice: 220,
          lastUpdateTime: new Date().toISOString(),
          securedInitial: false,
          scaleOutHistory: [],
          source: 'test',
          status: 'active',
          pnl: 200,
          roi: 10,
          notes: 'Test position 2'
        }
      ];

      // Calculate portfolio risk
      const risk = calculatePortfolioRisk(positions, 5000);

      // Check risk metrics
      expect(risk.totalRisk).toBeGreaterThanOrEqual(0);
      expect(risk.maxPositionRisk).toBeGreaterThanOrEqual(0);
      expect(risk.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(risk.positionRisks.length).toBe(2);
    });

    it('should handle empty portfolio', () => {
      const risk = calculatePortfolioRisk([], 10000);
      expect(risk.totalRisk).toBe(0);
      expect(risk.maxPositionRisk).toBe(0);
      expect(risk.diversificationScore).toBe(0);
    });
  });

  // Test volatility calculation
  describe('calculateVolatility', () => {
    it('should calculate volatility from price history', () => {
      // Create test price history
      const prices = [100, 105, 103, 110, 108, 115, 120, 118, 125];

      // Calculate volatility
      const volatility = calculateVolatility(prices);

      // Volatility should be a number
      expect(typeof volatility).toBe('number');
    });

    it('should handle insufficient data', () => {
      // Test with insufficient data
      const volatility = calculateVolatility([100, 105]);
      expect(volatility).toBe(0);
    });
  });

  // Test correlation calculation
  describe('calculateCorrelation', () => {
    it('should calculate correlation between two assets', () => {
      // Create test price histories
      const pricesA = [100, 105, 110, 115, 120, 125, 130];
      const pricesB = [200, 205, 210, 215, 220, 225, 230];

      // Calculate correlation
      const correlation = calculateCorrelation(pricesA, pricesB);

      // Correlation should be a number between -1 and 1
      expect(typeof correlation).toBe('number');
      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);

      // Test negative correlation
      const pricesC = [100, 105, 110, 115, 120, 125, 130];
      const pricesD = [230, 225, 220, 215, 210, 205, 200];

      const negativeCorrelation = calculateCorrelation(pricesC, pricesD);

      // Correlation should be a number between -1 and 1
      expect(typeof negativeCorrelation).toBe('number');
      expect(negativeCorrelation).toBeGreaterThanOrEqual(-1);
      expect(negativeCorrelation).toBeLessThanOrEqual(1);
    });

    it('should handle mismatched data', () => {
      // Test with mismatched data lengths
      const correlation = calculateCorrelation([100, 105], [200, 205, 210]);
      expect(correlation).toBe(0);
    });
  });
});
