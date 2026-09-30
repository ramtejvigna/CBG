// Google profile pictures are hot-link protected and can expire or be rate-limited,
// so we download the picture once and keep our own copy (as a data URL, like uploaded avatars).
const MAX_BYTES = 1_000_000;

export const isRemoteImage = (image: string | null | undefined): image is string =>
    !!image && /^https?:\/\//i.test(image);

export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const parsed = new URL(url);
        // Only Google's avatar CDN; never fetch arbitrary hosts from a server
        if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.googleusercontent.com')) {
            return null;
        }

        // Ask Google for a 256px square instead of the original
        const sized = url.replace(/=s\d+(-c)?$/, '') + '=s256-c';
        const response = await fetch(sized, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return null;

        const type = response.headers.get('content-type') ?? '';
        if (!type.startsWith('image/')) return null;

        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

        return `data:${type};base64,${bytes.toString('base64')}`;
    } catch {
        return null;
    }
}
