# FMEA Tool + Supabase Testing Guide

## Pre-Testing Checklist

- [ ] Supabase schema created (SQL run in console)
- [ ] Supabase project URL: `https://eyzbfylsbicoeoszcxfs.supabase.co`
- [ ] Supabase Anon Key: `sb_publishable_...`
- [ ] HTML file loaded at `index.html`
- [ ] All JavaScript files present (utils.js, auth.js, supabase.js, etc.)

---

## Test Scenarios

### 1. Authentication - Signup

**Steps:**
1. Open the application
2. Click "Don't have an account? Sign up"
3. Fill in:
   - Email: `test@example.com`
   - Password: `Test12345`
   - Confirm Password: `Test12345`
4. Click "Create Account"

**Expected Results:**
- ✅ Message appears: "Account created! Check your email to confirm..."
- ✅ Form clears
- ✅ Auto-switches back to login screen after 2 seconds
- ✅ New user record created in Supabase `auth.users` table
- ✅ New profile record created in `profiles` table

**Check Supabase:**
1. Go to Supabase console
2. Click **Authentication** → See new user in `Users` tab
3. Click **Database** → `profiles` table → See new row with user ID

---

### 2. Authentication - Login

**Steps:**
1. From login screen, enter:
   - Email: `test@example.com`
   - Password: `Test12345`
2. Click "Sign In"

**Expected Results:**
- ✅ Message appears: "Signing in..."
- ✅ Page navigates to Dashboard
- ✅ User email shown as "👤 test@example.com" in header
- ✅ Session stored in browser (check DevTools → Application → LocalStorage)

**localStorage Check:**
- `currentUser` = `test@example.com`
- `currentUserId` = (UUID from Supabase)

---

### 3. Project Creation

**Steps:**
1. From Dashboard, click "+ New Project"
2. Fill in:
   - Project Name: `Test FMEA Project`
   - Company: `Acme Corp`
   - Mode: Choose "Simple"
3. Click "Save Header"

**Expected Results:**
- ✅ Project created and appears on Dashboard
- ✅ Able to open project (FMEA table shows)
- ✅ Data persists on page refresh

**Check Supabase:**
1. Go to `projects` table
2. Should see new row with:
   - `user_id` = logged-in user's UUID
   - `name` = "Test FMEA Project"
   - `company` = "Acme Corp"
   - `mode` = "simple"

---

### 4. Add FMEA Rows

**Steps:**
1. Open the test project
2. Click "➕ Add Row" (in table)
3. Fill in:
   - Process Step: "Step 1"
   - Failure Mode: "Part fails"
   - Effect: "System doesn't work"
   - Cause: "Manufacturing defect"
   - Severity: 7, Occurrence: 5, Detection: 5
4. Click "Update Row"

**Expected Results:**
- ✅ Row appears in FMEA table
- ✅ RPN calculated automatically (7 × 5 × 5 = 175)
- ✅ Data persists on page refresh

**Check Supabase:**
1. Go to `fmea_rows` table
2. Should see new row with:
   - `project_id` = test project ID
   - `user_id` = logged-in user's UUID
   - `failure_mode` = "Part fails"
   - `sev` = 7, `occ` = 5, `det` = 5

---

### 5. Add Incident

**Steps:**
1. In FMEA row, click the incident link icon (top-right of row)
2. Add incident dialog opens
3. Fill in:
   - Description: "Test incident occurred"
4. Click "Save"

**Expected Results:**
- ✅ Incident saved and linked to row
- ✅ Incident count appears next to row
- ✅ Data persists on page refresh

**Check Supabase:**
1. Go to `incidents` table
2. Should see new row with:
   - `project_id` = test project ID
   - `user_id` = logged-in user's UUID
   - `description` = "Test incident occurred"
   - `fmea_row_id` = linked row ID

---

### 6. API Key Storage (Encrypted)

**Steps:**
1. Open Project Settings (⚙️)
2. Select provider: "Claude"
3. Paste an API key (dummy): `sk-ant-test123`
4. Click "Save Header"

**Expected Results:**
- ✅ API key accepted
- ✅ Test Connection available (optional)

**Check Supabase:**
1. Go to `api_keys` table
2. Should see row with:
   - `user_id` = logged-in user's UUID
   - `provider` = "claude"
   - `api_key_encrypted` = (base64 encoded key, NOT plain text!)

---

### 7. Multi-User Isolation (RLS Test)

**Steps:**
1. Open two different browsers (or incognito windows)
2. Browser 1: Login as `test@example.com` (password: `Test12345`)
3. Browser 2: Signup as `test2@example.com` (password: `Test12345`)
4. Browser 1: Create project "User 1 Project"
5. Browser 2: View dashboard

**Expected Results:**
- ✅ Browser 1 sees "User 1 Project"
- ✅ Browser 2 sees empty dashboard (or their own projects only)
- ✅ User 1 data not visible to User 2 (RLS enforced)

**Verify RLS in Supabase:**
1. Go to `projects` table
2. Notice that each user can only see their own rows
3. SQL check: `SELECT * FROM projects` only returns current user's projects

---

### 8. Logout

**Steps:**
1. Click "Sign Out" button
2. Verify redirected to login screen

**Expected Results:**
- ✅ Session cleared (localStorage cleared)
- ✅ Login form empty
- ✅ Can login as different user

---

### 9. Data Persistence

**Steps:**
1. Login as test user
2. Create project and add FMEA row
3. Close browser completely (force quit)
4. Reopen browser and navigate back to app
5. Click login (auto-redirect if session valid)

**Expected Results:**
- ✅ Session persists (Supabase handles JWT)
- ✅ Projects and FMEA rows load from Supabase
- ✅ No data loss

---

### 10. Groq Provider Settings

**Steps:**
1. In Project Settings, select "Groq"
2. Enter Groq API key
3. Click "Refresh" (loads available models)
4. Select a model
5. Adjust "Max Output Tokens" to 4096
6. Click "Save Header"

**Expected Results:**
- ✅ Models loaded and displayed
- ✅ Model selection saved
- ✅ Max tokens saved

**Check Supabase:**
1. Go to `provider_settings` table
2. Should see rows:
   - `provider` = "groq", `setting_name` = "groq_model", `setting_value` = (selected model)
   - `provider` = "groq", `setting_name` = "groq_max_tokens", `setting_value` = "4096"

---

## Troubleshooting

### "Repository not found" error
- **Cause:** Supabase credentials wrong
- **Fix:** Verify URL and Anon Key in `js/supabase.js`

### "Auth session not found"
- **Cause:** Supabase Auth not responding
- **Fix:** Check Supabase project status in console

### Data not saving
- **Cause:** User not authenticated
- **Fix:** Check browser console for auth errors, look at `currentUserId`

### RLS errors (403 Forbidden)
- **Cause:** RLS policies misconfigured
- **Fix:** Run SQL schema again in Supabase, verify all policies created

### "Function doesn't exist"
- **Cause:** JavaScript files not loaded in correct order
- **Fix:** Verify script tags in `index.html` are in this order:
  1. Supabase library (CDN)
  2. `js/supabase.js`
  3. `js/utils.js`
  4. `js/auth.js`
  5. (other modules)

---

## Browser DevTools Checks

### Check Session
1. Open DevTools (F12)
2. Go to **Console**
3. Type: `await getCurrentUser()`
4. Should return user object with email

### Check Storage
1. Go to **Application** tab
2. **LocalStorage** → your domain
3. Should see:
   - `currentUser` = user's email
   - `currentUserId` = user's UUID

### Check Network
1. Go to **Network** tab
2. Open Project settings
3. Look for requests to `eyzbfylsbicoeoszcxfs.supabase.co`
4. Should see successful requests (status 200/201)

---

## Performance Notes

- First load: ~1-2 seconds (Supabase auth check)
- Project load: ~500ms (fetch from Supabase)
- Add/edit row: ~1 second (Supabase upsert)
- RLS enforcement: Automatic (no additional latency)

---

## Success Criteria

All 10 test scenarios pass if:
- ✅ Multi-user auth works
- ✅ Data isolation via RLS
- ✅ Projects persist in Supabase
- ✅ FMEA rows persist in Supabase
- ✅ Incidents link correctly
- ✅ API keys encrypted in storage
- ✅ Provider settings saved
- ✅ Page refresh retrieves all data
- ✅ No data visible across users
- ✅ No errors in console

**You're ready for production!** 🚀
