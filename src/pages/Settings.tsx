import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { defaultSettings } from "@/services/mockData";
import { Settings as SettingsType } from "@/types";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const navigate = useNavigate();

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('tradingSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
  }, []);
  
  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('tradingSettings', JSON.stringify(settings));
    toast.success("Settings saved successfully");
    navigate("/");
  };

  // Test Binance connection
  const testConnection = async () => {
    if (!settings.apiKey || !settings.apiSecret) {
      toast.error("API Key and Secret are required");
      return;
    }

    toast.info("Testing connection to Binance...");
    
    // In a real app, we would verify the API key here
    // For demo purposes, just simulate a successful connection
    setTimeout(() => {
      toast.success("Connected to Binance successfully!");
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-trading-bg">
      <Header />
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <Card className="bg-trading-card border-gray-800">
            <CardHeader>
              <CardTitle>Binance API Configuration</CardTitle>
              <CardDescription>
                Connect to Binance for real-time market data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Binance API Key</Label>
                  <Input
                    id="apiKey"
                    placeholder="Enter your Binance API key"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">Binance API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    placeholder="Enter your Binance API secret"
                    value={settings.apiSecret}
                    onChange={(e) => setSettings({...settings, apiSecret: e.target.value})}
                    className="bg-secondary"
                  />
                </div>
              </div>
              <Button variant="secondary" onClick={testConnection}>Test Connection</Button>
              <div className="text-sm text-muted-foreground">
                <p>Note: Storing API keys in the browser is not recommended for production use.</p>
                <p>For this demo app, your keys are only stored in your browser's localStorage.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-trading-card border-gray-800">
            <CardHeader>
              <CardTitle>Telegram Integration</CardTitle>
              <CardDescription>
                Set up Telegram for signal notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={settings.telegramEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, telegramEnabled: checked})}
                />
                <Label>Enable Telegram notifications</Label>
              </div>
              
              {settings.telegramEnabled && (
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegramApiId">Telegram API ID</Label>
                    <Input
                      id="telegramApiId"
                      placeholder="Enter your Telegram API ID"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramApiHash">Telegram API Hash</Label>
                    <Input
                      id="telegramApiHash"
                      placeholder="Enter your Telegram API Hash"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      placeholder="Enter your Telegram Chat ID"
                      className="bg-secondary"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-trading-card border-gray-800">
            <CardHeader>
              <CardTitle>Trading Parameters</CardTitle>
              <CardDescription>
                Configure risk management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Maximum risk per trade: {settings.maxRiskPerTrade * 100}%</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.maxRiskPerTrade < 0.03 ? "Conservative" : 
                       settings.maxRiskPerTrade < 0.07 ? "Moderate" : "Aggressive"}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[settings.maxRiskPerTrade * 100]}
                    max={10}
                    min={1}
                    step={1}
                    onValueChange={(value) => setSettings({...settings, maxRiskPerTrade: value[0] / 100})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxOpenTrades">Maximum open trades</Label>
                  <Input
                    id="maxOpenTrades"
                    type="number"
                    value={settings.maxOpenTrades}
                    onChange={(e) => setSettings({...settings, maxOpenTrades: parseInt(e.target.value) || 0})}
                    min="1"
                    max="50"
                    className="bg-secondary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
