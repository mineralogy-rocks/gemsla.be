"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {useRef} from "react";
import {Canvas, useFrame} from "@react-three/fiber";
import {Edges} from "@react-three/drei";
import * as THREE from "three";

function RotatingDiamond() {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (meshRef.current) {
			// Faster rotation
			meshRef.current.rotation.y += 0.008;
			meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
		}
	});

	return (
		<mesh ref={meshRef}
		      rotation={[0.3, 0, 0]}>
			<octahedronGeometry args={[1, 0]} />
			<meshBasicMaterial visible={false} />
			<Edges scale={1}
			       threshold={15}
			       color="#000000"
			       lineWidth={1} />
		</mesh>
	);
}

export function DiamondWireframe() {
	return (
		<div className="w-full h-32 sm:h-40 md:h-48 flex items-center justify-center">
			<Canvas camera={{position: [0, 0, 5], fov: 50}}
			        style={{background: "transparent"}}>
				<ambientLight intensity={0.5} />
				<RotatingDiamond />
			</Canvas>
		</div>
	);
}

export default DiamondWireframe;
