"use client";
import { QRCodeSVG } from "qrcode.react";

interface Props {
	value: string;
	size?: number;
}

export default function QRCode({ value, size = 160 }: Props) {
	return (
		<QRCodeSVG
			value={value}
			size={size}
			bgColor="transparent"
			fgColor="currentColor"
			level="M"
		/>
	);
}
