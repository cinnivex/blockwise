// Row shapes matching supabase/migrations/0001_init.sql.

export type Profile = {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  /** Hex color, e.g. "#4f7cff". */
  color: string;
  archived: boolean;
  created_at: string;
};

export type TimerMode = "stopwatch" | "countdown";

export type TimeEntry = {
  id: string;
  user_id: string;
  category_id: string;
  started_at: string;
  /** Null while the session is still running. */
  ended_at: string | null;
  mode: TimerMode;
  planned_minutes: number | null;
  note: string | null;
  created_at: string;
};
