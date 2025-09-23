"""
Live Signal Generator - Converts real Binance market data into trading signals
with proper persistence and business logic
"""
import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import asyncio
import aiohttp
from ticklet_ai.services.supabase_client import get_client
from ticklet_ai.services.universe import explicit_env_symbols

logger = logging.getLogger(__name__)

class LiveSignalGenerator:
    def __init__(self):
        self.binance_base = "https://api.binance.com/api/v3"
        self.supabase = get_client()
        self.active_signals = {}  # Track active signals per symbol
        
    async def fetch_market_data(self, symbols: List[str]) -> Dict[str, Any]:
        """Fetch live market data from Binance API"""
        try:
            async with aiohttp.ClientSession() as session:
                # Get 24hr ticker data for all symbols
                async with session.get(f"{self.binance_base}/ticker/24hr") as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch ticker data: {response.status}")
                        return {}
                    
                    all_tickers = await response.json()
                    
                # Filter to requested symbols
                symbol_data = {}
                for ticker in all_tickers:
                    if ticker['symbol'] in symbols:
                        symbol_data[ticker['symbol']] = ticker
                        
                # Get klines data for technical analysis
                for symbol in symbols:
                    if symbol in symbol_data:
                        try:
                            async with session.get(
                                f"{self.binance_base}/klines",
                                params={
                                    'symbol': symbol,
                                    'interval': '1h',
                                    'limit': 100
                                }
                            ) as kline_resp:
                                if kline_resp.status == 200:
                                    klines = await kline_resp.json()
                                    symbol_data[symbol]['klines'] = klines
                        except Exception as e:
                            logger.warning(f"Failed to fetch klines for {symbol}: {e}")
                            
                return symbol_data
                
        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return {}
    
    def calculate_technical_indicators(self, klines: List) -> Dict[str, float]:
        """Calculate technical indicators from klines data"""
        if not klines or len(klines) < 20:
            return {}
            
        closes = [float(k[4]) for k in klines]  # Close prices
        highs = [float(k[2]) for k in klines]   # High prices
        lows = [float(k[3]) for k in klines]    # Low prices
        volumes = [float(k[5]) for k in klines] # Volumes
        
        # Simple moving averages
        sma_20 = sum(closes[-20:]) / 20
        sma_50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else sma_20
        
        # RSI calculation (simplified)
        gains = []
        losses = []
        for i in range(1, min(15, len(closes))):
            change = closes[i] - closes[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains) / len(gains) if gains else 0
        avg_loss = sum(losses) / len(losses) if losses else 1
        rs = avg_gain / avg_loss if avg_loss != 0 else 0
        rsi = 100 - (100 / (1 + rs))
        
        # Volatility (ATR approximation)
        true_ranges = []
        for i in range(1, min(20, len(klines))):
            tr = max(
                highs[i] - lows[i],
                abs(highs[i] - closes[i-1]),
                abs(lows[i] - closes[i-1])
            )
            true_ranges.append(tr)
        
        atr = sum(true_ranges) / len(true_ranges) if true_ranges else 0
        
        return {
            'sma_20': sma_20,
            'sma_50': sma_50,
            'rsi': rsi,
            'atr': atr,
            'current_price': closes[-1],
            'volume': volumes[-1]
        }
    
    def generate_signal_from_data(self, symbol: str, ticker_data: Dict, indicators: Dict) -> Optional[Dict]:
        """Generate trading signal based on market data and indicators"""
        try:
            current_price = float(ticker_data['lastPrice'])
            price_change_pct = float(ticker_data['priceChangePercent'])
            volume = float(ticker_data['volume']) * current_price
            
            # Skip if volume too low (below $1M)
            if volume < 1000000:
                return None
            
            # Check if we already have an active signal for this symbol
            if symbol in self.active_signals:
                existing_signal = self.active_signals[symbol]
                # Keep existing signal if still valid
                if existing_signal.get('status') == 'active':
                    return None
            
            # Signal generation logic
            signal_type = None
            confidence = 0
            entry_price = current_price
            
            # RSI-based signals
            rsi = indicators.get('rsi', 50)
            sma_20 = indicators.get('sma_20', current_price)
            sma_50 = indicators.get('sma_50', current_price)
            atr = indicators.get('atr', current_price * 0.02)
            
            # BUY conditions
            if (rsi < 35 and current_price > sma_20 and 
                price_change_pct < -2 and volume > 5000000):
                signal_type = 'BUY'
                confidence = min(0.85, 0.4 + (35 - rsi) * 0.01 + abs(price_change_pct) * 0.02)
                
            # SELL conditions  
            elif (rsi > 70 and current_price < sma_20 and 
                  price_change_pct > 3 and volume > 5000000):
                signal_type = 'SELL'
                confidence = min(0.85, 0.4 + (rsi - 70) * 0.01 + price_change_pct * 0.02)
                
            # Trend following signals
            elif (current_price > sma_20 > sma_50 and 
                  price_change_pct > 1.5 and volume > 10000000):
                signal_type = 'BUY'
                confidence = min(0.75, 0.5 + price_change_pct * 0.02)
                
            elif (current_price < sma_20 < sma_50 and 
                  price_change_pct < -1.5 and volume > 10000000):
                signal_type = 'SELL'
                confidence = min(0.75, 0.5 + abs(price_change_pct) * 0.02)
            
            if not signal_type or confidence < 0.3:
                return None
            
            # Calculate targets and stop loss
            risk_multiplier = 2 if signal_type == 'BUY' else -2
            reward_multiplier = 1 if signal_type == 'BUY' else -1
            
            stop_loss = entry_price - (risk_multiplier * atr)
            stop_price = stop_loss
            
            targets = {
                'tp1': entry_price + (reward_multiplier * atr * 1.5),
                'tp2': entry_price + (reward_multiplier * atr * 3),
                'tp3': entry_price + (reward_multiplier * atr * 5)
            }
            
            # Anomaly detection (high volatility)
            anomaly = abs(price_change_pct) > 5 or volume > 50000000
            
            signal = {
                'symbol': symbol,
                'side': signal_type,
                'entry_price': entry_price,
                'stop_price': stop_price,
                'stop_loss': stop_loss,
                'targets': targets,
                'confidence': confidence,
                'strategy': 'LiveSignalGenerator',
                'status': 'active',
                'anomaly': anomaly * 1.0,  # Convert to float
                'volatility_pct': abs(price_change_pct),
                'meta': {
                    'rsi': rsi,
                    'volume': volume,
                    'price_change_pct': price_change_pct,
                    'atr': atr,
                    'sma_20': sma_20,
                    'sma_50': sma_50,
                    'generation_time': datetime.now().isoformat()
                },
                'ai_summary': f"{signal_type} signal for {symbol} at ${entry_price:.4f} with {confidence*100:.1f}% confidence. RSI: {rsi:.1f}, Volume: ${volume/1000000:.1f}M"
            }
            
            return signal
            
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {e}")
            return None
    
    def get_target_symbols(self) -> List[str]:
        """Get list of symbols to monitor"""
        # Check if explicit symbols are set
        explicit = explicit_env_symbols()
        if explicit:
            return explicit
            
        # Default high-volume USDT pairs
        return [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
            'XRPUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT',
            'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'FILUSDT'
        ]
    
    async def store_signal_to_database(self, signal: Dict) -> bool:
        """Store signal to Supabase database"""
        try:
            if not self.supabase:
                logger.warning("Supabase client not available")
                return False
                
            # Insert signal into database
            result = self.supabase.table("signals").insert(signal).execute()
            
            if result.data:
                # Update local cache
                self.active_signals[signal['symbol']] = signal
                logger.info(f"Stored signal for {signal['symbol']}: {signal['side']} at ${signal['entry_price']}")
                return True
            else:
                logger.error(f"Failed to store signal: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing signal to database: {e}")
            return False
    
    async def cleanup_old_signals(self):
        """Mark old signals as expired and update their status"""
        try:
            if not self.supabase:
                return
                
            # Mark signals older than 4 hours as missed
            result = self.supabase.rpc('classify_missed_signals', {'p_minutes': 240}).execute()
            logger.info(f"Cleaned up {result.data} expired signals")
            
        except Exception as e:
            logger.error(f"Error cleaning up old signals: {e}")
    
    async def generate_live_signals(self) -> List[Dict]:
        """Main method to generate live trading signals"""
        try:
            # Get target symbols
            symbols = self.get_target_symbols()
            logger.info(f"Generating signals for {len(symbols)} symbols")
            
            # Fetch live market data
            market_data = await self.fetch_market_data(symbols)
            
            if not market_data:
                logger.warning("No market data received")
                return []
            
            # Generate signals
            new_signals = []
            
            for symbol, ticker_data in market_data.items():
                try:
                    # Calculate technical indicators
                    klines = ticker_data.get('klines', [])
                    indicators = self.calculate_technical_indicators(klines)
                    
                    # Generate signal
                    signal = self.generate_signal_from_data(symbol, ticker_data, indicators)
                    
                    if signal:
                        # Store to database
                        if await self.store_signal_to_database(signal):
                            new_signals.append(signal)
                            
                except Exception as e:
                    logger.error(f"Error processing {symbol}: {e}")
                    continue
            
            # Clean up old signals
            await self.cleanup_old_signals()
            
            logger.info(f"Generated {len(new_signals)} new signals")
            return new_signals
            
        except Exception as e:
            logger.error(f"Error in generate_live_signals: {e}")
            return []

# Global instance
live_signal_generator = LiveSignalGenerator()

async def run_signal_generation():
    """Run signal generation process"""
    return await live_signal_generator.generate_live_signals()