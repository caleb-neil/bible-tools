// src/pages/api/genealogy/[id].js
import sql from '../../../lib/db.js';

// This function runs on the server when someone requests this URL
export async function GET({ params, request }) {
    const genealogyId = params.id;

    try {
        const treeData = await sql`
        WITH tree_links AS (
            SELECT 
                le.child_id AS id,
                le.parent_id AS parentId,
                p.name,
                p.data,
                le.sort_order
            FROM lineage_entries le
            JOIN people p ON le.child_id = p.id
            WHERE le.source_id = ${genealogyId}
        ),
        tree_root AS (
            SELECT 
                p.id,
                NULL::int AS parentId, -- Root has no parent
                p.name,
                p.data,
                -1 AS sort_order -- Ensure root comes first
            FROM people p
            WHERE p.id IN (
                SELECT parent_id FROM lineage_entries WHERE source_id = ${genealogyId}
            )
            AND p.id NOT IN (
                SELECT child_id FROM lineage_entries WHERE source_id = ${genealogyId}
            )
        )
        SELECT * FROM tree_root
        UNION ALL
        SELECT * FROM tree_links
        ORDER BY sort_order ASC;
        `;

        return new Response(JSON.stringify(treeData), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Database failed" }), { status: 500 });
    }
}