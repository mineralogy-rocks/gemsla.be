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

	// Convert to non-indexed for flat shading
	const flatGeometry = geometry.toNonIndexed();

	// Compute flat normals manually (each triangle gets same normal for all 3 vertices)
	const positions = flatGeometry.getAttribute("position");
	const normals = new Float32Array(positions.count * 3);

	const pA = new THREE.Vector3();
	const pB = new THREE.Vector3();
	const pC = new THREE.Vector3();
	const cb = new THREE.Vector3();
	const ab = new THREE.Vector3();

	for (let i = 0; i < positions.count; i += 3) {
		pA.fromBufferAttribute(positions, i);
		pB.fromBufferAttribute(positions, i + 1);
		pC.fromBufferAttribute(positions, i + 2);

		cb.subVectors(pC, pB);
		ab.subVectors(pA, pB);
		cb.cross(ab);
		cb.normalize();

		// Set same normal for all 3 vertices of this triangle
		normals[i * 3] = cb.x;
		normals[i * 3 + 1] = cb.y;
		normals[i * 3 + 2] = cb.z;

		normals[(i + 1) * 3] = cb.x;
		normals[(i + 1) * 3 + 1] = cb.y;
		normals[(i + 1) * 3 + 2] = cb.z;

		normals[(i + 2) * 3] = cb.x;
		normals[(i + 2) * 3 + 1] = cb.y;
		normals[(i + 2) * 3 + 2] = cb.z;
	}

	flatGeometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

	return flatGeometry;
}

// Custom shader material for depth-based opacity on wireframe edges (black/gray for contrast)
const depthLineMaterial = new THREE.ShaderMaterial({
	transparent: true,
	uniforms: {
		nearColor: {value: new THREE.Color("#000000")},  // black (close)
		farColor: {value: new THREE.Color("#888888")},   // gray (far)
		nearOpacity: {value: 1.0},
		farOpacity: {value: 0.15},
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

// Shader material for mesh facets with normal-based shading for realistic gem look
const facetMaterial = new THREE.ShaderMaterial({
	transparent: true,
	depthWrite: false,
	side: THREE.DoubleSide,
	uniforms: {
		lightColor: {value: new THREE.Color("#d4ebfc")},   // light blue (facing camera)
		darkColor: {value: new THREE.Color("#2a5a8a")},    // dark blue (angled away)
		ambientColor: {value: new THREE.Color("#a8d4f0")}, // ambient fill
		lightDir: {value: new THREE.Vector3(-0.5, 0.3, 1.0).normalize()}, // light from front-left
	},
	vertexShader: `
		varying vec3 vNormal;
		varying vec3 vViewDir;
		varying float vDepth;
		void main() {
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			vNormal = normalize(normalMatrix * normal);
			vViewDir = normalize(-mvPosition.xyz);
			vDepth = -mvPosition.z;
			gl_Position = projectionMatrix * mvPosition;
		}
	`,
	fragmentShader: `
		uniform vec3 lightColor;
		uniform vec3 darkColor;
		uniform vec3 ambientColor;
		uniform vec3 lightDir;
		varying vec3 vNormal;
		varying vec3 vViewDir;
		varying float vDepth;
		void main() {
			vec3 normal = normalize(vNormal);
			vec3 viewDir = normalize(vViewDir);

			// Calculate how much facet faces camera (1 = directly facing, 0 = perpendicular)
			float facing = abs(dot(normal, viewDir));

			// Depth factor for additional variation
			float depthFactor = smoothstep(4.0, 5.5, vDepth);

			// Combine facing and depth for final shading
			float shade = facing * 0.7 + (1.0 - depthFactor) * 0.3;

			// Mix colors based on shade
			vec3 color = mix(darkColor, lightColor, shade);

			// Add ambient for softer look
			color = mix(ambientColor, color, 0.8);

			// Opacity varies: front-facing = slightly transparent, angled = more opaque
			// Higher base opacity to reduce visibility of inner space
			float opacity = mix(0.85, 0.55, facing);

			// Specular reflection only on crown/table facets (upward-pointing normals)
			// Pavilion facets point downward (negative Y) so they won't get specular
			if (normal.y > 0.0) {
				vec3 halfVector = normalize(lightDir + viewDir);
				float specular = pow(max(dot(normal, halfVector), 0.0), 32.0);

				// Add bright white highlight where specular is strong
				color = mix(color, vec3(1.0), specular * 0.95);
				opacity = mix(opacity, 0.55, specular);
			}

			gl_FragColor = vec4(color, opacity);
		}
	`,
});

// Circular halo shader material with radial gradient
const haloMaterial = new THREE.ShaderMaterial({
	transparent: true,
	depthWrite: false,
	uniforms: {
		centerColor: {value: new THREE.Color("#a8d4f0")},  // visible light blue
		opacity: {value: 0.2},  // subtle
	},
	vertexShader: `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: `
		uniform vec3 centerColor;
		uniform float opacity;
		varying vec2 vUv;
		void main() {
			// Calculate distance from center (0.5, 0.5)
			vec2 center = vec2(0.5, 0.5);
			float dist = distance(vUv, center) * 2.0;

			// Radial gradient: bright at center, transparent at edges
			float alpha = smoothstep(1.0, 0.0, dist) * opacity;

			gl_FragColor = vec4(centerColor, alpha);
		}
	`,
});

// Static halo that doesn't rotate with the gem
function Halo({position}: {position: [number, number, number]}) {
	const haloGeometry = useMemo(() => new THREE.PlaneGeometry(3.5, 3.5), []);

	return (
		<mesh geometry={haloGeometry}
		      material={haloMaterial}
		      position={[position[0], position[1], position[2] - 0.3]}
		      renderOrder={-1} />
	);
}

function Gem({position, scale, rotationSpeed, initialRotation}: GemProps) {
	const groupRef = useRef<THREE.Group>(null);
	const geometry = useMemo(() => createBrilliantGeometry(), []);
	const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry]);

	useFrame((state) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += rotationSpeed;
		}
	});

	return (
		<>
			<Halo position={position} />
			<group ref={groupRef}
			       position={position}
			       scale={scale}
			       rotation={initialRotation}>
				<mesh geometry={geometry}
				      material={facetMaterial} />
				<lineSegments geometry={edgesGeometry}
				              material={depthLineMaterial} />
			</group>
		</>
	);
}

export function DiamondWireframe() {
	return (
		<div className="w-full h-full">
			<Canvas camera={{position: [0, 0, 5], fov: 50}}
			        style={{background: "transparent"}}>
				<Gem position={[0, 0.6, 0.5]}
				     scale={0.95}
				     rotationSpeed={0.01}
				     initialRotation={[0.4, 0, 0]} />
			</Canvas>
		</div>
	);
}

export default DiamondWireframe;
