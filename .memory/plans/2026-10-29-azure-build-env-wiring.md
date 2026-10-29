# Plan: Azure Build Environment Wiring

## Goal
Make the generated Azure GitHub build use the existing Supabase public configuration and verify the live deployment, keeping the actual login allow-list handoff explicit.

| Phase | Status | Blueprint |
| --- | --- | --- |
| P01 | done | [Build wiring](../phases/2026-10-29-azure-build-env-wiring/P01-build/phase.md) |

One task spans the repository-variable configuration, workflow and resulting build because those components must agree for a deployable result. No new gameplay or account permission design is introduced.
