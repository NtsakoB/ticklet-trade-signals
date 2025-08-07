# Return Telegram and Supabase

Once dependency bugs are patched:

## Dependencies to Re-enable
- Use httpx==0.25.2
- Enable:
  - supabase==2.3.3
  - python-telegram-bot==20.7

## Routes to Re-enable
- `/telegram/send-signal`
- `/feedback/log` with Telegram hooks
- Supabase logging & chat history

## Code Changes Required
1. Uncomment telegram imports in `ticklet_ai/app/main.py`
2. Re-enable telegram router in main.py
3. Uncomment Supabase client imports and usage
4. Re-enable Supabase-related routes and functionality

## Current Status
**These integrations are temporarily disabled** - Core AI functionality (OpenAI, FastAPI, ML) remains fully operational.