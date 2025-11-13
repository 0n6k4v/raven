# VS Code Copilot Instructions

## Project Overview


### Root Folders

### Core Architecture

### Finding Related Code
1. **Semantic search first**: Use file search for general concepts
2. **Grep for exact strings**: Use grep for error messages or specific function names
3. **Follow imports**: Check what files import the problematic module
4. **Check test files**: Often reveal usage patterns and expected behavior

## General Behavior

### Working Principles

**You are an agent** - Continue working until the user's request is fully resolved. Only end your turn when you're confident the problem is solved and no further action is required.

### Problem-Solving Approach

1. **Think thoroughly** - Your reasoning should be comprehensive. Think step by step before and after each action.

2. **Plan extensively** - Plan before making any function calls. Reflect critically after each one. Avoid chaining function calls without introspection.

3. **Verify before acting** - If you're unsure about file contents or codebase structure, use tools to inspect and read relevant files. Never guess or make assumptions.

4. **Make intentional changes** - Only make necessary changes that are directly requested or clearly required for task completion. Avoid editing unrelated or unclear areas.

---

## CCoding Guidelines

### Indentation

```javascript
// ✅ Use tabs, not spaces
function example() {
	const data = {
		key: 'value'
	}
	return data
}
```

### Naming Conventions

#### Files & Folders
- **Components**: `PascalCase.jsx` (e.g., `UserProfile.jsx`)
- **Utilities**: `camelCase.js` (e.g., `formatDate.js`)
- **Constants**: `UPPER_SNAKE_CASE.js` (e.g., `API_ENDPOINTS.js`)

#### Code Elements
```javascript
// Components - PascalCase
const UserProfile = () => {}

// Functions & Variables - camelCase
const getUserData = () => {}
const userName = 'John'

// Constants - UPPER_SNAKE_CASE
const MAX_ITEMS = 100
const API_ENDPOINT = 'https://api.example.com'

// Custom Hooks - use + PascalCase
const useUserData = () => {}

// Event Handlers - handle + Action
const handleClick = () => {}
const handleSubmit = () => {}
```

### Strings

```javascript
// ✅ Use "double quotes" for user-facing strings (externalized/localized)
const message = "Welcome to the application"

// ✅ Use 'single quotes' for internal strings
const className = 'button-primary'

// ✅ Use placeholders instead of concatenation
const greeting = "Hello, {0}!" // Not: "Hello, " + name
```

### UI Labels

```javascript
// ✅ Use title-style capitalization
"Save Changes"    // Correct
"Create New Item" // Correct
"Log in"          // Correct (preposition)

// ❌ Avoid
"save changes"    // Wrong
"Create new item" // Wrong
```

**Rules:**
- Capitalize each word
- Don't capitalize prepositions of 4 or fewer letters unless first/last word
- Examples: in, with, for, from, into

### Comments

Use JSDoc style for functions, interfaces, enums, and classes:

```javascript
/**
 * Calculate user's total score
 * 
 * @param {Object} user - User object
 * @param {number[]} scores - Array of scores
 * @returns {number} Total score
 * @throws {Error} If scores array is empty
 * 
 * @example
 * calculateScore(user, [80, 90, 85]) // Returns 255
 */
function calculateScore(user, scores) {
	// Implementation
}
```

---

## Code Quality

### Simplicity First

```javascript
// ✅ Simple and clear
const isValid = user && user.age >= 18

// ❌ Overcomplicated
const isValid = Boolean(user) && Number(user.age) >= Number(18)
```

### Avoid Code Duplication

```javascript
// ❌ Duplicated logic
function getUserFullName() {
	return user.firstName + ' ' + user.lastName
}
function getAuthorFullName() {
	return author.firstName + ' ' + author.lastName
}

// ✅ Reusable function
function getFullName(person) {
	return `${person.firstName} ${person.lastName}`
}
```

### Pattern Introduction Rules

- Only introduce new patterns when all options for improving current implementation are exhausted
- When introducing something new, **fully remove** old implementation
- Avoid duplication or confusion

### Code Cleanliness

- ✅ Keep codebase clean and organized
- ✅ Use consistent patterns and naming conventions
- ❌ Avoid one-off scripts in main codebase
- ❌ Never overwrite `.env` without explicit confirmation
- ✅ Use linters, formatters, and style guides

---

## Coding Workflow

### Focus and Scope

1. **Stay focused** on code directly relevant to the current task
2. **Do not touch** unrelated code unless explicitly instructed
3. **Avoid** major architectural changes or large refactors unless structured, justified, and approved

### Change Impact Assessment

Before making changes, consider:

- ✅ Impact on downstream dependencies
- ✅ Effects on shared services
- ✅ Global logic implications
- ✅ Multi-component relationships

### Documentation

Document your reasoning if a change affects multiple components:

```javascript
/**
 * CHANGE RATIONALE:
 * 
 * Modified authentication flow to support SSO.
 * Affects: LoginForm, AuthProvider, ProtectedRoute
 * 
 * Breaking changes:
 * - AuthContext API updated
 * - Login callback signature changed
 */
```

---

## React Best Practices

### Component Structure

```javascript
export default function MyComponent({ prop1, prop2 }) {
	// 1. State
	const [state, setState] = useState(initialValue)
	
	// 2. Custom Hooks
	const { data, loading } = useCustomHook()
	
	// 3. Memoized Values
	const computedValue = useMemo(() => {
		return expensiveCalculation(data)
	}, [data])
	
	// 4. Callbacks
	const handleAction = useCallback(() => {
		// Handler logic
	}, [dependencies])
	
	// 5. Effects
	useEffect(() => {
		// Side effects
		return () => {
			// Cleanup
		}
	}, [dependencies])
	
	// 6. Early Returns
	if (loading) return <LoadingSkeleton />
	if (error) return <ErrorState error={error} />
	
	// 7. Render
	return (
		<div>
			{/* JSX */}
		</div>
	)
}
```

### Optimization

```javascript
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
	return <div>{/* Complex rendering */}</div>
})

// ✅ Use useMemo for expensive computations
const filteredData = useMemo(
	() => data.filter(item => item.active),
	[data]
)

// ✅ Use useCallback for callback functions
const handleClick = useCallback(() => {
	doSomething()
}, [dependencies])

// ✅ Proper key props for lists
{items.map(item => (
	<ListItem key={item.id} data={item} />
))}
```

### Effect Dependency Arrays

```javascript
// ✅ Correct dependencies
useEffect(() => {
	fetchData(userId)
}, [userId]) // Include all dependencies

// ❌ Missing dependencies
useEffect(() => {
	fetchData(userId)
}, []) // Missing userId

// ✅ Empty array for mount-only effects
useEffect(() => {
	initializeApp()
}, [])
```

---

## Performance Optimization

### Data Loading

```javascript
// ✅ Server-side pagination
const { data, loading } = usePagination({
	endpoint: '/api/items',
	pageSize: 20
})

// ✅ Loading skeletons
if (loading) return <ItemListSkeleton />

// ✅ Error boundaries
<ErrorBoundary fallback={<ErrorUI />}>
	<DataComponent />
</ErrorBoundary>

// ✅ Response caching
const cache = useSWR('/api/data', fetcher, {
	revalidateOnFocus: false
})
```

### Bundle Optimization

```javascript
// ✅ Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
	loading: () => <LoadingSkeleton />,
	ssr: false
})

// ✅ Tree shaking
import { specific } from 'library' // ✅
import * as Everything from 'library' // ❌
```

### Image Optimization

```javascript
// ✅ Next.js Image component
import Image from 'next/image'

<Image
	src="/hero.jpg"
	width={800}
	height={600}
	alt="Hero image"
	loading="lazy"
	placeholder="blur"
/>

// ✅ Responsive images
<picture>
	<source type="image/webp" srcSet={webpSrc} />
	<img src={jpgSrc} alt="Description" />
</picture>
```

---

## Accessibility Guidelines

### ARIA Best Practices

```javascript
// ✅ Proper ARIA labels
<button 
	aria-label="Close dialog"
	aria-pressed={isPressed}
	onClick={handleClose}
>
	<CloseIcon aria-hidden="true" />
</button>

// ✅ Descriptions
<div
	aria-labelledby="dialog-title"
	aria-describedby="dialog-description"
>
	<h2 id="dialog-title">Confirm Action</h2>
	<p id="dialog-description">Are you sure?</p>
</div>

// ✅ Role attributes
<nav role="navigation" aria-label="Main navigation">
	{/* Navigation items */}
</nav>
```

### Keyboard Navigation

```javascript
const handleKeyDown = (event) => {
	switch (event.key) {
		case 'Enter':
		case ' ':
			event.preventDefault()
			handleAction()
			break
		case 'Escape':
			handleClose()
			break
		case 'ArrowRight':
			handleNext()
			break
		case 'ArrowLeft':
			handlePrevious()
			break
		default:
			break
	}
}

// ✅ Proper tabIndex
<div
	tabIndex={0}
	onKeyDown={handleKeyDown}
	role="button"
>
	Interactive Element
</div>
```

### Focus Management

```javascript
// ✅ Focus trap in modals
useEffect(() => {
	const modal = modalRef.current
	if (!modal) return

	const focusableElements = modal.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	)
	
	const firstElement = focusableElements[0]
	const lastElement = focusableElements[focusableElements.length - 1]

	firstElement?.focus()

	const handleTab = (e) => {
		if (e.key === 'Tab') {
			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault()
				lastElement?.focus()
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault()
				firstElement?.focus()
			}
		}
	}

	modal.addEventListener('keydown', handleTab)
	return () => modal.removeEventListener('keydown', handleTab)
}, [isOpen])
```

### Color and Contrast

```javascript
// ✅ Minimum contrast ratios
// - Normal text: 4.5:1
// - Large text (18pt+): 3:1
// - UI components: 3:1

// ✅ Don't rely solely on color
<button className="bg-red-500 text-white">
	<AlertIcon aria-hidden="true" />
	<span>Error: Action failed</span> {/* Text conveys meaning */}
</button>

// ❌ Color only
<button className="bg-red-500">
	{/* No text or icon - meaning unclear */}
</button>
```

### Semantic HTML

```javascript
// ✅ Use semantic elements
<article>
	<header>
		<h1>Article Title</h1>
		<time dateTime="2025-01-15">January 15, 2025</time>
	</header>
	<section>
		<p>Content...</p>
	</section>
	<footer>
		<address>Contact information</address>
	</footer>
</article>

// ❌ Generic divs
<div>
	<div>
		<div>Article Title</div>
		<div>January 15, 2025</div>
	</div>
</div>
```

---

## Responsive Design

### Mobile-First Approach

```javascript
// ✅ Mobile-first CSS
className="
	text-sm          // Mobile (default)
	sm:text-base     // Small screens (640px+)
	md:text-lg       // Medium screens (768px+)
	lg:text-xl       // Large screens (1024px+)
"

// ✅ Touch-friendly targets (minimum 44px)
<button className="min-h-[44px] min-w-[44px] p-3">
	<Icon size={20} />
</button>
```

### Layout Patterns

```javascript
// ✅ Responsive Grid
<div className="
	grid
	grid-cols-1          // Mobile: 1 column
	sm:grid-cols-2       // Tablet: 2 columns
	lg:grid-cols-3       // Desktop: 3 columns
	gap-4
">
	{items.map(item => <Card key={item.id} {...item} />)}
</div>

// ✅ Responsive Flexbox
<div className="
	flex
	flex-col            // Mobile: Stack vertically
	md:flex-row         // Desktop: Horizontal
	gap-4
	items-stretch
">
	<Sidebar />
	<MainContent />
</div>
```

### Responsive Units

```javascript
// ✅ Use relative units
className="
	text-base      // rem-based (16px default)
	px-4          // rem-based spacing
	w-full        // Percentage-based width
	max-w-7xl     // rem-based max-width
"

// ❌ Avoid fixed pixels for layout
className="w-[1200px]" // Too rigid

// ✅ Better approach
className="w-full max-w-7xl mx-auto px-4"
```

### Viewport Configuration

```html
<!-- ✅ Required viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### Component Responsiveness

```javascript
// ✅ Responsive component variants
export function UserCard({ user }) {
	return (
		<div className="
			bg-white rounded-lg p-4
			
			// Mobile layout
			flex flex-col gap-3
			
			// Desktop layout
			md:flex-row md:items-center md:gap-6
		">
			<Avatar src={user.avatar} className="
				w-16 h-16           // Mobile
				md:w-20 md:h-20     // Desktop
			" />
			<div className="flex-1">
				<h3 className="text-lg md:text-xl font-bold">
					{user.name}
				</h3>
				<p className="text-sm md:text-base text-gray-600">
					{user.bio}
				</p>
			</div>
		</div>
	)
}
```

### Content Hierarchy

```javascript
// ✅ Adapt content for smaller screens
export function ProductDetails({ product }) {
	const isMobile = useMediaQuery('(max-width: 768px)')
	
	return (
		<div>
			<h1 className="text-2xl md:text-4xl font-bold">
				{product.name}
			</h1>
			
			{/* Show condensed info on mobile */}
			{isMobile ? (
				<CompactDetails product={product} />
			) : (
				<FullDetails product={product} />
			)}
		</div>
	)
}
```

---

## Quick Reference

### Official Documentation

- **React**: https://react.dev
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21
- **MDN Web Docs**: https://developer.mozilla.org

### Key Principles

1. **Think before you code** - Plan, reflect, verify
2. **Keep it simple** - Prefer clear over clever
3. **Avoid duplication** - DRY (Don't Repeat Yourself)
4. **Stay focused** - Touch only relevant code
5. **Performance matters** - Optimize by default
6. **Accessibility first** - Build for everyone
7. **Mobile-first** - Design small, enhance big

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**Maintainer:** Development Team