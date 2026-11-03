export function SearchBox({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={120}
        placeholder="Tìm câu hoặc thuật ngữ (gõ không dấu cũng được): do ben mau, MOQ, 色牢度…"
        aria-label="Tìm kiếm"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
      />
      <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white">
        Tìm
      </button>
    </form>
  );
}
