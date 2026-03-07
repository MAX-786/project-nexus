import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

// Input validation schema according to nexus-supabase-db rules
const searchSchema = z.object({
  query_embedding: z.array(z.number()).length(1536).optional(),
  search_term: z.string().optional(),
  limit: z.number().min(1).max(50).default(10)
}).refine(data => data.query_embedding !== undefined || data.search_term !== undefined, {
  message: "Either query_embedding or search_term must be provided"
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const parsed = searchSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.format() }, { status: 400 });
    }
    
    const { query_embedding, search_term, limit } = parsed.data;

    // Verify Authorization
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Execute Database Transaction
    let result;
    
    // If only keyword search without semantic embedding
    if (!query_embedding && search_term) {
      result = await supabase
        .from('nodes')
        .select('id, title, url, summary')
        .or(`title.ilike.%${search_term}%,summary.ilike.%${search_term}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
    } 
    // Handle semantic vector and hybrid search via our newly created RPC function
    else {
      result = await supabase.rpc('search_nodes_hybrid', {
        query_embedding: query_embedding ? `[${query_embedding.join(',')}]` : null, // Convert array to pgvector string format
        search_term: search_term || null,
        match_count: limit
      });
    }

    if (result.error) {
      console.error("[Nexus] Supabase search error:", result.error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Return Standardized Response
    return NextResponse.json({ results: result.data });

  } catch (error) {
    console.error("[Nexus] Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
