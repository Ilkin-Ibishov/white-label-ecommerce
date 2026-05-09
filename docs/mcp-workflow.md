# MCP-Enhanced Development Workflow

## Available MCP Tools

### Supabase MCP
- **execute_sql**: Run SQL directly on database
- **apply_migration**: Apply migrations with tracking
- **list_tables**: View schema structure
- **get_advisors**: Check security/performance recommendations

### GitHub MCP (via CLI fallback)
- **project updates**: Automated field updates
- **pr creation**: Pull request management
- **status checks**: Build/deployment monitoring

## Enhanced Workflow

### 1. Schema Development (Beta Agent Example)
```
OLD: Write SQL → Save file → Manual Supabase CLI → Verify
NEW: Write SQL → MCP apply_migration → Instant verification
```

### 2. Security Review (SEC Gatekeeper)
```
OLD: Read files → Manual RLS check
NEW: MCP get_advisors (security) → Auto-flag issues
```

### 3. Data Seeding (Beta Agent)
```
OLD: Write script → Run locally → Hope it works
NEW: MCP execute_sql (batch inserts) → Live monitoring
```

## Migration Status

| Sprint | Migration | Status | Method |
|--------|-----------|--------|--------|
| 1.1 Alpha | 01_users.sql | ⏳ Pending | Manual → MCP |
| 1.1 Alpha | 02_rls.sql | ⏳ Pending | Manual → MCP |
| 1.1 Beta | 01_schema.sql | ⏳ Pending | Manual → MCP |
| 1.1 Beta | 02_rls.sql | ⏳ Pending | Manual → MCP |

## Next Steps

1. Apply Alpha migrations via MCP
2. Apply Beta migrations via MCP
3. Run synthetic data seed via MCP execute_sql
4. Verify with MCP list_tables
5. Check security advisors

## Commands Available

```bash
# Apply migration (now via MCP)
mcp1_apply_migration

# Check database state
mcp1_list_tables

# Run ad-hoc SQL
mcp1_execute_sql

# Get security recommendations
mcp1_get_advisors type=security
```
