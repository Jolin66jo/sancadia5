create table if not exists public.games (
  id text primary key,
  name text not null,
  type text not null check (type in ('versus', 'puzzle', 'arcade', 'hidden')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.games (id, name, type) values
  ('2048', '2048', 'puzzle'),
  ('battleships', 'Battleships', 'versus'),
  ('bullscows', 'Bulls and Cows', 'puzzle'),
  ('checkers', 'Checkers', 'versus'),
  ('connect-4', 'Connect 4', 'versus'),
  ('dominoes', 'Dominoes', 'versus'),
  ('dots-and-boxes', 'Dots and Boxes', 'versus'),
  ('ganzenbord', 'Ganzenbord', 'versus'),
  ('gomoku', 'Gomoku', 'versus'),
  ('hangman', 'Hangman', 'puzzle'),
  ('latrunculi', 'LATRUNCULI', 'versus'),
  ('ludo', 'Ludo', 'versus'),
  ('mancala', 'Mancala', 'versus'),
  ('mastermind', 'Mastermind', 'puzzle'),
  ('minesweeper', 'Minesweeper', 'puzzle'),
  ('noughts-and-crosses', 'Noughts and Crosses', 'versus'),
  ('reversi', 'Reversi', 'versus'),
  ('sjoelen', 'Sjoelen', 'puzzle'),
  ('snake', 'Snake', 'puzzle'),
  ('stratego', 'Stratego', 'versus'),
  ('xiangqi', 'Xiangqi', 'versus')
on conflict (id) do nothing;

alter table public.games enable row level security;

alter table public.profiles
  add column if not exists imported_local_stats boolean not null default false;

alter table public.game_stats
  add constraint game_stats_game_id_games_fkey
  foreign key (game_id) references public.games (id) not valid;

alter table public.game_results
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms >= 0),
  add column if not exists move_count integer check (move_count is null or move_count >= 0),
  add column if not exists flagged boolean not null default false,
  add column if not exists imported boolean not null default false;

alter table public.game_results
  add constraint game_results_game_id_games_fkey
  foreign key (game_id) references public.games (id) not valid;

create index if not exists game_results_user_created_idx
  on public.game_results (user_id, created_at desc);
create index if not exists game_results_game_created_unflagged_idx
  on public.game_results (game_id, created_at desc)
  where flagged = false;
create index if not exists game_stats_game_difficulty_points_idx
  on public.game_stats (game_id, difficulty, points desc);
