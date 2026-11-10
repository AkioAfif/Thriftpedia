// Placeholder sementara untuk mengecek design token. Diganti Landing di task 4.3.
const swatches = [
  { name: "ink", className: "bg-ink" },
  { name: "cream", className: "bg-cream" },
  { name: "primary", className: "bg-primary" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "muted", className: "bg-muted" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 py-16">
      <h1 className="font-display text-4xl uppercase sm:text-6xl">Thriftpedia</h1>
      <p className="mt-3 max-w-prose text-lg">
        Barang bekas pilihan, satu barang satu stok.
      </p>

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {swatches.map((s) => (
          <li key={s.name} className="sticker overflow-hidden">
            <div className={`h-20 border-b-2 border-ink ${s.className}`} />
            <p className="p-3 font-heading font-bold">{s.name}</p>
          </li>
        ))}
      </ul>

      <a
        href="#"
        className="mt-10 inline-block rounded-sticker border-2 border-ink bg-primary px-6 py-3 font-heading font-bold text-paper shadow-sticker transition hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-sticker-lg active:translate-y-0 active:shadow-sticker-sm"
      >
        Jelajahi Katalog
      </a>
    </main>
  );
}
