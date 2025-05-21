// Type definitions for the admin panel

// Prayer time type
export interface PrayerTime {
  id: number;
  day: number;
  month: number;
  section: string;
  fajr_first_time: string;
  fajr_second_time: string;
  sunrise_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  created_at: string;
  updated_at: string;
}

// Section type
export interface Section {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  first_page: number;
  last_page: number;
  from: number;
  to: number;
}

// API Response types
export interface PrayerTimesListResponse {
  prayer_times: PrayerTime[];
  meta: PaginationMeta;
}

export interface SectionsListResponse {
  sections: Section[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  message: string;
} 