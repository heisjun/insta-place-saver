import { createClient } from "@/lib/supabase/server";
import { PlaceCategory } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// GET /api/places?category=카페
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get(
    "category"
  ) as PlaceCategory | null;

  let query = supabase
    .from("places")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/places
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, category, latitude, longitude } = body;

  if (!name || !category || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "name, category, latitude, longitude는 필수입니다" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("places")
    .insert({
      user_id: user.id,
      name,
      address: body.address ?? null,
      category,
      latitude,
      longitude,
      memo: body.memo ?? null,
      instagram_url: body.instagram_url ?? null,
      instagram_caption: body.instagram_caption ?? null,
      instagram_image_urls: body.instagram_image_urls ?? null,
      kakao_place_id: body.kakao_place_id ?? null,
      kakao_place_url: body.kakao_place_url ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
