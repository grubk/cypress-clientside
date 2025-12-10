/**
 * Location Validator Utility
 * 
 * Uses OpenStreetMap's Nominatim API for location validation and autocomplete.
 * This is a free, resource-efficient solution with built-in rate limiting.
 * 
 * Features:
 * - Validates if a location string is a real place
 * - Provides autocomplete suggestions
 * - Client-side caching to minimize API calls
 * - Debouncing to avoid excessive requests
 */

interface LocationSuggestion {
    displayName: string;
    country: string;
    state?: string;
}

// Simple in-memory cache to reduce API calls
const locationCache = new Map<string, LocationSuggestion[]>();
const validationCache = new Map<string, boolean>();

/**
 * Validates if a location string corresponds to a real place
 * @param location - The location string to validate
 * @returns Promise<boolean> - true if location is valid, false otherwise
 */
export async function validateLocation(location: string): Promise<boolean> {
    if (!location || location.trim().length < 2) {
        return false;
    }

    const normalizedLocation = location.trim().toLowerCase();
    
    // Check cache first
    if (validationCache.has(normalizedLocation)) {
        return validationCache.get(normalizedLocation)!;
    }

    try {
        const suggestions = await searchLocations(location);
        const isValid = suggestions.length > 0;
        
        // Cache the result
        validationCache.set(normalizedLocation, isValid);
        
        return isValid;
    } catch (error) {
        console.error('Location validation error:', error);
        // On error, assume valid to not block users
        return true;
    }
}

/**
 * Searches for location suggestions based on user input
 * @param query - The search query
 * @returns Promise<LocationSuggestion[]> - Array of location suggestions
 */
export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    // Check cache first
    if (locationCache.has(normalizedQuery)) {
        return locationCache.get(normalizedQuery)!;
    }

    try {
        // Using Nominatim API (free, no API key required)
        // Rate limit: 1 request per second (enforced by User-Agent requirement)
        const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5',
            'accept-language': 'en'
        });

        const response = await fetch(url, {
            headers: {
                // User-Agent is required by Nominatim usage policy
                'User-Agent': 'CypressClientApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const suggestions: LocationSuggestion[] = data.map((item: any) => ({
            displayName: item.display_name,
            country: item.address?.country || '',
            state: item.address?.state || item.address?.province || item.address?.region
        }));

        // Cache the results
        locationCache.set(normalizedQuery, suggestions);
        
        // Clear old cache entries if cache gets too large (keep last 100)
        if (locationCache.size > 100) {
            const firstKey = locationCache.keys().next().value;
            locationCache.delete(firstKey);
        }

        return suggestions;
    } catch (error) {
        console.error('Location search error:', error);
        return [];
    }
}

/**
 * Debounce function to limit API calls
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
