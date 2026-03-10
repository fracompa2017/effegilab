"use client";

import { Input } from "@/components/ui/Input";
import type { PageBlock } from "@/types";

type BlockEditorProps = {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
};

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Editor Blocco</h3>
      <Input
        id={`block-title-${block.id}`}
        label="Titolo"
        value={block.title ?? ""}
        onChange={(event) => onChange({ ...block, title: event.target.value })}
      />
      <Input
        id={`block-text-${block.id}`}
        label="Testo"
        value={block.text ?? ""}
        onChange={(event) => onChange({ ...block, text: event.target.value })}
      />
      <div className="space-y-1.5">
        <label htmlFor={`block-color-${block.id}`} className="text-sm font-medium text-slate-700">
          Colore
        </label>
        <input
          id={`block-color-${block.id}`}
          type="color"
          value={block.backgroundColor ?? "#ffffff"}
          onChange={(event) => onChange({ ...block, backgroundColor: event.target.value })}
          className="h-10 w-16 rounded border border-slate-300"
        />
      </div>
    </div>
  );
}
