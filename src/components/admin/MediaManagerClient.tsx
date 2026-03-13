"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Check,
  Copy,
  Grid3X3,
  ImagePlus,
  List,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MediaRow = {
  id: string;
  url: string;
  public_id: string | null;
  filename: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  format: string | null;
  created_at: string;
};

type UploadTask = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 20;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function validateFile(file: File): string | null {
  const extension = fileExtension(file.name);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Formato non supportato";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Supera il limite di 10MB";
  }

  return null;
}

async function fetchMediaRows(): Promise<MediaRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("media")
    .select("id,url,public_id,filename,width,height,size,format,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MediaRow[];
}

export function MediaManagerClient() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");
  const [typeFilter, setTypeFilter] = useState<"all" | "images">("images");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: ["admin-media-library"],
    queryFn: fetchMediaRows,
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("media").delete().in("id", ids);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      setSelectedIds([]);
      setToast("Elementi eliminati con successo.");
      await queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
    },
    onError: (error: Error) => {
      setToast(error.message || "Errore durante eliminazione.");
    },
  });

  const mediaRows = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = mediaRows.filter((row) => {
      if (typeFilter === "images") {
        const format = (row.format ?? "").toLowerCase();
        if (format && !["jpg", "jpeg", "png", "webp", "gif"].includes(format)) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${row.filename ?? ""} ${row.public_id ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    if (sortBy === "name") {
      return [...filtered].sort((a, b) =>
        (a.filename ?? "").localeCompare(b.filename ?? "", "it", { sensitivity: "base" }),
      );
    }

    if (sortBy === "size") {
      return [...filtered].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
    }

    return [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [mediaRows, search, sortBy, typeFilter]);

  function queueToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredRows.map((row) => row.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id));
      }
      const merged = new Set([...prev, ...visibleIds]);
      return [...merged];
    });
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      queueToast("URL copiato!");
    } catch {
      queueToast("Impossibile copiare negli appunti.");
    }
  }

  function updateTask(taskId: string, updater: (task: UploadTask) => UploadTask) {
    setUploads((prev) => prev.map((task) => (task.id === taskId ? updater(task) : task)));
  }

  async function uploadFile(file: File, index: number) {
    const taskId = `${Date.now()}-${index}-${file.name}`;

    setUploads((prev) => [
      {
        id: taskId,
        name: file.name,
        progress: 8,
        status: "uploading",
      },
      ...prev,
    ]);

    const progressTimer = window.setInterval(() => {
      updateTask(taskId, (task) => {
        if (task.status !== "uploading") {
          return task;
        }
        return {
          ...task,
          progress: Math.min(92, task.progress + Math.floor(Math.random() * 16 + 4)),
        };
      });
    }, 220);

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/admin/cloudinary-upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorPayload = await response.text();
        throw new Error(errorPayload || "Upload non riuscito.");
      }

      updateTask(taskId, (task) => ({ ...task, progress: 100, status: "done" }));
    } catch (error) {
      updateTask(taskId, (task) => ({
        ...task,
        status: "error",
        error: error instanceof Error ? error.message : "Errore upload",
      }));
    } finally {
      window.clearInterval(progressTimer);
    }
  }

  async function handleFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    const limited = files.slice(0, MAX_FILES_PER_UPLOAD);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of limited) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length) {
      queueToast(errors[0] || "Alcuni file non sono validi.");
    }

    for (const [index, file] of validFiles.entries()) {
      // Upload in sequenza per ridurre errori su hosting shared.
      await uploadFile(file, index);
    }

    await queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });

    if (validFiles.length) {
      queueToast(`Caricati ${validFiles.length} file.`);
    }
  }

  async function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList?.length) {
      return;
    }

    await handleFiles(Array.from(fileList));
    event.target.value = "";
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);

    const dropped = Array.from(event.dataTransfer.files ?? []);
    await handleFiles(dropped);
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-[#E6D6C8] bg-white px-4 py-2 text-sm text-[#5C5048] shadow-lg">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-col gap-3 rounded-2xl border border-black/7 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-4xl text-[#1E1810] md:text-5xl">Media Library</h1>
          <p className="text-sm text-[#6F645A]">Gestisci immagini del sito e copia URL in un click.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#D4918F] px-5 text-sm font-medium text-white"
        >
          <ImagePlus size={16} />
          Carica Immagini
        </button>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        multiple
        className="hidden"
        onChange={onFileInputChange}
      />

      <section
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-2xl border border-dashed bg-white p-6 text-center transition",
          isDragOver ? "border-[#D4918F] bg-[#FDF5F5]" : "border-[#D7CEC1]",
        )}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F7E9E8] text-[#D4918F]">
            <UploadCloud size={20} />
          </span>
          <p className="font-medium text-[#1E1810]">Trascina immagini qui o tocca per selezionarle</p>
          <p className="text-xs text-[#7A6F66]">
            Formati supportati: JPG, PNG, WEBP, GIF · max 10MB · fino a 20 file
          </p>
        </div>
      </section>

      {uploads.length ? (
        <section className="space-y-2 rounded-2xl border border-black/7 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8C8076]">Upload in corso</p>
          <div className="space-y-2">
            {uploads.slice(0, 8).map((task) => (
              <div key={task.id} className="rounded-xl border border-[#EFE4D8] p-3">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <p className="line-clamp-1 text-[#5C5048]">{task.name}</p>
                  <span className="text-[#8E8278]">
                    {task.status === "done" ? "Completato" : task.status === "error" ? "Errore" : "Upload"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#F0E6DB]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      task.status === "error" ? "bg-[#D0726C]" : "bg-[#D4918F]",
                    )}
                    style={{ width: `${task.status === "error" ? 100 : task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-black/7 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px_auto]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9088]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca per nome file..."
              className="h-12 w-full rounded-full border border-black/10 pl-10 pr-4 text-sm outline-none focus:border-[#D4918F]"
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | "images")}
            className="h-12 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="images">Immagini</option>
            <option value="all">Tutto</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "recent" | "name" | "size")}
            className="h-12 rounded-full border border-black/10 px-4 text-sm outline-none focus:border-[#D4918F]"
          >
            <option value="recent">Più recente</option>
            <option value="name">Nome</option>
            <option value="size">Dimensione</option>
          </select>

          <button
            type="button"
            onClick={() => setViewMode((mode) => (mode === "grid" ? "list" : "grid"))}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-4 text-sm text-[#5C5048]"
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
            {viewMode === "grid" ? "Vista lista" : "Vista griglia"}
          </button>

          <button
            type="button"
            onClick={() => deleteMutation.mutate(selectedIds)}
            disabled={!selectedIds.length || deleteMutation.isPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#EDC6C3] px-4 text-sm text-[#A24D49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Elimina selezionati ({selectedIds.length})
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6F645A]">{filteredRows.length} elementi</p>
          <button
            type="button"
            onClick={toggleSelectAllVisible}
            className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-[#5C5048]"
          >
            <Check size={14} />
            Seleziona visibili
          </button>
        </div>

        {mediaQuery.isLoading ? (
          <div className="rounded-2xl border border-black/7 bg-white p-6 text-sm text-[#6F645A]">Caricamento media...</div>
        ) : mediaQuery.isError ? (
          <div className="rounded-2xl border border-[#EDC6C3] bg-[#FFF5F4] p-6 text-sm text-[#A24D49]">
            {(mediaQuery.error as Error).message}
          </div>
        ) : !filteredRows.length ? (
          <div className="rounded-2xl border border-dashed border-[#D7CEC1] bg-white p-8 text-center text-sm text-[#6F645A]">
            Nessuna immagine trovata. Carica i primi file dalla sezione sopra.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
            {filteredRows.map((media) => {
              const selected = selectedIds.includes(media.id);

              return (
                <article
                  key={media.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white",
                    selected ? "border-[#D4918F]" : "border-black/7",
                  )}
                >
                  <div className="relative aspect-square overflow-hidden bg-[#F2EAE0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.url} alt={media.filename ?? "Media"} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => toggleSelection(media.id)}
                      className={cn(
                        "absolute left-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/95",
                        selected ? "border-[#D4918F] text-[#D4918F]" : "border-black/10 text-[#5C5048]",
                      )}
                      aria-label="Seleziona media"
                    >
                      <Check size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 p-3">
                    <p className="line-clamp-1 text-xs font-medium text-[#1E1810]">
                      {media.filename ?? media.public_id ?? "Senza nome"}
                    </p>
                    <p className="text-[11px] text-[#8E8278]">
                      {media.width ?? "-"}×{media.height ?? "-"} · {formatBytes(media.size)} · {formatDate(media.created_at)}
                    </p>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(media.url)}
                        className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-black/10 px-2 text-[11px] text-[#5C5048]"
                      >
                        <Copy size={12} />
                        Copia URL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void copyToClipboard(media.url);
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 px-2 text-[11px] text-[#5C5048]"
                      >
                        Usa come...
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate([media.id])}
                        className="col-span-2 inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-[#EDC6C3] px-2 text-[11px] text-[#A24D49]"
                      >
                        <Trash2 size={12} />
                        Elimina
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/7 bg-white">
            {filteredRows.map((media) => {
              const selected = selectedIds.includes(media.id);

              return (
                <div
                  key={media.id}
                  className={cn(
                    "grid grid-cols-[36px_68px_1fr_auto] items-center gap-3 border-b border-black/7 px-3 py-2",
                    selected ? "bg-[#FFF7F7]" : "",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelection(media.id)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                      selected ? "border-[#D4918F] text-[#D4918F]" : "border-black/10 text-[#5C5048]",
                    )}
                  >
                    <Check size={14} />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.filename ?? "Media"} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-[#1E1810]">
                      {media.filename ?? media.public_id ?? "Senza nome"}
                    </p>
                    <p className="text-xs text-[#8E8278]">
                      {media.width ?? "-"}×{media.height ?? "-"} · {formatBytes(media.size)} · {formatDate(media.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(media.url)}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/10 px-3 text-xs text-[#5C5048]"
                    >
                      Copia URL
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate([media.id])}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#EDC6C3] px-3 text-xs text-[#A24D49]"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
