# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary, for this first surface: **dispatchers** and **general admins** at Fleetly's subcontractor fleet operators. A dispatcher sees and manages only their own subcontractor's drivers, vehicles, and trips; general admin sees across all subcontractors (currently 38, scaling toward ~5,000 drivers). Both work from a desktop/laptop browser in an office or depot setting, not on the move — this is the "sit down and manage the fleet" surface, distinct from the driver mobile app.

Secondary, not yet in scope: drivers themselves (served by a separate React Native app, a separate repo, not this surface).

## Product Purpose

Fleetly is a fleet check-in and damage-register platform for logistics subcontractors. The admin panel is where dispatchers onboard and manage the fleet (drivers, vehicles, badges, devices), oversee trips and damage reports as they happen, and configure the operational rules (document types, retention policies) that govern the driver app's behavior. Success is a dispatcher never needing to touch the database directly or ask an engineer to do something the panel should let them do themselves — every admin action currently only possible via raw SQL (creating a driver, issuing a badge, approving a device) becomes a real, safe, self-service action here.

## Positioning

Unlike a generic fleet-management SaaS, Fleetly's model is built around strict per-tenant isolation enforced at the database layer (Postgres RLS), not just application logic — a dispatcher's queries are structurally incapable of returning another subcontractor's data, even if a future screen were built carelessly. The two deliberate exceptions (damage visible to both the vehicle's owner and the reporting driver's employer; a dispatcher can explicitly share one trip with another subcontractor for a charter) are exactly that — deliberate, narrow, and named — not a permissive default. The admin panel's job is to make that model legible and usable, not to work around it.

## Operating Context

Used from a browser, at a desk, not in the field. A dispatcher's day involves: approving newly-enrolled driver devices, watching trips start/end in near-real-time, reviewing and acting on incident/damage notifications, occasionally correcting a closed trip's odometer or force-close reason (with a mandatory reason, logged), and managing which document types (registration, insurance, licences) their subcontractor requires. General admin additionally manages the global default document-type set, retention policy, and has visibility across every subcontractor for support/oversight purposes.

## Capabilities and Constraints

- This is a separate repo from the API (`fleetly`, a sibling folder — `../fleetly`) by deliberate decision: separate repos per deployable app (API / admin / mobile), not a monorepo. Product/architecture docs referenced below live there, not here.
- Every domain object this panel touches already exists as a tested NestJS/Postgres API in `../fleetly`: driver, vehicle, trip (with a defined state machine — active → completed/force_closed, amendable after close), damage (report/accept/dismiss/repair), incidents (new_damage/breakdown, minimal — no lifecycle), documents (typed, expiring, with a signed-upload flow), badges/devices (issue, approve, revoke), retention policy, notifications. The panel is a client of this API, not a place that invents new backend behavior. The API is already deployed (Fly.io, Frankfurt) with separate staging/production environments.
- Auth: staff (dispatcher/general_admin) authenticate via Supabase Auth's own hosted flow — this panel builds its own login form against Supabase's client SDK, not a custom backend login endpoint.
- Staff provisioning has a known gap: no endpoint yet creates a `staff_user` row tied to a real Supabase Auth identity. This is likely the *first* real screen this panel needs (a general-admin-only "invite a dispatcher" flow), since right now that binding can only be done by hand via SQL.
- Stack (already decided, not this session's choice): Next.js (16, App Router), TypeScript, Tailwind, deployed on Vercel, talking to the NestJS API — never directly to the database.
- Undecided: exact split of "primary areas" beyond the rough sketch (drivers, vehicles, trips, damage) in `../fleetly/docs/product-brief.md` §18 — build order and page inventory to be confirmed as we go, not fixed here.

## Brand Commitments

- Working name **Fleetly** — display name/branding can change later; not yet a fixed legal or trademark commitment. Bundle identifiers should derive from the operating company, not the product name, when that matters (mobile-specific, not this surface).
- Confirmed feel, from `../fleetly/docs/product-brief.md` §29 ("Product Design Philosophy"): **fast, simple, dependable, professional, operational, modern, uncomplicated.** For this surface specifically, §18 narrows it further: "practical rather than visually complex" — scanability and speed over decorative polish. Prefer one obvious action over multiple flexible options when the workflow has one correct path. Error messages state what happened and what to do next, never a bare status code.
- A concrete visual reference already exists: `../fleetly/docs/index.html`, a full click-through prototype of the driver workflow (red/crimson accent `#ff4d6d`→`#d90429`, Poppins + JetBrains Mono, heavily rounded shapes). It's driver-app-scoped, not admin-panel-specific, but it's the established Fleetly visual identity and the starting point for this surface's own visual world, not a from-scratch decision.

## Evidence on Hand

- `../fleetly/docs/index.html` — interactive prototype, driver-app workflow (see Brand Commitments).
- `../fleetly/docs/product-brief.md` — full product brief, sections on roles, workflows, admin panel scope (§18), design philosophy (§29).
- `../fleetly/docs/architecture.md` — technical architecture, RLS/tenant model, roles and capabilities matrix, API contracts.
- `../fleetly/docs/trip-state-machine.md` — the trip lifecycle this panel will visualize/act on.
- No real logo, brand marks, or customer-facing copy exist yet beyond the working name. Do not fabricate testimonials, customer names, or metrics — none exist; this is a pre-launch internal pilot tool for one client's 38 subcontractors.

## Product Principles

1. **RLS is the ground truth, the UI is a view onto it.** Never build a screen that implies a permission the backend doesn't actually enforce — if the panel appears to let a dispatcher see something, they can actually see it, because RLS already allows it.
2. **Practical over decorative.** This is an Operate-mode surface: dense information, scanable tables, fast task completion. Not a marketing site, not a dashboard built to impress.
3. **Every write is attributable and explainable.** The backend already logs who did what and why (audit events, amendment reasons); the panel should never hide or make optional a reason the backend requires.
4. **Build against the real API contracts, not assumptions.** The backend is finished, tested, and deployed — its DTOs and response shapes are the actual interface, not a sketch to be renegotiated.
5. **Small, real, working slices over broad scaffolding.** Given the "invite a dispatcher" gap is the actual current bottleneck, prefer shipping one true end-to-end flow (login → one real admin action) before fanning out to every listed area.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond ordinary good web practice (keyboard navigation, sufficient contrast, readable at standard zoom). Not yet confirmed with the client.
