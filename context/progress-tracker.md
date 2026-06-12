# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation implementation

## Current Goal

- None.

## Completed

- Reworked `context/current-issues.md` issue 2 after user testing showed selected elements still were not deleted: canvas selection is now tracked via React Flow `onSelectionChange`, the canvas wrapper is focusable and handles Delete/Backspace directly, deletion calls the Liveblocks `onDelete` mutation, and connected edges are included when deleting selected nodes.
- Implemented `context/current-issues.md` issues 2-7 and marked them pending test: added Liveblocks-backed keyboard deletion for selected canvas nodes/edges, enabled all node handles to start/end connections, tightened shape drop coordinate handling, disabled automatic initial canvas fit on first drop, allowed `img.clerk.com` in Next image remote patterns, and confirmed the workspace navbar keeps the UserButton removed while editor home still renders it.
- Implemented `context/current-issues.md` issue 1 and marked it pending test: workspace Save button now triggers the autosave hook's shared save function, shows Save/Saving.../Saved/Error button states, and the canvas GET route now reads private Vercel Blob content through the Blob SDK.
- Fixed `context/current-issues.md` by documenting the canvas audit, normalizing saved/imported canvas nodes before insertion, centering dropped shapes under the cursor after React Flow coordinate conversion, and ensuring the canvas React Flow surface fills its workspace.
- Implemented `21-canvas-autosave.md` with `@vercel/blob`, a project canvas save/load route backed by Vercel Blob and `canvasJsonPath`, a debounced canvas autosave hook, saved-canvas hydration that skips non-empty Liveblocks rooms, and a workspace save status indicator.
- Implemented `20-ai-sidebar-shell.md` with a separated controlled AI sidebar component, preserved floating right slide-over behavior, AI Workspace header, close control, AI Architect/Specs tabs, empty chat state, starter prompt chips, local draft submission UI, Enter/Shift+Enter handling, and static specs card/actions.
- Implemented `19-presence-avatars-cursor.md` with a room-scoped canvas presence group, collaborator-only avatar stack, Clerk UserButton for the current user, conditional collaborator divider, Liveblocks cursor broadcasting from React Flow mouse movement, cursor clearing on mouse leave, and colored viewport cursors for other participants.
- Refined canvas edge rendering to match the screenshot direction with orthogonal smooth-step paths, muted gray strokes, smaller inline arrowheads, subtle active brightening, and a smooth-step connection preview.
- Refined starter template modal previews to use a wider import dialog, three roomier horizontal cards, larger full-diagram SVG preview areas, clearer node/edge visibility, and per-card Import buttons.
- Implemented `18-starter-template.md` with three predefined starter canvas templates, shared canvas typed node/edge data, a starter template import modal with lightweight SVG previews, a workspace navbar entry point, and a Liveblocks React Flow replacement import flow that clears the current canvas before adding template nodes and edges.
- Implemented `17-canvas-ergonomics.md` with a bottom-left floating zoom/history control bar, animated React Flow zoom out/fit view/zoom in actions, Liveblocks undo/redo hooks with disabled states, `hooks/useKeyboardShortcuts`, editable-field shortcut skipping, and MiniMap removal.
- Implemented `16-edge-behavior.md` with four-side node handles, custom smooth-step canvas edge rendering, arrowheaded light strokes, wider invisible edge interaction paths, hover/selection brightening, midpoint-positioned inline label badges, edit-on-double-click labels, and Liveblocks-synced edge label updates.
- Implemented `15-nodes-color-toolbar.md` with predefined background/text color pairs on nodes, selected-node floating color swatches, active swatch state, tight text-color-based hover glow, drag/pan-safe toolbar interactions, and Liveblocks-synced color updates without server calls.
- Implemented `14-node-editing.md` with selected-node resize handles, minimum resize dimensions, centered inline label editing, empty-label placeholder text, Escape/blur editing close behavior, and label updates synced through the existing Liveblocks React Flow node-change flow.
- Implemented `13-node-shape.md` with shape-aware node rendering, selected-state border emphasis, SVG scaling for diamond/hexagon/cylinder, CSS rendering for rectangle/pill/circle, and a cursor-following ghost drag preview from the shape panel.
- Fixed `context/current-issues.md` editor canvas issues by making the canvas a flush full-viewport layer, converting the AI sidebar to an overlay, moving the left sidebar fully off-screen when closed, removing embedded canvas card/grid behavior, and rendering dropped nodes with their actual shape values.
- Implemented `12-shape-panel.md` with a draggable bottom shape panel, shape drag payloads with default sizes, canvas dragover/drop handling, React Flow coordinate conversion, Liveblocks-synced node creation, generated shape/timestamp/counter node IDs, and a basic custom canvas node renderer.
- Implemented `11-base-canvas.md` with a Liveblocks-backed React Flow canvas foundation, shared canvas node/edge types, room wrapper, suspense loading state, connection fallback, MiniMap, and dot-pattern background.
- Implemented `10-liveblocks-setup.md` with Liveblocks Presence/UserMeta typing, cached node client, deterministic cursor colors, room creation, Clerk/project-gated auth token issuance, and `@liveblocks/node`.
- Implemented `09-share-dialog.md` with collaborator listing, owner-only invite/remove APIs, Clerk profile enrichment, project link copying, and workspace share dialog access modes.
- Implemented `08-editor-workspace-shell.md` with a server-rendered `/editor/[roomId]` workspace shell, project access checks, access-denied state, highlighted project sidebar, canvas placeholder, and AI sidebar placeholder.
- Implemented `06-project-apis.md` with backend-only REST handlers for listing, creating, renaming, and deleting owner-scoped projects.
- Implemented `05-prisma.md` with Prisma project metadata models, collaborator membership relation, cached Prisma client singleton, first migration, generated client, and Accelerate/direct Postgres branching.
- Implemented `/editor` home screen project entry, local create/rename/delete project dialogs, owned-project sidebar actions, and mobile sidebar scrim behavior from `04-project-dialogs.md`.
- Established the dark design token foundation in `app/globals.css` using the documented CSS custom properties and Tailwind token aliases.
- Updated the root layout metadata and global body styling to use Ghost AI branding and design tokens.
- Replaced the starter homepage with a token-based dark workspace preview.
- Installed and configured shadcn/ui for the Next.js 16 + Tailwind v4 app.
- Added shadcn/ui primitives: Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea.
- Installed `lucide-react` and shadcn support dependencies.
- Added `libs/utils.ts` with a reusable `cn()` helper, with `lib/utils.ts` re-exporting it for generated shadcn imports.
- Mapped shadcn CSS variables to the existing Ghost AI dark theme tokens so primitives do not fall back to light defaults.
- Added the base editor chrome components from `context/feature_specs/02-editor.md`.
- Installed `@clerk/ui` and wired Clerk authentication into the app shell.
- Added Clerk sign-in and sign-up pages with minimal dark, token-driven layouts.
- Added `proxy.ts` route protection with auth routes public and all other app/API routes protected.
- Updated `/` to redirect authenticated users to `/editor` and unauthenticated users to the configured sign-in path.
- Added Clerk `UserButton` to the editor navbar and a minimal protected `/editor` shell.
- Refined the auth entry screen to a 50/50 desktop split with a token-colored left panel, feature list icons, and Geist font alignment for Clerk UI.

## In Progress

- None.

## Next Up

- Feature 22 (TBD)

## Open Questions

- None for the canvas autosave unit.

## Architecture Decisions

- Prisma client initialization uses Accelerate only for `prisma+postgres://` database URLs and `@prisma/adapter-pg` for direct PostgreSQL URLs.

## Session Notes

- 2026-06-12: Revisited `context/current-issues.md` issue 2 after user reported Delete/Backspace still did not remove selected elements. Replaced the child/document listener that read `useNodes()`/`useEdges()` selection with wrapper-level keyboard handling, React Flow `onSelectionChange` refs, wrapper focus on mouse down, and Liveblocks `onDelete({ nodes, edges })`; connected edges are included for selected-node deletion.
- 2026-06-12: Fixed `context/current-issues.md` issues 2-7; read Liveblocks React Flow and Clerk/Next image guidance, disabled React Flow's built-in delete key, added a canvas keyboard deletion listener using `useNodes()`/`useEdges()` and Liveblocks node/edge change helpers, made each custom node handle connectable from and to its side, preserved cursor-centered drops with drag-offset payload metadata and canvas bounds checks, removed root `fitView` to prevent first-drop auto zoom, added `img.clerk.com` to `next.config.ts` remotePatterns, verified the workspace header has no UserButton while editor home still uses `EditorNavbar`, marked issues 2-7 pending to test, and verified with `npm run lint` and `npm run build`. The first build hit a corrupt generated `.next/dev/types/routes.d.ts`; removing only the generated `.next` directory and rebuilding passed.
- 2026-06-12: Fixed `context/current-issues.md` issue 1; exposed a manual `saveCanvas` callback from `hooks/use-canvas-autosave.ts`, wired it through the canvas room into the workspace navbar Save button, kept the button workspace-only, changed the button labels to Save/Saving.../Saved/Error with transient terminal states, confirmed PUT already used `access: "private"`, replaced raw canvas blob fetch in GET with `@vercel/blob` `get(..., { access: "private", useCache: false })`, marked issue 1 as pending to test, and verified with `npm run lint` and `npm run build`.
- 2026-06-12: Fixed `context/current-issues.md`; added audit notes, hardened `components/editor/collaborative-canvas.tsx` so saved/imported nodes are normalized with custom node type, shape, color, and size metadata, centered drag-created nodes at the drop cursor using React Flow coordinates, set the React Flow canvas surface to fill its parent, and verified with `npm run lint` and `npm run build`. Browser plugin verification was unavailable because tool discovery exposed only sub-agent tooling.
- 2026-06-12: Completed `21-canvas-autosave.md`; installed `@vercel/blob`, reused the existing Prisma `canvasJsonPath` field, added `GET`/`PUT /api/projects/[projectId]/canvas` for Blob-backed canvas snapshots, added `hooks/use-canvas-autosave.ts`, loaded saved snapshots only when the Liveblocks room is empty, surfaced saving/saved/error in the workspace header, and verified with `npm run lint` and `npm run build`.
- 2026-06-12: Restored the AI Architect empty-state JSX that had been replaced by a literal ellipsis, bringing back the bot icon, prompt text, and starter prompt chips without touching the Specs tab or outer sidebar.
- 2026-06-12: Reworked the AI sidebar tab body so tab panels are absolutely pinned below the tab bar and to the sidebar bottom, ensuring the AI chat input stays at the bottom instead of in the middle when the empty state is short.
- 2026-06-12: Tightened the AI Architect tab layout to use a two-row grid so the chat textarea stays fixed at the bottom like the screenshot while only the message area scrolls.
- 2026-06-12: Updated the editor navbar AI toggle to match the screenshot direction by replacing the bot icon with a Lucide spark/star icon, showing the `AI` label, and using the brand-accent active pill styling while preserving the existing sidebar toggle behavior.
- 2026-06-12: Completed `20-ai-sidebar-shell.md`; added `components/editor/ai-sidebar.tsx`, replaced the workspace placeholder with the controlled AI sidebar component, preserved the parent open/close state and right-side slide transform, added AI Architect and Specs tabs with token-based styles, local starter prompt/draft message UI, Enter-to-submit and Shift+Enter newline handling, and a static demo spec card; verified with `npm run lint` and `npm run build`. In-app browser verification was unavailable because tool discovery exposed no callable browser control tool in this session.
- 2026-06-12: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Ghost AI feature workflow memory, current editor workspace shell, token mappings, shadcn Tabs/Button/Textarea primitives, and `20-ai-sidebar-shell.md`; marked the UI-only AI sidebar shell work as in progress.
- 2026-06-12: Completed `19-presence-avatars-cursor.md`; added the canvas-only presence avatar group, filtered Liveblocks collaborators against the active Clerk user ID, moved the room-view Clerk UserButton into the presence group, capped collaborator avatars at five with overflow, added React Flow-space cursor broadcasting and viewport-rendered colored cursor badges, renamed presence `isThinking` to `thinking`, and verified with `npm run lint` and `npm run build`. Local dev server was already running at `http://localhost:3000`; unauthenticated `GET /` redirects to `/sign-in` through Clerk as expected. Browser plugin verification was unavailable because no callable in-app browser tool was exposed in this session.
- 2026-06-12: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Liveblocks presence/type guidance, and `19-presence-avatars-cursor.md`; marked room-scoped presence avatars and live cursors as in progress.
- 2026-06-12: Completed canvas edge visual refinement; changed `components/editor/canvas-edge.tsx` from Bezier to `getSmoothStepPath`, added muted gray rest strokes, brighter selected/hover/edit strokes, smaller local SVG arrowheads, retained wide transparent hit paths and label editing, and changed the live connection preview to smooth-step; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend reported `iab` unavailable.
- 2026-06-12: Started canvas edge visual refinement from screenshot; found the custom edge renderer was using Bezier paths even though `16-edge-behavior.md` calls for `getSmoothStepPath` right-angle routing.
- 2026-06-11: Completed starter template modal visual refinement; widened the dialog beyond the default responsive max width, changed the grid to roomier three-column cards, enlarged previews, removed tiny preview labels so diagram shapes/edges are clearer, and added per-card Import buttons; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend reported `iab` unavailable.
- 2026-06-11: Started starter template modal visual refinement from screenshots; target is a wider import dialog with clearer full-template previews and roomier cards, without changing persistence or canvas rendering behavior.
- 2026-06-11: Completed `18-starter-template.md`; added the starter template library, import modal with SVG previews, workspace navbar Templates button, and collaborative canvas replacement flow that clears current edges/nodes before adding template edges/nodes and fitting the view; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend reported `iab` unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Ghost AI feature workflow memory, and `18-starter-template.md`; marked starter template library/import work as in progress.
- 2026-06-11: Completed `17-canvas-ergonomics.md`; added the bottom-left control bar above the shape panel, wired zoom controls to the React Flow instance with short animations, wired undo/redo to Liveblocks history hooks with disabled visual states, added `hooks/useKeyboardShortcuts` for zoom and history shortcuts while skipping editable fields, and removed the MiniMap; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend reported `iab` unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, current canvas source, Liveblocks hook exports, React Flow instance types, and `17-canvas-ergonomics.md`; marked canvas ergonomics work as in progress.
- 2026-06-11: Completed `16-edge-behavior.md`; added custom edge rendering with smooth-step routing, arrow markers, widened invisible interaction paths, hover/selected brightening, midpoint-positioned editable label badges, four explicit node handles, and Liveblocks edge label updates; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend was unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Ghost AI feature workflow memory, and `16-edge-behavior.md`; marked edge behavior work as in progress.
- 2026-06-11: Completed `15-nodes-color-toolbar.md`; added text color to canvas node data, defaulted dropped nodes to the neutral color pair, added selected-node floating swatches with active state and controlled hover glow, and synced color pair changes through Liveblocks React Flow `onNodesChange`; verified with `npm run lint` and `npm run build`.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Liveblocks React Flow guidance, and `15-nodes-color-toolbar.md`; marked node color toolbar work as in progress.
- 2026-06-11: Fixed focused node label editing alignment so the active textarea text is vertically centered in the node instead of sitting at the top of the edit box.
- 2026-06-11: Completed `14-node-editing.md`; added selected-node resize handles with minimum dimensions, overlaid centered textarea editing on node double-click, placeholder text for empty labels, blur/Escape edit closing, and label updates through the existing Liveblocks React Flow `onNodesChange` path; verified with `npm run lint` and `npm run build`.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Liveblocks React Flow guidance, and `14-node-editing.md`; marked node resizing and inline label editing work as in progress.
- 2026-06-11: Completed `13-node-shape.md`; exported a reusable node shape primitive, added selected-state border emphasis, kept CSS shapes for rectangle/pill/circle and SVG shapes for diamond/hexagon/cylinder, and added a cursor-following ghost preview for shape drags without changing drop creation; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend was unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client component docs, Liveblocks React Flow guidance, and `13-node-shape.md`; marked node shape rendering and drag preview work as in progress.
- 2026-06-11: Completed `context/current-issues.md` fixes; replaced embedded workspace grid/card treatment with a full canvas layer, converted the right AI sidebar to a floating overlay, strengthened closed left-sidebar offset, added shape-aware node rendering for rectangle, diamond, circle, pill, cylinder, and hexagon, and kept shape drops on the Liveblocks React Flow node-change path; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend was unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js CSS docs, Liveblocks React Flow guidance, `context/current-issues.md`, current screenshot, and editor canvas/sidebar source; marked current canvas issue fixes as in progress.
- 2026-06-11: Completed `12-shape-panel.md`; added the bottom shape panel, drag payload parsing, drop-to-node creation through Liveblocks React Flow node changes, default node size constants, and a basic custom node renderer; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because the in-app browser backend was unavailable.
- 2026-06-11: Read required project, architecture, UI, code standards, workflow, progress context, Next.js client/server component docs, Liveblocks React Flow guidance, and `12-shape-panel.md`; marked shape panel work as in progress.
- 2026-06-10: Completed `11-base-canvas.md`; replaced the workspace placeholder with a Liveblocks `LiveblocksProvider`/`RoomProvider` wrapper and `useLiveblocksFlow` React Flow canvas using empty initial nodes and edges; verified with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- 2026-06-10: Completed `10-liveblocks-setup.md`; configured `liveblocks.config.ts`, added cached Liveblocks node client and deterministic cursor colors, added `POST /api/liveblocks-auth` with Clerk auth, project access checks, room creation, and session metadata; installed `@liveblocks/node`; verified with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- 2026-06-10: Completed `09-share-dialog.md`; added collaborator API handlers, server-only collaborator helpers with Clerk Backend API enrichment, and a workspace share dialog with owner manage mode and collaborator read-only mode; verified with `npm run lint` and `npm run build`.
- 2026-06-10: Completed `08-editor-workspace-shell.md`; added `lib/project-access.ts`, `components/editor/access-denied.tsx`, `components/editor/editor-workspace-shell.tsx`, and `/editor/[roomId]` with server-side auth/access checks and placeholder workspace layout; verified with `npm run lint` and `npm run build`.
- 2026-06-09: Completed `06-project-apis.md`; added `GET`/`POST /api/projects` and `PATCH`/`DELETE /api/projects/[projectId]` with Clerk `401` handling, owner-only `403` mutations, Prisma persistence, and verified with `npm run lint` and `npm run build`.
- 2026-06-09: Read required project, architecture, UI, code standards, workflow, progress context, Next.js route handler docs, Clerk API route guidance, Prisma client guidance, and `06-project-apis.md`; marked backend project API work as in progress.
- 2026-06-09: Completed `05-prisma.md`; added `prisma/models/project.prisma`, `lib/prisma.ts`, migration `20260609083811_add_project_models`, generated Prisma Client, and verified with `npx prisma validate`, `npx prisma migrate dev --name add_project_models`, `npx prisma generate`, `npm run lint`, and `npm run build`.
- 2026-06-09: Read populated `05-prisma.md` and marked the Prisma foundation unit as in progress.
- 2026-06-09: Read required project, architecture, UI, code standards, workflow, progress context, and `05-prisma.md`; found `05-prisma.md` is empty, so no exact Prisma implementation can be safely performed yet.
- 2026-06-09: Updated the Create Project dialog project-name input to use the dark-theme primary text token.
- 2026-06-09: Completed `04-project-dialogs.md` implementation with in-memory project state only; verified with `npm run lint` and `npm run build`. Browser plugin verification was blocked because no in-app browser backend was available.
- 2026-06-09: Read required project, architecture, UI, code standards, workflow, progress context, and `04-project-dialogs.md`; marked project dialogs/editor home work as in progress.
- 2026-06-08: Read required project, architecture, UI, code standards, workflow, and progress context. Requested design-system spec exists but is empty.
- 2026-06-08: Implemented dark-only CSS variables, Tailwind token mappings, base document styling, Ghost AI metadata, and an initial token-based homepage.
- 2026-06-08: Read populated design-system feature spec and marked shadcn/ui primitive setup as in progress.
- 2026-06-08: Completed design-system primitive setup and verified with lint and production build.
- 2026-06-08: Started editor chrome component work by adding the top navbar and project sidebar shell.
- 2026-06-08: Started auth implementation from `03-auth.md`; installed `@clerk/ui`, added protected editor shell route, root redirects, Clerk auth pages, `proxy.ts`, and `UserButton` integration.
- 2026-06-08: Completed auth implementation and verified with `npm run lint` and `npm run build`.
- 2026-06-08: Updated auth UI to match the screenshot direction with a strict 50/50 desktop layout, differentiated left panel, and Clerk font/theme alignment using existing design tokens.
