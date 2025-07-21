class TakeProfitFormatter:
    """
    Formatter for displaying Take Profit (TP) levels for SELL signals in descending order.
    Ensures visual correctness for TP levels without altering trading logic or order structure.
    """

    @staticmethod
    def format_take_profit_levels(signal_type: str, tp_levels: list) -> list:
        """
        Format TP levels for SELL signals to display in descending order.

        :param signal_type: 'SELL' or 'BUY'.
        :param tp_levels: List of TP levels (floats).
                          Example for SELL: [TP1, TP2, TP3] with unsorted prices.
                          Example for BUY: [TP1, TP2, TP3] with unsorted prices.
        :return: List of formatted TP levels.
        """
        if signal_type.upper() == 'SELL':
            # Sort TP levels in descending order for SELL signals
            return sorted(tp_levels, reverse=True)
        elif signal_type.upper() == 'BUY':
            # Sort TP levels in ascending order for BUY signals
            return sorted(tp_levels)
        else:
            raise ValueError(f"Invalid signal type: {signal_type}. Must be 'SELL' or 'BUY'.")

    @staticmethod
    def format_signal_output(signal: dict) -> dict:
        """
        Apply TP level formatting to a signal dictionary.

        :param signal: Signal dictionary containing 'type' and 'tp_levels'.
                       Example: {'type': 'SELL', 'tp_levels': [TP1, TP2, TP3]}
        :return: Signal dictionary with formatted TP levels.
        """
        signal_type = signal.get('type', '').upper()
        tp_levels = signal.get('tp_levels', [])

        if not tp_levels or signal_type not in ['SELL', 'BUY']:
            return signal  # Return unmodified signal if no TP levels or invalid type

        # Format TP levels based on signal type
        signal['tp_levels'] = TakeProfitFormatter.format_take_profit_levels(signal_type, tp_levels)
        return signal


class SignalGenerator:
    """
    Backend module for generating trading signals.
    """

    def generate_signal(self, signal_type: str, tp_levels: list) -> dict:
        """
        Generate a trading signal with formatted TP levels.

        :param signal_type: 'SELL' or 'BUY'.
        :param tp_levels: List of TP levels (unsorted).
                          Example: [TP1, TP2, TP3]
        :return: Signal dictionary.
        """
        signal = {
            'type': signal_type.upper(),
            'tp_levels': tp_levels
        }

        # Format TP levels for visual correctness
        return TakeProfitFormatter.format_signal_output(signal)


class TelegramFormatter:
    """
    Formatter for sending trading signals via Telegram.
    """

    def format_telegram_message(self, signal: dict) -> str:
        """
        Format trading signal into a Telegram message.

        :param signal: Signal dictionary containing 'type' and 'tp_levels'.
        :return: Formatted Telegram message string.
        """
        signal = TakeProfitFormatter.format_signal_output(signal)

        tp_levels = signal.get('tp_levels', [])
        signal_type = signal.get('type', 'UNKNOWN')

        # Generate TP level display
        tp_display = "\n".join([f"T{i+1}: ${tp:.2f}" for i, tp in enumerate(tp_levels)])
        return f"Signal Type: {signal_type}\nTake Profit Levels:\n{tp_display}"


class UISignalDisplay:
    """
    UI module for displaying trading signals.
    """

    def render_signal(self, signal: dict) -> str:
        """
        Render trading signal for UI display.

        :param signal: Signal dictionary containing 'type' and 'tp_levels'.
        :return: Formatted signal string for UI.
        """
        signal = TakeProfitFormatter.format_signal_output(signal)

        tp_levels = signal.get('tp_levels', [])
        signal_type = signal.get('type', 'UNKNOWN')

        # Generate TP level display
        tp_display = ", ".join([f"T{i+1}: ${tp:.2f}" for i, tp in enumerate(tp_levels)])
        return f"Signal Type: {signal_type}, Take Profit Levels: {tp_display}"