// supabase/functions/create-client/index.ts
// Deploy: supabase functions deploy create-client
// No necesita secrets — lee la service key de la tabla app_settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const respond = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Cliente con la sesion del coach
    const coachClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar sesion
    const { data: { user: coachUser }, error: authErr } = await coachClient.auth.getUser();
    if (authErr || !coachUser) return respond({ error: "Sesion invalida" }, 401);

    // Verificar que es coach Y obtener la service key de app_settings
    const { data: coachProfile } = await coachClient
      .from("profiles")
      .select("role")
      .eq("id", coachUser.id)
      .single();

    if (coachProfile?.role !== "coach") {
      return respond({ error: "Solo los entrenadores pueden crear clientes" }, 403);
    }

    // Leer service key desde app_settings (igual que la anthropic_key)
    const { data: settings } = await coachClient
      .from("app_settings")
      .select("supabase_service_key")
      .eq("user_id", coachUser.id)
      .maybeSingle();

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY") || settings?.supabase_service_key || "";

    if (!serviceKey) {
      return respond({
        error: "Falta la Supabase Service Key. Anadela en Ajustes de la app."
      }, 400);
    }

    // Parsear datos del nuevo cliente
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return respond({ error: "email, password y full_name son obligatorios" }, 400);
    }
    if (password.length < 6) {
      return respond({ error: "La contrasena debe tener al menos 6 caracteres" }, 400);
    }

    // Crear usuario con Admin API usando la service key
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      const msg = createErr.message.includes("already registered")
        ? "Ya existe un usuario con ese email"
        : createErr.message;
      return respond({ error: msg }, 400);
    }

    // Asignar rol client + coach_id en profiles
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert({
        id:       newUser.user.id,
        email,
        full_name,
        role:     "client",
        coach_id: coachUser.id,
      }, { onConflict: "id" });

    if (profileErr) {
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return respond({ error: "Error al crear perfil: " + profileErr.message }, 500);
    }

    return respond({
      ok: true,
      client: { id: newUser.user.id, email, full_name },
    });

  } catch (err) {
    return respond({ error: err.message }, 500);
  }
});