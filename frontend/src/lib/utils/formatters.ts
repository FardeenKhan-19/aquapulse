import { formatDistanceToNow, format, parseISO } from 'date-fns';

function normalizeIsoString(isoString: string): string {
    if (!isoString) return isoString;
    return isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
}

export function formatRelativeTime(isoString: string): string {
    try {
        return formatDistanceToNow(parseISO(normalizeIsoString(isoString)), { addSuffix: true });
    } catch {
        return 'Unknown';
    }
}

export function formatDateTime(isoString: string): string {
    try {
        return format(parseISO(normalizeIsoString(isoString)), 'MMM d, yyyy HH:mm');
    } catch {
        return 'Unknown';
    }
}

export function formatDate(isoString: string): string {
    try {
        return format(parseISO(normalizeIsoString(isoString)), 'MMM d, yyyy');
    } catch {
        return 'Unknown';
    }
}

export function formatTime(isoString: string): string {
    try {
        return format(parseISO(normalizeIsoString(isoString)), 'HH:mm');
    } catch {
        return '--:--';
    }
}

export function formatNumber(num: number, decimals = 1): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
}

export function formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
}

export function formatTds(value: number | null): string {
    if (value === null) return '--';
    return `${value.toFixed(0)} ppm`;
}

export function formatTemperature(value: number | null): string {
    if (value === null) return '--';
    return `${value.toFixed(1)}°C`;
}

export function formatPh(value: number | null): string {
    if (value === null) return '--';
    return value.toFixed(2);
}

export function formatTurbidity(value: number | null): string {
    if (value === null) return '--';
    return `${value.toFixed(1)} NTU`;
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function humanizeSnakeCase(str: string): string {
    return str
        .split('_')
        .map((word) => capitalize(word))
        .join(' ');
}
