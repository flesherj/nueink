/**
 * Transaction Location
 * Geographic information about where a transaction occurred.
 *
 * Populated by providers that support location data (e.g., Plaid).
 * YNAB transactions will not have location data.
 */
export interface TransactionLocation {
  address?: string;       // Street address
  city?: string;          // City name
  region?: string;        // State/province (e.g., "CA", "Ontario")
  postalCode?: string;    // ZIP/postal code
  country?: string;       // Country code (e.g., "US", "CA")
  lat?: number;           // Latitude
  lon?: number;           // Longitude
}
