// Edge function: delete a user (admin only)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Validate caller
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Admin client
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller must be an ACTIVE admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (callerProfile?.status !== "ativo") return json({ error: "Forbidden" }, 403);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid body" }, 400); }
    const userId = body?.userId;
    if (!userId || typeof userId !== "string") return json({ error: "userId required" }, 400);
    if (userId === user.id) return json({ error: "Não é possível remover você mesmo" }, 400);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("admin-delete-user delete error:", delErr.message);
      return json({ error: "Falha ao remover usuário" }, 500);
    }

    return json({ success: true });
  } catch (e) {
    console.error("admin-delete-user unexpected:", (e as Error).message);
    return json({ error: "Erro interno" }, 500);
  }
});
