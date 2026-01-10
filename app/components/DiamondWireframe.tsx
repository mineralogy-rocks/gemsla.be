"use client";

import React, {useRef, useMemo} from "react";
import {Canvas, useFrame} from "@react-three/fiber";
import * as THREE from "three";

interface GemProps {
	position: [number, number, number];
	scale: number;
	rotationSpeed: number;
	initialRotation: [number, number, number];
}

// Create a brilliant cut diamond geometry with indexed vertices for clean edges
function createBrilliantGeometry() {
	const segments = 8;
	const crownHeight = 0.4;
	const tableRadius = 0.35;
	const girdleRadius = 1;
	const pavilionDepth = -0.9;

	const vertices: number[] = [];
	const indices: number[] = [];

	// Vertex 0: Table center (top)
	vertices.push(0, crownHeight, 0);

	// Vertices 1-8: Table edge points
	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		vertices.push(
			Math.cos(angle) * tableRadius,
			crownHeight,
			Math.sin(angle) * tableRadius
		);
	}

	// Vertices 9-16: Girdle points
	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		vertices.push(
			Math.cos(angle) * girdleRadius,
			0,
			Math.sin(angle) * girdleRadius
		);
	}

	// Vertex 17: Culet (bottom point)
	vertices.push(0, pavilionDepth, 0);

	// Table faces (center to edge)
	for (let i = 0; i < segments; i++) {
		const next = (i % segments) + 1;
		const nextNext = ((i + 1) % segments) + 1;
		indices.push(0, next, nextNext);
	}

	// Crown faces (table edge to girdle)
	for (let i = 0; i < segments; i++) {
		const tableIdx = (i % segments) + 1;
		const tableNextIdx = ((i + 1) % segments) + 1;
		const girdleIdx = (i % segments) + 9;
		const girdleNextIdx = ((i + 1) % segments) + 9;

		// Two triangles per segment
		indices.push(tableIdx, girdleIdx, tableNextIdx);
		indices.push(tableNextIdx, girdleIdx, girdleNextIdx);
	}

	// Pavilion faces (girdle to culet)
	for (let i = 0; i < segments; i++) {
		const girdleIdx = (i % segments) + 9;
		const girdleNextIdx = ((i + 1) % segments) + 9;
		indices.push(girdleIdx, 17, girdleNextIdx);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();

	return geometry;
}

// Custom shader material for depth-based opacity
const depthLineMaterial = new THREE.ShaderMaterial({
	transparent: true,
	uniforms: {
		nearColor: {value: new THREE.Color("#000000")},
		farColor: {value: new THREE.Color("#f4f4f4")},
		nearOpacity: {value: 1.0},
		farOpacity: {value: 0.1},
	},
	vertexShader: `
		varying float vDepth;
		void main() {
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			vDepth = -mvPosition.z;
			gl_Position = projectionMatrix * mvPosition;
		}
	`,
	fragmentShader: `
		uniform vec3 nearColor;
		uniform vec3 farColor;
		uniform float nearOpacity;
		uniform float farOpacity;
		varying float vDepth;
		void main() {
			float depth = smoothstep(3.0, 8.0, vDepth);
			vec3 color = mix(nearColor, farColor, depth);
			float opacity = mix(nearOpacity, farOpacity, depth);
			gl_FragColor = vec4(color, opacity);
		}
	`,
});

function Gem({position, scale, rotationSpeed, initialRotation}: GemProps) {
	const groupRef = useRef<THREE.Group>(null);
	const geometry = useMemo(() => createBrilliantGeometry(), []);
	const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry]);

	useFrame((state) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += rotationSpeed;
			groupRef.current.rotation.z = initialRotation[2] + Math.sin(state.clock.elapsedTime * 0.2) * 0.03;
		}
	});

	return (
		<group ref={groupRef}
		       position={position}
		       scale={scale}
		       rotation={initialRotation}>
			<mesh geometry={geometry}>
				<meshBasicMaterial color="#7ec8e3"
				                   transparent={true}
				                   opacity={0.5}
				                   depthWrite={false}
				                   side={THREE.DoubleSide} />
			</mesh>
			<lineSegments geometry={edgesGeometry}
			              material={depthLineMaterial} />
		</group>
	);
}

const gemConfigs: Omit<GemProps, "position">[] = [
	{scale: 0.7, rotationSpeed: 0.006, initialRotation: [-Math.PI / 2, 0, 0]},
	{scale: 0.95, rotationSpeed: 0.008, initialRotation: [0.3, 0, 0]},
	{scale: 0.7, rotationSpeed: 0.006, initialRotation: [Math.PI / 2, 0, 0]},
];

const positions: [number, number, number][] = [
	[-2.5, 0, 0],
	[0, 0, 0],
	[2.5, 0, 0],
];

export function DiamondWireframe() {
	return (
		<div className="w-full h-32 sm:h-40 md:h-48 flex items-center justify-center">
			<Canvas camera={{position: [0, 0, 6], fov: 50}}
			        style={{background: "transparent"}}>
				<ambientLight intensity={0.5} />
				{gemConfigs.map((config, index) => (
					<Gem key={index}
					     position={positions[index]}
					     {...config} />
				))}
			</Canvas>
		</div>
	);
}

export default DiamondWireframe;
