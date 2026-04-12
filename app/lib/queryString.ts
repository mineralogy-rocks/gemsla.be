export function createQueryString(
	params: Record<string, string | number | boolean>,
	searchParams: URLSearchParams,
): string {
	const urlParams = new URLSearchParams(searchParams.toString());
	Object.entries(params).forEach(([key, value]) => {
		if (value === "" || value === false || value === 1 || value === "all") {
			urlParams.delete(key);
		} else {
			urlParams.set(key, String(value));
		}
	});
	return urlParams.toString();
}
