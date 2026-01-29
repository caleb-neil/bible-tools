// src/pages/api/genealogy/[id].js
import sql from '../../../lib/db.js';

// This function runs on the server when someone requests this URL
export async function GET({ params, request }) {
    const genealogyId = params.id;

    try {
        // 1. Ask the database for the specific tree data
        // (Adjust this query to match your actual table structure)
        const treeData = await sql`
        SELECT 
            p.id, 
            p.name, 
            le.parent_id as parentId
        FROM people p
        LEFT JOIN lineage_entries le ON p.id = le.child_id
        WHERE le.source_id = ${genealogyId}

        UNION

        SELECT 
            p.id, 
            p.name, 
            NULL as parentId
        FROM people p
        WHERE p.id IN (
            SELECT parent_id FROM lineage_entries WHERE source_id = ${genealogyId}
        )
        AND p.id NOT IN (
            SELECT child_id FROM lineage_entries WHERE source_id = ${genealogyId}
        );
        `;

        // 2. Send the JSON back to the browser
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