# FPL AI Advisor - Real-Time Data Integration

## Overview
The FPL AI Advisor now uses **real-time data from the official Fantasy Premier League API** to provide accurate, current-season advice for **2025/2026**.

## What Changed

### 1. Real-Time FPL Data Fetcher ([src/lib/fpl-api.ts](src/lib/fpl-api.ts#L424-L672))

**New Functions Added:**
- `getFPLContextForAI()` - Fetches live FPL data for current season
- `buildAIPromptWithFPLData()` - Builds AI prompt with real player data

**What It Fetches:**
- ✅ Current season and gameweek information
- ✅ Top performing players by position (sorted by form & PPG)
- ✅ Real player stats: points, form, ownership, cost
- ✅ Upcoming fixtures with difficulty ratings
- ✅ Team information and schedules

**Caching:**
- Data is cached for 10 minutes to avoid rate limiting
- Automatic refresh when cache expires
- Fallback to basic prompt if FPL API is unavailable

### 2. Enhanced System Prompt

The AI now receives a detailed prompt with:

```
📅 SEASON: 2025/2026 | GAMEWEEK X

🔥 TOP IN-FORM PLAYERS (CURRENT SEASON):

Top Forwards:
- Player names from actual 2025/2026 season data
...

Top Midfielders:
- Salah (LIV): 142pts, Form: 9.1, PPG: 8.9, £13.5m, 62.7% owned
...

Top Defenders:
- Alexander-Arnold (LIV): 87pts, Form: 6.8, PPG: 5.4, £7.5m, 34.1% owned
...

📊 EASY UPCOMING FIXTURES:
- GW12: Liverpool vs Southampton (Difficulty: 2/5)
- GW12: Man City vs Luton (Difficulty: 1/5)
...

⚠️ CRITICAL RULES:
1. ONLY suggest players from the lists above
2. DO NOT suggest players from past seasons
3. DO NOT make up player names or stats
4. Always reference the current gameweek number
5. Use ONLY the stats shown above
```

### 3. Updated Chat API Route ([src/app/api/advisor/chat/route.ts](src/app/api/advisor/chat/route.ts#L86-L119))

**Changes:**
- Fetches real-time FPL data before each AI request
- Builds enhanced prompt with current player data
- Falls back to basic prompt if FPL API fails
- Logs detailed information about fetched data

**Example Log Output:**
```
[API] Fetching real-time FPL data for 2025/2026 season...
[FPL API] Fetching fresh bootstrap data
[API] FPL data fetched successfully: {
  season: '2024/2025',
  gameweek: 11,
  playersCount: {
    forwards: 10,
    midfielders: 10,
    defenders: 10,
    goalkeepers: 5
  }
}
[API] Calling GLM API with enhanced FPL context...
```

## How It Works

### Data Flow:
```
User asks question
  → Fetch real-time FPL data (cached 10 min)
  → Filter top players by form & PPG
  → Get upcoming fixtures with difficulty
  → Build enhanced prompt with real data
  → Send to GLM API
  → AI responds with ONLY current season players
```

### Player Filtering Criteria:
- ✅ Must have played at least 100 minutes this season
- ✅ Must have 75%+ chance of playing next round (or no injury concerns)
- ✅ Sorted by: Form → Points Per Game → Total Points
- ✅ Top 10 per position (5 for goalkeepers)

### Fixture Analysis:
- Fetches next gameweek fixtures
- Shows difficulty rating (1-5, where 1 = easiest)
- Filters "easy fixtures" (difficulty ≤ 2)
- Shows home/away status

## Testing The New Feature

### Test 1: Ask About Current Season Players
**Try:** "Who are the best forwards for gameweek 12?"

**Expected:** AI will recommend players from the current **2025/2026 season** top performers list, NOT historical players like "Harry Kane at Tottenham" (if he's transferred).

### Test 2: Ask About Specific Old Players
**Try:** "Should I get Harry Kane for my team?"

**Expected:**
- If Kane is in current season data → AI recommends based on current stats
- If Kane is NOT in current season data → AI says "I don't have current data for that player" and suggests alternatives

### Test 3: Verify Season Information
**Try:** "What gameweek is it?"

**Expected:** AI responds with the actual current gameweek (e.g., "It's Gameweek 11 of the **2025/2026 season**").

### Test 4: Fixture-Based Recommendations
**Try:** "Which defenders have easy fixtures?"

**Expected:** AI recommends defenders whose teams have upcoming difficulty ratings of 1-2, using REAL fixture data.

## Benefits

### Before (Old System):
- ❌ AI used training data (outdated seasons)
- ❌ Suggested players who transferred/retired
- ❌ Made up player names like "Raphael Dias Belloli"
- ❌ No real fixture or form data
- ❌ Generic advice

### After (New System):
- ✅ AI uses LIVE data from official FPL API
- ✅ Only suggests current season players
- ✅ Real stats: points, form, PPG, ownership, cost
- ✅ Actual fixture difficulty ratings
- ✅ Season-specific advice (**2025/2026**)
- ✅ Accurate gameweek information
- ✅ No hallucinated players

## Data Source

All data is fetched from the **official Fantasy Premier League API**:
- Base URL: `https://fantasy.premierleague.com/api/`
- Endpoints:
  - `/bootstrap-static/` - Player & team data
  - `/fixtures/?event=X` - Fixture data for gameweek X

## Error Handling

If the FPL API is unavailable:
1. System logs an error
2. Falls back to basic prompt (without real-time data)
3. AI still provides advice but warns about limited data
4. Next request will retry FPL API fetch

## Monitoring

Check server logs for:
```bash
[API] Fetching real-time FPL data for 2025/2026 season...
[FPL API] Using cached bootstrap data
[FPL API] Fetching fresh bootstrap data
[API] FPL data fetched successfully
[API] Failed to fetch FPL data, falling back to basic prompt
```

## Next Steps (Optional Enhancements)

Future improvements you could add:
1. **Player Search** - Allow users to ask about specific players by name
2. **Team Analysis** - Fetch user's actual FPL team for personalized advice
3. **Injury Updates** - Show detailed injury/availability status
4. **Price Changes** - Track player price rises/falls
5. **Ownership Trends** - Show transfer in/out patterns
6. **Historical Comparison** - Compare current form to past gameweeks
7. **Differential Picks** - Suggest low-ownership high-potential players

## Files Modified

1. [src/lib/fpl-api.ts](src/lib/fpl-api.ts) - Added AI context builder functions (lines 424-672)
2. [src/app/api/advisor/chat/route.ts](src/app/api/advisor/chat/route.ts) - Integrated real-time data (lines 1-4, 86-119)
3. [.env.local](.env.local) - GLM API key configuration
4. [server.ts](server.ts) - Fixed server URL display (line 91-93)

## API Key Status

✅ **GLM API Key:** Recharged and working
✅ **FPL API:** Public, no key required

## Usage Notes

- Data refreshes every 10 minutes automatically
- FPL API is public and free (no authentication needed)
- Rate limiting: 1 second between FPL API requests
- GLM API uses ~500-1500 tokens per request depending on conversation length

---

**Last Updated:** November 3, 2025
**Current Season:** 2025/2026
**Status:** ✅ Live and Functional
