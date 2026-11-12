// Placeholder sementara untuk mengecek design token. Diganti Landing di task 4.3.
const swatches = [
  { name: "canvas", className: "bg-canvas" },
  { name: "surface", className: "bg-surface" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "badge-success", className: "bg-badge-success" },
  { name: "error", className: "bg-error" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-margin-mobile py-margin-mobile sm:px-margin-tablet sm:py-margin-tablet lg:px-margin-desktop lg:py-margin-desktop">
      <h1 className="headline-mobile sm:headline-lg">Thriftpedia</h1>
      <p className="body-lg mt-lg max-w-prose text-text-secondary">
        Barang bekas pilihan, satu barang satu stok.
      </p>

      <ul className="mt-xl grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-6">
        {swatches.map((s) => (
          <li key={s.name} className="card overflow-hidden p-0">
            <div className={`h-20 ${s.className}`} />
            <p className="label-md p-md text-text">{s.name}</p>
          </li>
        ))}
      </ul>

      <a
        href="#"
        className="title-md mt-xl inline-flex min-h-11 items-center rounded-md bg-primary px-lg text-on-primary transition-colors duration-150 ease-out hover:bg-primary-hover"
      >
        Explore catalog
      </a>
    </main>
  );
}
