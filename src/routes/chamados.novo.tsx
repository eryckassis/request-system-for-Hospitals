/* eslint-disable prettier/prettier */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Monitor,
  Wrench,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageEnter } from "@/hooks/use-gsap";
import { departmentLabel } from "@/components/status-badge";

const searchSchema = z.object({
  dept: z.enum(["ti", "manutencao"]).catch("ti"),
});

export const Route = createFileRoute("/chamados/novo")({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const dept = (match.search as { dept: "ti" | "manutencao" }).dept;
    return {
      meta: [
        { title: `Novo chamado — ${departmentLabel(dept)}` },
        {
          name: "description",
          content: `Abra um novo chamado para ${departmentLabel(dept)}.`,
        },
      ],
    };
  },
  component: NewTicketPage,
});

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const formSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  sector_id: z.string().uuid("Selecione um setor"),
  title: z.string().trim().min(4, "Mínimo 4 caracteres").max(120),
  description: z.string().trim().min(10, "Descreva com mais detalhes").max(2000),
});

type FormValues = z.infer<typeof formSchema>;

function NewTicketPage() {
  const { dept } = Route.useSearch();
  const navigate = useNavigate();
  const ref = usePageEnter<HTMLDivElement>();

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const sectorsQuery = useQuery({
    queryKey: ["sectors", dept],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("id, name")
        .eq("department", dept)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["users-autocomplete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, sector_id")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", sector_id: "", title: "", description: "" },
  });

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = [...files];
      for (const f of accepted) {
        if (next.length >= MAX_IMAGES) {
          toast.error(`Máximo de ${MAX_IMAGES} imagens.`);
          break;
        }
        if (f.size > MAX_SIZE) {
          toast.error(`"${f.name}" excede 5 MB.`);
          continue;
        }
        next.push(f);
      }
      setFiles(next);
    },
    [files],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const removeFile = (i: number) =>
    setFiles((arr) => arr.filter((_, idx) => idx !== i));

  const onSubmit = form.handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 1) Upload images — guarda apenas o caminho no storage (bucket privado)
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${dept}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("ticket-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        uploadedPaths.push(path);
      }

      // 2) Upsert do usuário para alimentar o autocomplete (best-effort)
      try {
        await supabase
          .from("users")
          .upsert(
            { name: values.name.trim(), sector_id: values.sector_id },
            { onConflict: "name", ignoreDuplicates: false },
          );
      } catch {
        // silencioso
      }


      // 3) Insert ticket
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          title: values.title,
          description: values.description,
          department: dept,
          sector_id: values.sector_id,
          user_name_snapshot: values.name,
          images: uploadedPaths,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success("Chamado aberto com sucesso.");
      navigate({ to: "/chamados/$id", params: { id: data.id } });
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Não foi possível abrir o chamado.",
      );
    } finally {
      setSubmitting(false);
    }
  });


  const Icon = dept === "ti" ? Monitor : Wrench;

  return (
    <div ref={ref} className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4" />
            {departmentLabel(dept)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Novo chamado
        </p>
        <h1 className="font-instrument italic  mt-2 text-3xl sm:text-4xl tracking-tight">
          Conte o que está acontecendo.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Quanto mais detalhes, mais rápido a equipe consegue resolver.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input
                id="name"
                placeholder="Ex: Maria Silva"
                list="users-autocomplete"
                autoComplete="off"
                {...form.register("name", {
                  onChange: (e) => {
                    const match = usersQuery.data?.find(
                      (u) =>
                        u.name.toLowerCase() ===
                        e.target.value.trim().toLowerCase(),
                    );
                    if (match?.sector_id) {
                      form.setValue("sector_id", match.sector_id, {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
              <datalist id="users-autocomplete">
                {usersQuery.data?.map((u) => (
                  <option key={u.id} value={u.name} />
                ))}
              </datalist>
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>


            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select
                value={form.watch("sector_id")}
                onValueChange={(v) =>
                  form.setValue("sector_id", v, { shouldValidate: true })
                }
              >
                <SelectTrigger id="sector">
                  <SelectValue
                    placeholder={
                      sectorsQuery.isLoading
                        ? "Carregando..."
                        : sectorsQuery.data?.length
                          ? "Selecione o setor"
                          : "Nenhum setor cadastrado"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sectorsQuery.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sector_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.sector_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Resumo do problema"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={6}
              placeholder="Descreva o problema com o máximo de detalhes."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagens (opcional)</Label>
            <div
              {...getRootProps()}
              className={`rounded-md border border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-white/60 bg-white/5"
                  : "border-border hover:border-white/30"
              }`}
            >
              <input {...getInputProps()} />
              <ImagePlus className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm">
                Arraste e solte ou{" "}
                <span className="underline">clique para enviar</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Até {MAX_IMAGES} imagens · máx 5 MB cada
              </p>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                {previews.map((p, i) => (
                  <div
                    key={p.url}
                    className="relative aspect-square rounded-md overflow-hidden border border-border bg-surface"
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 rounded-md bg-black/70 p-1 hover:bg-black"
                      aria-label="Remover"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={submitting} className="min-w-40">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Enviando..." : "Abrir chamado"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
