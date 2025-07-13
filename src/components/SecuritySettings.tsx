import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, Shield, Key, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import SecurityService from "@/services/securityService";
import { toast } from "sonner";

interface ApiKeyData {
  binanceApiKey: string;
  binanceApiSecret: string;
  telegramApiKey: string;
}

const SecuritySettings = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewPassword, setIsNewPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyData>({
    binanceApiKey: "",
    binanceApiSecret: "",
    telegramApiKey: ""
  });
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, errors: [] as string[] });
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);

  useEffect(() => {
    // Check if any API keys exist
    const hasKeys = SecurityService.hasApiKey('binanceApiKey') || 
                   SecurityService.hasApiKey('binanceApiSecret') || 
                   SecurityService.hasApiKey('telegramApiKey');
    setIsNewPassword(!hasKeys);
  }, []);

  useEffect(() => {
    if (password) {
      const validation = SecurityService.validatePassword(password);
      setPasswordStrength(validation);
    }
  }, [password]);

  const handleUnlock = () => {
    if (isNewPassword) {
      // Setting up new password
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      
      if (!passwordStrength.isValid) {
        toast.error("Password does not meet security requirements");
        return;
      }
    }

    try {
      const passwordHash = SecurityService.hashPassword(password);
      
      if (isNewPassword) {
        // Create new session
        SecurityService.createSession(passwordHash);
        setIsUnlocked(true);
        toast.success("Security setup completed");
      } else {
        // Verify existing password by trying to decrypt a test key
        const testKey = SecurityService.getApiKey('binanceApiKey', password);
        
        // If we have stored keys but can't decrypt, password is wrong
        if (SecurityService.hasApiKey('binanceApiKey') && !testKey && password) {
          toast.error("Incorrect password");
          return;
        }
        
        SecurityService.createSession(passwordHash);
        setIsUnlocked(true);
        loadApiKeys();
        toast.success("Successfully unlocked");
      }
    } catch (error) {
      toast.error("Failed to unlock. Please try again.");
    }
  };

  const loadApiKeys = () => {
    if (!isUnlocked) return;
    
    setApiKeys({
      binanceApiKey: SecurityService.getApiKey('binanceApiKey', password),
      binanceApiSecret: SecurityService.getApiKey('binanceApiSecret', password),
      telegramApiKey: SecurityService.getApiKey('telegramApiKey', password)
    });
  };

  const saveApiKey = (keyName: keyof ApiKeyData, value: string) => {
    SecurityService.storeApiKey(keyName, value, password);
    toast.success(`${keyName} saved securely`);
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassword("");
    setConfirmPassword("");
    setApiKeys({
      binanceApiKey: "",
      binanceApiSecret: "",
      telegramApiKey: ""
    });
    SecurityService.clearSession();
    toast.success("Security settings locked");
  };

  const generatePassword = () => {
    const newPassword = SecurityService.generateSecurePassword(16);
    setPassword(newPassword);
    navigator.clipboard.writeText(newPassword);
    toast.success("Secure password generated and copied to clipboard");
  };

  const clearAllData = () => {
    SecurityService.clearAllApiKeys();
    SecurityService.clearSession();
    setIsUnlocked(false);
    setPassword("");
    setConfirmPassword("");
    setApiKeys({
      binanceApiKey: "",
      binanceApiSecret: "",
      telegramApiKey: ""
    });
    toast.success("All encrypted data cleared");
  };

  if (!isUnlocked) {
    return (
      <Card className="bg-trading-card border-gray-800 max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Security Protection</CardTitle>
          <CardDescription>
            {isNewPassword ? "Set up password protection for your API keys" : "Enter your password to access API keys"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isNewPassword && (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your API keys will be encrypted and stored securely. Choose a strong password you'll remember.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswordGenerator(true)}
                      className="p-1"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="p-1"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {passwordStrength.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">Password Strength</span>
                      <Badge variant={passwordStrength.isValid ? "default" : "secondary"}>
                        {passwordStrength.isValid ? "Strong" : "Weak"}
                      </Badge>
                    </div>
                    {!passwordStrength.isValid && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {passwordStrength.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            </>
          )}
          
          {!isNewPassword && (
            <div className="space-y-2">
              <Label htmlFor="unlockPassword">Password</Label>
              <div className="relative">
                <Input
                  id="unlockPassword"
                  type={showPasswords ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleUnlock} 
            className="w-full"
            disabled={!password || (isNewPassword && (!confirmPassword || !passwordStrength.isValid))}
          >
            {isNewPassword ? "Set Up Protection" : "Unlock"}
          </Button>

          {/* Password Generator Dialog */}
          <Dialog open={showPasswordGenerator} onOpenChange={setShowPasswordGenerator}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Secure Password</DialogTitle>
                <DialogDescription>
                  Generate a cryptographically secure password
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button onClick={generatePassword} className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Generate Password
                </Button>
                <p className="text-sm text-muted-foreground">
                  A secure 16-character password will be generated and copied to your clipboard.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-trading-card border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Secure API Configuration
            </CardTitle>
            <CardDescription>
              Your API keys are encrypted and protected
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handleLock}>
            <Lock className="h-4 w-4 mr-2" />
            Lock
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Binance API Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Binance API Keys</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="binanceApiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="binanceApiKey"
                    type={showPasswords ? "text" : "password"}
                    value={apiKeys.binanceApiKey}
                    onChange={(e) => setApiKeys({...apiKeys, binanceApiKey: e.target.value})}
                    placeholder="Enter Binance API Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => saveApiKey('binanceApiKey', apiKeys.binanceApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    disabled={!apiKeys.binanceApiKey}
                  >
                    Save
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="binanceApiSecret">API Secret</Label>
                <div className="relative">
                  <Input
                    id="binanceApiSecret"
                    type={showPasswords ? "text" : "password"}
                    value={apiKeys.binanceApiSecret}
                    onChange={(e) => setApiKeys({...apiKeys, binanceApiSecret: e.target.value})}
                    placeholder="Enter Binance API Secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => saveApiKey('binanceApiSecret', apiKeys.binanceApiSecret)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    disabled={!apiKeys.binanceApiSecret}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Telegram API Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Telegram API Key</h3>
            <div className="space-y-2">
              <Label htmlFor="telegramApiKey">Bot Token</Label>
              <div className="relative">
                <Input
                  id="telegramApiKey"
                  type={showPasswords ? "text" : "password"}
                  value={apiKeys.telegramApiKey}
                  onChange={(e) => setApiKeys({...apiKeys, telegramApiKey: e.target.value})}
                  placeholder="Enter Telegram Bot Token"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => saveApiKey('telegramApiKey', apiKeys.telegramApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                  disabled={!apiKeys.telegramApiKey}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPasswords ? "Hide" : "Show"} Values
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadApiKeys()}
              >
                Reload Keys
              </Button>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Clear All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Encrypted Data</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all stored API keys and reset the password protection. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={clearAllData}>
                    Clear All Data
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Security Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your API keys are encrypted using AES encryption and stored locally. Never share your password or API keys with anyone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;