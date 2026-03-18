import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { email, password, first_name, last_name } = parsed.data;
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
      },
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data.user });
}

