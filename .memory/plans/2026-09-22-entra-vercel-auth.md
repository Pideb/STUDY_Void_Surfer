# Plan: Entra Vercel Authentication

## Goal

Deploy VOID SURFER through Vercel so organization users only need a URL and an Entra account. Keep Supabase Auth and the RLS-protected leaderboard; configure Microsoft OAuth as a single-tenant Entra application without Graph profile access or SPA client secrets.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Make tenant-aware OAuth configuration explicit and document reproducible Supabase/Entra/Vercel deployment. | [P01](../phases/2026-09-22-entra-vercel-auth/P01-entra-vercel-auth/phase.md) |
