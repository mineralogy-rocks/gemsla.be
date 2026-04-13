const fmtEUR = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });
const fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });


export function money(v: number | null | undefined, ccy: "eur" | "usd"): string {
	if (v == null) return "—";
	return ccy === "eur" ? fmtEUR.format(v) : fmtUSD.format(v);
}


export function fmtDate(iso: string | null): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
