# NameGenerator

A random name generation utility with web interface and CSV-based data management, backed by SQLite database storage.

## Features

- **SQLite Backend**: Names stored in a SQLite database for easy management and expansion
- **Web Interface**: Three HTML pages for different use cases
  - **Random Generator** (`random.html`): Generate random names with customizable frequencies
  - **Database Viewer** (`viewer.html`): Browse and filter all names with sorting
  - **Source Dashboard** (`dashboard.html`): View statistics and identify undersupplied sources
- **CSV Import/Export**: Easy bulk editing of names using spreadsheet software
- **Hierarchical Tagging**: Organize names by source with parent-child relationships
- **Gender Support**: Male, female, ambiguous, queer, and any gender categories
- **Weighted Random**: Frequency weights for more realistic name distributions

## Quick Start

### 1. Create the Database

```bash
python3 create_database.py
```

This creates `names.db` with the schema and default titles.

### 2. Import Names

```bash
# Import from CSV (default: names.csv)
python3 import_names_from_csv.py

# Import from custom file
python3 import_names_from_csv.py my_names.csv

# Reset database and import
python3 import_names_from_csv.py names.csv -reset
```

### 3. Open the Web Interface

Open `index.html` in your browser to access all features.

## Database Management

### Exporting Names to CSV

Export all names from the database to a CSV file for easy editing:

```bash
# Export to default file (names.csv)
python3 export_names_to_csv.py

# Export to custom file
python3 export_names_to_csv.py my_export.csv
```

**Output Format:**
```csv
Name,Position,Gender,Weight,Tags
Alexander,first,male,1.0,Test Names
Dr.,title,any,1.0,Default
Cloud-dancing-Sunchaser,nickname,ambiguous,1.0,Blades - Dagger Isles
Captain,title,any,1.0,Blades - Akoros|Default
```

### CSV Format Specification

The CSV must have these columns in order:

| Column | Description | Valid Values | Example |
|--------|-------------|--------------|---------|
| **Name** | The name text (required) | Any non-empty string | `Alexander` |
| **Position** | Name position (required) | `first`, `last`, `title`, `nickname` | `first` |
| **Gender** | Gender category (required) | `male`, `female`, `ambiguous`, `queer`, `any` | `male` |
| **Weight** | Frequency weight (required) | Any positive number | `1.0` |
| **Tags** | Source/category tags (optional) | Pipe-separated tag names | `Blades 68\|Blades - Akoros` |

**Important Notes:**
- All values must be **human-readable** (not IDs)
- Tags are separated by pipe characters (`|`)
- Multiple tags per name are supported
- Empty tags column is allowed (name will have no tags)

### Importing Names from CSV

Import names with validation and error reporting:

```bash
# Import from default file (names.csv)
python3 import_names_from_csv.py

# Import from custom file
python3 import_names_from_csv.py data/custom_names.csv

# Clear existing names before importing
python3 import_names_from_csv.py names.csv -reset
```

**Validation:**
The importer validates:
- ✅ All required fields are present and non-empty
- ✅ Position values match valid positions in database
- ✅ Gender values match valid genders in database
- ✅ Weight is a positive number
- ✅ All tag names exist in the database

**Error Reporting Example:**
```
Loaded 100 rows. 95 successes. 5 failures.

Errors:
  * Row 12: unknown position 'midddle'
  * Row 23: unknown gender 'gaaaaaaaaaay'
  * Row 45: invalid weight 'notanumber' (must be a number)
  * Row 67: unknown tag 'Bades In The Dakr'
  * Row 89: invalid weight '-5.0' (must be > 0)
```

## Workflow for Editing Names

1. **Export** current names to CSV:
   ```bash
   python3 export_names_to_csv.py
   ```

2. **Edit** `names.csv` in your spreadsheet software:
   - Add new names
   - Modify existing names
   - Change tags, genders, or weights
   - Delete rows to remove names

3. **Import** the updated CSV:
   ```bash
   python3 import_names_from_csv.py names.csv -reset
   ```

4. **Verify** import was successful (check error messages)

5. **Refresh** the web pages to see your changes

## Database Schema

### Positions
- `first` - First names
- `last` - Last names
- `title` - Honorifics and titles (Dr., Captain, etc.)
- `nickname` - Nicknames and aliases

### Genders
- `male` - Masculine names
- `female` - Feminine names
- `ambiguous` - Gender-neutral names
- `queer` - Non-binary/queer names
- `any` - Names that work for any gender

### Tag Types
- `source` - Origin/setting of the name (e.g., "Blades 68", "Red Water")
- `vibe` - Mood or feeling (future expansion)
- `theme` - Thematic categories (future expansion)

## Web Interface

### Random Generator (`random.html`)
- Generate 1-10 random names at once
- Control frequency of titles and nicknames (0-100%)
- Filter by source and gender
- Multi-select sources with hierarchical display

### Database Viewer (`viewer.html`)
- Browse all names in a sortable table
- Filter by position, gender, and source
- See all tags for each name
- Results counter shows filtered count

### Source Dashboard (`dashboard.html`)
- Statistics for each source (first/last/title/nickname counts)
- Color-coded warnings for undersupplied sources
  - 🔴 Critical: <50 first OR <25 last names
  - ⚠️ Warning: <25 title OR nickname names
- Filter to show only undersupplied sources

## Use Cases

- **Game Masters**: Generate NPC names for tabletop RPGs
- **Writers**: Create character names for stories
- **Game Developers**: Procedural character naming
- **Testing**: Placeholder names for applications
- **Learning**: Example of SQLite + web integration

## Files Structure

```
Names/
├── index.html              # Landing page with navigation
├── random.html             # Random name generator
├── viewer.html             # Database viewer/browser
├── dashboard.html          # Source statistics
├── create_database.py      # Database schema creation
├── export_names_to_csv.py  # Export names to CSV
├── import_names_from_csv.py # Import names from CSV
├── names.csv               # Current names (~1580 entries)
└── names.db                # SQLite database
```

## Technical Details

- **Frontend**: Pure HTML/CSS/JavaScript with SQL.js
- **Backend**: SQLite database accessed via SQL.js in browser
- **No Server Required**: Everything runs client-side
- **Data Management**: CSV-based for easy bulk editing
- **Extensible**: Add new sources, tags, and names easily via CSV

## Contributing

To add new names:
1. Export current database to CSV
2. Add your names following the format specification
3. Import the CSV back into the database
4. Test the web interface to verify

## License

See [LICENSE.md](../LICENSE.md) in the project root.
