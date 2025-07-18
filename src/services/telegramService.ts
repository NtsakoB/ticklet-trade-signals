interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

interface SignalData {
  type: string;
  symbol: string;
  strategyName: string;
  entryPrice: number;
  entryRange?: { min: number; max: number };
  stopLoss: number;
  takeProfit: number;
  targets?: number[];
  confidence: number;
  timestamp: string;
  leverage?: number;
}

class TelegramService {
  private static instance: TelegramService;
  private config: TelegramConfig | null = null;
  private sentSignalsHash = new Set<string>();

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('telegramConfig');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load Telegram config:', error);
    }
  }

  setConfig(config: TelegramConfig): void {
    this.config = config;
    localStorage.setItem('telegramConfig', JSON.stringify(config));
  }

  getConfig(): TelegramConfig | null {
    return this.config;
  }

  async validateConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config || !this.config.botToken || !this.config.chatId) {
      return { success: false, message: 'Bot token and chat ID are required' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`);
      const data = await response.json();

      if (!data.ok) {
        return { success: false, message: 'Invalid bot token' };
      }

      // Test sending a message to validate chat ID
      const testMessage = '✅ Telegram connection successful!\nYour trading signals will be sent here.';
      const sendResult = await this.sendMessage(testMessage);
      
      if (sendResult.success) {
        return { success: true, message: `Connected successfully as @${data.result.username}` };
      } else {
        return { success: false, message: 'Bot token valid but cannot send to chat ID' };
      }
    } catch (error) {
      return { success: false, message: 'Failed to connect to Telegram' };
    }
  }

  private async sendMessage(message: string): Promise<{ success: boolean; error?: string }> {
    if (!this.config || !this.config.enabled || !this.config.botToken || !this.config.chatId) {
      return { success: false, error: 'Telegram not configured' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.description || 'Failed to send message' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  private generateSignalHash(signal: SignalData): string {
    return `${signal.symbol}_${signal.type}_${signal.entryPrice}_${signal.strategyName}_${Math.floor(Date.parse(signal.timestamp) / 60000)}`;
  }

  private formatSignalMessage(signal: SignalData): string {
    const typeEmoji = signal.type.toLowerCase().includes('long') || signal.type.toLowerCase() === 'buy' ? '🚀' : '🔻';
    const confidenceEmoji = signal.confidence >= 0.8 ? '🧠' : signal.confidence >= 0.6 ? '🤔' : '⚠️';
    
    // Validate signal data to prevent zero values in Telegram messages
    if (!signal.entryPrice || signal.entryPrice <= 0) {
      console.error(`[WARN] Zero entry price in Telegram signal for ${signal.symbol}: ${signal.entryPrice}`);
      throw new Error(`Invalid signal data: Zero entry price for ${signal.symbol}`);
    }
    
    if (!signal.stopLoss || signal.stopLoss <= 0) {
      console.error(`[WARN] Zero stop loss in Telegram signal for ${signal.symbol}: ${signal.stopLoss}`);
      throw new Error(`Invalid signal data: Zero stop loss for ${signal.symbol}`);
    }
    
    let message = `${typeEmoji} <b>${signal.type.toUpperCase()} Setup</b> | #${signal.symbol}\n`;
    message += `${confidenceEmoji} <b>Confidence:</b> ${(signal.confidence * 100).toFixed(2)}%\n`;
    message += `📊 <b>Strategy:</b> ${signal.strategyName}\n`;
    
    // Format prices with appropriate decimal places for micro-priced tokens
    const getDecimalPlaces = (price: number) => price < 1 ? 6 : price < 100 ? 4 : 2;
    const entryDecimals = getDecimalPlaces(signal.entryPrice);
    const slDecimals = getDecimalPlaces(signal.stopLoss);
    
    if (signal.entryRange) {
      const rangeDecimals = getDecimalPlaces(signal.entryRange.min);
      message += `🎯 <b>Entry:</b> ${signal.entryRange.min.toFixed(rangeDecimals)} → ${signal.entryRange.max.toFixed(rangeDecimals)}\n`;
    } else {
      message += `🎯 <b>Entry:</b> ${signal.entryPrice.toFixed(entryDecimals)}\n`;
    }
    
    if (signal.targets && signal.targets.length > 0) {
      // Filter out any zero/invalid targets
      const validTargets = signal.targets.filter(t => t > 0 && !isNaN(t));
      if (validTargets.length > 0) {
        const targetStr = validTargets.map((t, i) => {
          const decimals = getDecimalPlaces(t);
          return `🎯 ${t.toFixed(decimals)}`;
        }).join(', ');
        message += `<b>Targets:</b> ${targetStr}\n`;
      } else {
        message += `🎯 <b>Target:</b> ${signal.takeProfit.toFixed(getDecimalPlaces(signal.takeProfit))}\n`;
      }
    } else {
      message += `🎯 <b>Target:</b> ${signal.takeProfit.toFixed(getDecimalPlaces(signal.takeProfit))}\n`;
    }
    
    message += `🛑 <b>Stop:</b> ${signal.stopLoss.toFixed(slDecimals)}\n`;
    
    if (signal.leverage && signal.leverage > 0) {
      message += `⚡ <b>Leverage:</b> ${signal.leverage}x\n`;
    }
    
    message += `🕒 <b>Time:</b> ${new Date(signal.timestamp).toLocaleString()}`;
    
    return message;
  }

  async sendSignal(signal: SignalData): Promise<{ success: boolean; error?: string }> {
    if (!this.config || !this.config.enabled) {
      return { success: false, error: 'Telegram not enabled' };
    }

    // Validate signal data before sending to prevent zero values
    if (!signal.entryPrice || signal.entryPrice <= 0) {
      console.error(`[TelegramService] Rejecting signal with zero entry price for ${signal.symbol}: ${signal.entryPrice}`);
      return { success: false, error: 'Invalid signal: Zero entry price' };
    }
    
    if (!signal.stopLoss || signal.stopLoss <= 0) {
      console.error(`[TelegramService] Rejecting signal with zero stop loss for ${signal.symbol}: ${signal.stopLoss}`);
      return { success: false, error: 'Invalid signal: Zero stop loss' };
    }
    
    if (signal.targets && signal.targets.some(t => t <= 0 || isNaN(t))) {
      console.error(`[TelegramService] Rejecting signal with invalid targets for ${signal.symbol}: ${signal.targets}`);
      return { success: false, error: 'Invalid signal: Zero or invalid targets' };
    }

    // Check for duplicates
    const signalHash = this.generateSignalHash(signal);
    if (this.sentSignalsHash.has(signalHash)) {
      return { success: false, error: 'Duplicate signal prevented' };
    }

    try {
      const message = this.formatSignalMessage(signal);
      const result = await this.sendMessage(message);

      if (result.success) {
        // Add to sent signals to prevent duplicates
        this.sentSignalsHash.add(signalHash);
        
        // Keep only last 100 signal hashes to prevent memory buildup
        if (this.sentSignalsHash.size > 100) {
          const hashes = Array.from(this.sentSignalsHash);
          this.sentSignalsHash.clear();
          hashes.slice(-50).forEach(hash => this.sentSignalsHash.add(hash));
        }
      }

      return result;
    } catch (error) {
      console.error(`[TelegramService] Error formatting/sending signal for ${signal.symbol}:`, error);
      return { success: false, error: `Signal formatting failed: ${error.message}` };
    }
  }

  isEnabled(): boolean {
    return this.config?.enabled || false;
  }

  clearSentSignals(): void {
    this.sentSignalsHash.clear();
  }
}

export default TelegramService;
