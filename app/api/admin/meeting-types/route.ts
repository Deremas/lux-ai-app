import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetingType } from "@/db/schema";

// Create a new meeting type
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, heading, subheading, description, pricePolicy } = body;

  try {
    const newMeetingType = await db
      .insert(meetingType)
      .values({
        name,
        heading,
        subheading,
        description,
        pricePolicy,
      })
      .returning();

    return NextResponse.json(newMeetingType, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create meeting type", details: message },
      { status: 500 },
    );
  }
}

// Fetch all meeting types
export async function GET() {
  try {
    const meetingTypes = await db.select().from(meetingType);
    return NextResponse.json(meetingTypes, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch meeting types", details: message },
      { status: 500 },
    );
  }
}
