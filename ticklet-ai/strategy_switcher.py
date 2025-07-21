# Strategy Switcher - Dynamic Strategy Loading
"""
Dynamic strategy switcher for loading and switching between different trading strategies.
Enables runtime strategy selection and configuration management.
"""

import logging
from typing import Dict, Any, Optional, Type
from strategies.ticklet_alpha import TickletAlpha
from strategies.bull_strategy import BullStrategy
from strategies.jam_bot_strategy import JamBotStrategy
from strategies.ai_predictor_strategy import AIPredictorStrategy
from strategies.condition_strategy import ConditionStrategy

# Initialize logger for diagnostic and operational tracing
logger = logging.getLogger(__name__)

# Define constants for strategy names to prevent hardcoded strings
TICKLET_ALPHA = "ticklet_alpha"
BULL = "bull"
JAM_BOT = "jam_bot"
AI = "ai"
CONDITION = "condition"

class StrategyRegistry:
    """Registry for managing available trading strategies"""
    
    def __init__(self):
        self._strategies = {
            TICKLET_ALPHA: TickletAlpha,
            BULL: BullStrategy,
            JAM_BOT: JamBotStrategy,
            AI: AIPredictorStrategy,
            CONDITION: ConditionStrategy
        }
        logger.info(f"Strategy registry initialized with {len(self._strategies)} strategies")
    
    def get_available_strategies(self) -> Dict[str, str]:
        """Get list of available strategies with descriptions"""
        strategy_info = {}
        for name, strategy_class in self._strategies.items():
            try:
                temp_instance = strategy_class()
                info = temp_instance.get_strategy_info()
                strategy_info[name] = info.get('description', f'{name} strategy')
            except Exception as e:
                logger.warning(f"Could not get info for strategy {name}: {e}")
                strategy_info[name] = f'{name} strategy (info unavailable)'
        
        return strategy_info
    
    def register_strategy(self, name: str, strategy_class: Type) -> bool:
        """Register a new strategy"""
        try:
            # Validate strategy class has required methods
            required_methods = ['generate_signals', 'get_strategy_info']
            for method in required_methods:
                if not hasattr(strategy_class, method):
                    raise ValueError(f"Strategy class must implement {method} method")
            
            self._strategies[name] = strategy_class
            logger.info(f"Successfully registered strategy: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to register strategy {name}: {e}")
            return False
    
    def unregister_strategy(self, name: str) -> bool:
        """Unregister a strategy"""
        if name in self._strategies:
            del self._strategies[name]
            logger.info(f"Successfully unregistered strategy: {name}")
            return True
        logger.warning(f"Strategy {name} not found for unregistration")
        return False
    
    def get_strategy_class(self, name: str) -> Optional[Type]:
        """Get strategy class by name"""
        return self._strategies.get(name)

# Global strategy registry instance
_strategy_registry = StrategyRegistry()

def get_selected_strategy(name: str, config: Optional[Dict] = None) -> object:
    """
    Retrieve the selected trading strategy class based on user or system input.

    This function serves as the central entry point for loading strategy modules
    dynamically, based on the strategy name selected via UI dropdown, API request,
    or internal logic.

    :param name: The lowercase string name representing the strategy
    :param config: Optional configuration dictionary for strategy initialization
    :return: An instance of the corresponding strategy class
    :raises ValueError: If the strategy name is invalid or unsupported
    :raises ImportError: If the strategy class fails to load (optional future-proofing)
    """
    strategy_class = _strategy_registry.get_strategy_class(name)
    
    if strategy_class is None:
        available = list(_strategy_registry.get_available_strategies().keys())
        logger.error(f"Unknown strategy name: '{name}'. Available strategies are: {', '.join(available)}")
        raise ValueError(f"Unknown strategy name: '{name}'. Available strategies are: {', '.join(available)}")
    
    try:
        strategy_instance = strategy_class(config=config)
        logger.info(f"Successfully instantiated strategy: '{name}'")
        return strategy_instance
    except Exception as e:
        logger.error(f"Failed to create strategy instance '{name}': {e}")
        raise

def get_strategy_info(name: str) -> Dict[str, Any]:
    """
    Get detailed information about a strategy.
    
    Args:
        name: Strategy name
    
    Returns:
        Dictionary containing strategy information
    """
    try:
        strategy = get_selected_strategy(name)
        return strategy.get_strategy_info()
    except Exception as e:
        logger.error(f"Failed to get strategy info for {name}: {e}")
        return {
            'name': name,
            'error': str(e),
            'available': False
        }

def list_available_strategies() -> Dict[str, str]:
    """Get list of all available strategies with descriptions"""
    return _strategy_registry.get_available_strategies()

def register_custom_strategy(name: str, strategy_class: Type) -> bool:
    """
    Register a custom strategy.
    
    Args:
        name: Strategy name
        strategy_class: Strategy class implementing required interface
    
    Returns:
        True if successful, False otherwise
    """
    return _strategy_registry.register_strategy(name, strategy_class)

def validate_strategy_config(name: str, config: Dict) -> Dict[str, Any]:
    """
    Validate strategy configuration.
    
    Args:
        name: Strategy name
        config: Configuration dictionary
    
    Returns:
        Validation result with errors/warnings
    """
    result = {
        'valid': True,
        'errors': [],
        'warnings': []
    }
    
    try:
        # Try to create strategy with config
        strategy = get_selected_strategy(name, config)
        
        # Basic validation checks
        required_fields = ['timeframe', 'risk_per_trade', 'max_leverage']
        for field in required_fields:
            if field not in config:
                result['warnings'].append(f"Missing recommended field: {field}")
        
        # Validate numeric ranges
        if 'risk_per_trade' in config:
            risk = config['risk_per_trade']
            if not isinstance(risk, (int, float)) or risk <= 0 or risk > 1:
                result['errors'].append("risk_per_trade must be between 0 and 1")
        
        if 'max_leverage' in config:
            leverage = config['max_leverage']
            if not isinstance(leverage, (int, float)) or leverage < 1 or leverage > 100:
                result['errors'].append("max_leverage must be between 1 and 100")
        
        result['valid'] = len(result['errors']) == 0
        
    except Exception as e:
        result['valid'] = False
        result['errors'].append(f"Strategy creation failed: {str(e)}")
    
    return result

def create_strategy_from_api(strategy_config: Dict) -> Any:
    """
    Create strategy instance from API configuration.
    
    Args:
        strategy_config: Dictionary containing strategy name and config
    
    Returns:
        Strategy instance
    """
    if 'name' not in strategy_config:
        raise ValueError("Strategy configuration must include 'name' field")
    
    name = strategy_config['name']
    config = strategy_config.get('config', {})
    
    # Validate configuration
    validation = validate_strategy_config(name, config)
    if not validation['valid']:
        raise ValueError(f"Invalid configuration: {validation['errors']}")
    
    return get_selected_strategy(name, config)

# Strategy metadata for frontend integration
STRATEGY_METADATA = {
    "ticklet_alpha": {
        "display_name": "Ticklet Alpha",
        "category": "balanced",
        "description": "Main backend strategy with balanced risk/reward",
        "recommended_timeframes": ["5m", "15m"],
        "market_conditions": ["trending", "ranging"],
        "risk_level": "medium"
    },
    "bull": {
        "display_name": "Bull Market",
        "category": "trending",
        "description": "Optimized for strong uptrend conditions",
        "recommended_timeframes": ["5m", "15m", "1h"],
        "market_conditions": ["trending_up"],
        "risk_level": "medium-high"
    },
    "jam_bot": {
        "display_name": "JAM Bot",
        "category": "scalping",
        "description": "High-frequency scalping for quick profits",
        "recommended_timeframes": ["1m", "3m"],
        "market_conditions": ["volatile", "ranging"],
        "risk_level": "high"
    },
    "ai": {
        "display_name": "AI Predictor",
        "category": "ai_enhanced",
        "description": "Machine learning enhanced predictions",
        "recommended_timeframes": ["5m", "15m"],
        "market_conditions": ["all"],
        "risk_level": "medium"
    },
    "condition": {
        "display_name": "Adaptive Condition",
        "category": "adaptive",
        "description": "Adapts to different market conditions automatically",
        "recommended_timeframes": ["5m", "15m", "1h"],
        "market_conditions": ["all"],
        "risk_level": "medium"
    }
}

def get_strategy_metadata(name: str = None) -> Dict:
    """Get strategy metadata for frontend display"""
    if name:
        return STRATEGY_METADATA.get(name, {})
    return STRATEGY_METADATA

# Export main functions
__all__ = [
    'get_selected_strategy',
    'get_strategy_info', 
    'list_available_strategies',
    'register_custom_strategy',
    'validate_strategy_config',
    'create_strategy_from_api',
    'get_strategy_metadata'
]