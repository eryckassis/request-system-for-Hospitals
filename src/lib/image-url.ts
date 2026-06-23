import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve uma lista de imagens do bucket `ticket-images`.
 * Aceita tanto caminhos do storage (novo formato) quanto URLs completas
 * (formato antigo com getPublicUrl) e retorna URLs prontas para uso.
 */
export async function resolveTicketImageUrls(
  items: string[],
): Promise<string[]> {
  if (!items?.length) return [];
  const out: string[] = [];
  const paths: { idx: number; path: string }[] = [];

  items.forEach((it, idx) => {
    if (!it) {
      out[idx] = "";
      return;
    }
    // URL antiga já assinada/pública
    if (/^https?:\/\//i.test(it)) {
      // Se for getPublicUrl antigo de bucket privado, tenta extrair o path
      const m = it.match(/\/ticket-images\/(.+)$/);
      if (m) {
        paths.push({ idx, path: decodeURIComponent(m[1]) });
        out[idx] = "";
      } else {
        out[idx] = it;
      }
    } else {
      paths.push({ idx, path: it });
      out[idx] = "";
    }
  });

  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from("ticket-images")
      .createSignedUrls(
        paths.map((p) => p.path),
        60 * 60,
      );
    data?.forEach((signed, i) => {
      const target = paths[i];
      out[target.idx] = signed.signedUrl ?? "";
    });
  }
  return out.filter(Boolean);
}
