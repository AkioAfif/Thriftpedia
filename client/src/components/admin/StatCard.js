import Link from 'next/link';

export default function StatCard({ icon, title, stats, buttonLabel, href }) {
  return (
    <section className="flex flex-col rounded-[20px] border border-[#e6b8a2] bg-[#fdefe6] p-7">
      <div className="text-[#2b1d14]">{icon}</div>
      <h2 className="mt-6 text-2xl font-semibold text-[#2b1d14]">{title}</h2>

      <dl className="mt-8 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-[#6b5d52]">{stat.label}</dt>
            <dd className="mt-3 text-4xl font-semibold text-[#2b1d14]">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={href}
        className="mt-10 block rounded-[10px] bg-[#a3452a] py-3 text-center text-sm font-semibold text-white hover:bg-[#8f3b23]"
      >
        {buttonLabel}
      </Link>
    </section>
  );
}