#!/usr/bin/env bash
set -e
freqtrade backtesting --config freqtrade/config.sample.json --strategy GoldenHookX --timeframe 1h "$@"