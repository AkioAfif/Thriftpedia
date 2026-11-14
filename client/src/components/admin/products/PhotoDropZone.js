'use client';

import { useState } from 'react';

function UploadIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

const hasFiles = (e) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

// File picker + drop target. The border turns solid while files are dragged over it.
// Photos being reordered inside the gallery are not files, so they never light it up.
export default function PhotoDropZone({ disabled, uploading, onFiles }) {
  const [over, setOver] = useState(false);

  return (
    <label
      className="relative block cursor-pointer"
      onDragEnter={(e) => {
        if (hasFiles(e) && !disabled) setOver(true);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files ?? []));
      }}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          onFiles(files);
        }}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={`flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 px-4 text-center lg:h-auto lg:py-6 text-[#2B2118] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:border-dashed peer-disabled:border-[#D9CFC1] peer-disabled:bg-[#F5F0E8] peer-disabled:text-[#5C4D40] ${
          over ? 'border-solid border-[#B5532E] bg-[#FBE6DC]' : 'border-dashed border-[#B5532E] bg-[#FFF8F4]'
        }`}
      >
        <span className={disabled ? 'text-[#5C4D40]' : 'text-[#B5532E]'}>
          <UploadIcon />
        </span>
        {/* Below lg (touch): one short line; from lg the drag hint and file rules, as before. */}
        <span className="text-sm font-semibold lg:hidden">{uploading ? 'Uploading...' : 'Tap to add photos'}</span>
        <span className="hidden text-sm font-semibold lg:inline">{uploading ? 'Uploading...' : 'Drag photos here or browse'}</span>
        <span className="hidden text-[13px] text-[#6F6358] lg:inline">JPG, PNG or WebP · max 5 MB each</span>
      </span>
    </label>
  );
}
