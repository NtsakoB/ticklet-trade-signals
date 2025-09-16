#!/usr/bin/env bash
set -e
freqtrade trade --config freqtrade/config.sample.json --strategy GoldenHookX --dry-run "$@"