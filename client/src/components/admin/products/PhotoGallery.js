'use client';

import { useId, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';

// Every photo carries a stable id, so React keys never depend on the URL or the position.
let seq = 0;
export const toPhotoItem = (url) => ({ id: `photo-${(seq += 1)}`, url });

// Moves the item at `from` so it ends up at `to` (0-based), returning a new, gap-free array.
export function movePhoto(list, from, to) {
  if (from === to || from < 0 || from >= list.length) return list;
  const next = list.filter((_, i) => i !== from);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, list[from]);
  return next;
}

// A photo that no longer loads (e.g. an old local /uploads URL) shows a clear placeholder,
// so the admin knows to remove it and upload a new one.
function PhotoPreview({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} could not be loaded`}
        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-[#CFBEAE] bg-[#F5F0E8] px-2 text-center"
      >
        <span className="text-xs font-semibold text-[#5C4D40]">Image unavailable</span>
        <span className="text-xs text-[#6F6358]">Remove it and upload again</span>
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full rounded-[14px] border border-[#EAE4DA] bg-[#F5F0E8] object-cover"
    />
  );
}

// 36px white circle buttons with an icon; each has an aria-label and a tooltip (title).
const circleBtn = `flex size-9 shrink-0 items-center justify-center rounded-full border border-[#D9CFC1] bg-white text-[#2B2118] shadow-sm hover:bg-[#F5F0E8] ${focusRing}`;
const arrowBtn = `${circleBtn} disabled:cursor-not-allowed disabled:border-[#EAE4DA] disabled:bg-[#F5F0E8] disabled:text-[#A89B8E] disabled:shadow-none`;

function StarIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
    </svg>
  );
}

// Index 0 is the cover. Reorder by dragging (HTML5 drag events) or with the arrow buttons;
// every change produces a new array and is announced to screen readers.
export default function PhotoGallery({ photos, onChange, readOnly = false }) {
  const uid = useId();
  const [dragId, setDragId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null); // insertion point: before item i, or photos.length
  const [message, setMessage] = useState('');

  const btnId = (id, name) => `${uid}-${id}-${name}`;
  const focusLater = (...ids) =>
    requestAnimationFrame(() => {
      const target = ids.map((id) => document.getElementById(id)).find((el) => el && !el.disabled);
      target?.focus();
    });

  function move(from, to, { announce = true } = {}) {
    const next = movePhoto(photos, from, to);
    if (next === photos) return;
    onChange(next);
    if (announce) setMessage(to === 0 ? 'Photo moved to position 1. It is now the cover.' : `Photo moved to position ${to + 1}`);
  }

  function moveBy(index, delta) {
    const id = photos[index].id;
    move(index, index + delta);
    focusLater(btnId(id, delta < 0 ? 'left' : 'right'), btnId(id, delta < 0 ? 'right' : 'left'));
  }

  function remove(index) {
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
    setMessage(next.length === 0 ? 'Photo removed. No photos left.' : `Photo removed. ${index === 0 ? 'The next photo is now the cover.' : ''}`.trim());
  }

  function endDrag() {
    setDragId(null);
    setDropIndex(null);
  }

  function onDragOver(e, index) {
    if (!dragId) return; // files dragged from the desktop are handled by the upload zone
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;
    const insertAt = after ? index + 1 : index;
    if (insertAt !== dropIndex) setDropIndex(insertAt);
  }

  function onDrop(e) {
    if (!dragId) return;
    e.preventDefault();
    const from = photos.findIndex((p) => p.id === dragId);
    if (from >= 0 && dropIndex != null) move(from, dropIndex > from ? dropIndex - 1 : dropIndex);
    endDrag();
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
      <ul className="mt-4 grid grid-cols-3 gap-3" onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDropIndex(null);
      }}>
        {photos.map((photo, index) => {
          const dragging = dragId === photo.id;
          const showBefore = dropIndex === index && dragId;
          const showAfter = dropIndex === photos.length && index === photos.length - 1 && dragId;
          return (
            <li
              key={photo.id}
              draggable={!readOnly}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', photo.id); // Firefox needs data to start a drag
                setDragId(photo.id);
              }}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={onDrop}
              onDragEnd={endDrag}
              className={`relative min-w-0 rounded-[14px] transition-opacity ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'} ${
                dragging ? 'opacity-40' : ''
              }`}
            >
              {showBefore && <span aria-hidden="true" className="absolute -left-2 bottom-0 top-0 z-10 w-1 rounded-full bg-[#B5532E]" />}
              {showAfter && <span aria-hidden="true" className="absolute -right-2 bottom-0 top-0 z-10 w-1 rounded-full bg-[#B5532E]" />}

              <div className="relative">
                <PhotoPreview src={photo.url} alt={`Product photo ${index + 1}${index === 0 ? ' (cover)' : ''}`} />
                {index > 0 && !readOnly && (
                  <button
                    type="button"
                    onClick={() => move(index, 0)}
                    aria-label={`Make photo ${index + 1} the cover`}
                    title="Make cover"
                    className={`absolute left-1.5 top-1.5 ${circleBtn} hover:bg-[#FBE6DC] hover:text-[#B5532E]`}
                  >
                    <StarIcon />
                  </button>
                )}
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-[#B5532E] px-2.5 py-1 text-xs font-semibold text-white">
                    Cover
                  </span>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    title="Remove photo"
                    className={`absolute right-1.5 top-1.5 ${circleBtn} hover:border-[#EBC3AE] hover:bg-[#FCEDEA] hover:text-[#B3402A]`}
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                )}
              </div>

              {!readOnly && (
                <div className="mt-2 flex items-center justify-between gap-1">
                  <button
                    id={btnId(photo.id, 'left')}
                    type="button"
                    onClick={() => moveBy(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move photo ${index + 1} left`}
                    title="Move left"
                    className={arrowBtn}
                  >
                    <ChevronLeftIcon width={16} height={16} />
                  </button>
                  <button
                    id={btnId(photo.id, 'right')}
                    type="button"
                    onClick={() => moveBy(index, 1)}
                    disabled={index === photos.length - 1}
                    aria-label={`Move photo ${index + 1} right`}
                    title="Move right"
                    className={arrowBtn}
                  >
                    <ChevronRightIcon width={16} height={16} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
