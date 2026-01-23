# Warehouse Loading Tracker

A simple web app to track warehouse loading operations. The goal is to give loaders and supervisors a clear, shared view of what is loaded, in-progress, or missing so teams can coordinate faster and reduce errors.

## Purpose

Keep a concise, real-time board of loading activity so teams can see shipment progress at a glance and act on missing items quickly.

## Basic outline / Features

- Track shipments being loaded onto vehicles.
- Record expected vs. loaded quantities and any missing/unavailable items.
- Identify the delivery vehicle for each shipment.
- Set and update load status (pending, in-process, complete).
- Simple, fast CRUD workflows: create, view, update, and remove load entries.

## Core data per load

- Shipment identifier: route code or client name (e.g., PR2301, ACME Co.)
- Quantity: expected / loaded (e.g., 75/75 or 60/63)
- Delivery vehicle ID: truck or van identifier
- Missing/unavailable quantity: count of items not available
- Status: `pending`, `in-process`, `complete`

## Getting started

This project is intentionally minimal and framework-agnostic for the first version. Suggested local steps for implementers:

- Create a project folder and a Python virtual environment (if using Python).
- Implement a small backend to store and validate the load entries (SQLite or simple JSON for a prototype).
- Build a lightweight web UI that displays the board and allows quick updates.
- See `Project_Overview.md` for goals, constraints, and design considerations.

## Contributing

Keep changes small and focused. Prioritize correctness and clarity over visual polish. Good first improvements:

- Add simple persistence (SQLite) and a minimal API for CRUD operations.
- Add basic validation for quantities and status transitions.
- Improve the UI for readability and low-typing workflows.

## Notes

This repository is intended as a learning project and foundation. Future expansions may include authentication, an activity log, filters by shift/date, and export options.
