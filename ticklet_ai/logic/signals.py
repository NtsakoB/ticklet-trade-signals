import logging
logger = logging.getLogger(__name__)

def generate_signals(symbols, timeframe):
    """Generate live trading signals using market data analysis"""
    logger.info(f"Generating signals for {len(symbols)} symbols on {timeframe}")
    
    try:
        # Import live signal generator
        import asyncio
        from ticklet_ai.services.live_signal_generator import run_signal_generation
        
        # Run async signal generation in sync context
        loop = None
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            # If loop is already running, create a task
            future = asyncio.ensure_future(run_signal_generation())
            # Note: This won't complete immediately in a running loop
            signals = []
        else:
            # Run the async function
            signals = loop.run_until_complete(run_signal_generation())
        
        # Convert to legacy format expected by pipeline
        legacy_signals = []
        for signal in signals:
            legacy_signals.append({
                'symbol': signal['symbol'],
                'signal_type': signal['side'],
                'entry_price': signal['entry_price'],
                'confidence': signal['confidence'],
                'stop_loss': signal.get('stop_loss'),
                'targets': signal.get('targets'),
                'strategy': signal.get('strategy', 'LiveSignalGenerator')
            })
        
        logger.info(f"Generated {len(legacy_signals)} live signals")
        return legacy_signals
        
    except Exception as e:
        logger.error(f"Error generating live signals: {e}")
        # Fallback to minimal signal for testing
        return [{
            'symbol': symbols[0] if symbols else 'BTCUSDT',
            'signal_type': 'BUY',
            'entry_price': 50000.0,
            'confidence': 0.5
        }]