# Observability Guide

**How to observe the development process, completed stages, active work, and blockers.**

---

## Recommended Tool: GitHub Projects

**Why GitHub Projects?**
- ✅ Free (included with GitHub)
- ✅ Already connected to your repo
- ✅ Auto-syncs with issues and PRs
- ✅ No additional MCP server needed
- ✅ Kanban + Table + Roadmap views

**Alternative**: Linear (better UX, $8/user/mo)  
**Alternative**: ClickUp (your original plan, but overkill for agent coordination)

---

## GitHub Projects Setup (5 minutes)

### 1. Create Project
1. Go to https://github.com/Ilkin-Ibishov/white-label-ecommerce/projects
2. Click **"New project"**
3. Choose **"Feature Release"** template
4. Name: **"Sprint 1.1 — Foundation"**

### 2. Configure Views

**Board View (Kanban)**
```
Columns:
- 📋 Backlog
- 🟡 In Progress (Alpha/Beta/Gamma)
- ⏳ In Review (Gatekeeper queue)
- 🟢 Done
- 🚫 Blocked
```

**Table View (Details)**
```
Columns:
- Title
- Assignee (Agent: Alpha/Beta/Gamma/SEC/ARCH/UX)
- Status
- Priority
- Sprint
- Linked PR
```

**Roadmap View (Timeline)**
- Group by: Agent
- Date field: Due date

### 3. Custom Fields

| Field | Type | Options |
|-------|------|---------|
| **Agent** | Single select | Alpha, Beta, Gamma, SEC, ARCH, UX |
| **Status** | Single select | Backlog, In Progress, Review, Done, Blocked |
| **Phase** | Single select | 1-Foundation, 2-Core, 3-Customer, 4-Admin, 5-WhiteLabel, 6-Prod |
| **Gatekeeper** | Single select | None, SEC, ARCH, UX |
| **Sprint** | Iteration | Sprint 1.1, Sprint 1.2, Sprint 2.1... |

### 4. Workflows (Auto-automation)

```yaml
# Auto-move PRs to "In Review"
When: PR opened
Then: Move linked issue to "In Review" column

# Auto-move merged PRs to "Done"
When: PR merged
Then: Move linked issue to "Done" column

# Auto-assign gatekeepers
When: PR touches src/app/api/auth/
Then: Add label "needs-sec-review"

When: PR touches supabase/migrations/
Then: Add label "needs-arch-review"

When: PR touches src/components/
Then: Add label "needs-ux-review"
```

---

## What You Can Observe

### Dashboard 1: Executive Summary
```
┌─────────────────────────────────────────────────────┐
│ Sprint 1.1 — Foundation               Due: May 16   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Progress: 33% ████████░░░░░░░░░░                   │
│                                                     │
│  ✅ Completed: Gamma (Hour 1 scaffold)              │
│  🟡 Active: Alpha (Auth), Beta (Products)           │
│  ⏳ Review Queue: 2 PRs awaiting gatekeepers          │
│  🚫 Blocked: 0                                      │
│                                                     │
│  Production: https://white-label-ecommerce-kappa... │
│  Commit: bee0c6a                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard 2: Gatekeeper Queue
```
┌─────────────────────────────────────────────────────┐
│ Pending Reviews                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SEC (Security)        1 PR     Auth middleware     │
│  ARCH (Architecture)   0 PRs                        │
│  UX (Design)           1 PR     Login page UI       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Dashboard 3: Agent Status
```
┌─────────────────────────────────────────────────────┐
│ Agent Alpha — Auth System                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Current: Setting up Supabase Auth                  │
│  Progress: 40%                                      │
│  Last Handoff: 2026-05-10                           │
│  Next Deliverable: RLS policies                     │
│  Blockers: None                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Manual Observation (File-Based)

Since agents use git-native coordination, you can also observe directly:

### Check Sprint Status
```bash
cat sprint/current.json
```

### Check Agent Handoffs
```bash
ls -la handoffs/
cat handoffs/alpha-2026-05-10.md
```

### Check Recent Commits
```bash
git log --oneline --graph -10
```

### Check Open PRs
```bash
gh pr list  # or visit GitHub web
```

### Check Deployment Status
```bash
npx vercel ls
```

---

## Alerting (Optional)

Set up notifications for:

1. **Slack/Discord webhook** when:
   - PR marked as "Blocked"
   - Gatekeeper review requested > 24 hours
   - Production deployment fails

2. **Email notification** when:
   - Sprint 50% complete
   - All gatekeeper queues empty (ready for next sprint)

---

## Recommended Setup Priority

1. **Immediate** (today): Use file-based observation
   - Check `sprint/current.json`
   - Check `handoffs/` directory

2. **This week**: Set up GitHub Projects
   - Create board view
   - Add issues for Sprint 1.1 tasks
   - Link PRs to issues

3. **Later**: Add automation
   - Auto-move PRs on open/merge
   - Slack notifications for blockers

---

## Summary

| Tool | Best For | Cost | Setup |
|------|----------|------|-------|
| **GitHub Projects** | Your main dashboard | Free | 5 min |
| **File-based** | Agent coordination | Free | Already done |
| **Vercel Dashboard** | Deployment status | Free | Auto |
| **GitHub PRs** | Code review queue | Free | Auto |

**Recommendation**: Use GitHub Projects as your single pane of glass. Everything else feeds into it.
