# Option 2 – Reintroducing Supabase (When Proxy Bug is Patched)

Once Supabase and/or Gotrue fix the legacy `proxy` argument bug, use this requirements.txt:

```text
fastapi==0.111.0
uvicorn[standard]==0.30.0
python-dotenv==1.0.1
httpx==0.25.2
openai==1.30.1
python-telegram-bot==20.7
pyjwt==2.8.0
pydantic==2.7.1
supabase==2.3.3
websockets==12.0
aiofiles==23.2.1
xgboost==2.0.3
scikit-learn==1.4.2
pandas==2.2.2
joblib==1.4.2
redis==5.0.3
requests==2.31.0
```

## Notes:
- This version upgrades httpx to 0.25.2 and python-telegram-bot to 20.7
- Use this only after confirming Supabase/Gotrue compatibility with modern httpx versions
- Until then, use the conflict-free stack with httpx==0.24.1 and Supabase commented out

## Current Status:
**This option is not active now** - stored for future use when Supabase proxy bug is resolved.