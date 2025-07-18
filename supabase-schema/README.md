# Ticklet Trading Bot - Supabase Database Schema

This folder contains the complete database schema and management files for the Ticklet trading bot. This is a **non-conflicting** setup that works alongside your existing Lovable-Supabase integration.

## 📁 Folder Structure

```
supabase-schema/
├── schema.sql          # Complete database tables and structure
├── policies.sql        # Row-Level Security (RLS) policies
├── functions/          # PostgreSQL stored procedures
│   ├── credentials_manager.sql  # Secure credential storage
│   ├── trading_analytics.sql    # Trading performance analytics
│   └── ai_learning.sql         # AI learning and optimization
├── seeds/              # Sample data for development
│   └── sample_data.sql
├── .env.example        # Environment configuration template
└── README.md          # This file
```

## 🗄️ Database Tables

### Core Tables
- **`user_profiles`** - Extended user information beyond auth.users
- **`user_credentials`** - Encrypted API keys and secrets storage
- **`trading_signals`** - AI-generated trading recommendations
- **`bot_configurations`** - User trading bot settings
- **`trades`** - Trading history and open positions
- **`backtest_results`** - Strategy backtesting performance
- **`ai_learning_data`** - AI model learning and improvement
- **`telegram_interactions`** - Telegram bot communication logs

### Key Features
- ✅ **Encrypted credential storage** using PostgreSQL PGP encryption
- ✅ **Row-Level Security** for complete user data isolation
- ✅ **AI learning pipeline** for continuous strategy improvement
- ✅ **Comprehensive analytics** for trading performance tracking
- ✅ **Multi-mode trading** support (paper/live trading)
- ✅ **Strategy management** with backtesting capabilities

## 🔧 Setup Instructions

### 1. Initial Schema Setup
Run the SQL files in this order:

```sql
-- 1. Create tables and structure
\i supabase-schema/schema.sql

-- 2. Apply security policies
\i supabase-schema/policies.sql

-- 3. Install functions
\i supabase-schema/functions/credentials_manager.sql
\i supabase-schema/functions/trading_analytics.sql
\i supabase-schema/functions/ai_learning.sql

-- 4. (Optional) Load sample data for development
\i supabase-schema/seeds/sample_data.sql
```

### 2. Environment Configuration
```bash
# Copy environment template
cp supabase-schema/.env.example .env

# Edit with your actual values
nano .env
```

### 3. Configure Supabase Secrets
Set up secure API key storage in Supabase:

```sql
-- Store user credentials securely
SELECT public.store_user_credential(
    auth.uid(),
    'binance',
    'api_key',
    'your-binance-api-key'
);

SELECT public.store_user_credential(
    auth.uid(),
    'binance',
    'secret_key',
    'your-binance-secret-key'
);
```

## 🔐 Security Features

### Credential Encryption
All API keys and sensitive data are encrypted using PostgreSQL's PGP encryption:
- Automatic encryption on storage
- Secure decryption for authorized access only
- User-specific encryption keys
- Credential versioning and rotation support

### Row-Level Security
Complete data isolation between users:
- Users can only access their own data
- Service role access for background processing
- Granular permissions per table and operation
- Protected against data leaks

## 📊 Analytics & Learning

### Available Analytics Functions
```sql
-- Get trading performance statistics
SELECT * FROM public.calculate_trading_stats(auth.uid(), '2024-01-01', '2024-12-31');

-- Analyze strategy performance
SELECT * FROM public.get_strategy_performance(auth.uid(), 30);

-- Calculate maximum drawdown
SELECT public.calculate_max_drawdown(auth.uid());

-- Get AI performance metrics
SELECT * FROM public.calculate_ai_performance(auth.uid());

-- Get AI insights and recommendations
SELECT * FROM public.get_ai_insights(auth.uid());
```

### AI Learning Pipeline
The AI learning system continuously improves by:
1. Recording market data at signal generation
2. Tracking actual trade outcomes
3. Calculating prediction accuracy
4. Identifying successful/failed patterns
5. Optimizing strategy parameters
6. Providing actionable insights

## 🚀 Integration with Lovable

### Non-Conflicting Design
- ✅ Does not modify existing `src/integrations/supabase/` files
- ✅ Works alongside current Lovable-Supabase integration
- ✅ Maintains existing functionality completely
- ✅ Uses separate schema management approach

### API Integration Points
```typescript
// Example: Store user API keys securely
await supabase.rpc('store_user_credential', {
  p_user_id: user.id,
  p_provider: 'binance',
  p_credential_type: 'api_key',
  p_credential_value: apiKey
});

// Example: Get trading analytics
const { data } = await supabase.rpc('calculate_trading_stats', {
  p_user_id: user.id,
  p_start_date: '2024-01-01',
  p_end_date: '2024-12-31'
});
```

## 🔄 Migration Strategy

### From Current Local Storage
1. Export existing trade data from localStorage
2. Transform to database format
3. Insert using proper user authentication
4. Verify data integrity
5. Update frontend to use database queries

### Credential Migration
```sql
-- Migrate existing API keys to secure storage
SELECT public.store_user_credential(
    auth.uid(),
    'binance',
    'api_key',
    'existing-api-key-from-localstorage'
);
```

## 📝 Development Notes

### Testing with Sample Data
The `seeds/sample_data.sql` file provides realistic test data for development:
- Sample trading signals with various confidence levels
- Completed and open trades
- Backtest results with performance metrics
- AI learning data showing prediction accuracy
- Telegram interaction logs

### Best Practices
1. **Always use functions** for credential operations
2. **Test RLS policies** thoroughly before production
3. **Monitor AI learning accuracy** and adjust thresholds
4. **Regular backup** of trading data and configurations
5. **Use paper trading** for testing new strategies

## 🛠️ Maintenance

### Regular Tasks
- Monitor database performance and optimize queries
- Review and update AI learning thresholds
- Backup trading data and configurations
- Update credential encryption keys periodically
- Analyze trading performance and adjust strategies

### Monitoring Queries
```sql
-- Check database health
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- Monitor AI learning progress
SELECT strategy, COUNT(*), AVG(prediction_accuracy)
FROM public.ai_learning_data
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY strategy;
```

## 🆘 Support

For questions or issues:
1. Check existing database logs for errors
2. Verify RLS policies are correctly applied
3. Ensure proper user authentication
4. Review credential encryption/decryption
5. Test with sample data first

This schema provides a robust, secure, and scalable foundation for your Ticklet trading bot while maintaining full compatibility with your existing Lovable setup.