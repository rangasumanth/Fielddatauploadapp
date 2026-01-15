create table if not exists public.tests (
  test_id text primary key,
  session_id text,
  user_name text,
  email text,
  geo_latitude double precision,
  geo_longitude double precision,
  geo_city text,
  geo_state text,
  geo_accuracy double precision,
  geo_timestamp timestamptz,
  metadata_date text,
  device_id text,
  device_type text,
  test_cycle text,
  location text,
  environment text,
  time_start text,
  time_end text,
  road_type text,
  posted_speed_limit text,
  number_of_lanes text,
  traffic_density text,
  road_heading text,
  camera_heading text,
  lighting text,
  weather_condition text,
  severity text,
  measured_distance text,
  mount_height text,
  pitch_angle text,
  vehicle_capture_view text,
  external_battery_plugged_in boolean,
  firmware text,
  var_version text,
  latest_video_file_name text,
  latest_video_url text,
  video_uploaded_at timestamptz,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tests_created_at_idx on public.tests (created_at desc);

create table if not exists public.test_videos (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.tests(test_id) on delete cascade,
  file_name text not null,
  url text,
  size bigint,
  type text,
  uploaded_at timestamptz default now()
);

create index if not exists test_videos_test_id_idx on public.test_videos (test_id);
