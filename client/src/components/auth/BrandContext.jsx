import Image from 'next/image';

export default function BrandContext() {
  return (
    <div className="flex w-full items-center justify-center gap-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
        <Image
          src="/logo.svg"
          alt="Thriftpedia logo"
          width={48}
          height={48}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="headline-sm font-semibold leading-tight">
          <span className="text-text">thrift</span>
          <span className="text-primary">pedia</span>
        </p>

        <p className="body-sm text-text-secondary">
          Love at Second Sight.
        </p>
      </div>
    </div>
  );
}
