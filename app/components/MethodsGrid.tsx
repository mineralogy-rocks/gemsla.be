"use client";

import React from "react";
import {motion} from "framer-motion";
import {staggerContainer, staggerItem} from "../lib/animations";

const methods = [
	"Raman Spectroscopy",
	"X-ray Diffraction",
	"NMR Spectroscopy",
	"Fluorescence Spectroscopy",
	"Electrochemical Analysis",
	"Optical Analysis",
];

export function MethodsGrid() {
	return (
		<motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
		            variants={staggerContainer}
		            initial="hidden"
		            whileInView="visible"
		            viewport={{once: true, margin: "-50px"}}>
			{methods.map((method, index) => (
				<motion.div key={index}
				            className="text-center py-4 px-4 border border-border-light rounded-lg bg-background/50 hover:bg-callout-bg transition-colors duration-300"
				            variants={staggerItem}
				            whileHover={{
					            y: -2,
					            transition: {duration: 0.2}
				            }}>
					<p className="text-foreground text-sm sm:text-base">
						{method}
					</p>
				</motion.div>
			))}
		</motion.div>
	);
}

export default MethodsGrid;
