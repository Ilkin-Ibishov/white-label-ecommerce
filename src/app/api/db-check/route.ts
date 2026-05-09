import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("_dummy").select("*").limit(1);
    
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    
    return NextResponse.json({ 
      connected: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
