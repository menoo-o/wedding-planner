# Design System Specification
 
## 1. Overview & Creative North Star: "The Ethereal Ledger"
 
This design system is built to transform the often-stressful task of family financial management into a moment of calm, organized clarity. Our Creative North Star is **"The Ethereal Ledger."** 
 
Unlike traditional banking apps that rely on rigid grids and heavy borders to convey "security," this system uses **Soft Minimalism** to convey trust through precision and openness. We break the "template" look by utilizing intentional asymmetry—placing important data points off-center to draw the eye—and high-contrast typography scales that feel more like a premium editorial magazine than a spreadsheet. The experience should feel like looking through sheets of frosted glass: layered, airy, and deeply intentional.
 
---
 
## 2. Colors: Tonal Depth & The "No-Line" Rule
 
The palette is a sophisticated blend of oceanic teals and breathable grays, designed to reduce cognitive load.
 
### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting on a `surface` background provides all the definition needed without the "clutter" of a line.
 
### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tiers to create "nested" depth:
- **Base Layer:** `surface` (#f7faf9) – The canvas.
- **Secondary Sections:** `surface-container-low` (#f0f5f4) – For grouping related content.
- **Interactive Cards:** `surface-container-lowest` (#ffffff) – Used to "pop" primary information off the screen.
- **Top-Level Overlays:** `surface-bright` (#f7faf9) – For temporary modals or menus.
 
### The "Glass & Gradient" Rule
To elevate the "app-like" feel, use **Glassmorphism** for floating action buttons or navigation bars. Use semi-transparent versions of `surface` with a `backdrop-filter: blur(20px)`. 
 
For main Call-to-Actions (CTAs) and Hero States, apply a subtle **Signature Texture**: a linear gradient from `primary` (#2A9D8F) to `primary-container` (#8cf5e4 - *Placeholder, needs to be derived from seed*) at a 135-degree angle. This provides a visual "soul" that flat fills cannot replicate.
 
---
 
## 3. Typography: Editorial Authority
 
We use a dual-font strategy to balance character with readability.
 
*   **Display & Headlines (Plus Jakarta Sans):** This typeface provides a modern, geometric friendliness. Use `display-lg` (3.5rem) for total balance views to make wealth feel substantial and clear.
*   **Body & Labels (Manrope):** A highly legible sans-serif with a warm personality. Its open counters ensure that financial figures are readable even at the `label-sm` (0.6875rem) size.
 
**Hierarchy Strategy:** 
- Use `headline-md` for category titles (e.g., "Monthly Groceries").
- Use `title-sm` in `primary` (#2A9D8F) for interactive links to signify importance without weight.
- Always use `body-md` for transactional descriptions to maintain a clean, rhythmic flow.
 
---
 
## 4. Elevation & Depth: Tonal Layering
 
We eschew traditional "box-shadows" in favor of natural light physics.
 
*   **The Layering Principle:** Achieve depth by stacking. Place a `surface-container-lowest` card on top of a `surface-container-low` background. This creates a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** For elements that truly float (like Modals), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(44, 52, 52, 0.06);`. Note the use of the `on-surface` color (#2c3434) at a very low opacity to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: Use `outline-variant` (#abb4b3 - *Placeholder, needs to be derived from seed*) at **15% opacity**. Never use 100% opaque borders.
 
---
 
## 5. Components: The Soft Interface
 
### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container` - *Placeholder, needs to be derived from seed*), `on-primary-container` text, and `xl` (3rem) rounded corners.
- **Secondary:** `secondary-container` fill with `on-secondary-container` text. No shadow.
- **Tertiary:** Transparent background, `primary` text, with a subtle `surface-variant` hover state.
 
### Cards & Lists
- **Cards:** Use `md` (1.5rem) or `lg` (2rem) corner radius. 
- **The "Line-Free" List:** Forbid divider lines. Separate list items using `8px` of vertical white space and a 2% color shift on hover. This keeps the ledger feeling "unbroken" and fluid.
 
### Input Fields
- **Styling:** Soft-filled `surface-container-highest` backgrounds rather than outlined boxes. 
- **States:** On focus, the background shifts to `surface-lowest` with a 2px `primary` "Ghost Border" (20% opacity).
 
### Financial Progress Bars
- Use a thick `8px` track in `secondary-container` with a rounded `primary` fill. This "soft" thickness makes the data feel tactile and approachable.
 
---
 
## 6. Do’s and Don’ts
 
### Do:
- **Do** use asymmetrical padding (e.g., more padding at the top of a card than the bottom) to create an editorial, high-end feel.
- **Do** use `primary_fixed_dim` for "positive" financial states (income) and `error` for "negative" states (expenses), but always paired with their respective containers to soften the blow.
- **Do** embrace white space, utilizing a **Compact** level of spacing (spacing: 1). If a screen feels "full," remove an element rather than shrinking it.
 
### Don’t:
- **Don’t** use pure black (#000000) for text. Always use `on-surface` (#2c3434) to maintain the soft visual profile.
- **Don’t** use "Default" corner radii (4px or 8px). Stick to the Roundedness Scale: `MAXIMUM` (pill-shaped) is your starting point.
- **Don’t** use harsh transitions. All hover and state changes should have a minimum `200ms` ease-out duration to match the "Ethereal" persona.