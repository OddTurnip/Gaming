/**
 * DataAccess.js
 * Centralized database access layer for the Name Generator application.
 * Handles all SQL.js interactions, query building, and name generation logic.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Minimum number of first names a source should have to be considered well-supplied.
 * Sources with fewer first names are flagged as undersupplied.
 * @constant {number}
 */
const THRESHOLD_FIRST_NAMES = 50;

/**
 * Minimum number of last names a source should have to be considered well-supplied.
 * Sources with fewer last names are flagged as undersupplied.
 * @constant {number}
 */
const THRESHOLD_LAST_NAMES = 25;

/**
 * When a source has fewer than this many titles, the Default tag titles are also included.
 * This ensures title generation doesn't fail for sources with limited title options.
 * @constant {number}
 */
const THRESHOLD_TITLES_FOR_DEFAULT_FALLBACK = 25;

/**
 * CDN URL for SQL.js library files.
 * @constant {string}
 */
const SQL_JS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/';

/**
 * Default probability that a generated name will include a nickname (0.0 to 1.0).
 * @constant {number}
 */
const DEFAULT_NICKNAME_FREQUENCY = 0.25;

/**
 * Default probability that a generated name will include a title (0.0 to 1.0).
 * @constant {number}
 */
const DEFAULT_TITLE_FREQUENCY = 0.10;

// ============================================================================
// STATE
// ============================================================================

/**
 * Global database instance. Initialized by calling initDatabase().
 * @type {Database|null}
 */
let db = null;

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize SQL.js and load the database file.
 *
 * @param {string} [dbPath='names.db'] - Path to the SQLite database file
 * @returns {Promise<Database>} The initialized database instance
 * @throws {Error} If SQL.js fails to initialize or database fails to load
 *
 * @example
 * const database = await initDatabase('names.db');
 */
async function initDatabase(dbPath = 'names.db') {
    // Initialize SQL.js
    const SQL = await initSqlJs({
        locateFile: file => `${SQL_JS_CDN_URL}${file}`
    });

    // Load the database file
    const response = await fetch(dbPath);
    if (!response.ok) {
        throw new Error(`Failed to load database: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));

    return db;
}

/**
 * Get the current database instance.
 *
 * @returns {Database|null} The database instance, or null if not initialized
 *
 * @example
 * const db = getDatabase();
 * if (db) {
 *     // Use database
 * }
 */
function getDatabase() {
    return db;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Execute a parameterized query and return all results.
 * This is the RECOMMENDED and SECURE way to execute queries with user input.
 *
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Array} Array of result rows, or empty array if no results
 *
 * @example
 * const results = execParams("SELECT * FROM tags WHERE tag_name = ?", ["Blades 68"]);
 */
function execParams(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
        results.push(stmt.get());
    }
    stmt.free();

    return results;
}

/**
 * Escape single quotes in SQL string literals.
 *
 * @deprecated Use parameterized queries via execParams() instead. This function
 * provides basic SQL escaping but is NOT a complete defense against SQL injection.
 * Retained only for backward compatibility with buildNameViewerQuery() and tests.
 *
 * @param {string} value - The string value to escape
 * @returns {string} The escaped string with single quotes doubled
 *
 * @example
 * escapeSQL("O'Brien") // Returns: "O''Brien"
 */
function escapeSQL(value) {
    return value.replace(/'/g, "''");
}

/**
 * Get all source tags from the database, organized hierarchically.
 *
 * @returns {Array<{id: number, name: string, parentId: number|null, parentName: string|null}>}
 * Array of source tag objects
 *
 * @example
 * const sources = getSourceTags();
 * // [{ id: 1, name: 'Blades 68', parentId: null, parentName: null }, ...]
 */
function getSourceTags() {
    const result = db.exec(`
        SELECT t.id, t.tag_name, t.parent_tag_id, p.tag_name as parent_name
        FROM tags t
        LEFT JOIN tags p ON t.parent_tag_id = p.id
        WHERE t.tag_type_id = (SELECT id FROM tag_types WHERE type_name = 'source')
        ORDER BY
            CASE WHEN t.parent_tag_id IS NULL THEN t.tag_name ELSE p.tag_name END,
            CASE WHEN t.parent_tag_id IS NULL THEN 0 ELSE 1 END,
            t.tag_name
    `);

    if (result.length === 0) return [];

    return result[0].values.map(([id, name, parentId, parentName]) => ({
        id,
        name,
        parentId,
        parentName
    }));
}

/**
 * Convert source tag names to tag IDs, including child tags.
 * When a parent tag is selected, all its children are included.
 *
 * @param {string[]} sourceNames - Array of source tag names
 * @returns {number[]} Array of tag IDs (includes children of parent tags)
 *
 * @example
 * const tagIds = getTagIdsForSources(['Blades 68']);
 * // Returns IDs for 'Blades 68' and all its children like 'Blades - Akoros'
 */
function getTagIdsForSources(sourceNames) {
    const tagIds = [];

    sourceNames.forEach(source => {
        const sql = `
            SELECT id FROM tags WHERE tag_name = ?
            UNION
            SELECT id FROM tags WHERE parent_tag_id = (SELECT id FROM tags WHERE tag_name = ?)
        `;
        const tagResult = execParams(sql, [source, source]);

        tagResult.forEach(row => {
            tagIds.push(row[0]);
        });
    });

    return tagIds;
}

/**
 * Get all available genders from the database.
 *
 * @returns {Array<string>} Array of gender names
 *
 * @example
 * const genders = getGenders();
 * // ['male', 'female', 'ambiguous', 'queer', 'any']
 */
function getGenders() {
    const result = db.exec('SELECT gender FROM genders ORDER BY id');
    if (result.length === 0) return [];
    return result[0].values.map(row => row[0]);
}

/**
 * Get all available positions from the database.
 *
 * @returns {Array<string>} Array of position names
 *
 * @example
 * const positions = getPositions();
 * // ['first', 'last', 'title', 'nickname']
 */
function getPositions() {
    const result = db.exec('SELECT position FROM positions ORDER BY position');
    if (result.length === 0) return [];
    return result[0].values.map(row => row[0]);
}

/**
 * Get database statistics (total counts).
 *
 * @returns {{names: number, sources: number, otherTags: number, firstNames: number, lastNames: number, nicknames: number, titles: number}} Statistics object
 *
 * @example
 * const stats = getDatabaseStats();
 * // { names: 1296, sources: 12, otherTags: 45, firstNames: 1006, lastNames: 507, nicknames: 193, titles: 57 }
 */
function getDatabaseStats() {
    const namesCount = db.exec('SELECT COUNT(*) as count FROM names')[0].values[0][0];
    const sourcesCount = db.exec(`
        SELECT COUNT(*) as count FROM tags
        WHERE tag_type_id = (SELECT id FROM tag_types WHERE type_name = 'source')
    `)[0].values[0][0];
    const otherTagsCount = db.exec(`
        SELECT COUNT(*) as count FROM tags
        WHERE tag_type_id != (SELECT id FROM tag_types WHERE type_name = 'source')
    `)[0].values[0][0];

    // Get actual counts per position (not sum of source associations)
    const firstNamesCount = db.exec(`
        SELECT COUNT(*) as count FROM names
        WHERE position_id = (SELECT id FROM positions WHERE position = 'first')
    `)[0].values[0][0];

    const lastNamesCount = db.exec(`
        SELECT COUNT(*) as count FROM names
        WHERE position_id = (SELECT id FROM positions WHERE position = 'last')
    `)[0].values[0][0];

    const nicknamesCount = db.exec(`
        SELECT COUNT(*) as count FROM names
        WHERE position_id = (SELECT id FROM positions WHERE position = 'nickname')
    `)[0].values[0][0];

    const titlesCount = db.exec(`
        SELECT COUNT(*) as count FROM names
        WHERE position_id = (SELECT id FROM positions WHERE position = 'title')
    `)[0].values[0][0];

    return {
        names: namesCount,
        sources: sourcesCount,
        otherTags: otherTagsCount,
        firstNames: firstNamesCount,
        lastNames: lastNamesCount,
        nicknames: nicknamesCount,
        titles: titlesCount
    };
}

// ============================================================================
// QUERY BUILDERS FOR DATABASE VIEWER
// ============================================================================

/**
 * Build a SQL query for the database viewer with filters.
 *
 * ⚠️ SECURITY WARNING: This function uses string interpolation (via escapeSQL())
 * instead of parameterized queries. It should ONLY be used with trusted input
 * from controlled UI elements (dropdowns populated from database values).
 * For arbitrary user input, use parameterized queries via execParams() instead.
 *
 * @param {Object} filters - Filter options
 * @param {string} [filters.position] - Filter by position (e.g., 'first', 'last')
 * @param {string} [filters.gender] - Filter by gender (e.g., 'male', 'female')
 * @param {string} [filters.source] - Filter by source tag name, or '__ORPHANED__' for names without sources
 * @returns {string} SQL query string (not parameterized - use with caution)
 *
 * @example
 * // Only use with values from controlled dropdowns
 * const query = buildNameViewerQuery({ position: 'first', gender: 'male' });
 * const result = db.exec(query);
 */
function buildNameViewerQuery(filters = {}) {
    const conditions = [];

    if (filters.position) {
        conditions.push(`p.position = '${escapeSQL(filters.position)}'`);
    }

    if (filters.gender) {
        conditions.push(`g.gender = '${escapeSQL(filters.gender)}'`);
    }

    if (filters.source) {
        if (filters.source === '__ORPHANED__') {
            // Show names with no source tags
            conditions.push(`n.id NOT IN (
                SELECT nt.name_id FROM name_tags nt
                JOIN tags t ON nt.tag_id = t.id
                JOIN tag_types tt ON t.tag_type_id = tt.id
                WHERE tt.type_name = 'source'
            )`);
        } else {
            // Include parent tag and all its children
            const escapedSource = escapeSQL(filters.source);
            conditions.push(`n.id IN (
                SELECT nt.name_id FROM name_tags nt
                JOIN tags t ON nt.tag_id = t.id
                WHERE t.tag_name = '${escapedSource}'
                   OR t.parent_tag_id = (SELECT id FROM tags WHERE tag_name = '${escapedSource}')
            )`);
        }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return `
        SELECT
            n.id,
            n.name,
            p.position,
            g.gender,
            PRINTF('%.2f', n.frequency_weight) as weight,
            (SELECT GROUP_CONCAT(t2.tag_name, ', ')
             FROM name_tags nt2
             JOIN tags t2 ON nt2.tag_id = t2.id
             JOIN tag_types tt2 ON t2.tag_type_id = tt2.id
             WHERE nt2.name_id = n.id AND tt2.type_name = 'source'
             ORDER BY t2.tag_name) as sources,
            (SELECT GROUP_CONCAT(t2.tag_name, ', ')
             FROM name_tags nt2
             JOIN tags t2 ON nt2.tag_id = t2.id
             JOIN tag_types tt2 ON t2.tag_type_id = tt2.id
             WHERE nt2.name_id = n.id AND tt2.type_name = 'vibe'
             ORDER BY t2.tag_name) as vibes,
            (SELECT GROUP_CONCAT(t2.tag_name, ', ')
             FROM name_tags nt2
             JOIN tags t2 ON nt2.tag_id = t2.id
             JOIN tag_types tt2 ON t2.tag_type_id = tt2.id
             WHERE nt2.name_id = n.id AND tt2.type_name = 'theme'
             ORDER BY t2.tag_name) as themes
        FROM names n
        LEFT JOIN positions p ON n.position_id = p.id
        LEFT JOIN genders g ON n.gender_id = g.id
        ${whereClause}
        GROUP BY n.id
        ORDER BY n.id
    `;
}

/**
 * Build a SQL query for source statistics (dashboard).
 * Returns count of names by position for each source tag.
 *
 * NOTE: Only counts names DIRECTLY tagged with each source (not children).
 * This prevents double-counting when a name is tagged with a child source.
 *
 * @returns {string} SQL query string
 *
 * @example
 * const query = buildSourceStatsQuery();
 * const result = db.exec(query);
 */
function buildSourceStatsQuery() {
    return `
        SELECT
            t.id,
            t.tag_name,
            t.parent_tag_id,
            p.tag_name as parent_name,
            (SELECT COUNT(DISTINCT n.id)
             FROM names n
             JOIN positions pos ON n.position_id = pos.id
             JOIN name_tags nt ON n.id = nt.name_id
             WHERE pos.position = 'first'
               AND nt.tag_id = t.id
            ) as first_count,
            (SELECT COUNT(DISTINCT n.id)
             FROM names n
             JOIN positions pos ON n.position_id = pos.id
             JOIN name_tags nt ON n.id = nt.name_id
             WHERE pos.position = 'last'
               AND nt.tag_id = t.id
            ) as last_count,
            (SELECT COUNT(DISTINCT n.id)
             FROM names n
             JOIN positions pos ON n.position_id = pos.id
             JOIN name_tags nt ON n.id = nt.name_id
             WHERE pos.position = 'title'
               AND nt.tag_id = t.id
            ) as title_count,
            (SELECT COUNT(DISTINCT n.id)
             FROM names n
             JOIN positions pos ON n.position_id = pos.id
             JOIN name_tags nt ON n.id = nt.name_id
             WHERE pos.position = 'nickname'
               AND nt.tag_id = t.id
            ) as nickname_count
        FROM tags t
        LEFT JOIN tags p ON t.parent_tag_id = p.id
        WHERE t.tag_type_id = (SELECT id FROM tag_types WHERE type_name = 'source')
        ORDER BY
            CASE WHEN t.parent_tag_id IS NULL THEN t.tag_name ELSE p.tag_name END,
            CASE WHEN t.parent_tag_id IS NULL THEN 0 ELSE 1 END,
            t.tag_name
    `;
}

/**
 * Check if a source is undersupplied based on thresholds.
 *
 * @param {number} firstCount - Number of first names
 * @param {number} lastCount - Number of last names
 * @param {boolean} isAdminEntry - Whether this is an admin/system source (e.g., 'Default', 'Test Names')
 * @returns {boolean} True if the source needs more names
 *
 * @example
 * isUndersupplied(30, 15, false) // true (below thresholds)
 * isUndersupplied(60, 30, false) // false (above thresholds)
 * isUndersupplied(0, 0, true) // false (admin entries never undersupplied)
 */
function isUndersupplied(firstCount, lastCount, isAdminEntry = false) {
    if (isAdminEntry) return false;
    return firstCount < THRESHOLD_FIRST_NAMES || lastCount < THRESHOLD_LAST_NAMES;
}

// ============================================================================
// NAME GENERATION FUNCTIONS
// ============================================================================

/**
 * Get a weighted random name from the database.
 * Uses frequency_weight column to bias selection toward more common names.
 *
 * @param {string} position - Name position ('first', 'last', 'title', 'nickname')
 * @param {string[]} genders - Array of allowed genders (e.g., ['male', 'female', 'any'])
 * @param {number[]} sourceTagIds - Array of source tag IDs to filter by (empty = all sources)
 * @returns {string|null} The selected name, or null if no names match criteria
 *
 * @example
 * const firstName = getWeightedName('first', ['male', 'any'], [1, 2, 3]);
 */
function getWeightedName(position, genders, sourceTagIds = []) {
    //Build placeholders for genders array
    const genderPlaceholders = genders.map(() => '?').join(', ');

    // Tag IDs are integers, safe to use directly in IN clause
    let sourceFilter = '';
    if (sourceTagIds.length > 0) {
        const tagIdList = sourceTagIds.join(', ');
        sourceFilter = ` AND n.id IN (SELECT nt.name_id FROM name_tags nt WHERE nt.tag_id IN (${tagIdList}))`;
    }

    const sql = `
        SELECT n.name FROM names n
        WHERE n.position_id = (SELECT id FROM positions WHERE position = ?)
          AND n.gender_id IN (SELECT id FROM genders WHERE gender IN (${genderPlaceholders}))
          ${sourceFilter}
        ORDER BY RANDOM() * n.frequency_weight DESC
        LIMIT 1
    `;

    const params = [position, ...genders];
    const result = execParams(sql, params);

    if (result.length === 0) {
        return null;
    }

    return result[0][0];
}

/**
 * Count how many names are available matching criteria.
 *
 * @param {string} position - Name position
 * @param {string[]} genders - Array of allowed genders
 * @param {number[]} sourceTagIds - Array of source tag IDs
 * @returns {number} Count of matching names
 *
 * @example
 * const count = countNames('nickname', ['male', 'any'], [1, 2]);
 */
function countNames(position, genders, sourceTagIds = []) {
    // Build placeholders for genders array
    const genderPlaceholders = genders.map(() => '?').join(', ');

    // Tag IDs are integers, safe to use directly in IN clause
    let sourceFilter = '';
    if (sourceTagIds.length > 0) {
        const tagIdList = sourceTagIds.join(', ');
        sourceFilter = ` AND n.id IN (SELECT nt.name_id FROM name_tags nt WHERE nt.tag_id IN (${tagIdList}))`;
    }

    const sql = `
        SELECT COUNT(DISTINCT n.id) FROM names n
        WHERE n.position_id = (SELECT id FROM positions WHERE position = ?)
          AND n.gender_id IN (SELECT id FROM genders WHERE gender IN (${genderPlaceholders}))
          ${sourceFilter}
    `;

    const params = [position, ...genders];
    const result = execParams(sql, params);

    if (result.length === 0) {
        return 0;
    }

    return result[0][0];
}

/**
 * Count names for a tag INCLUDING its children.
 * Used to determine if a parent tag should be shown in the UI.
 *
 * @param {string} position - Name position
 * @param {string[]} genders - Array of allowed genders
 * @param {number} tagId - Single tag ID to check (will include children)
 * @returns {number} Count of matching names (tag + all children)
 *
 * @example
 * // Count first names for "Blades In The Dark" including all child tags
 * const count = countNamesIncludingChildren('first', ['male', 'female', 'any'], 5);
 */
function countNamesIncludingChildren(position, genders, tagId) {
    // Build placeholders for genders array
    const genderPlaceholders = genders.map(() => '?').join(', ');

    // tagId is an integer, safe to use directly
    const sql = `
        SELECT COUNT(DISTINCT n.id) FROM names n
        JOIN positions pos ON n.position_id = pos.id
        JOIN name_tags nt ON n.id = nt.name_id
        WHERE pos.position = ?
          AND n.gender_id IN (SELECT id FROM genders WHERE gender IN (${genderPlaceholders}))
          AND (nt.tag_id = ${tagId}
               OR nt.tag_id IN (SELECT id FROM tags WHERE parent_tag_id = ${tagId}))
    `;

    const params = [position, ...genders];
    const result = execParams(sql, params);

    if (result.length === 0) {
        return 0;
    }

    return result[0][0];
}

/**
 * Generate a complete random name with optional nickname and title.
 *
 * @param {Object} options - Generation options
 * @param {string[]} options.genders - Array of allowed genders (must include at least one non-'any' gender)
 * @param {string[]} [options.sourceNames=[]] - Array of source names to filter by
 * @param {number} [options.nicknameFrequency=0.25] - Probability of including a nickname (0.0 to 1.0)
 * @param {number} [options.titleFrequency=0.10] - Probability of including a title (0.0 to 1.0)
 * @returns {string} The generated full name
 * @throws {Error} If no genders are selected or required names cannot be generated
 *
 * @example
 * const name = generateRandomName({
 *     genders: ['male', 'any'],
 *     sourceNames: ['Blades 68'],
 *     nicknameFrequency: 0.25,
 *     titleFrequency: 0.10
 * });
 * // Returns something like: "Captain John Smith" or "Mary 'Rose' Jones"
 */
function generateRandomName(options) {
    const {
        genders,
        sourceNames = [],
        nicknameFrequency = DEFAULT_NICKNAME_FREQUENCY,
        titleFrequency = DEFAULT_TITLE_FREQUENCY
    } = options;

    // Validate that at least one non-'any' gender is selected
    const nonAnyGenders = genders.filter(g => g !== 'any');
    if (nonAnyGenders.length === 0) {
        throw new Error('Please select at least one gender (male, female, ambiguous, or queer)');
    }

    // Convert source names to tag IDs
    const sourceTagIds = sourceNames.length > 0 ? getTagIdsForSources(sourceNames) : [];

    if (sourceNames.length > 0 && sourceTagIds.length === 0) {
        throw new Error('No valid sources found in database');
    }

    // Get required first and last names
    const firstName = getWeightedName('first', genders, sourceTagIds);
    const lastName = getWeightedName('last', genders, sourceTagIds);

    if (!firstName || !lastName) {
        throw new Error('Could not find required first or last names in database with selected genders and sources');
    }

    let fullName = firstName;

    // Add nickname based on frequency
    if (nicknameFrequency > 0 && Math.random() < nicknameFrequency) {
        let nickname = null;
        const nicknameCount = countNames('nickname', genders, sourceTagIds);

        if (nicknameCount === 0) {
            // No nicknames available, use a first name instead
            nickname = getWeightedName('first', genders, sourceTagIds);
        } else {
            // 50/50 between actual nickname and first name
            if (Math.random() < 0.5) {
                nickname = getWeightedName('nickname', genders, sourceTagIds);
            } else {
                nickname = getWeightedName('first', genders, sourceTagIds);
            }
        }

        if (nickname) {
            fullName += ` "${nickname}"`;
        }
    }

    // Add last name
    fullName += ` ${lastName}`;

    // Add title based on frequency
    if (titleFrequency > 0 && Math.random() < titleFrequency) {
        let titleSourceTagIds = sourceTagIds;

        // If fewer than threshold titles available, also include Default titles
        if (sourceTagIds.length > 0) {
            const titleCount = countNames('title', genders, sourceTagIds);
            if (titleCount < THRESHOLD_TITLES_FOR_DEFAULT_FALLBACK) {
                const defaultTagResult = db.exec("SELECT id FROM tags WHERE tag_name = 'Default'");
                if (defaultTagResult.length > 0 && defaultTagResult[0].values.length > 0) {
                    titleSourceTagIds = [...sourceTagIds, defaultTagResult[0].values[0][0]];
                }
            }
        }

        const title = getWeightedName('title', genders, titleSourceTagIds);
        if (title) {
            fullName = `${title} ${fullName}`;
        }
    }

    return fullName;
}

// ============================================================================
// EXPORTS (for browser and Node.js usage)
// ============================================================================

const NameGeneratorDB = {
    // Constants
    THRESHOLD_FIRST_NAMES,
    THRESHOLD_LAST_NAMES,
    THRESHOLD_TITLES_FOR_DEFAULT_FALLBACK,
    DEFAULT_NICKNAME_FREQUENCY,
    DEFAULT_TITLE_FREQUENCY,

    // Database functions
    initDatabase,
    getDatabase,

    // Helper functions
    execParams,
    escapeSQL,  // Deprecated - use execParams() instead
    getSourceTags,
    getTagIdsForSources,
    getGenders,
    getPositions,
    getDatabaseStats,

    // Query builders
    buildNameViewerQuery,
    buildSourceStatsQuery,
    isUndersupplied,

    // Name generation
    getWeightedName,
    countNames,
    countNamesIncludingChildren,
    generateRandomName
};

// Make available globally (for browser classic scripts)
if (typeof window !== 'undefined') {
    window.NameGeneratorDB = NameGeneratorDB;
}

// Make available for Node.js/testing (globalThis works in both browser and Node)
if (typeof globalThis !== 'undefined') {
    globalThis.NameGeneratorDB = NameGeneratorDB;
}
