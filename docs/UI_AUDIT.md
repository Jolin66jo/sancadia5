# Front-end UI audit

## Initial inventory and findings (before fixes)

This is the initial report captured before UI changes. Findings are based on source inspection; viewport, keyboard, text-zoom, contrast, offline, storage-corruption, and lifecycle checks are still pending. `Fixed` remains `N` until a change is verified.

Severity: **High** = likely blocks use or accessibility; **Medium** = material usability, consistency, or resilience concern; **Low** = polish or incomplete state coverage; **None** = no issue observed in the initial source pass.

| Screen | Issue found | Severity | Fixed (Y/N) |
|---|---|---:|:---:|
| Home (`/`) | Vertically distributed content plus optional event cards may push the main action below the first 360×640 viewport. | Medium | N |
| Games menu (`/games`) | Game names use `truncate`, so long names are clipped instead of wrapping. | Medium | N |
| Game rules (`/games/:gameId/rules`) | Dynamic rules pages not yet checked at narrow widths or with long content. | Medium | N |
| Per-game settings (`/games/:gameId/settings`) | Long settings page and reset dialog need viewport/keyboard checks. | Medium | N |
| Game shell and unknown game (`/games/:gameId`) | Unknown game fallback exists; playable/coming-soon variants need responsive and lifecycle checks. | Medium | N |
| General settings (`/settings`) | Long page and text fields need keyboard, focus, wrapping, and viewport checks. | Medium | N |
| Stats (`/stats`) | Empty state exists; populated long game names and narrow stats grid need responsive checks. | Medium | N |
| Login (`/login`) | Form labels and controls exist; keyboard/focus behavior still needs checking. | Low | N |
| Sign up (`/signup`) | Form labels and controls exist; keyboard/focus behavior still needs checking. | Low | N |
| Social / leaderboard (`/social`) | Friends and leaderboard are placeholder content; leaderboard is not interactive. | Low | N |
| Shop (`/shop`) | Loading, error, and empty copy exist; verify layout and offline/error behavior. | Low | N |
| Profile (`/profile`) | Dynamic account state and narrow layout need checking. | Medium | N |
| Admin (`/admin`) | Privileged dashboard layout/data states need narrow layout and state checks. | Medium | N |
| Not found (`*`) | Fallback route exists; navigation and narrow layout need checking. | Low | N |
| Noughts and Crosses: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Noughts and Crosses: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Connect 4: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Connect 4: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Gomoku: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Gomoku: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Xiangqi: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Xiangqi: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Reversi: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Reversi: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Latrunculi: pre-game | Uses a game-specific visual skin with hard-coded colors that bypass app theme tokens. | Medium | N |
| Latrunculi: game | Game-specific stylesheet uses hard-coded colors, and its reduced-motion media query nests desktop layout rules. | Medium | N |
| Stratego: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Stratego: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Sjoelen: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Sjoelen: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Ganzenbord: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Ganzenbord: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Checkers: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Checkers: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Battleships: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Battleships: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Mastermind: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Mastermind: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Bulls and Cows: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Bulls and Cows: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Hangman: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Hangman: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Dots and Boxes: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Dots and Boxes: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Mancala: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Mancala: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Dominoes: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Dominoes: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Ludo: pre-game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Ludo: game | Shared match setup plus board screens; compact-board touch sizing needs checking. | Medium | N |
| Snake: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Snake: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| 2048: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| 2048: game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Minesweeper: pre-game | Pre-game / puzzle setup and board controls need viewport and target checks. | Medium | N |
| Minesweeper: game | Board cells have a 28px minimum and need a touch-target exception/fit check; Expert is the documented scroll exception if present. | High | N |
| Coming-soon catalog entries (Seega, Egyptian Mancala, Senet, The Game of 20 Squares, Hounds and Jackals, Mehen, Go, Chinese Checkers, Lu Zhan Qi, Mahjong) | Render a shared coming-soon screen rather than separate playable game screens; verify label and fit. | Low | N |
| Shared dialog: reset data | Native dialog exists; viewport fit, internal scrolling, focus trap, and focus restoration need checking. | High | N |
| Shared dialog: game over | Native dialog exists; viewport fit and focus behavior need checking. | Medium | N |
| Shared dialog: reconstructed rules | Native dialog exists; viewport fit and focus behavior need checking. | Medium | N |
| Shared dialog: game settings reset | Native dialog exists; viewport fit and focus behavior need checking. | Medium | N |
| Toasts and PWA/offline notice | PWA notice exists; overlap with navigation and screen readers needs checking. | Medium | N |
| Loading fallbacks | Page and game Suspense fallbacks exist; layout stability needs checking. | Low | N |
| Error-boundary fallback | No React error boundary was found in the initial route tree. | Medium | N |

## Route and game coverage

Explicit routes are `/`, `/games`, `/games/:gameId/rules`, `/games/:gameId/settings`, `/games/:gameId`, `/settings`, `/stats`, `/login`, `/signup`, `/social`, `/shop`, `/profile`, and `/admin`, followed by `*` for not found. The game route dynamically resolves the catalog IDs listed above. The 21 `available` game IDs each have a game screen with its game-specific initial/setup state; the 10 `coming-soon` catalog entries share the coming-soon screen. Their individual setup controls are inventoried above with the named games.

## Validation status

- Initial checks are source inspection only. No viewport, screen-reader, keyboard-only, text-zoom, contrast, performance, service-worker/offline, storage-corruption, or timer/listener runtime check has yet been performed.
- Screenshots are pending. A screenshot-capable browser may not be installed; this will be checked before claiming screenshot coverage.
- Browser back and deep-link refresh still need runtime verification.
