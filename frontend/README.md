# Frontend

---

## 📂 Directory Tree

```text
root/
├── public/                  # Static assets (favicon, robots.txt, manifest.json)
├── src/
│   ├── assets/              # Images, Fonts, Global Styles
│   │
│   ├── components/          # ✅ GLOBAL SHARED UI (Dumb Components only)
│   │   ├── ui/              # Atomic Elements (Button, Input, Card, Modal)
│   │   ├── layout/          # Layout Components (Navbar, Sidebar, Footer)
│   │   └── form/            # Form-specific components (DateField, Select)
│   │
│   ├── config/              # ✅ Environment & Global Configuration
│   │   ├── env.js           # Env var validation
│   │   └── theme.js         # Theme constants
│   │
│   ├── hooks/               # ✅ Global Hooks (useMediaQuery, useScroll, useOnClickOutside)
│   │
│   ├── lib/                 # ✅ 3rd Party Wrappers (Facade Pattern)
│   │   ├── axios.js         # Axios Instance (Interceptors setup)
│   │   ├── query.js         # React Query Client setup
│   │   └── utils.js         # CN/Clsx className helpers
│   │
│   ├── stores/              # ✅ Global State (Zustand/Redux - เฉพาะที่เป็น Global จริงๆ)
│   │   └── toastStore.js    # Notification State
│   │
│   ├── types/               # ✅ Shared Types (TypeScript only)
│   │   └── api.types.ts     # Generic API Response types
│   │
│   ├── utils/               # ✅ Pure Functions / Helpers
│   │   ├── date.js          # Date formatting
│   │   ├── format.js        # Currency/Number formatting
│   │   └── storage.js       # LocalStorage wrappers
│   │
│   ├── features/            # ⭐️ HERO: Business Logic แบ่งตาม Domain
│   │   ├── auth/            # ตัวอย่าง Feature: Authentication
│   │   │   ├── api/         # API calls (login, register, getUser)
│   │   │   ├── components/  # Components เฉพาะของ Auth (LoginForm, ProtectedRoute)
│   │   │   ├── hooks/       # Hooks เฉพาะของ Auth (useAuth, useLogin)
│   │   │   ├── routes/      # 📍 Feature-specific Routes
│   │   │   │   └── index.jsx # Define routes for this feature
│   │   │   ├── stores/      # State เฉพาะของ Auth (authStore)
│   │   │   ├── types/       # Types เฉพาะของ Auth
│   │   │   └── index.js     # 🛡️ Public API (Barrel File) - Export เฉพาะที่จำเป็น
│   │   │
│   │   └── product/         # ตัวอย่าง Feature: Product
│   │       ├── api/
│   │       ├── components/
│   │       ├── routes/
│   │       └── index.js
│   │
│   ├── pages/               # 📄 Composition Layer (ประกอบร่าง)
│   │   ├── LandingPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   └── ... (Pages อื่นๆ ที่เรียกใช้ Feature Components)
│   │
│   ├── routes/              # 🚦 Main Router Configuration
│   │   └── index.jsx        # รวม Route จากทุก Feature เข้าด้วยกัน
│   │
│   ├── App.jsx              # Provider Setup (Theme, QueryClient, AuthProvider)
│   └── main.jsx             # Application Entry Point
│
├── .env                     # Environment Variables
├── .eslintrc.cjs            # Linting Config
├── vite.config.js           # Vite Configuration
└── package.json
```