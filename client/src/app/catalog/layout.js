export const metadata = {
  title: 'Vintage & Pre-Loved Catalog — Thriftpedia',
  description: 'Every piece is curated, one-of-one, and 100% original.',
};

export default function CatalogLayout({ children }) {
  return <div className="w-full flex-1 flex flex-col">{children}</div>;
}
