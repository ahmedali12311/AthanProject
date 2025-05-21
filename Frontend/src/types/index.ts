export interface Section {
  id: number;
  name: string;
}

export interface SectionsResponse {
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    first_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  sections: Section[];
}

export interface PrayerTime {
  id: number;
  day: number;
  month: number;
  fajr_first_time: string;
  fajr_second_time: string;
  sunrise_time: string;
  dhuhr_time: string;
  asr_time: string;
  maghrib_time: string;
  isha_time: string;
  section_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PrayerTimesResponse {
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    first_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  prayer_times: PrayerTime[];
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface TimeRemainingFormat {
  hours: number;
  minutes: number;
  seconds: number;
}

export type ThemeType = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';