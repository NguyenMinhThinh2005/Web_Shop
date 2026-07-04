---
name: Chú Tám Tân Xe Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#534434'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#867461'
  outline-variant: '#d8c3ad'
  surface-tint: '#855300'
  primary: '#855300'
  on-primary: '#ffffff'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#ffb95f'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#565e74'
  on-tertiary: '#ffffff'
  tertiary-container: '#a9b0c9'
  on-tertiary-container: '#3b4358'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
This design system is engineered for a premium motorcycle parts specialist, prioritizing high-velocity "quick order" workflows over traditional marketplace browsing. The brand personality is professional, authoritative, and dependable—reflecting a specialist's expertise rather than a generic retailer's breadth.

The design style is **Corporate Modern with a Minimalist lean**. It utilizes high-quality typography and generous whitespace to eliminate "marketplace clutter." The interface relies on a clean, light aesthetic with subtle warm accents to evoke a sense of heritage and trustworthiness. Visual hierarchy is strictly enforced to guide users toward primary conversion points without cognitive overload.

## Colors
The palette is rooted in industry-standard signals of reliability and professional service.

- **Primary (Amber):** Used for primary call-to-actions, branding elements, and progress indicators. It provides high visibility against the clean background.
- **Secondary (Emerald):** Reserved specifically for "Success" states, trust badges, and direct contact actions (Zalo/Phone), signaling safety and completion.
- **Surface & Background:** The system uses a "Warm White" (#FAFAF9) background to soften the interface, while interactive cards remain pure White (#FFFFFF) to pop forward.
- **Text & UI:** Deep Slate (#0F172A) is used for maximum contrast in typography, while Slate-500 (#64748B) handles secondary meta-data.

## Typography
**Be Vietnam Pro** is selected for its exceptional legibility in the Vietnamese language and its contemporary, professional feel. 

- **Hierarchy:** Large display titles are reserved for category headings and brand statements. 
- **Readability:** Body text uses a comfortable 16px base with increased line height to ensure technical part descriptions and specifications are easy to scan.
- **Labels:** Small caps or bold weights are used for data labels (SKU numbers, stock status) to differentiate them from actionable text.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop (1280px max-width) and a **Fluid Fluid** approach on mobile.

- **Grid:** A 12-column grid is used for desktop part listings. On mobile, this collapses to a single column with 16px side margins.
- **Rhythm:** An 8pt linear scaling system is used for most components, but a 4px "half-step" is permitted for tight technical tables and data-heavy "quick-order" rows.
- **Density:** The system prioritizes high information density in the "Quick Order" table while maintaining generous 40px+ padding between major sections to prevent visual fatigue.

## Elevation & Depth
Depth is achieved through **Tonal Layers** combined with **Ambient Shadows**.

- **Level 0 (Background):** #FAFAF9 (Warm White).
- **Level 1 (Cards/Sections):** White surface with a `shadow-sm` (4px blur, 2% opacity black).
- **Level 2 (Interactive/Hover):** White surface with `shadow-md` (12px blur, 6% opacity primary color tint) to indicate "lift" and interactability.
- **Level 3 (Modals/Quick-View):** White surface with `shadow-xl` (25px blur, 10% opacity black) and a 40% backdrop blur (glassmorphism) behind it to maintain focus on the order flow.

## Shapes
The shape language is sophisticated and approachable. 

- **Standard Elements:** Buttons, inputs, and small cards use `rounded-xl` (0.75rem to 1rem) for a modern SaaS feel.
- **Large Containers:** Product showcase cards and main containers use `rounded-2xl` (1.5rem) to reinforce the premium brand positioning.
- **Strictness:** Do not use sharp 0px corners; every interactive element must have a radius to maintain the approachable "trusted specialist" persona.

## Components
- **Primary Buttons:** Bold Amber (#F59E0B) background with White text. High-contrast, `rounded-xl` shape.
- **Quick Order Rows:** Low-profile list items with subtle separators. Feature a "Quick Add" (+) button that triggers a success state (Secondary Green).
- **Input Fields:** Clean White background with 1px Slate-200 borders. Focus states use a 2px Amber ring with a soft glow.
- **Status Chips:** Small, pill-shaped indicators. "In Stock" uses a soft Green tint; "Special Order" uses a soft Amber tint.
- **Cards:** White surfaces with a delicate `shadow-sm`. On hover, the border-color transitions to Primary Amber to signal selection.
- **Search Bar:** Large, centered, and prominent. Uses `rounded-2xl` and a subtle inner shadow to feel "recessed" into the header, encouraging use.