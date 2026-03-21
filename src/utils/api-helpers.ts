export function normalizeResponse(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    return res?.items || res?.data || [];
}
