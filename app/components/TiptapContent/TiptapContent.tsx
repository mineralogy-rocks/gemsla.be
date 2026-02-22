"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

const AlignableImage = Image.extend({
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
			"data-storage-path": {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-storage-path"),
				renderHTML: (attributes: Record<string, string | null>) => {
					if (!attributes["data-storage-path"]) return {};
					return { "data-storage-path": attributes["data-storage-path"] };
				},
			},
		};
	},
});

interface TiptapContentProps {
	content: JSONContent | Record<string, unknown>;
}

export function TiptapContent({ content }: TiptapContentProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Link.configure({
				openOnClick: true,
				HTMLAttributes: {
					target: "_blank",
					rel: "noopener noreferrer",
					class: "tiptap-link",
				},
			}),
			AlignableImage.configure({
				HTMLAttributes: {
					class: "tiptap-image",
				},
			}),
		],
		content: content as JSONContent,
		editable: false,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "tiptap-content prose max-w-none",
			},
		},
	});

	if (!editor) return null;

	return <EditorContent editor={editor} />;
}

export default TiptapContent;
