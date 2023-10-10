import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {

    try {
        const { year, category, competition } = context.params;

        return NextResponse.json({year, category, competition});
        
    } catch (error) {
        return NextResponse.json(error);
    }

}