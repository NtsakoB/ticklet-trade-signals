// Simple encryption service for storing sensitive data
class SecurityService {
  private static ENCRYPTION_KEY = 'trading_app_key_2024';
  private static STORAGE_PREFIX = 'encrypted_';

  // Simple XOR encryption (for demo purposes - use proper encryption in production)
  private static encrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(char ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  private static decrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const char = decoded.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(char ^ keyChar);
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  // Store encrypted API key
  static storeApiKey(keyName: string, value: string, password: string): void {
    const combinedKey = this.ENCRYPTION_KEY + password;
    const encrypted = this.encrypt(value, combinedKey);
    localStorage.setItem(this.STORAGE_PREFIX + keyName, encrypted);
  }

  // Retrieve and decrypt API key
  static getApiKey(keyName: string, password: string): string {
    const encrypted = localStorage.getItem(this.STORAGE_PREFIX + keyName);
    if (!encrypted) return '';
    
    const combinedKey = this.ENCRYPTION_KEY + password;
    return this.decrypt(encrypted, combinedKey);
  }

  // Check if API key exists
  static hasApiKey(keyName: string): boolean {
    return localStorage.getItem(this.STORAGE_PREFIX + keyName) !== null;
  }

  // Remove API key
  static removeApiKey(keyName: string): void {
    localStorage.removeItem(this.STORAGE_PREFIX + keyName);
  }

  // Clear all encrypted data
  static clearAllApiKeys(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate secure password
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Hash password for session verification
  static hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Session management
  private static SESSION_KEY = 'trading_session';
  
  static createSession(passwordHash: string): void {
    const session = {
      hash: passwordHash,
      timestamp: Date.now(),
      expires: Date.now() + (60 * 60 * 1000) // 1 hour
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  static isSessionValid(passwordHash: string): boolean {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      return session.hash === passwordHash && session.expires > Date.now();
    } catch {
      return false;
    }
  }

  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  static extendSession(): void {
    const sessionData = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        session.expires = Date.now() + (60 * 60 * 1000); // Extend by 1 hour
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (error) {
        console.error('Failed to extend session:', error);
      }
    }
  }
}

export default SecurityService;