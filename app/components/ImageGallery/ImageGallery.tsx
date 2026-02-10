"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbox, type LightboxImage } from "../Lightbox";

interface GalleryImage {
	id: string;
	url: string;
	alt?: string;
	title?: string;
	caption?: string;
}

interface ImageGalleryProps {
	images: GalleryImage[];
	columns?: 2 | 3 | 4;
}

const staggerContainer = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const staggerItem = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function ImageGallery({
	images,
	columns = 3,
}: ImageGalleryProps) {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	const openLightbox = (index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	const gridColsClass = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
	};

	if (images.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-background-creme p-8 text-center">
				<svg className="mx-auto h-12 w-12 text-text-gray"
				     fill="none"
				     viewBox="0 0 24 24"
				     stroke="currentColor">
					<path strokeLinecap="round"
					      strokeLinejoin="round"
					      strokeWidth={1.5}
					      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<p className="mt-4 text-text-gray">No images available</p>
			</div>
		);
	}

	const lightboxImages: LightboxImage[] = images.map((img) => ({
		url: img.url,
		alt: img.alt,
		title: img.title,
		caption: img.caption,
	}));

	return (
		<>
			<motion.div className={`grid gap-4 ${gridColsClass[columns]}`}
			            variants={staggerContainer}
			            initial="hidden"
			            animate="show">
				{images.map((image, index) => (
					<motion.div key={image.id}
					            variants={staggerItem}>
						<button type="button"
						        className="group relative aspect-square w-full overflow-hidden rounded-lg bg-background-creme focus:outline-none focus:ring-2 focus:ring-callout-accent focus:ring-offset-2"
						        onClick={() => openLightbox(index)}
						        aria-label={`View ${image.alt || `image ${index + 1}`} in fullscreen`}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={image.url}
							     alt={image.alt || `Gallery image ${index + 1}`}
							     loading="lazy"
							     className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />

							{/* Hover overlay */}
							<div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/20">
								<svg className="h-8 w-8 text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								     fill="none"
								     viewBox="0 0 24 24"
								     stroke="currentColor">
									<path strokeLinecap="round"
									      strokeLinejoin="round"
									      strokeWidth={2}
									      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
								</svg>
							</div>
						</button>
						{(image.title || image.caption) && (
							<div className="mt-2">
								{image.title && (
									<p className="text-sm font-medium text-foreground">{image.title}</p>
								)}
								{image.caption && (
									<p className="text-xs text-text-gray mt-0.5">{image.caption}</p>
								)}
							</div>
						)}
					</motion.div>
				))}
			</motion.div>

			<Lightbox images={lightboxImages}
			          initialIndex={lightboxIndex}
			          isOpen={lightboxOpen}
			          onClose={() => setLightboxOpen(false)} />
		</>
	);
}

export default ImageGallery;
