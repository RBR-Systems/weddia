export const DEFAULT_VENUE_WIDTH_METERS = 10;
export const DEFAULT_VENUE_HEIGHT_METERS = 6;
export const INITIAL_METERS_TO_PIXELS = 80; // 1 meter = 80px (default zoom)
export const SNAP_METERS = 0.25; // Snap to 0.25m increments
export const MIN_PARTY_SIZE = 1;

export const TABLE_SHAPE_DIMENSIONS: Record<string, { width_m: number; height_m: number }> = {
  round: { width_m: 1.8, height_m: 1.8 },
  rectangular: { width_m: 2, height_m: 1 },
  square: { width_m: 1.5, height_m: 1.5 },
};

export const DEFAULT_TABLE_DIMENSION = { width_m: 1.8, height_m: 1.8 } as const;
