# Genshin Progress Tracker - Testing Checklist

## Prerequisites
```bash
npm install
npm run dev
```
Visit: http://localhost:5173

---

## 1. Manual Character Entry ✅

### Test: Create a new character
- [ ] Click "Add Character" button
- [ ] Select "Manual Entry"
- [ ] Fill out form:
  - Character Name: e.g., "Zhongli"
  - Level: 90, Ascension: 6
  - Constellation: C0 (or your actual)
  - Talents: 9/9/9
  - Weapon: "Vortex Vanquisher" R1, Level 90, Ascension 6
  - Priority: Main
  - Notes: "Geo Archon shield support"
- [ ] Click "Add Character"
- [ ] Verify character appears in grid instantly
- [ ] Check all data is correct on card

### Test: Character card display
- [ ] Verify level displays as "Lv. 90/90"
- [ ] Verify 0 constellation stars (all gray)
- [ ] Verify talent levels show: AA 9, Skill 9, Burst 9
- [ ] Verify weapon shows with R1
- [ ] Verify priority badge shows "Main"

---

## 2. Character Edit ✅

### Test: Edit existing character
- [ ] Hover over any character card
- [ ] Click the pencil (edit) button
- [ ] Form opens pre-filled with character data
- [ ] Change constellation to C1
- [ ] Change talent burst to 10
- [ ] Click "Update Character"
- [ ] Verify changes appear immediately
- [ ] Check constellation star is filled
- [ ] Check burst talent shows 10

---

## 3. Character Delete ✅

### Test: Delete character with confirmation
- [ ] Hover over any character card
- [ ] Click the trash (delete) button
- [ ] Confirmation modal appears
- [ ] Verify character name is shown in warning
- [ ] Click "Cancel" → modal closes, character remains
- [ ] Hover and click delete again
- [ ] Click "Delete Character"
- [ ] Verify character disappears from roster immediately

---

## 4. Character Detail Page ✅

### Test: View character details
- [ ] Click on any character card (not edit/delete buttons)
- [ ] Navigate to detail page
- [ ] Verify URL is `/roster/{character-id}`
- [ ] Check all sections display:
  - Character name as page title
  - Level and constellation in subtitle
  - Basic Info card (level, ascension, constellation, priority)
  - Talents card (3 large numbers)
  - Weapon card (name, level, refinement)
  - Artifacts card (if any artifacts exist)
  - Notes card (if notes exist)
- [ ] Click "Back" button
- [ ] Verify returns to roster page

---

## 5. Search and Filter ✅

### Test: Search functionality
- [ ] Type character name in search box
- [ ] Verify only matching characters show
- [ ] Clear search
- [ ] Verify all characters return

### Test: View modes
- [ ] Click Grid view button (default)
- [ ] Verify characters in 4-column grid
- [ ] Click List view button
- [ ] Verify characters in vertical list
- [ ] Toggle back to Grid view

---

## 6. GOOD Format Export ✅

### Test: Export roster to GOOD JSON
- [ ] Add at least 2 characters to roster (manual entry or samples)
- [ ] Click "Export" button in header
- [ ] Modal opens with JSON preview
- [ ] Verify JSON shows:
  - `"format": "GOOD"`
  - `"version": 2`
  - `"source": "Genshin Progress Tracker"`
  - Characters array with your data
  - Weapons array
  - Artifacts array (if any)
- [ ] Click "Copy" button
- [ ] Paste JSON somewhere to verify it's valid
- [ ] Click "Download JSON" button
- [ ] Verify file downloads with date in filename
- [ ] Open downloaded file and verify contents

---

## 7. GOOD Format Import ✅

### Test: Import from GOOD JSON file
- [ ] Export your roster first (see test above)
- [ ] Delete all characters from roster
- [ ] Click "Add Character" → "Import GOOD Format (JSON)"
- [ ] Click upload area or paste JSON
- [ ] Upload the file you exported OR paste the JSON
- [ ] Click "Import" button
- [ ] Verify success message shows character count
- [ ] Modal auto-closes after 2 seconds
- [ ] Verify all characters re-appear with correct data
- [ ] Click into character detail pages to verify artifacts imported

### Test: Import validation
- [ ] Try pasting invalid JSON (e.g., `{ "invalid": true }`)
- [ ] Click "Import"
- [ ] Verify error message appears
- [ ] Try pasting valid JSON but not GOOD format
- [ ] Verify error: "Not a valid GOOD format file"

---

## 8. Enka.network Integration ✅

### Test: Import from Enka by UID
**Note: You need your actual Genshin UID for this test!**

- [ ] Make sure "Show Character Details" is ON in Genshin settings
- [ ] Put characters in your showcase (max 8)
- [ ] Copy your UID from game
- [ ] In app: Click "Add Character" → "Import from Enka.network"
- [ ] Paste your UID (9 digits)
- [ ] Click "Import from Enka"
- [ ] Wait for fetch (may take 3-5 seconds)
- [ ] Verify success message with character count
- [ ] Verify all showcase characters imported
- [ ] Click into detail pages to verify:
  - Correct level and ascension
  - Correct constellation
  - Correct talent levels
  - Weapon with correct refinement
  - All 5 artifacts with substats
  - Notes say "Imported from Enka.network (UID: ...)"

### Test: Enka error handling
- [ ] Enter invalid UID (e.g., "123")
- [ ] Verify error: "Please enter a valid UID (9 digits)"
- [ ] Enter fake UID (e.g., "999999999")
- [ ] Click import
- [ ] Verify error message (likely "UID not found")

---

## 9. Dev Tools (Optional) ✅

### Test: Seed sample data
- [ ] Open browser console (F12)
- [ ] Type: `window.devTools.seedSampleCharacters()`
- [ ] Press Enter
- [ ] Verify 4 characters appear:
  - Furina
  - Neuvillette
  - Kazuha
  - Bennett
- [ ] Check they all have weapons, artifacts, talents
- [ ] Verify console shows: "✅ Sample characters added successfully"

---

## 10. Responsive Design ✅

### Test: Mobile/tablet layout
- [ ] Resize browser to mobile width (< 640px)
- [ ] Verify:
  - Header stacks properly
  - Tabs scroll horizontally
  - Character grid becomes 1 column
  - Modals are readable
  - Detail page cards stack vertically
- [ ] Resize to tablet (640-1024px)
- [ ] Verify character grid shows 2-3 columns
- [ ] Resize to desktop (> 1024px)
- [ ] Verify character grid shows 4 columns

---

## 11. Data Persistence ✅

### Test: IndexedDB persistence
- [ ] Add several characters
- [ ] Refresh page (F5)
- [ ] Verify all characters still there
- [ ] Close browser completely
- [ ] Reopen and navigate to app
- [ ] Verify data persists

### Test: Browser developer tools
- [ ] Open DevTools → Application tab
- [ ] Expand IndexedDB → GenshinTracker
- [ ] Click "characters" table
- [ ] Verify your characters are stored
- [ ] Check structure matches schema

---

## 12. Edge Cases ✅

### Test: Empty states
- [ ] Delete all characters
- [ ] Verify empty state appears with:
  - Icon
  - "No Characters Yet" message
  - "Add Character" button
- [ ] Click "Add Character" from empty state
- [ ] Verify modal opens

### Test: Long character names
- [ ] Create character with very long name
- [ ] Verify name doesn't break card layout
- [ ] Verify detail page handles long name

### Test: Zero constellation
- [ ] Create C0 character
- [ ] Verify all 6 stars are gray
- [ ] Edit to C6
- [ ] Verify all 6 stars are gold

### Test: Multiple modals
- [ ] Open "Add Character" modal
- [ ] Close it
- [ ] Open "Export" modal
- [ ] Verify correct modal opens
- [ ] Verify old modal doesn't leak

---

## 13. Performance ✅

### Test: Large roster
- [ ] Import 20+ characters (use sample data or GOOD import)
- [ ] Verify grid renders smoothly
- [ ] Test search with many characters
- [ ] Verify no lag when typing
- [ ] Switch between grid/list view
- [ ] Verify smooth transitions

---

## Summary Checklist

**Character Management:**
- [ ] Create character manually
- [ ] Edit character
- [ ] Delete character (with confirmation)
- [ ] View character details
- [ ] Navigate between roster and detail pages

**Import/Export:**
- [ ] Export to GOOD JSON (copy & download)
- [ ] Import from GOOD JSON (paste & upload)
- [ ] Import from Enka.network by UID
- [ ] Validate import errors

**UI/UX:**
- [ ] Search characters
- [ ] Toggle grid/list view
- [ ] Hover to see edit/delete buttons
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Empty states
- [ ] Loading states (Enka import)
- [ ] Success/error messages

**Data:**
- [ ] Data persists across refreshes
- [ ] IndexedDB stores correctly
- [ ] Sample data works (dev tools)

---

## Known Limitations

1. **Enka Import**: Only imports showcase characters (max 8)
2. **Enka Cache**: Updates every 5-10 minutes
3. **Character Names**: Using simple ID mapping (may not match all characters)
4. **Artifacts**: Manual entry doesn't support full artifact input yet
5. **Teams**: Team features not yet implemented

---

## Next Steps After Testing

If everything works:
1. Test with your actual Genshin UID
2. Export your real roster
3. Try importing into Genshin Optimizer to verify compatibility
4. Report any bugs or issues

Happy testing! 🎮✨
