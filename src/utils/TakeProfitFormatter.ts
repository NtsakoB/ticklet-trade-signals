/**
 * Formatter for displaying Take Profit (TP) levels for SELL signals in descending order.
 * Ensures visual correctness for TP levels without altering trading logic or order structure.
 */
export class TakeProfitFormatter {
  /**
   * Format TP levels for SELL signals to display in descending order.
   *
   * @param signal_type - 'SELL' or 'BUY'.
   * @param tp_levels - List of TP levels (floats).
   *                    Example for SELL: [TP1, TP2, TP3] with unsorted prices.
   *                    Example for BUY: [TP1, TP2, TP3] with unsorted prices.
   * @returns List of formatted TP levels.
   */
  static formatTakeProfitLevels(signal_type: string, tp_levels: number[]): number[] {
    if (signal_type.toUpperCase() === 'SELL') {
      // Sort TP levels in descending order for SELL signals
      return [...tp_levels].sort((a, b) => b - a);
    } else if (signal_type.toUpperCase() === 'BUY') {
      // Sort TP levels in ascending order for BUY signals
      return [...tp_levels].sort((a, b) => a - b);
    } else {
      throw new Error(`Invalid signal type: ${signal_type}. Must be 'SELL' or 'BUY'.`);
    }
  }

  /**
   * Apply TP level formatting to a signal object.
   *
   * @param signal - Signal object containing 'type' and 'targets' or 'tp_levels'.
   * @returns Signal object with formatted TP levels.
   */
  static formatSignalOutput<T extends { type: string; targets?: number[]; tp_levels?: number[] }>(signal: T): T {
    const signal_type = signal.type?.toUpperCase();
    const tp_levels = signal.targets || signal.tp_levels || [];

    if (!tp_levels.length || !['SELL', 'BUY'].includes(signal_type)) {
      return signal; // Return unmodified signal if no TP levels or invalid type
    }

    // Format TP levels based on signal type
    const formattedLevels = this.formatTakeProfitLevels(signal_type, tp_levels);
    
    if (signal.targets) {
      return { ...signal, targets: formattedLevels };
    } else if (signal.tp_levels) {
      return { ...signal, tp_levels: formattedLevels };
    }
    
    return signal;
  }
}