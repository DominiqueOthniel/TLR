import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Supabase non configuré (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant).');
    return null;
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
}

export async function uploadImageFromDataUrl(
  bucket: string,
  path: string,
  dataUrl: string,
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    return dataUrl;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return dataUrl;
  }

  const mimeType = match[1];
  const base64 = match[2];

  try {
    const buffer = Buffer.from(base64, 'base64');

    const { error: uploadError } = await client.storage.from(bucket).upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (uploadError) {
      console.error('Erreur upload Supabase', uploadError.message);
      return dataUrl;
    }

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      console.error('Impossible de récupérer l’URL publique Supabase');
      return dataUrl;
    }

    return data.publicUrl;
  } catch (err) {
    console.error('Exception upload Supabase', err);
    return dataUrl;
  }
}

