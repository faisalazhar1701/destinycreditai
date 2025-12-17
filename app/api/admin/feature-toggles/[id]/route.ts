import { NextResponse, NextRequest } from "next/server";

// GET request
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // type-safe fix
  // aapka existing GET logic yahan rahega
  return NextResponse.json({ message: `Feature toggle ${id}` });
}

// PATCH request
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // aapka existing PATCH logic yahan rahega
  return NextResponse.json({ success: true });
}

// DELETE request
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // aapka existing DELETE logic yahan rahega
  return NextResponse.json({ success: true });
}
