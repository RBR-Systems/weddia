# Internationalization (i18n) Migration Plan
## Complete Guide to Implementing Multi-Language Support (English & Spanish)

---

## Executive Summary

This document outlines the industry-standard approach to migrating your web application to support multiple languages (English and Spanish) with locale-based language selection. The plan covers best practices for React, Vue, and Angular frameworks.

**Key Industry Standards:**
- **React**: `react-i18next` (6.3M+ weekly downloads)
- **Vue**: `vue-i18n` (official Vue ecosystem plugin)
- **Angular**: `@angular/localize` (native Angular solution)

---

## Table of Contents

1. [Overview & Industry Standards](#overview--industry-standards)
2. [Framework-Specific Implementation](#framework-specific-implementation)
3. [Migration Strategy](#migration-strategy)
4. [Best Practices](#best-practices)
5. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
6. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Overview & Industry Standards

### What is i18n?

**Internationalization (i18n)** is the process of designing your application to support multiple languages and locales without code changes. It prepares your app for localization (l10n), which is the actual translation process.

### Why i18n Matters (2025 Data)

- **68%** of users would switch to a brand that speaks their language
- **65%+** of global internet users prefer content in their native language
- Apps with i18n see **30%** faster content updates compared to traditional string replacement
- Proper i18n reduces localization costs by **40%+**

### Core Principles

1. **Separate content from code** - All user-facing text in translation files
2. **Use structured keys** - Hierarchical organization (e.g., `nav.home`, `errors.404`)
3. **Support pluralization** - Different forms for singular/plural
4. **Locale-aware formatting** - Dates, numbers, currencies adapt automatically
5. **Lazy loading** - Load only needed translations (reduces bundle size by 40%)
6. **Fallback strategy** - Default language when translation missing

---

## Framework-Specific Implementation

### React: react-i18next

**Why react-i18next?**
- Most popular (6.3M+ weekly downloads, 9.8K+ GitHub stars)
- Hook-friendly API (`useTranslation`)
- Excellent performance with lazy loading
- Supports namespaces, pluralization, interpolation
- Works with SSR (Next.js compatible)

#### Installation

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

#### Project Structure

```
src/
├── locales/
│   ├── en/
│   │   └── translation.json
│   └── es/
│       └── translation.json
├── i18n.js
└── App.jsx
```

#### Configuration (i18n.js)

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    resources: {
      en: {
        translation: require('./locales/en/translation.json')
      },
      es: {
        translation: require('./locales/es/translation.json')
      }
    }
  });

export default i18n;
```

#### Translation Files

**locales/en/translation.json:**
```json
{
  "welcome": "Welcome",
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "greeting": "Hello, {{name}}!",
  "items": "{{count}} item",
  "items_other": "{{count}} items"
}
```

**locales/es/translation.json:**
```json
{
  "welcome": "Bienvenido",
  "nav": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto"
  },
  "greeting": "¡Hola, {{name}}!",
  "items": "{{count}} artículo",
  "items_other": "{{count}} artículos"
}
```

#### Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

function Welcome() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('greeting', { name: 'John' })}</p>
      <p>{t('items', { count: 5 })}</p>
      
      {/* Language Switcher */}
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('es')}>Español</button>
    </div>
  );
}
```

#### Complex Markup with Trans Component

```jsx
import { Trans } from 'react-i18next';

<Trans i18nKey="userMessagesUnread" count={count}>
  Hello <strong title={t('nameTitle')}>{{name}}</strong>, 
  you have {{count}} unread message.
  <Link to="/msgs">Go to messages</Link>
</Trans>
```

---

### Vue: vue-i18n

**Why vue-i18n?**
- Official Vue ecosystem plugin
- Composition API and Options API support
- Built-in pluralization (CLDR rules)
- Automatic date/number formatting
- Lazy loading support
- Type-safe with TypeScript

#### Installation

```bash
npm install vue-i18n
```

#### Project Structure

```
src/
├── locales/
│   ├── en.json
│   └── es.json
├── i18n.ts (or i18n.js)
└── main.ts
```

#### Configuration (i18n.ts)

```typescript
import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import es from './locales/es.json';

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('user-locale') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es
  }
});

export default i18n;
```

#### Translation Files

**locales/en.json:**
```json
{
  "welcome": "Welcome",
  "nav": {
    "home": "Home",
    "about": "About"
  },
  "greeting": "Hello, {name}!",
  "items": "No items | One item | {count} items"
}
```

**locales/es.json:**
```json
{
  "welcome": "Bienvenido",
  "nav": {
    "home": "Inicio",
    "about": "Acerca de"
  },
  "greeting": "¡Hola, {name}!",
  "items": "Sin artículos | Un artículo | {count} artículos"
}
```

#### Main.ts Setup

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import i18n from './i18n';

createApp(App)
  .use(i18n)
  .mount('#app');
```

#### Usage in Components (Composition API)

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const switchLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem('user-locale', lang);
};
</script>

<template>
  <div>
    <h1>{{ t('welcome') }}</h1>
    <p>{{ t('greeting', { name: 'John' }) }}</p>
    <p>{{ t('items', 5) }}</p>
    
    <!-- Language Switcher -->
    <button @click="switchLanguage('en')">English</button>
    <button @click="switchLanguage('es')">Español</button>
  </div>
</template>
```

#### Date/Number Formatting

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { d, n } = useI18n();
const today = new Date();
const price = 1999.5;
</script>

<template>
  <!-- Date formatting -->
  <p>{{ d(today, 'short') }}</p>
  
  <!-- Number formatting -->
  <p>{{ n(price, 'currency') }}</p>
</template>
```

---

### Angular: @angular/localize

**Why @angular/localize?**
- Native Angular solution (optimized performance)
- Compile-time translation (smaller bundles)
- Automatic locale-aware formatting
- No third-party dependencies needed
- Excellent for production builds

**Note:** Angular's approach is compile-time based, meaning you build separate bundles for each language. For runtime switching, consider `ngx-translate`.

#### Installation

```bash
ng add @angular/localize
```

#### Configuration (angular.json)

```json
{
  "projects": {
    "your-app": {
      "i18n": {
        "sourceLocale": "en",
        "locales": {
          "es": {
            "translation": "src/i18n/messages.es.xlf"
          }
        }
      },
      "architect": {
        "build": {
          "configurations": {
            "es": {
              "localize": ["es"]
            }
          }
        }
      }
    }
  }
}
```

#### Usage in Templates

```html
<!-- Simple translation -->
<h1 i18n="@@welcomeMessage">Welcome</h1>

<!-- With interpolation -->
<p i18n>Hello, {{name}}!</p>

<!-- With description and meaning -->
<button i18n="Button label|Click to submit@@submitButton">
  Submit
</button>

<!-- Pluralization -->
<span i18n>
  {count, plural, =0 {No items} =1 {One item} other {{{count}} items}}
</span>
```

#### Usage in TypeScript

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  template: `<h1>{{ welcome }}</h1>`
})
export class WelcomeComponent {
  welcome = $localize`:@@welcomeMessage:Welcome`;
}
```

#### Extract Translations

```bash
ng extract-i18n --output-path src/i18n
```

This generates `messages.xlf` (source file). Copy it to create `messages.es.xlf` and translate.

#### Build for Specific Locale

```bash
# Build for Spanish
ng build --configuration=es

# Build for all locales
ng build --localize
```

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

**Objectives:**
- Set up i18n infrastructure
- Audit existing strings
- Create translation key naming conventions

**Tasks:**

1. **Install Dependencies**
   - Choose framework-appropriate library
   - Install language detection plugins

2. **Create Project Structure**
   ```
   src/
   ├── locales/ (or i18n/)
   │   ├── en/
   │   │   └── translation.json
   │   └── es/
   │       └── translation.json
   └── i18n.js (config file)
   ```

3. **Audit Application**
   - List all user-facing text
   - Identify dynamic content
   - Note pluralization needs
   - Document date/number formatting requirements

4. **Establish Naming Conventions**
   ```
   Format: section.subsection.key
   
   Examples:
   - nav.home
   - auth.login.button
   - errors.validation.email
   - products.list.title
   ```

5. **Set Up Base Configuration**
   - Configure fallback language (English)
   - Enable language detection
   - Set up lazy loading (if needed)

### Phase 2: Core Migration (Weeks 2-3)

**Objectives:**
- Migrate high-traffic pages first
- Establish translation workflow
- Implement language switcher

**Tasks:**

1. **Priority-Based Migration**
   
   **Priority 1 (Week 2):**
   - Navigation/Header
   - Home page
   - Login/Authentication
   - Error messages
   
   **Priority 2 (Week 3):**
   - Main feature pages
   - Forms and validation messages
   - Settings/Profile pages
   
   **Priority 3 (Week 4):**
   - Secondary pages
   - Footer content
   - Help/Documentation

2. **Migration Process per Component**
   
   **Before (Hardcoded):**
   ```jsx
   <h1>Welcome to our app</h1>
   <button>Sign In</button>
   ```
   
   **After (React example):**
   ```jsx
   const { t } = useTranslation();
   
   <h1>{t('welcome.title')}</h1>
   <button>{t('auth.signIn')}</button>
   ```
   
   **Translation file:**
   ```json
   {
     "welcome": {
       "title": "Welcome to our app"
     },
     "auth": {
       "signIn": "Sign In"
     }
   }
   ```

3. **Implement Language Switcher**
   
   **React Example:**
   ```jsx
   function LanguageSwitcher() {
     const { i18n } = useTranslation();
     
     return (
       <select 
         value={i18n.language} 
         onChange={(e) => i18n.changeLanguage(e.target.value)}
       >
         <option value="en">English</option>
         <option value="es">Español</option>
       </select>
     );
   }
   ```

4. **Handle Special Cases**
   - Dynamic content with variables
   - Pluralization rules
   - Gender-specific translations
   - Date/time/currency formatting

### Phase 3: Translation & QA (Week 4)

**Objectives:**
- Complete Spanish translations
- Quality assurance testing
- Performance optimization

**Tasks:**

1. **Translation Process**
   - Use professional translators (recommended)
   - Or use Translation Management Systems (TMS):
     - Crowdin
     - Lokalise
     - POEditor
     - Phrase

2. **Quality Checks**
   - Missing translation keys
   - Context appropriateness
   - Text length/overflow issues
   - Cultural sensitivity

3. **Testing Checklist**
   - [ ] All pages display correctly in both languages
   - [ ] No missing translations (check console for warnings)
   - [ ] Dates format correctly per locale
   - [ ] Numbers/currencies format correctly
   - [ ] Pluralization works as expected
   - [ ] Language switcher persists selection
   - [ ] No layout breaking from longer translations
   - [ ] RTL support (if adding Arabic later)

4. **Performance Optimization**
   - Implement lazy loading for large apps
   - Split translations by namespace/feature
   - Use code splitting for language bundles
   - Cache translations in browser storage

### Phase 4: Deployment & Monitoring (Week 5)

**Objectives:**
- Deploy to production
- Monitor for issues
- Gather user feedback

**Tasks:**

1. **Pre-Deployment**
   - Final QA in staging environment
   - Performance testing
   - Cross-browser testing
   - Mobile responsiveness check

2. **Deployment Strategy**
   - Gradual rollout (A/B testing)
   - Monitor error logs
   - Track language selection analytics
   - Gather user feedback

3. **Post-Deployment Monitoring**
   - Watch for missing translation errors
   - Monitor performance metrics
   - Track user language preferences
   - Collect translation improvement suggestions

---

## Best Practices

### 1. File Organization

**Good Structure:**
```
locales/
├── en/
│   ├── common.json          # Shared across app
│   ├── navigation.json      # Nav items
│   ├── auth.json           # Authentication
│   └── products.json       # Product features
└── es/
    ├── common.json
    ├── navigation.json
    ├── auth.json
    └── products.json
```

**Benefits:**
- Easier to manage
- Better for team collaboration
- Supports lazy loading
- Reduces merge conflicts

### 2. Translation Key Naming

**DO:**
```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "auth.login.title": "Log In",
  "auth.login.button": "Sign In",
  "errors.validation.email": "Invalid email address"
}
```

**DON'T:**
```json
{
  "home": "Home",
  "about_page": "About",
  "LOGIN_TITLE": "Log In",
  "btn_signin": "Sign In",
  "email_error": "Invalid email address"
}
```

**Rules:**
- Use dot notation for hierarchy
- Use camelCase or snake_case consistently
- Be descriptive but concise
- Include context when necessary

### 3. Handle Pluralization Correctly

**React (i18next):**
```json
{
  "items": "{{count}} item",
  "items_other": "{{count}} items"
}
```

**Vue (vue-i18n):**
```json
{
  "items": "No items | One item | {count} items"
}
```

**Angular:**
```html
<span i18n>
  {count, plural, =0 {No items} =1 {One item} other {{{count}} items}}
</span>
```

### 4. Use Interpolation for Dynamic Content

**DO:**
```json
{
  "greeting": "Hello, {{name}}! You have {{count}} new messages."
}
```

```jsx
t('greeting', { name: 'John', count: 5 })
// Output: "Hello, John! You have 5 new messages."
```

**DON'T:**
```jsx
// Concatenating strings
`Hello, ${name}! You have ${count} new messages.`
```

### 5. Implement Lazy Loading for Large Apps

**React (i18next):**
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    ns: ['common', 'navigation', 'auth'],
    defaultNS: 'common'
  });
```

**Vue (vue-i18n):**
```typescript
const i18n = createI18n({
  locale: 'en',
  messages: {}
});

async function loadLocaleMessages(locale: string) {
  const messages = await import(`./locales/${locale}.json`);
  i18n.global.setLocaleMessage(locale, messages.default);
}
```

### 6. Persist User Language Choice

```javascript
// Save on change
i18n.changeLanguage('es');
localStorage.setItem('userLanguage', 'es');

// Load on init
const savedLanguage = localStorage.getItem('userLanguage') || 'en';
i18n.changeLanguage(savedLanguage);
```

### 7. Provide Context for Translators

**React:**
```json
{
  "nav.home": "Home",
  "nav.home_description": "Link to homepage"
}
```

**Angular:**
```html
<a i18n="Navigation link to homepage@@navHome">Home</a>
```

### 8. Format Dates, Numbers, and Currencies

**React:**
```jsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
const date = new Date();

// Use Intl API
new Intl.DateTimeFormat(i18n.language).format(date);
new Intl.NumberFormat(i18n.language, { 
  style: 'currency', 
  currency: 'USD' 
}).format(1999.50);
```

**Vue:**
```vue
<template>
  <p>{{ d(date, 'short') }}</p>
  <p>{{ n(price, 'currency', 'USD') }}</p>
</template>
```

### 9. Handle Missing Translations Gracefully

**Configuration:**
```javascript
// React
i18n.init({
  fallbackLng: 'en',
  saveMissing: true, // Log missing keys
  missingKeyHandler: (lng, ns, key) => {
    console.warn(`Missing translation: ${key}`);
  }
});
```

**Development Warnings:**
- Enable in dev mode
- Monitor console for missing keys
- Track in error monitoring (Sentry, LogRocket)

### 10. Consider SEO for Multi-Language Sites

**URL Structure:**
```
example.com/en/about  (English)
example.com/es/acerca (Spanish)
```

**HTML Lang Attribute:**
```html
<html lang="es">
```

**Hreflang Tags:**
```html
<link rel="alternate" hreflang="en" href="https://example.com/en/" />
<link rel="alternate" hreflang="es" href="https://example.com/es/" />
```

---

## Common Pitfalls to Avoid

### 1. ❌ Concatenating Translated Strings

**BAD:**
```javascript
const message = t('welcome') + ', ' + userName + '!';
```

**GOOD:**
```javascript
const message = t('welcome.message', { name: userName });
// Translation: "Welcome, {{name}}!"
```

**Why:** Word order changes between languages.

### 2. ❌ Hardcoding Plurals

**BAD:**
```javascript
const text = count === 1 ? '1 item' : `${count} items`;
```

**GOOD:**
```javascript
const text = t('items', { count });
```

**Why:** Different languages have different plural rules (some have 3+ forms).

### 3. ❌ Translating in Comments or Console Logs

**BAD:**
```javascript
console.log(t('debug.message')); // Wastes translation budget
// TODO: t('feature.description') // Don't translate comments
```

**GOOD:**
```javascript
console.log('Debug: User action completed'); // Keep in English
// TODO: Add feature X
```

### 4. ❌ Loading All Translations Upfront

**BAD:**
```javascript
// 500KB+ of translations loaded immediately
import en from './locales/en/all-translations.json';
import es from './locales/es/all-translations.json';
```

**GOOD:**
```javascript
// Lazy load by namespace
const loadNamespace = (ns) => import(`./locales/${lang}/${ns}.json`);
```

**Impact:** Initial load time increases 40%+

### 5. ❌ Not Providing Fallback Language

**BAD:**
```javascript
i18n.init({
  lng: userLanguage // Could be undefined
});
```

**GOOD:**
```javascript
i18n.init({
  lng: userLanguage || 'en',
  fallbackLng: 'en'
});
```

### 6. ❌ Ignoring Text Expansion

**Issue:** Spanish text is typically 20-30% longer than English.

**BAD:**
```css
.button {
  width: 100px; /* Fixed width breaks with longer text */
}
```

**GOOD:**
```css
.button {
  min-width: 100px;
  padding: 0.5rem 1rem;
  white-space: nowrap;
}
```

### 7. ❌ Translating Dates Manually

**BAD:**
```javascript
const months = [t('jan'), t('feb'), ...];
const dateString = `${months[date.getMonth()]} ${date.getDate()}`;
```

**GOOD:**
```javascript
const dateString = new Intl.DateTimeFormat(i18n.language, {
  month: 'long',
  day: 'numeric'
}).format(date);
```

### 8. ❌ Not Testing with Real Translations

**BAD:**
```json
{
  "test": "Test",
  "placeholder": "Placeholder text"
}
```

**GOOD:** Use actual translations early to catch layout issues.

### 9. ❌ Mixing Translation Approaches

**BAD:**
```jsx
// Using both direct strings and translation function
<h1>Welcome</h1>
<p>{t('description')}</p>
<button>Click here</button>
```

**GOOD:**
```jsx
<h1>{t('welcome')}</h1>
<p>{t('description')}</p>
<button>{t('clickHere')}</button>
```

### 10. ❌ Not Considering RTL Languages (Future-Proofing)

Even if not supporting RTL now, structure your app to make it easy later:

```css
/* Instead of */
margin-left: 20px;

/* Use logical properties */
margin-inline-start: 20px;
```

---

## Testing & Quality Assurance

### Automated Testing

**1. Missing Translation Keys**

```javascript
// Jest test example (React)
import i18n from './i18n';

describe('i18n', () => {
  it('should have all keys translated', () => {
    const enKeys = Object.keys(i18n.getResourceBundle('en', 'translation'));
    const esKeys = Object.keys(i18n.getResourceBundle('es', 'translation'));
    
    expect(enKeys.sort()).toEqual(esKeys.sort());
  });
});
```

**2. Validate JSON Structure**

```javascript
const validateTranslations = (en, es) => {
  const enKeys = getAllKeys(en);
  const esKeys = getAllKeys(es);
  
  const missing = enKeys.filter(key => !esKeys.includes(key));
  const extra = esKeys.filter(key => !enKeys.includes(key));
  
  if (missing.length) console.error('Missing ES keys:', missing);
  if (extra.length) console.warn('Extra ES keys:', extra);
};
```

### Manual Testing Checklist

- [ ] **Language Switcher**
  - [ ] Changes take effect immediately
  - [ ] Selection persists on page reload
  - [ ] Works on all pages

- [ ] **Visual Layout**
  - [ ] No text overflow
  - [ ] Buttons fit content
  - [ ] Forms display correctly
  - [ ] Navigation menu aligned

- [ ] **Dynamic Content**
  - [ ] Plurals work correctly (0, 1, 2+)
  - [ ] Variable interpolation displays properly
  - [ ] Dates show in correct format
  - [ ] Numbers/currency formatted correctly

- [ ] **Error Handling**
  - [ ] No console errors for missing keys
  - [ ] Fallback language works
  - [ ] Error messages display in correct language

- [ ] **Performance**
  - [ ] Initial load time acceptable
  - [ ] Language switch is fast (<100ms)
  - [ ] No unnecessary re-renders

### Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

### Accessibility

- [ ] `lang` attribute updates on HTML element
- [ ] Screen readers announce language changes
- [ ] Text direction correct (for future RTL support)

---

## Tools & Resources

### Translation Management Systems (TMS)

1. **Crowdin** - GitHub integration, automated workflows
2. **Lokalise** - Developer-focused, API-driven
3. **POEditor** - Simple, collaborative
4. **Phrase** - Enterprise-grade
5. **Weblate** - Open-source

### Development Tools

**React:**
- `i18next-scanner` - Extract keys from code
- `react-i18next-debug` - Dev tools extension

**Vue:**
- `vue-i18n-extract` - Find missing/unused keys
- `@intlify/vue-i18n-loader` - Load translations in .vue files

**Angular:**
- `ng extract-i18n` - Built-in extraction tool
- `xliffmerge` - Merge translation files

### Testing Tools

- **i18n-tasks** - Check for missing/unused translations
- **Pseudo-localization** - Test for hard-coded strings

---

## Maintenance Plan

### Regular Tasks

**Weekly:**
- Review new translation requests
- Add new keys to both language files
- Update TMS with new strings

**Monthly:**
- Audit for unused translations
- Check for consistency in terminology
- Review translation quality

**Quarterly:**
- User feedback review
- Performance optimization
- Update dependencies

### Documentation

Maintain a translation guide including:
- Key naming conventions
- Context for specific terms
- Tone and voice guidelines
- Examples of good translations

---

## Success Metrics

Track these KPIs:

1. **Coverage**: % of app translated
2. **Quality**: Translation accuracy rate
3. **Performance**: Page load times per locale
4. **Usage**: % of users per language
5. **Engagement**: Time on site by language
6. **Errors**: Missing translation key count

---

## Conclusion

Implementing i18n is an investment that pays dividends as your app scales globally. By following industry best practices:

✅ Your codebase stays clean and maintainable  
✅ Adding new languages becomes straightforward  
✅ Users get a native-feeling experience  
✅ Your team can collaborate efficiently  
✅ Performance remains optimal

Start with the framework-specific guide above, follow the migration phases, and avoid common pitfalls. Good luck with your internationalization journey! 🌍

---

## Quick Reference

### React (react-i18next)
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Vue (vue-i18n)
```bash
npm install vue-i18n
```

### Angular (@angular/localize)
```bash
ng add @angular/localize
```

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Framework Versions:** React 18+, Vue 3+, Angular 15+
