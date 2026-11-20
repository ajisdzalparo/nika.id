import { SiteHeader } from "@/components/site-header";
import { CatalogEditor, EMPTY_DRAFT } from "@/components/admin/catalog-editor";

export default function AddTemplatePage() {
  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="font-serif text-5xl font-medium">Template baru</h2>
          <CatalogEditor initial={EMPTY_DRAFT} />
        </div>
      </div>
    </>
  );
}
