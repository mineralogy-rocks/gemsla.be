"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { SearchInput } from "@/app/components/SearchInput";
import { normalizeSearchResults } from "@/app/lib/normalizeSearchResults";


interface InlineEntitySearchProps<T> {
	searchUrl: string;
	placeholder?: string;
	renderItem: (item: T) => React.ReactNode;
	getId: (item: T) => string;
	onSelect: (item: T) => void | Promise<void>;
	emptyLabel?: string;
}


const DEBOUNCE_MS = 250;


export function InlineEntitySearch<T>({
	searchUrl,
	placeholder = "Search...",
	renderItem,
	getId,
	onSelect,
	emptyLabel = "No matches",
}: InlineEntitySearchProps<T>) {
	const listboxId = useId();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [selecting, setSelecting] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const selectingRef = useRef(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const requestIdRef = useRef(0);


	const runSearch = useCallback(async (q: string) => {
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		const myId = ++requestIdRef.current;
		setLoading(true);
		try {
			const url = q ? `${searchUrl}?q=${encodeURIComponent(q)}` : searchUrl;
			const res = await fetch(url, { signal: controller.signal });
			if (!res.ok) throw new Error();
			const data = await res.json();
			if (myId !== requestIdRef.current) return;
			const next = normalizeSearchResults<T>(data);
			setResults(next);
			setActiveIndex(next.length > 0 ? 0 : -1);
		} catch (err) {
			if ((err as Error).name === "AbortError") return;
			if (myId !== requestIdRef.current) return;
			setResults([]);
			setActiveIndex(-1);
		} finally {
			if (myId === requestIdRef.current) setLoading(false);
		}
	}, [searchUrl]);


	useEffect(() => {
		if (!open) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => runSearch(query.trim()), DEBOUNCE_MS);
		return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
	}, [query, open, runSearch]);


	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		if (open) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);


	useEffect(() => {
		return () => { abortRef.current?.abort(); };
	}, []);


	const handlePick = useCallback(async (item: T) => {
		if (selectingRef.current) return;
		selectingRef.current = true;
		setSelecting(true);
		try {
			await onSelect(item);
			setQuery("");
			setOpen(false);
			setResults([]);
		} catch {
			// onSelect threw — keep dropdown open so user can retry
		} finally {
			selectingRef.current = false;
			setSelecting(false);
		}
	}, [onSelect]);


	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => results.length === 0 ? -1 : i < results.length - 1 ? i + 1 : 0);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => results.length === 0 ? -1 : i > 0 ? i - 1 : results.length - 1);
		} else if (e.key === "Enter") {
			if (activeIndex >= 0 && activeIndex < results.length) {
				e.preventDefault();
				handlePick(results[activeIndex]);
			}
		} else if (e.key === "Escape") {
			setOpen(false);
		}
	};


	const activeId = activeIndex >= 0 && activeIndex < results.length
		? `${listboxId}-opt-${getId(results[activeIndex])}`
		: undefined;


	return (
		<div ref={containerRef}
		     className="relative">
			<SearchInput value={query}
			             onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
			             onClear={() => { setQuery(""); setResults([]); }}
			             placeholder={placeholder}
			             onFocus={() => setOpen(true)}
			             onKeyDown={handleKeyDown}
			             role="combobox"
			             aria-expanded={open && (results.length > 0 || loading)}
			             aria-controls={listboxId}
			             aria-activedescendant={activeId}
			             aria-autocomplete="list" />


			{open && (results.length > 0 || loading || query.trim()) && (
				<ul id={listboxId}
				    role="listbox"
				    className="absolute z-20 mt-1 w-full rounded-md border border-border bg-background shadow-md overflow-y-auto max-h-60">
					{loading && results.length === 0 ? (
						<li className="px-3 py-2 text-sm text-text-gray">Searching...</li>
					) : results.length === 0 ? (
						<li className="px-3 py-2 text-sm text-text-gray">{emptyLabel}</li>
					) : (
						results.map((item, index) => {
							const itemId = getId(item);
							const isActive = index === activeIndex;
							return (
								<li key={itemId}
								    id={`${listboxId}-opt-${itemId}`}
								    role="option"
								    aria-selected={isActive}
								    className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-border-light last:border-0 ${
									    isActive ? "bg-background-creme" : "hover:bg-background-creme"
								    } ${selecting ? "opacity-60 pointer-events-none" : ""}`}
								    onMouseEnter={() => setActiveIndex(index)}
								    onClick={() => handlePick(item)}>
									{renderItem(item)}
								</li>
							);
						})
					)}
				</ul>
			)}
		</div>
	);
}
