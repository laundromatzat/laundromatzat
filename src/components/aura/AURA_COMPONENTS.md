# Aura Component Library Documentation

## Overview

The Aura Component Library is a collection of premium, reusable React components built with the Aura design system. All components feature consistent styling, smooth animations, and accessibility best practices.

## Design Tokens

### Colors

- `aura-bg` - Primary background (#F5F2EB)
- `aura-surface` - Surface/card background (#FFFFFF)
- `aura-text-primary` - Primary text (#2C2A26)
- `aura-text-secondary` - Secondary text (#4B4943)
- `aura-accent` - Accent color (#D6D1C7)
- Semantic colors: `aura-success`, `aura-warning`, `aura-error`, `aura-info`

### Shadows

- `shadow-aura-sm` - Small shadow
- `shadow-aura-md` - Medium shadow
- `shadow-aura-lg` - Large shadow
- `shadow-aura-xl` - Extra large shadow
- `shadow-aura-glow` - Glow effect

### Animations

- `animate-fade-in` - Fade in animation
- `animate-smooth-in` - Smooth slide in
- `animate-scale-in` - Scale in animation
- `animate-glow-pulse` - Pulsing glow effect

---

## Components

### AuraButton

Premium button component with multiple variants and states.

**Props:**

- `variant?: "primary" | "secondary" | "accent" | "ghost" | "danger"` - Visual variant
- `size?: "sm" | "md" | "lg"` - Button size
- `isLoading?: boolean` - Show loading spinner
- `icon?: React.ReactNode` - Icon element
- `iconPosition?: "left" | "right"` - Icon placement
- `fullWidth?: boolean` - Full width button

**Usage:**

```tsx
import { AuraButton } from "@/components/aura";

// Primary button
<AuraButton variant="primary" size="md">
  Click Me
</AuraButton>

// Button with icon
<AuraButton variant="secondary" icon={<PlusIcon />} iconPosition="left">
  Add Item
</AuraButton>

// Loading button
<AuraButton variant="primary" isLoading>
  Submitting...
</AuraButton>
```

**Variants:**

- **primary**: Dark background, white text - use for main actions
- **secondary**: Light background, bordered - use for secondary actions
- **accent**: Accent color background - use for emphasis
- **ghost**: Transparent - use for tertiary actions
- **danger**: Error color - use for destructive actions

---

### AuraCard

Premium card container with glassmorphism and elevation.

**Props:**

- `variant?: "elevated" | "glass" | "bordered" | "interactive"` - Visual variant
- `padding?: "sm" | "md" | "lg" | "none"` - Internal padding
- `gradientTop?: boolean` - Show gradient top border
- `interactive?: boolean` - Enable hover effects
- `onClick?: () => void` - Click handler (makes card interactive)

**Usage:**

```tsx
import { AuraCard } from "@/components/aura";

// Elevated card
<AuraCard variant="elevated" padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</AuraCard>

// Glassmorphism card
<AuraCard variant="glass" padding="lg" gradientTop>
  <h2>Premium Content</h2>
</AuraCard>

// Interactive/clickable card
<AuraCard variant="interactive" onClick={() => navigate("/details")}>
  <p>Click to view details</p>
</AuraCard>
```

**Variants:**

- **elevated**: White background with shadow - standard card
- **glass**: Glassmorphism effect with backdrop blur
- **bordered**: Emphasized border - use for outlined style
- **interactive**: Hover animations - use for clickable cards

---

### AuraModal

Premium modal dialog with glassmorphism backdrop.

**Props:**

- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close handler
- `title?: string` - Modal title
- `size?: "sm" | "md" | "lg" | "xl" | "full"` - Modal size
- `showCloseButton?: boolean` - Show close button (default: true)
- `footer?: React.ReactNode` - Footer content
- `children: React.ReactNode` - Modal content

**Usage:**

```tsx
import { AuraModal, AuraButton } from "@/components/aura";

const [isOpen, setIsOpen] = useState(false);

<AuraModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={
    <>
      <AuraButton variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </AuraButton>
      <AuraButton variant="primary" onClick={handleConfirm}>
        Confirm
      </AuraButton>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</AuraModal>;
```

**Features:**

- Glassmorphism backdrop with blur
- Keyboard navigation (Escape to close)
- Focus trap for accessibility
- Smooth animations
- Responsive sizing

---

### AuraInput

Premium form input with validation states.

**Props:**

- `label?: string` - Input label
- `error?: string` - Error message
- `success?: string` - Success message
- `helperText?: string` - Helper text
- `inputType?: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea"` - Input type
- `size?: "sm" | "md" | "lg"` - Input size
- `prefixIcon?: React.ReactNode` - Prefix icon
- `suffixIcon?: React.ReactNode` - Suffix icon
- `fullWidth?: boolean` - Full width input
- `rows?: number` - Textarea rows (textarea only)

**Usage:**

```tsx
import { AuraInput } from "@/components/aura";

// Basic input
<AuraInput
  label="Email"
  inputType="email"
  placeholder="you@example.com"
/>

//Input with validation
<AuraInput
  label="Password"
  inputType="password"
  error="Password is too short"
/>

// Input with icon
<AuraInput
  label="Search"
  prefixIcon={<SearchIcon />}
  placeholder="Search..."
/>

// Textarea
<AuraInput
  label="Message"
  inputType="textarea"
  rows={6}
  helperText="Maximum 500 characters"
/>
```

**States:**

- Normal: Default aura border
- Error: Red border with error message
- Success: Green border with success message
- Disabled: Reduced opacity, cursor not-allowed

---

### AuraBadge

Status badge with semantic colors.

**Props:**

- `variant?: "success" | "warning" | "error" | "info" | "neutral"` - Color variant
- `size?: "sm" | "md" | "lg"` - Badge size
- `icon?: React.ReactNode` - Optional icon
- `shape?: "pill" | "rounded"` - Shape variant
- `onDismiss?: () => void` - Dismiss handler (shows close button)

**Usage:**

```tsx
import { AuraBadge } from "@/components/aura";

// Status badges
<AuraBadge variant="success">Active</AuraBadge>
<AuraBadge variant="warning">Pending</AuraBadge>
<AuraBadge variant="error">Failed</AuraBadge>

// Badge with icon
<AuraBadge variant="info" icon={<InfoIcon />}>
  New Feature
</AuraBadge>

// Dismissible badge
<AuraBadge variant="neutral" onDismiss={() => removeTag(id)}>
  React
</AuraBadge>
```

**Variants:**

- **success**: Green - use for positive states
- **warning**: Amber - use for caution states
- **error**: Red - use for error states
- **info**: Gray - use for informational states
- **neutral**: Beige - use for neutral tags

---

## Utility Classes

### Glassmorphism

```css
.aura-glass          /* Standard glass effect */
.aura-glass-strong   /* Stronger glass effect */
.aura-glass-subtle   /* Subtle glass effect */
```

### Gradient Text

```css
.aura-gradient-text  /* Gradient text effect */
```

### Transitions

```css
.aura-transition      /* Standard 300ms transition */
.aura-transition-fast /* Fast 150ms transition */
```

---

## Migration Guide

### From Legacy Components

**Old Button:**

```tsx
<button className="btn-primary">Click</button>
```

**New Aura Button:**

```tsx
<AuraButton variant="primary">Click</AuraButton>
```

**Old Card:**

```tsx
<div className="card">Content</div>
```

**New Aura Card:**

```tsx
<AuraCard variant="elevated">Content</AuraCard>
```

### From Custom Styles

Replace custom Tailwind classes with Aura components:

- Replace `bg-brand-*` with `bg-aura-*`
- Replace `text-brand-*` with `text-aura-*`
- Use `AuraCard` instead of custom card divs
- Use `AuraButton` instead of styled buttons

---

## Best Practices

1. **Consistent Variant Usage**: Use `primary` for main CTAs, `secondary` for supporting actions, `ghost` for tertiary actions

2. **Proper Sizing**: Use size variants consistently - `lg` for hero buttons, `md` for standard, `sm` for compact interfaces

3. **Accessibility**: All components include proper ARIA attributes and keyboard navigation

4. **Color Semantics**: Use semantic colors (success, warning, error) appropriately

5. **Loading States**: Show loading states for async operations with `isLoading` prop

6. **Form Validation**: Use error/success props to provide clear feedback

---

## Examples

### Login Form

```tsx
<AuraCard variant="glass" padding="lg">
  <h2 className="text-2xl font-bold mb-6">Log In</h2>

  <AuraInput
    label="Email"
    inputType="email"
    placeholder="you@example.com"
    error={emailError}
  />

  <AuraInput label="Password" inputType="password" error={passwordError} />

  <AuraButton
    variant="primary"
    fullWidth
    isLoading={isLoading}
    onClick={handleLogin}
  >
    Log In
  </AuraButton>
</AuraCard>
```

### Confirmation Dialog

```tsx
<AuraModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Delete Item"
  footer={
    <>
      <AuraButton variant="ghost" onClick={() => setShowConfirm(false)}>
        Cancel
      </AuraButton>
      <AuraButton variant="danger" onClick={handleDelete}>
        Delete
      </AuraButton>
    </>
  }
>
  <p>
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
</AuraModal>
```
