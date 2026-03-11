import { BlockRenderer } from "@/components/page-builder/BlockRenderer";
import { HomepageClient } from "@/components/shop/HomepageClient";
import { createClient } from "@/lib/supabase/server";
import type { PageBlock } from "@/types";

function normalizeHomepageBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return (blocks as Array<Record<string, unknown>>)
    .filter((item) => Boolean(item && typeof item === "object" && item.id && item.type))
    .map((item, index) => {
      const props =
        item.props && typeof item.props === "object"
          ? (item.props as Record<string, unknown>)
          : Object.fromEntries(
              Object.entries(item).filter(([key]) => !["id", "type", "order", "props"].includes(key)),
            );

      return {
        id: String(item.id),
        type: String(item.type),
        props,
        order: typeof item.order === "number" ? item.order : index,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_content")
    .select("page, blocks")
    .in("page", ["homepage", "home"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const blocks = error ? [] : normalizeHomepageBlocks(data?.blocks);

  if (blocks.length > 0) {
    return <BlockRenderer blocks={blocks} />;
  }

  return <HomepageClient />;
}
