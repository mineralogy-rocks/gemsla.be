"use client";

import { useState, useCallback, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {TextArea} from "@/app/components/TextArea";
import {Input} from "@/app/components/Input";

export interface UploadedImage {
	id: string;
	url: string;
	path?: string;
	name: string;
	display_order: number;
	title?: string;
	caption?: string;
}

interface ImageUploadProps {
	images: UploadedImage[];
	onImagesChange: (images: UploadedImage[]) => void;
	onImageFieldChange?: (imageId: string, field: "title" | "caption", value: string) => void;
	reportId?: string;
	maxImages?: number;
	disabled?: boolean;
}

export function ImageUpload({
	images,
	onImagesChange,
	onImageFieldChange,
	reportId,
	maxImages = 10,
	disabled = false,
}: ImageUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

	const uploadFile = async (file: File): Promise<UploadedImage | null> => {
		const formData = new FormData();
		formData.append("file", file);
		if (reportId) {
			formData.append("reportId", reportId);
		}

		const response = await fetch("/api/reports/upload", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.error || "Upload failed");
		}

		const data = await response.json();

		return {
			id: generateTempId(),
			url: data.url,
			path: data.path,
			name: file.name,
			display_order: images.length,
		};
	};

	const handleFiles = useCallback(async (files: FileList | null) => {
		if (!files || files.length === 0 || disabled) return;

		setError(null);

		// Check max images
		const remainingSlots = maxImages - images.length;
		if (remainingSlots <= 0) {
			setError(`Maximum ${maxImages} images allowed`);
			return;
		}

		// Filter valid files
		const validFiles = Array.from(files)
			.slice(0, remainingSlots)
			.filter((file) => {
				const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
				if (!validTypes.includes(file.type)) {
					setError("Only JPEG, PNG, GIF, and WebP images are allowed");
					return false;
				}
				if (file.size > 10 * 1024 * 1024) {
					setError("Images must be smaller than 10MB");
					return false;
				}
				return true;
			});

		if (validFiles.length === 0) return;

		setUploading(true);

		try {
			const uploadPromises = validFiles.map(uploadFile);
			const results = await Promise.all(uploadPromises);
			const uploadedImages = results.filter((img): img is UploadedImage => img !== null);

			onImagesChange([...images, ...uploadedImages]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to upload images");
		} finally {
			setUploading(false);
		}
	}, [images, onImagesChange, maxImages, disabled, reportId]);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	}, [handleFiles]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		if (!disabled) {
			setIsDragging(true);
		}
	}, [disabled]);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleRemove = useCallback((imageToRemove: UploadedImage) => {
		const newImages = images
			.filter((img) => img.id !== imageToRemove.id)
			.map((img, index) => ({ ...img, display_order: index }));
		onImagesChange(newImages);

		if (imageToRemove.path?.startsWith("temp/")) {
			fetch("/api/reports/upload", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: imageToRemove.path }),
			}).catch((err) => console.error("Failed to delete temp file:", err));
		}
	}, [images, onImagesChange]);

	const handleReorder = useCallback((dragIndex: number, dropIndex: number) => {
		if (dragIndex === dropIndex) return;

		const newImages = [...images];
		const [draggedImage] = newImages.splice(dragIndex, 1);
		newImages.splice(dropIndex, 0, draggedImage);

		const reorderedImages = newImages.map((img, index) => ({
			...img,
			display_order: index,
		}));

		onImagesChange(reorderedImages);
	}, [images, onImagesChange]);

	return (
		<div className="flex flex-col gap-4">
			<div className={`
				relative rounded-lg border-2 border-dashed p-6 text-center transition-colors
				${isDragging ? "border-callout-accent bg-callout-accent/10" : "border-border"}
				${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-callout-accent"}
			`}
			     onDrop={handleDrop}
			     onDragOver={handleDragOver}
			     onDragLeave={handleDragLeave}
			     onClick={() => !disabled && inputRef.current?.click()}>
				<input ref={inputRef}
				       type="file"
				       accept="image/jpeg,image/png,image/gif,image/webp"
				       multiple
				       onChange={(e) => handleFiles(e.target.files)}
				       disabled={disabled}
				       className="hidden" />

				<div className="flex flex-col items-center gap-2">
					{uploading ? (
						<>
							<svg className="h-10 w-10 animate-spin text-callout-accent"
							     fill="none"
							     viewBox="0 0 24 24">
								<circle className="opacity-25"
								        cx="12"
								        cy="12"
								        r="10"
								        stroke="currentColor"
								        strokeWidth="4" />
								<path className="opacity-75"
								      fill="currentColor"
								      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
							<p className="text-sm text-text-gray">Uploading...</p>
						</>
					) : (
						<>
							<svg className="h-10 w-10 text-text-gray"
							     fill="none"
							     viewBox="0 0 24 24"
							     stroke="currentColor">
								<path strokeLinecap="round"
								      strokeLinejoin="round"
								      strokeWidth={1.5}
								      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p className="text-sm text-foreground">
								Drag and drop images here, or click to browse
							</p>
							<p className="text-xs text-text-gray">
								JPEG, PNG, GIF, WebP up to 10MB ({images.length}/{maxImages})
							</p>
						</>
					)}
				</div>
			</div>

			{error && (
				<p className="text-sm text-red-500" role="alert">
					{error}
				</p>
			)}

			{/* Image previews */}
			<AnimatePresence>
				{images.length > 0 && (
					<motion.div className="flex flex-col gap-4"
					            initial={{ opacity: 0, height: 0 }}
					            animate={{ opacity: 1, height: "auto" }}
					            exit={{ opacity: 0, height: 0 }}>
						{images.map((image, index) => (
							<motion.div key={image.id}
							            className="group relative overflow-hidden rounded-lg border border-border bg-background-creme"
							            initial={{ opacity: 0, scale: 0.9 }}
							            animate={{ opacity: 1, scale: 1 }}
							            exit={{ opacity: 0, scale: 0.9 }}
							            {...{
								            draggable: !disabled,
								            onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
									            e.dataTransfer.setData("text/plain", index.toString());
								            },
								            onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
									            e.preventDefault();
								            },
								            onDrop: (e: React.DragEvent<HTMLDivElement>) => {
									            e.preventDefault();
									            const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
									            handleReorder(dragIndex, index);
								            },
							            } as any}>
								<div className="flex flex-col">
									<div className="relative w-full aspect-video">
										<img src={image.url}
										     alt={image.name}
										     loading="lazy"
										     className="h-full w-full object-cover" />

										{!disabled && (
											<button type="button"
											        onClick={() => handleRemove(image)}
											        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 cursor-pointer"
											        aria-label={`Remove ${image.name}`}>
												<svg className="h-4 w-4"
												     fill="none"
												     viewBox="0 0 24 24"
												     stroke="currentColor">
													<path strokeLinecap="round"
													      strokeLinejoin="round"
													      strokeWidth={2}
													      d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										)}

										<div className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-xs text-background">
											{index + 1}
										</div>
									</div>

									{onImageFieldChange && (
										<div className="flex-1 p-4 space-y-3">
											<Input label="Title"
											       value={image.title || ""}
											       onChange={(e) => onImageFieldChange(image.id, "title", e.target.value)}
											       placeholder="Image title"
											       disabled={disabled}
											       className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-gray focus:outline-none focus:ring-1 focus:ring-callout-accent" />
											<TextArea label="Caption"
															  value={image.caption || ""}
											          onChange={(e) => onImageFieldChange(image.id, "caption", e.target.value)}
											          placeholder="Image caption"
											          disabled={disabled}
											          rows={4}
											          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-gray focus:outline-none focus:ring-1 focus:ring-callout-accent resize-none" />
									</div>
									)}
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default ImageUpload;
