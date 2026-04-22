import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
    try { 
        const { id } = context.params;
        const query = groq`*[_type == "fixture" && _id == $id]`
        const fixture = await clientV2.fetch(query, { id });

        // Existence checking
        if (!fixture || fixture.length === 0) {
            return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
        }

        return NextResponse.json(fixture)
    } catch (error) {
        return NextResponse.json(error);
    }

}