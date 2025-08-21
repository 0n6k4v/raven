# General Coding Guidance

## General Behavior

- You are an agent: continue working until the user's request is fully resolved. 
  Only end your turn when you're confident the problem is solved and no further 
  action is required.

- Your thinking should be thorough—it's absolutely fine (and encouraged) if your 
  reasoning is long. Think step by step before and after each action you take.

- You MUST Plan extensively before making any function calls. Reflect critically after 
  each one. Avoid chaining function calls without introspection between them, as 
  that can impair insight and decision-making.

- If you're unsure about file contents or the codebase structure, use tools to 
  inspect and read relevant files. Never guess or make assumptions.

- Only make necessary, intentional changes that are either directly requested or 
  clearly required for task completion. Avoid editing unrelated or unclear areas.

## Code Quality and Style

- Prefer simple solutions that are easy to understand and maintain.

- Avoid code duplication: before writing new logic, check if similar 
  functionality already exists in the codebase.

- Only introduce a new pattern or technology if all options for improving the 
  current implementation have been exhausted. If you do introduce something new, 
  make sure to fully remove the old implementation to avoid duplication or 
  confusion.

- Keep the codebase clean and organized. Use consistent patterns and naming 
  conventions where applicable.

- Avoid writing one-off scripts in the main codebase—especially if they are 
  only intended to run once.

- Refactor files when they exceed 200–300 lines of code to preserve modularity 
  and clarity.

- Never overwrite the .env file without asking for and receiving explicit 
  confirmation.

- Follow best practices around formatting and consistency. Use linters, 
  formatters, and style guides where appropriate.

## Coding Workflow

- Stay focused on the parts of the code directly relevant to the current task.

- Do not touch unrelated code, even if it could be improved, unless explicitly 
  instructed to do so.

- Avoid major architectural changes or large refactors unless they are 
  structured, justified, and approved.

- Before making a change, always consider its impact on other parts of the 
  system—downstream dependencies, shared services, and global logic should be 
  reviewed.

- Document or summarize your reasoning and decision-making if a change affects 
  multiple components.

### Accessibility Guidelines

#### ARIA Best Practices
- Always include `aria-label` or `aria-labelledby` for interactive elements
- Use `aria-describedby` for additional context
- Implement proper focus management with `tabIndex`
- Use semantic HTML elements when possible

#### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Implement proper tab order with `tabIndex`
- Use arrow keys for grid navigation
- Provide skip links for long content

#### Color and Contrast
- Use Fluent UI design tokens for consistent colors
- Ensure minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information

### Performance Optimization

#### React Best Practices
- Use `useMemo` and `useCallback` for expensive computations
- Implement proper dependency arrays in `useEffect`
- Use `React.memo` for components that don't need frequent re-renders
- Implement proper key props for lists

#### Data Loading Patterns
- Implement server-side pagination for large datasets
- Use loading skeletons instead of spinners
- Implement proper error boundaries
- Cache API responses where appropriate

#### Bundle Optimization
- Use dynamic imports for code splitting
- Implement proper tree shaking
- Optimize images and assets
- Use Vite's built-in optimization features

### Responsive Design Guidelines

#### Mobile-First Approach
- Design for mobile screens first, then enhance for larger screens
- Use Fluent UI's responsive breakpoints
- Implement touch-friendly interactions (minimum 44px tap targets)

#### Layout Patterns
- Use CSS Grid and Flexbox for responsive layouts
- Implement proper viewport meta tags
- Use relative units (rem, em, %) instead of fixed pixels
- Test on various screen sizes and orientations

#### Component Responsiveness
- Provide alternative layouts for different screen sizes
- Use compound components for complex responsive patterns
- Implement proper overflow handling
- Consider content hierarchy on smaller screens