"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TemplateDefinition } from "@/lib/templates";

interface TemplateCardProps {
  template: TemplateDefinition;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
      <div className="relative aspect-video bg-muted">
        <Image src={template.thumbnail} alt={template.name} fill className="object-cover transition-transform group-hover:scale-105" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={template.type === "Premium" ? "default" : "secondary"}>{template.type}</Badge>
          {!template.isActive && <Badge variant="destructive">Archived</Badge>}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded inline-block mt-1">ID: {template.slug}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px] flex-1">{template.description}</p>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/preview/${template.slug}`}>
            <Button variant="outline" size="sm" className="w-full">
              Preview
            </Button>
          </Link>
          <Link href={`/admin/templates/${template.slug}`}>
            <Button variant="outline" size="sm" className="w-full">
              Detail
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
