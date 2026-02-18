import { SiteHeader } from "@/components/site-header";
import { TemplateCard } from "@/components/admin/template-card";
import { getAllTemplates } from "@/lib/templates";

export default function TemplatesPage() {
  const templates = getAllTemplates();

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template Forge</h1>
            <p className="text-muted-foreground">Manajemen desain undangan pernikahan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.slug} template={template} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
