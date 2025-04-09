# Database Consolidation Plan

## Current Database Structure

Currently, our app uses multiple separate database files which causes inconsistency and data duplication:

1. **`database.js`** - Main database stored in `memoria.db`
   - Handles mood entries with location data
   - Contains the core functionality for our mood journal
   - Stores location metadata in `mood_entry_metadata` table

2. **`MoodsDB.js`** - Separate database stored in `moods.db`
   - Contains a separate moods table that duplicates functionality
   - Not fully integrated with the main database
   - Creates confusion with similar naming to the mood entries in the main database

3. **`PlacesDB.js`** - Separate database stored in `places.db`
   - Stores places information separate from the main database
   - Requires manual synchronization with mood entries that have location data
   - Creates a disconnected experience where places need to be "saved" from mood entries

## Issues with Current Structure

1. **Data Duplication**: Information about moods exists in multiple places
2. **Synchronization Problems**: Changes in one database don't reflect in others
3. **Inconsistent User Experience**: Places from mood entries need manual "saving"
4. **Maintenance Complexity**: Multiple database files are harder to maintain
5. **Increased Code Complexity**: Requires multiple context providers and API layers

## Consolidation Plan

### Step 1: Unify Schema Design

1. Create a unified schema in the main `memoria.db` database:
   ```sql
   -- Keep existing tables:
   -- user_profile, mood_entries, mood_tags, mood_entry_metadata, mood_activities

   -- Add new places table
   CREATE TABLE IF NOT EXISTS places (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     address TEXT,
     latitude REAL,
     longitude REAL,
     notes TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );

   -- Add relationship table between places and mood entries
   CREATE TABLE IF NOT EXISTS place_moods (
     id TEXT PRIMARY KEY,
     place_id TEXT NOT NULL,
     mood_id TEXT NOT NULL,
     FOREIGN KEY (place_id) REFERENCES places (id) ON DELETE CASCADE,
     FOREIGN KEY (mood_id) REFERENCES mood_entries (id) ON DELETE CASCADE
   );
   ```

### Step 2: Create Database Utilities

1. Rename `database.js` to `DatabaseService.js` to reflect its role as the single source of truth
2. Create utility classes for different data types:
   - `MoodService.js` - For mood-related operations
   - `PlaceService.js` - For place-related operations
   - `UserService.js` - For user profile operations

### Step 3: Data Migration

1. Create a migration utility to:
   - Import any places from `places.db` into the new `places` table in `memoria.db`
   - Import any unique moods from `moods.db` into `memoria.db`
   - Establish appropriate relationships between existing mood entries and their places

2. Run the migration when the app starts if needed

### Step 4: Update Context Providers

1. Update `PlacesContext.js` to use the new `PlaceService` instead of `PlacesDB`
2. Update any code that references `MoodsDB.js` to use the new `MoodService`
3. Ensure all components use the consolidated database structure

### Step 5: Implement Automatic Place Creation

1. Enhance the mood entry saving process to automatically:
   - Create a place entry when a mood has location data
   - Establish the relationship in the `place_moods` table
   - Update existing places rather than creating duplicates

### Step 6: Update UI for Seamless Experience

1. Update the PlacesScreen to:
   - Display all places from the unified database
   - Allow editing of any place regardless of its source
   - Remove "Save to Database" prompts and buttons
   - Provide a consistent experience across the app

### Step 7: Clean Up

1. After successful migration, delete the now-unused database files:
   - `MoodsDB.js`
   - `PlacesDB.js`
   - Any other redundant database utilities

2. Remove any deprecated tables or columns after ensuring all data is properly migrated

## Benefits of Consolidated Approach

1. **Single Source of Truth**: All data stored in one database
2. **Consistent User Experience**: Places from mood entries appear automatically
3. **Improved Data Integrity**: Proper relationships between entities
4. **Simplified Development**: One set of database utilities
5. **Better Performance**: No need for cross-database synchronization
6. **Easier Maintenance**: Unified schema makes future changes simpler

## Implementation Timeline

1. Develop and test the migration utility (1-2 days)
2. Create the new service classes (1-2 days)
3. Update context providers and UI components (2-3 days)
4. Test the new implementation thoroughly (1-2 days)
5. Deploy the changes to production (1 day)

Total estimate: 6-10 days for complete database consolidation 