-- database/migrations/workspace-context-add-columns.sql
-- Run in Supabase Dashboard → SQL Editor
-- Adds website_url and primary_goal columns to existing workspace_context table

ALTER TABLE public.workspace_context
  ADD COLUMN IF NOT EXISTS website_url  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_goal TEXT NOT NULL DEFAULT '';
