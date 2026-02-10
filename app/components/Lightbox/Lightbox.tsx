"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface LightboxImage {
	url: string;
	alt?: string;
	title?: string;
	caption?: string;
}

interface LightboxProps {
	images: LightboxImage[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
}

export function Lightbox({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
}: LightboxProps) {
	const [currentIndex, setCurrentIndex] = useState(initialIndex);

	// Reset index when opened with new initialIndex
	useEffect(() => {
		if (isOpen) {
			setCurrentIndex(initialIndex);
		}
	}, [isOpen, initialIndex]);

	const goToPrevious = useCallback(() => {
		setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
	}, [images.length]);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
	}, [images.length]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					onClose();
					break;
				case "ArrowLeft":
					goToPrevious();
					break;
				case "ArrowRight":
					goToNext();
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose, goToPrevious, goToNext]);

	// Prevent body scroll when open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (images.length === 0) return null;

	const currentImage = images[currentIndex];

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95"
				            initial={{ opacity: 0 }}
				            animate={{ opacity: 1 }}
				            exit={{ opacity: 0 }}
				            role="dialog"
				            aria-modal="true"
				            aria-label="Image lightbox">
					{/* Close button */}
					<button type="button"
					        onClick={onClose}
					        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
					        aria-label="Close lightbox">
						<svg className="h-6 w-6"
						     fill="none"
						     viewBox="0 0 24 24"
						     stroke="currentColor">
							<path strokeLinecap="round"
							      strokeLinejoin="round"
							      strokeWidth={2}
							      d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>

					{/* Previous button */}
					{images.length > 1 && (
						<button type="button"
						        onClick={goToPrevious}
						        className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
						        aria-label="Previous image">
							<svg className="h-8 w-8"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={2}
								      d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					)}

					{/* Image */}
					<motion.div className="relative max-h-[90vh] max-w-[90vw]"
					            key={currentIndex}
					            initial={{ opacity: 0, scale: 0.95 }}
					            animate={{ opacity: 1, scale: 1 }}
					            exit={{ opacity: 0, scale: 0.95 }}
					            transition={{ duration: 0.2 }}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={currentImage.url}
						     alt={currentImage.alt || `Image ${currentIndex + 1}`}
						     className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />

						{/* Title/Caption overlay */}
						{(currentImage.title || currentImage.caption) && (
							<div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8">
								{currentImage.title && (
									<p className="text-sm font-medium text-white">{currentImage.title}</p>
								)}
								{currentImage.caption && (
									<p className="text-xs text-white/80 mt-0.5">{currentImage.caption}</p>
								)}
							</div>
						)}
					</motion.div>

					{/* Next button */}
					{images.length > 1 && (
						<button type="button"
						        onClick={goToNext}
						        className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20"
						        aria-label="Next image">
							<svg className="h-8 w-8"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={2}
								      d="M9 5l7 7-7 7" />
							</svg>
						</button>
					)}

					{/* Image counter */}
					{images.length > 1 && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/10 px-4 py-2 text-sm text-background">
							{currentIndex + 1} / {images.length}
						</div>
					)}

					{/* Thumbnail strip for multiple images */}
					{images.length > 1 && images.length <= 10 && (
						<div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-2">
							{images.map((image, index) => (
								<button key={index}
								        type="button"
								        onClick={() => setCurrentIndex(index)}
								        className={`h-12 w-12 overflow-hidden rounded-md border-2 transition-all ${
									        index === currentIndex
										        ? "border-background opacity-100"
										        : "border-transparent opacity-60 hover:opacity-100"
								        }`}
								        aria-label={`Go to image ${index + 1}`}
								        aria-current={index === currentIndex}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={image.url}
									     alt=""
									     className="h-full w-full object-cover" />
								</button>
							))}
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default Lightbox;
