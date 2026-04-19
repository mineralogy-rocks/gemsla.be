"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { SearchInput } from "@/app/components/SearchInput";
import { SlidePanel } from "@/app/components/SlidePanel";


interface EntityPickerProps<T> {
	open: boolean;
	onClose: () => void;
	title: string;
	placeholder?: string;
	searchUrl: string;
	renderItem: (item: T, isActive: boolean) => React.ReactNode;
	getId: (item: T) => string;
	onSelect: (item: T) => void | Promise<void>;
	emptyLabel?: string;
	loadingLabel?: string;
}


const DEBOUNCE_MS = 250;


export function EntityPicker<T>({
	open,
	onClose,
	title,
	placeholder = "Search...",
	searchUrl,
	renderItem,
	getId,
	onSelect,
	emptyLabel = "No matches",
	loadingLabel = "Searching...",
}: EntityPickerProps<T>) {
	const listboxId = useId();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [selecting, setSelecting] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const requestIdRef = useRef(0);


	const runSearch = useCallback(async (q: string) => {
		if (abortRef.current) {
			abortRef.current.abort();
		}
		const controller = new AbortController();
		abortRef.current = controller;
		const myRequestId = ++requestIdRef.current;

		setLoading(true);
		setError(null);

		try {
			const url = q
				? `${searchUrl}?q=${encodeURIComponent(q)}`
				: searchUrl;
			const res = await fetch(url, { signal: controller.signal });
			if (!res.ok) {
				throw new Error(`Search failed (${res.status})`);
			}
			const data = await res.json();
			if (myRequestId !== requestIdRef.current) return;

			const next: T[] = Array.isArray(data?.results)
				? data.results
				: Array.isArray(data?.stones)
					? data.stones
					: Array.isArray(data?.reports)
						? data.reports
						: [];
			setResults(next);
			setActiveIndex(next.length > 0 ? 0 : -1);
		} catch (err) {
			if ((err as Error).name === "AbortError") return;
			if (myRequestId !== requestIdRef.current) return;
			setResults([]);
			setActiveIndex(-1);
			setError("Search failed — try again");
		} finally {
			if (myRequestId === requestIdRef.current) {
				setLoading(false);
			}
		}
	}, [searchUrl]);


	useEffect(() => {
		if (!open) return;

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			runSearch(query.trim());
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, open, runSearch]);


	useEffect(() => {
		if (!open) {
			setQuery("");
			setResults([]);
			setActiveIndex(-1);
			setError(null);
			setSelecting(false);
			if (abortRef.current) {
				abortRef.current.abort();
				abortRef.current = null;
			}
			return;
		}

		const t = setTimeout(() => inputRef.current?.focus(), 50);
		return () => clearTimeout(t);
	}, [open]);


	useEffect(() => {
		if (activeIndex < 0 || !listRef.current) return;
		const el = listRef.current.querySelector<HTMLElement>(`[data-ep-index="${activeIndex}"]`);
		el?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);


	const handlePick = useCallback(async (item: T) => {
		if (selecting) return;
		setSelecting(true);
		try {
			await onSelect(item);
		} finally {
			setSelecting(false);
		}
	}, [onSelect, selecting]);


	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => {
				if (results.length === 0) return -1;
				return i < results.length - 1 ? i + 1 : 0;
			});
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => {
				if (results.length === 0) return -1;
				return i > 0 ? i - 1 : results.length - 1;
			});
		} else if (e.key === "Enter") {
			if (activeIndex >= 0 && activeIndex < results.length) {
				e.preventDefault();
				handlePick(results[activeIndex]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};


	const activeId = activeIndex >= 0 && activeIndex < results.length
		? `${listboxId}-opt-${getId(results[activeIndex])}`
		: undefined;


	return (
		<SlidePanel isOpen={open}
		            onClose={onClose}
		            title={title}>
			<div className="flex flex-col gap-3 min-h-0">
				<SearchInput ref={inputRef}
				             value={query}
				             onChange={(e) => setQuery(e.target.value)}
				             onClear={() => setQuery("")}
				             placeholder={placeholder}
				             onKeyDown={handleKeyDown}
				             role="combobox"
				             aria-expanded={open}
				             aria-controls={listboxId}
				             aria-activedescendant={activeId}
				             aria-autocomplete="list" />


				{loading && (
					<div className="text-sm text-text-gray px-1 py-2">
						{loadingLabel}
					</div>
				)}


				{!loading && error && (
					<div className="rounded-md border border-border bg-background-creme px-3 py-2 text-sm text-foreground">
						{error}
						<button type="button"
						        className="ml-2 text-callout-accent hover:underline"
						        onClick={() => runSearch(query.trim())}>
							Retry
						</button>
					</div>
				)}


				{!loading && !error && results.length === 0 && (
					<div className="text-sm text-text-gray px-1 py-2">
						{emptyLabel}
					</div>
				)}


				{!error && results.length > 0 && (
					<ul ref={listRef}
					    id={listboxId}
					    role="listbox"
					    className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
						{results.map((item, index) => {
							const itemId = getId(item);
							const isActive = index === activeIndex;
							return (
								<li key={itemId}
								    id={`${listboxId}-opt-${itemId}`}
								    role="option"
								    aria-selected={isActive}
								    data-ep-index={index}
								    className={`rounded-md border px-3 py-2 cursor-pointer transition-colors ${
									    isActive
										    ? "border-callout-accent bg-background-creme"
										    : "border-border hover:bg-background-creme"
								    } ${selecting ? "opacity-60 pointer-events-none" : ""}`}
								    onMouseEnter={() => setActiveIndex(index)}
								    onClick={() => handlePick(item)}>
									{renderItem(item, isActive)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</SlidePanel>
	);
}
