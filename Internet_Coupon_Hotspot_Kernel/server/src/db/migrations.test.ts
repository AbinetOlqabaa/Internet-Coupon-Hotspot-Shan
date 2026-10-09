import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Schema & Migration Sequence Integrity', () => {
  const migrationsDir = path.resolve(__dirname, 'migrations');

  it('contains sequentially numbered migration files', () => {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(files[0]).toBe('001_initial_schema.sql');
    expect(files[1]).toBe('002_user_management_and_roles.sql');
    expect(files[2]).toBe('003_notifications_loyalty_and_ai.sql');
  });

  it('validates 001_initial_schema.sql defines core tables and constraints', () => {
    const content = fs.readFileSync(path.join(migrationsDir, '001_initial_schema.sql'), 'utf-8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS owners');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS customers');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS access_packages');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS coupons');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS gateways');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS access_sessions');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS payment_intents');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS ledger_entries');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS audit_events');
    expect(content).toContain('price_minor INTEGER NOT NULL CHECK (price_minor >= 0)');
    expect(content).toContain('amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0)');
    expect(content).toContain('uq_payment_idempotency UNIQUE (owner_id, idempotency_key)');
  });

  it('validates 002_user_management_and_roles.sql defines role columns and password resets', () => {
    const content = fs.readFileSync(path.join(migrationsDir, '002_user_management_and_roles.sql'), 'utf-8');
    expect(content).toContain('ALTER TABLE owners ADD COLUMN IF NOT EXISTS role');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS password_reset_tokens');
    expect(content).toContain('token_hash VARCHAR(255) NOT NULL');
  });

  it('validates 003_notifications_loyalty_and_ai.sql defines notifications, loyalty, and AI providers', () => {
    const content = fs.readFileSync(path.join(migrationsDir, '003_notifications_loyalty_and_ai.sql'), 'utf-8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS notifications');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS loyalty_badges');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS bonus_grants');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS ai_providers');
    expect(content).toContain('idx_notifications_owner_status');
    expect(content).toContain('idx_ai_providers_owner_prio');
  });
});
