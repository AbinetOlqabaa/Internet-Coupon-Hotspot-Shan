import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLocale } from './types.js';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
  onLanguageChange?: (lang: SupportedLocale) => void;
  token?: string | null;
  apiBase?: string;
}

export function LanguageSelector({
  compact = false,
  className = '',
  onLanguageChange,
  token,
  apiBase,
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = (i18n.language as SupportedLocale) || 'en';
  const currentOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode: SupportedLocale) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }

    i18n.changeLanguage(langCode);
    setIsOpen(false);

    if (onLanguageChange) {
      onLanguageChange(langCode);
    }

    // If authenticated, persist to backend profile in background
    if (token && apiBase) {
      fetch(`${apiBase}/api/v1/auth/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: langCode }),
      }).catch(() => {
        // Silently preserve local preference even if server unreachable
      });
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`language-selector-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t('selectLanguage')}: ${currentOption.nativeName}`}
        className="btn-outline"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: compact ? '0.3rem 0.6rem' : '0.45rem 0.85rem',
          fontSize: compact ? '0.8rem' : '0.85rem',
          fontWeight: 600,
          borderRadius: '0.55rem',
          cursor: 'pointer',
          background: 'var(--color-surface, #ffffff)',
          color: 'var(--color-text, #1e293b)',
          border: '1px solid var(--color-border, #cbd5e1)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }} aria-hidden="true">
          🌐
        </span>
        <span style={{ fontWeight: 700 }}>
          {compact ? currentOption.code.toUpperCase() : currentOption.nativeName}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('selectLanguage')}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 9999,
            minWidth: '150px',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: '0.65rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            padding: '0.35rem 0',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => handleSelectLanguage(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLanguage(lang.code);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.9rem',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--color-brand-primary, #102A43)' : 'var(--color-text, #172B4D)',
                  background: isSelected ? 'rgba(22, 166, 161, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid var(--color-brand-secondary, #16A6A1)' : '3px solid transparent',
                  outline: 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem' }}>{lang.nativeName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-muted, #64748b)' }}>
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <span style={{ color: 'var(--color-brand-secondary, #16A6A1)', fontWeight: 800 }}>
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
