"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useEditor, EditorContent, type JSONContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";

const imageClickPluginKey = new PluginKey("imageClick");

const ResizableImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			"data-align": {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-align"),
				renderHTML: (attributes: Record<string, string | null>) => {
					if (!attributes["data-align"]) return {};
					return { "data-align": attributes["data-align"] };
				},
			},
		};
	},

	addProseMirrorPlugins() {
		const parentPlugins = this.parent?.() || [];
		return [
			...parentPlugins,
			new Plugin({
				key: imageClickPluginKey,
				props: {
					handleDOMEvents: {
						click: (view, event) => {
							const target = event.target as HTMLElement;
							const container = target.closest("[data-resize-container]");
							if (!container) return false;

							let imagePos: number | null = null;
							view.state.doc.descendants((node, pos) => {
								if (node.type.name === "image" && imagePos === null) {
									const dom = view.nodeDOM(pos);
									if (dom && container.contains(dom as Node)) {
										imagePos = pos;
									}
								}
							});

							if (imagePos !== null) {
								const tr = view.state.tr.setSelection(
									NodeSelection.create(view.state.doc, imagePos)
								);
								view.dispatch(tr);
								return true;
							}
							return false;
						},
					},
				},
				view() {
					return {
						update(view) {
							view.state.doc.descendants((node, pos) => {
								if (node.type.name !== "image") return;
								const dom = view.nodeDOM(pos);
								if (!dom) return;
								const container = (dom as HTMLElement).closest?.("[data-resize-container]")
									|| (dom instanceof HTMLElement ? dom.querySelector?.("[data-resize-container]") : null)
									|| (dom.parentElement?.closest("[data-resize-container]"));
								if (!container) return;
								const align = node.attrs["data-align"];
								if (align) {
									container.setAttribute("data-align", align);
								} else {
									container.removeAttribute("data-align");
								}
							});
						},
					};
				},
			}),
		];
	},
});

function isImageNodeSelected(editor: Editor): boolean {
	const { selection } = editor.state;
	return selection instanceof NodeSelection && selection.node.type.name === "image";
}

interface TiptapEditorProps {
	content?: JSONContent;
	onChange: (content: JSONContent) => void;
	placeholder?: string;
}

function MenuBar({ editor }: { editor: Editor }) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [imageSelected, setImageSelected] = useState(false);
	const [currentAlign, setCurrentAlign] = useState<string | null>(null);

	const updateImageState = useCallback(() => {
		const selected = isImageNodeSelected(editor);
		setImageSelected(selected);
		if (selected) {
			setCurrentAlign(editor.getAttributes("image")["data-align"] || null);
		} else {
			setCurrentAlign(null);
		}
	}, [editor]);

	useEffect(() => {
		editor.on("selectionUpdate", updateImageState);
		editor.on("transaction", updateImageState);
		return () => {
			editor.off("selectionUpdate", updateImageState);
			editor.off("transaction", updateImageState);
		};
	}, [editor, updateImageState]);

	const handleLinkClick = () => {
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("Enter URL:", previousUrl || "https://");

		if (url === null) return;

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	};

	const handleImageUpload = async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch("/api/blog/upload", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Failed to upload image");
				return;
			}

			const { url } = await res.json();
			editor.chain().focus().setImage({ src: url }).run();
		} catch {
			alert("Failed to upload image");
		}
	};

	const handleImageClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleImageUpload(file);
			e.target.value = "";
		}
	};

	const setImageAlign = (align: string) => {
		const newAlign = currentAlign === align ? null : align;
		editor.chain().focus().updateAttributes("image", { "data-align": newAlign }).run();
	};

	const buttons = [
		{
			label: "B",
			action: () => editor.chain().focus().toggleBold().run(),
			active: editor.isActive("bold"),
			className: "font-bold",
		},
		{
			label: "I",
			action: () => editor.chain().focus().toggleItalic().run(),
			active: editor.isActive("italic"),
			className: "italic",
		},
		{
			label: "H2",
			action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
			active: editor.isActive("heading", { level: 2 }),
		},
		{
			label: "H3",
			action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			active: editor.isActive("heading", { level: 3 }),
		},
		{
			label: "List",
			action: () => editor.chain().focus().toggleBulletList().run(),
			active: editor.isActive("bulletList"),
		},
		{
			label: "1.",
			action: () => editor.chain().focus().toggleOrderedList().run(),
			active: editor.isActive("orderedList"),
		},
		{
			label: "Quote",
			action: () => editor.chain().focus().toggleBlockquote().run(),
			active: editor.isActive("blockquote"),
		},
		{
			label: "Link",
			action: handleLinkClick,
			active: editor.isActive("link"),
		},
		{
			label: "Image",
			action: handleImageClick,
			active: false,
		},
	];

	return (
		<div className="flex flex-wrap gap-1 border-b border-border bg-background-creme px-3 py-2 rounded-t-md">
			{buttons.map((btn) => (
				<button key={btn.label}
					type="button"
					onClick={btn.action}
					className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
						btn.active
							? "bg-foreground text-background"
							: "text-foreground hover:bg-border-light"
					} ${btn.className || ""}`}>
					{btn.label}
				</button>
			))}
			{imageSelected && (
				<>
					<span className="w-px h-6 bg-border self-center mx-1" />
					{(["left", "center", "right"] as const).map((align) => (
						<button key={align}
							type="button"
							onClick={() => setImageAlign(align)}
							className={`px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
								currentAlign === align
									? "bg-foreground text-background"
									: "text-foreground hover:bg-border-light"
							}`}>
							{align.charAt(0).toUpperCase() + align.slice(1)}
						</button>
					))}
				</>
			)}
			<input ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				onChange={handleFileChange}
				className="hidden" />
		</div>
	);
}

export function TiptapEditor({ content, onChange, placeholder = "Start writing..." }: TiptapEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Placeholder.configure({ placeholder }),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "tiptap-link",
				},
			}),
			ResizableImage.configure({
				HTMLAttributes: {
					class: "tiptap-image",
				},
				resize: {
					enabled: true,
					directions: ["bottom-right", "bottom-left", "top-right", "top-left"],
					minWidth: 50,
					minHeight: 50,
					alwaysPreserveAspectRatio: true,
				},
			}),
		],
		content: content || undefined,
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			onChange(editor.getJSON());
		},
		editorProps: {
			attributes: {
				class: "tiptap-editor prose max-w-none px-4 py-3 min-h-[300px] focus:outline-none",
			},
		},
	});

	if (!editor) return null;

	return (
		<div className="border border-border rounded-md overflow-hidden">
			<MenuBar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}

export default TiptapEditor;
