import { supabase } from "@/shared/lib/supabaseClient";

const BUCKET = "receipts";

export async function uploadReceipt(file: File, expenseId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `expenses/${expenseId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteReceipt(url: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
