# Option 2 – Future Compatibility Plan (Supabase Proxy Conflict)

If Supabase/Gotrue eventually supports modern httpx/httpcore versions (0.25+), you may use this option instead:

## Option 2 Requirements
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
- This version will fail if Supabase/Gotrue still uses the deprecated `proxy=` argument internally.
- Use this only after confirming Supabase/Gotrue compatibility or after removing their usage from the project.
- You may also consider replacing Supabase with a custom backend or database connector in the future.

## Current Status:
**Option 2 is not active now**, but safely stored as a README file for future compatibility when Supabase/Gotrue is patched.