import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
  editable?: boolean;
  className?: string;
};

const MAX = 2 * 1024 * 1024;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminAvatar({
  userId,
  name,
  avatarUrl,
  size = "sm",
  editable = false,
  className,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const dim = size === "md" ? "size-14" : "size-9";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Selecione uma imagem");
    }
    if (file.size > MAX) return toast.error("Máximo 2MB");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const { error: dbErr } = await supabase
      .from("admins")
      .update({ avatar_url: path })
      .eq("id", userId);
    setUploading(false);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("Foto atualizada");
    qc.invalidateQueries({ queryKey: ["admin-context"] });
  };

  const trigger = () => input.current?.click();

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar className={dim}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
        <AvatarFallback className="bg-surface-2 text-xs">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {editable && (
        <>
          <button
            type="button"
            onClick={trigger}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid place-items-center size-5 rounded-full bg-foreground text-background border-2 border-background hover:scale-105 transition-transform"
            aria-label="Trocar foto"
          >
            {uploading ? (
              <Loader2 className="size-2.5 animate-spin" />
            ) : (
              <Camera className="size-2.5" />
            )}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </>
      )}
    </div>
  );
}
