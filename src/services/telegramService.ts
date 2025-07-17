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
    
    let message = `${typeEmoji} <b>${signal.type.toUpperCase()} Setup</b> | #${signal.symbol}\n`;
    message += `${confidenceEmoji} <b>Confidence:</b> ${(signal.confidence * 100).toFixed(2)}%\n`;
    message += `📊 <b>Strategy:</b> ${signal.strategyName}\n`;
    
    if (signal.entryRange) {
      message += `🎯 <b>Entry:</b> ${signal.entryRange.min.toFixed(4)} → ${signal.entryRange.max.toFixed(4)}\n`;
    } else {
      message += `🎯 <b>Entry:</b> ${signal.entryPrice.toFixed(4)}\n`;
    }
    
    if (signal.targets && signal.targets.length > 0) {
      const targetStr = signal.targets.map((t, i) => `🎯 ${t.toFixed(4)}`).join(', ');
      message += `<b>Targets:</b> ${targetStr}\n`;
    } else {
      message += `🎯 <b>Target:</b> ${signal.takeProfit.toFixed(4)}\n`;
    }
    
    message += `🛑 <b>Stop:</b> ${signal.stopLoss.toFixed(4)}\n`;
    
    if (signal.leverage) {
      message += `⚡ <b>Leverage:</b> ${signal.leverage}x\n`;
    }
    
    message += `🕒 <b>Time:</b> ${new Date(signal.timestamp).toLocaleString()}`;
    
    return message;
  }

  async sendSignal(signal: SignalData): Promise<{ success: boolean; error?: string }> {
    if (!this.config || !this.config.enabled) {
      return { success: false, error: 'Telegram not enabled' };
    }

    // Check for duplicates
    const signalHash = this.generateSignalHash(signal);
    if (this.sentSignalsHash.has(signalHash)) {
      return { success: false, error: 'Duplicate signal prevented' };
    }

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
  }

  isEnabled(): boolean {
    return this.config?.enabled || false;
  }

  clearSentSignals(): void {
    this.sentSignalsHash.clear();
  }
}

export default TelegramService;
