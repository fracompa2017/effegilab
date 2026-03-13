"use client";

import { useParams } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  GripVertical,
  Images,
  LayoutTemplate,
  MessageSquareText,
  MinusSquare,
  Palette,
  Pencil,
  PlusCircle,
  Rocket,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { PageBlock } from "@/types";
import { BlockEditor } from "@/components/page-builder/BlockEditor";

type BlockTemplate = {
  type: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  defaults: Record<string, unknown>;
};

type PageMeta = {
  label: string;
  previewPath: string;
};

const pageMetaMap: Record<string, PageMeta> = {
  homepage: { label: "Homepage", previewPath: "/" },
  "chi-siamo": { label: "Chi siamo", previewPath: "/chi-siamo" },
  "come-funziona": { label: "Come funziona", previewPath: "/come-funziona" },
  contatti: { label: "Contatti", previewPath: "/contatti" },
};

const blockLibrary: BlockTemplate[] = [
  {
    type: "hero",
    label: "Hero",
    icon: Sparkles,
    defaults: {
      kicker: "Artigianato Napoletano",
      title: "Ogni storia d'amore merita di essere raccontata",
      subtitle: "Wedding stationery artigianale e personalizzata.",
      ctaText: "Scopri le partecipazioni",
      ctaLink: "/shop",
      ctaSecondaryText: "Contattaci",
      ctaSecondaryLink: "/contatti",
      backgroundGradient: "rose",
      emoji: "💍",
    },
  },
  {
    type: "categories",
    label: "Categorie",
    icon: LayoutTemplate,
    defaults: {
      title: "Categorie evento",
      subtitle: "Scegli il tuo momento speciale",
      showAll: false,
    },
  },
  {
    type: "collections",
    label: "Collezioni",
    icon: Palette,
    defaults: {
      title: "Collezioni",
      subtitle: "Linee iconiche Effegi Lab",
      maxItems: 8,
    },
  },
  {
    type: "products",
    label: "Prodotti",
    icon: PlusCircle,
    defaults: {
      title: "I piu amati",
      subtitle: "Prodotti scelti dalle nostre coppie",
      categorySlug: "",
      collectionName: "",
      maxItems: 8,
      columns: 4,
    },
  },
  {
    type: "how-it-works",
    label: "Come funziona",
    icon: Rocket,
    defaults: {
      title: "Come funziona",
      steps: [
        { number: "1", title: "Scegli il prodotto", description: "Seleziona il prodotto da personalizzare." },
        { number: "2", title: "Ricevi la bozza", description: "Ti inviamo la proposta grafica." },
        { number: "3", title: "Conferma", description: "Approvi la bozza via WhatsApp." },
        { number: "4", title: "Consegna", description: "Produciamo e spediamo in circa 7 giorni lavorativi." },
      ],
    },
  },
  {
    type: "text-image",
    label: "Testo + Immagine",
    icon: Images,
    defaults: {
      title: "Il nostro stile artigianale",
      text: "Ogni progetto nasce su misura e viene condiviso in bozza prima della produzione.",
      imageUrl: "",
      imagePosition: "right",
      ctaText: "Scopri di piu",
      ctaLink: "/chi-siamo",
    },
  },
  {
    type: "banner-promo",
    label: "Banner promo",
    icon: Sparkles,
    defaults: {
      text: "LAB15: 15% di sconto",
      subtext: "Spedizione gratuita oltre 150 euro",
      backgroundColor: "#E8B4B4",
      ctaText: "Vai allo shop",
      ctaLink: "/shop",
    },
  },
  {
    type: "instagram",
    label: "Instagram",
    icon: Images,
    defaults: {
      title: "Seguici su Instagram",
      handle: "@effegilab",
      maxItems: 6,
    },
  },
  {
    type: "reviews",
    label: "Recensioni",
    icon: MessageSquareText,
    defaults: {
      title: "Recensioni",
      subtitle: "Le parole delle nostre coppie",
    },
  },
  {
    type: "consult-banner",
    label: "Banner consulenza",
    icon: Rocket,
    defaults: {
      title: "Prenota una call creativa",
      subtitle: "Consulenza personalizzata",
      text: "Dalla palette al materiale, progettiamo insieme i tuoi coordinati.",
      ctaText: "Prenota consulenza",
      ctaLink: "https://effegi-lab2.reservio.com/booking",
      ctaSecondaryText: "Scrivici su WhatsApp",
      ctaSecondaryLink: "https://wa.me/393333333333",
    },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: MinusSquare,
    defaults: {
      height: 48,
    },
  },
];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function cloneBlocks(blocks: PageBlock[]) {
  return blocks.map((block) => ({
    ...block,
    props: { ...block.props },
  }));
}

function normalizeBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as PageBlock[])
    .filter((block) => Boolean(block?.id && block?.type))
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({
      ...block,
      order: index,
      props: block.props ?? {},
    }));
}

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function sortableId(blockId: string) {
  return `block:${blockId}`;
}

function parseBlockId(id: string) {
  return id.replace("block:", "");
}

function parsePaletteType(id: string) {
  return id.replace("palette:", "");
}

function toPreviewText(block: PageBlock) {
  const props = block.props ?? {};
  const title =
    asString(props.title) ||
    asString(props.text) ||
    asString(props.subtitle) ||
    asString(props.subtext);

  if (block.type === "spacer") {
    return `Altezza: ${asNumber(props.height, 48)}px`;
  }

  return title || "Blocco configurabile";
}

function toPreviewLines(block: PageBlock) {
  const props = block.props ?? {};
  const lines: string[] = [];

  if (block.type === "spacer") {
    return [`Spazio verticale: ${asNumber(props.height, 48)}px`];
  }

  const title = asString(props.title);
  const subtitle = asString(props.subtitle);
  const ctaText = asString(props.ctaText);
  const text = asString(props.text);
  const subtext = asString(props.subtext);

  if (title) {
    lines.push(`"${title}"`);
  }

  if (subtitle) {
    lines.push(subtitle);
  } else if (!title && text) {
    lines.push(text);
  } else if (subtext) {
    lines.push(subtext);
  }

  if (ctaText) {
    lines.push(`CTA: "${ctaText}"`);
  }

  if (!lines.length) {
    lines.push("Blocco configurabile");
  }

  return lines.slice(0, 2);
}

function absolutePreviewUrl(previewPath: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const normalizedPath = previewPath.startsWith("/") ? previewPath : `/${previewPath}`;

  if (!base) {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
}

function createBlockFromTemplate(template: BlockTemplate, order: number): PageBlock {
  return {
    id: uniqueId(template.type),
    type: template.type,
    props: { ...template.defaults },
    order,
  };
}

function createDefaultBlocksForPage(pageKey: string): PageBlock[] {
  if (pageKey !== "homepage") {
    return [];
  }

  const defaultOrder = [
    "hero",
    "categories",
    "collections",
    "products",
    "how-it-works",
    "reviews",
    "consult-banner",
  ];

  return defaultOrder
    .map((type, index) => {
      const template = blockLibrary.find((entry) => entry.type === type);
      if (!template) {
        return null;
      }

      return {
        id: uniqueId(`preset-${template.type}`),
        type: template.type,
        props: { ...template.defaults },
        order: index,
      } satisfies PageBlock;
    })
    .filter(Boolean) as PageBlock[];
}

function DraggablePaletteItem({
  template,
  onAdd,
}: {
  template: BlockTemplate;
  onAdd: () => void;
}) {
  const id = `palette:${template.type}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const Icon = template.icon;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onAdd}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 py-2 text-left text-sm text-[#5C5048] hover:border-[#D4918F]/60 hover:bg-[#FFF9F8]",
        isDragging ? "opacity-70" : "",
      )}
      {...listeners}
      {...attributes}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4EEE5] text-[#7A6E66]">
        <Icon size={14} />
      </span>
      <span className="leading-tight">{template.label}</span>
    </button>
  );
}

function SortableCanvasBlock({
  block,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const template = blockLibrary.find((item) => item.type === block.type);
  const Icon = template?.icon ?? LayoutTemplate;
  const blockLabel = template?.label ?? block.type;
  const previewLines = toPreviewLines(block);
  const id = sortableId(block.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "relative rounded-2xl border bg-white p-4 shadow-sm transition",
        isSelected ? "border-[#D4918F] ring-2 ring-[#D4918F]/30" : "border-black/10",
        isDragging ? "opacity-60" : "",
      )}
      onClick={onSelect}
      role="presentation"
    >
      {isSelected ? (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveUp();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#5C5048] hover:bg-[#F8F6F2]"
            aria-label="Sposta su"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMoveDown();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#5C5048] hover:bg-[#F8F6F2]"
            aria-label="Sposta giu"
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[#5C5048] hover:bg-[#F8F6F2]"
            aria-label="Modifica blocco"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#EDC6C3] text-[#A24D49] hover:bg-[#FFF5F5]"
            aria-label="Elimina blocco"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4EEE5] text-[#6E6158]">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9C9088]">
              {blockLabel}
            </p>
            <p className="truncate text-sm font-semibold text-[#1E1810]">{previewLines[0] ?? toPreviewText(block)}</p>
            {previewLines[1] ? (
              <p className="truncate text-xs text-[#6F635A]">{previewLines[1]}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#7A6E66] hover:bg-[#F8F6F2]"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          aria-label="Modifica blocco"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      </div>
    </article>
  );
}

export default function AdminPageBuilderPage() {
  const routeParams = useParams<{ page: string }>();
  const page = routeParams?.page ?? "";
  const supabase = useMemo(() => createClient(), []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { setNodeRef: setCanvasNodeRef, isOver: isCanvasOver } = useDroppable({ id: "canvas" });

  const [isLoading, setIsLoading] = useState(true);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<PageBlock[][]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string; tone: "success" | "error" | "info" } | null>(
    null,
  );

  const initializedRef = useRef(false);
  const blocksRef = useRef<PageBlock[]>([]);
  const lastSavedSnapshotRef = useRef("");

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const showToast = useCallback((message: string, tone: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    if (!page) {
      return;
    }

    let active = true;

    async function load() {
      setIsLoading(true);
      const tryLoadByPage = async (pageName: string) =>
        supabase
          .from("page_content")
          .select("page, blocks")
          .eq("page", pageName)
          .maybeSingle();

      let response = await tryLoadByPage(page);
      if ((!response.data || !response.data.blocks) && page === "homepage") {
        response = await tryLoadByPage("home");
      }

      if (!active) {
        return;
      }

      if (response.error) {
        showToast("Errore nel caricamento dei blocchi.", "error");
        setIsLoading(false);
        return;
      }

      const loadedBlocks = normalizeBlocks(response.data?.blocks);
      const effectiveBlocks = loadedBlocks.length ? loadedBlocks : createDefaultBlocksForPage(page);

      if (!loadedBlocks.length && effectiveBlocks.length) {
        showToast("Caricati blocchi base. Premi Pubblica per applicarli al sito.", "info");
      }

      setBlocks(effectiveBlocks);
      setSelectedBlockId(effectiveBlocks[0]?.id ?? null);
      setHistory([]);
      lastSavedSnapshotRef.current = JSON.stringify(effectiveBlocks);
      initializedRef.current = true;
      setIsLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [page, showToast, supabase]);

  const pageMeta = pageMetaMap[page];

  useEffect(() => {
    if (!page || !pageMeta) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!initializedRef.current) {
        return;
      }

      const snapshot = JSON.stringify(blocksRef.current);
      if (snapshot === lastSavedSnapshotRef.current) {
        return;
      }

      void (async () => {
        const payload = {
          page,
          blocks: blocksRef.current,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("page_content").upsert(payload, { onConflict: "page" });
        if (error) {
          showToast("Auto-save non riuscito.", "error");
          return;
        }

        lastSavedSnapshotRef.current = snapshot;
        showToast("Salvato automaticamente", "success");
      })();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [page, pageMeta, showToast, supabase]);

  function withHistory(updater: (current: PageBlock[]) => PageBlock[]) {
    setBlocks((current) => {
      const next = updater(current).map((item, index) => ({ ...item, order: index }));
      setHistory((prev) => [...prev, cloneBlocks(current)].slice(-20));
      return next;
    });
  }

  function addBlock(type: string, index?: number) {
    const template = blockLibrary.find((item) => item.type === type);
    if (!template) {
      return;
    }

    withHistory((current) => {
      const newBlock = createBlockFromTemplate(template, current.length);
      if (typeof index === "number" && index >= 0 && index <= current.length) {
        const next = [...current];
        next.splice(index, 0, newBlock);
        setSelectedBlockId(newBlock.id);
        return next;
      }
      setSelectedBlockId(newBlock.id);
      return [...current, newBlock];
    });
  }

  function updateBlock(nextBlock: PageBlock) {
    withHistory((current) =>
      current.map((item) => (item.id === nextBlock.id ? { ...nextBlock } : item)),
    );
  }

  function removeBlock(blockId: string) {
    withHistory((current) => current.filter((item) => item.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }

  function moveSelected(direction: "up" | "down") {
    if (!selectedBlockId) {
      return;
    }

    withHistory((current) => {
      const currentIndex = current.findIndex((item) => item.id === selectedBlockId);
      if (currentIndex < 0) {
        return current;
      }

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      return arrayMove(current, currentIndex, nextIndex);
    });
  }

  function undo() {
    setHistory((currentHistory) => {
      const previous = currentHistory.at(-1);
      if (!previous) {
        return currentHistory;
      }
      setBlocks(previous.map((item, index) => ({ ...item, order: index })));
      setSelectedBlockId((currentSelected) =>
        previous.some((item) => item.id === currentSelected) ? currentSelected : previous[0]?.id ?? null,
      );
      return currentHistory.slice(0, -1);
    });
  }

  async function saveBlocks(mode: "publish" | "auto" = "publish") {
    if (!page) {
      return;
    }

    const snapshot = JSON.stringify(blocksRef.current);
    if (mode === "auto" && snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (mode === "publish") {
      setIsPublishing(true);
    }

    const payload = {
      page,
      blocks: blocksRef.current,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("page_content").upsert(payload, { onConflict: "page" });

    if (mode === "publish") {
      setIsPublishing(false);
    }

    if (error) {
      showToast("Salvataggio non riuscito. Riprova.", "error");
      return;
    }

    if (mode === "publish" && pageMeta) {
      try {
        await fetch("/api/admin/revalidate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: pageMeta.previewPath }),
        });
      } catch {
        showToast("Pubblicato, ma revalidate non riuscita.", "info");
      }
    }

    lastSavedSnapshotRef.current = snapshot;
    showToast(mode === "publish" ? "Pubblicato!" : "Salvato automaticamente", "success");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("palette:")) {
      const type = parsePaletteType(activeId);
      const targetIndex = overId.startsWith("block:")
        ? blocks.findIndex((item) => item.id === parseBlockId(overId))
        : undefined;
      addBlock(type, targetIndex === -1 ? undefined : targetIndex);
      return;
    }

    if (!activeId.startsWith("block:") || !overId.startsWith("block:")) {
      return;
    }

    const activeBlockId = parseBlockId(activeId);
    const overBlockId = parseBlockId(overId);

    if (activeBlockId === overBlockId) {
      return;
    }

    withHistory((current) => {
      const oldIndex = current.findIndex((item) => item.id === activeBlockId);
      const newIndex = current.findIndex((item) => item.id === overBlockId);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function openPreview() {
    if (!pageMeta) {
      return;
    }
    window.open(absolutePreviewUrl(pageMeta.previewPath), "_blank", "noopener,noreferrer");
  }

  if (page && !pageMeta) {
    return (
      <section className="rounded-2xl border border-black/7 bg-white p-6">
        <h1 className="font-serif text-4xl text-[#1E1810]">Pagina non supportata</h1>
        <p className="mt-2 text-sm text-[#5C5048]">
          Torna alla lista pagine e seleziona una pagina disponibile.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          className={cn(
            "fixed right-6 top-5 z-[80] rounded-xl border px-4 py-2 text-sm shadow-lg",
            toast.tone === "success" && "border-[#BFE0C8] bg-white text-[#2E6D45]",
            toast.tone === "error" && "border-[#EDC6C3] bg-white text-[#A24D49]",
            toast.tone === "info" && "border-black/10 bg-white text-[#5C5048]",
          )}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/7 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-4xl text-[#1E1810]">Page Builder</h1>
          <span className="inline-flex items-center rounded-full border border-[#E4D8CC] bg-[#FBF8F4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A6E66]">
            {pageMeta?.label ?? "..."}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!history.length}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm text-[#5C5048] hover:bg-[#F8F6F2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Undo2 size={14} /> Annulla
          </button>
          <button
            type="button"
            onClick={openPreview}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-sm text-[#5C5048] hover:bg-[#F8F6F2]"
          >
            <Eye size={14} /> Anteprima
          </button>
          <button
            type="button"
            onClick={() => void saveBlocks("publish")}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#D4918F] px-4 py-2 text-sm font-medium text-white hover:bg-[#c47f7d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? "Pubblicazione..." : "Pubblica"}
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-[185px_minmax(0,1fr)_225px]">
          <aside className="rounded-2xl border border-black/7 bg-white p-3 shadow-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9C9088]">
              Blocchi
            </p>
            <div className="space-y-2">
              {blockLibrary.map((template) => (
                <DraggablePaletteItem
                  key={template.type}
                  template={template}
                  onAdd={() => addBlock(template.type)}
                />
              ))}
            </div>
          </aside>

          <section
            ref={setCanvasNodeRef}
            className={cn(
              "rounded-2xl border border-black/7 bg-[#EDEBE7] p-4 shadow-sm",
              isCanvasOver ? "ring-2 ring-[#D4918F]/45" : "",
            )}
          >
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-white p-6 text-sm text-[#5C5048]">
                Caricamento blocchi...
              </div>
            ) : blocks.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-sm text-[#7A6E66]">
                Trascina blocchi qui per iniziare
              </div>
            ) : (
              <SortableContext
                items={blocks.map((block) => sortableId(block.id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <SortableCanvasBlock
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onMoveUp={() => moveSelected("up")}
                      onMoveDown={() => moveSelected("down")}
                      onDelete={() => removeBlock(block.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </section>

          <aside className="rounded-2xl border border-black/7 bg-white p-3 shadow-sm">
            {!selectedBlock ? (
              <div className="space-y-3 text-sm text-[#5C5048]">
                <h2 className="font-serif text-2xl text-[#1E1810]">Proprieta</h2>
                <p>Seleziona un blocco per modificarlo.</p>
                <ol className="space-y-1 text-xs text-[#7A6E66]">
                  <li>1. Trascina o clicca un blocco dalla palette</li>
                  <li>2. Seleziona il blocco nel canvas</li>
                  <li>3. Modifica i campi e pubblica</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1E1810]">Modifica · {selectedBlock.type}</h2>
                <BlockEditor block={selectedBlock} onChange={updateBlock} />
              </div>
            )}
          </aside>
        </div>
      </DndContext>
    </div>
  );
}
