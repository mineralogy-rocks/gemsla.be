export function BackgroundTexture() {
	return (
		<div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
		     style={{
			     backgroundImage: 'url("/NNNoise Texture Generator.svg")',
			     backgroundSize: "400px 400px",
			     backgroundRepeat: "repeat",
		     }} />
	);
}
