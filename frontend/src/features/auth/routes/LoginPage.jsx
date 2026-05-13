import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../../../assets/raven.png';
import { AuthenticationService } from '../services';
import { AuthPolicy } from '../utils';

// ============================================================================
// DOMAIN LAYER - Business Logic & Validation
// ============================================================================

class EmailAddress {
  constructor(value) {
    this.value = value;
  }

  isValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
  }

  toString() {
    return this.value;
  }

  static create(value) {
    return new EmailAddress(value);
  }
}

class LoginCredentials {
  constructor(email, password) {
    this.email = EmailAddress.create(email);
    this.password = password;
  }

  validate() {
    if (!this.email.isValid()) {
      throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
    }
    
    if (!this.password || this.password.length === 0) {
      throw new Error('กรุณากรอกรหัสผ่าน');
    }
  }

  getEmail() {
    return this.email.toString();
  }

  getPassword() {
    return this.password;
  }
}

// ============================================================================
// APPLICATION LAYER - Use Cases & Hooks
// ============================================================================

const useFormState = () => {
  const [form, setForm] = useState({ email: '', password: '' });

  const updateField = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateField(name, value);
  }, [updateField]);

  return { form, handleInputChange };
};

const usePasswordVisibility = () => {
  const [showPassword, setShowPassword] = useState(false);

  const toggle = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const inputType = useMemo(
    () => (showPassword ? 'text' : 'password'),
    [showPassword]
  );

  return { showPassword, toggle, inputType };
};

const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  return { 
    loading, 
    setLoading, 
    checking, 
    setChecking 
  };
};

const useErrorState = () => {
  const [error, setError] = useState('');

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return { error, setError, clearError };
};

const useAuthCheck = (setChecking) => {
  useEffect(() => {
    let mounted = true;

    AuthenticationService.fetchCurrentUser()
      .then(user => {
        if (mounted && AuthPolicy.isAuthenticated(user)) {
          AuthenticationService.redirectToHome();
        }
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, [setChecking]);
};

const useLoginLogic = () => {
  const { form, handleInputChange } = useFormState();
  const { showPassword, toggle: toggleShowPassword, inputType } = usePasswordVisibility();
  const { loading, setLoading, checking, setChecking } = useLoadingState();
  const { error, setError, clearError } = useErrorState();

  useAuthCheck(setChecking);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      
      setLoading(true);
      clearError();

      try {
        const credentials = new LoginCredentials(form.email, form.password);
        credentials.validate();

        const result = await AuthenticationService.login(
          credentials.getEmail(), 
          credentials.getPassword()
        );

        if (result.success) {
          AuthenticationService.redirectToHome();
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [form.email, form.password, setLoading, setError, clearError]
  );

  return {
    form,
    showPassword,
    error,
    loading,
    checking,
    handleInputChange,
    toggleShowPassword,
    inputType,
    handleSubmit,
  };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const Icon = memo(function Icon({ Component, className = "" }) {
  return <Component className={className} />;
});

const Spinner = memo(function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
  );
});

const StatusDot = memo(function StatusDot({ color = "red-500" }) {
  return <div className={`w-2 h-2 bg-${color} rounded-full mr-3`} />;
});

const Logo = memo(function Logo({ src, alt = "Logo" }) {
  return (
    <div className="w-20 h-20 bg-gradient-to-br from-crimson to-deep-maroon rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
      <img src={src} alt={alt} className="w-14 h-14 text-white" />
    </div>
  );
});

const Header = memo(function Header({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <Logo src={logo} alt="RAVEN LOGO" />
      <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
});

const ErrorMessage = memo(function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-center">
        <StatusDot color="red-500" />
        <span className="text-red-700 text-sm">{message}</span>
      </div>
    </div>
  );
});

const InputLabel = memo(function InputLabel({ htmlFor, children }) {
  return (
    <label 
      className="block text-sm font-semibold text-gray-700" 
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
});

const InputIcon = memo(function InputIcon({ icon: IconComponent }) {
  return (
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon Component={IconComponent} className="h-5 w-5 text-gray-400" />
    </div>
  );
});

const PasswordToggle = memo(function PasswordToggle({ showPassword, onClick }) {
  const IconComponent = showPassword ? EyeOff : Eye;
  const ariaLabel = showPassword ? 'Hide password' : 'Show password';

  return (
    <button
      type="button"
      className="absolute inset-y-0 right-0 pr-4 flex items-center"
      onClick={onClick}
      tabIndex={-1}
      aria-label={ariaLabel}
    >
      <Icon 
        Component={IconComponent} 
        className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" 
      />
    </button>
  );
});

const TextInput = memo(function TextInput({
  id,
  name,
  type,
  icon: IconComponent,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  rightElement,
}) {
  const paddingClass = name === 'password' ? 'pl-12 pr-12' : 'pl-12 pr-4';

  return (
    <div className="space-y-2">
      <InputLabel htmlFor={id}>
        {name === 'email' ? 'อีเมล' : 'รหัสผ่าน'}
      </InputLabel>
      
      <div className="relative">
        <InputIcon icon={IconComponent} />
        
        <input
          id={id}
          name={name}
          type={type}
          className={`w-full ${paddingClass} py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent transition-all duration-200 placeholder-gray-400`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
        />
        
        {rightElement}
      </div>
    </div>
  );
});

const Checkbox = memo(function Checkbox({ id, label }) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 text-crimson focus:ring-crimson border-gray-300 rounded"
      />
      <label htmlFor={id} className="ml-2 text-sm text-gray-600">
        {label}
      </label>
    </div>
  );
});

const Link = memo(function Link({ href, children, className = "" }) {
  return (
    <a
      href={href}
      className={`text-sm text-crimson hover:text-red-700 font-medium hover:underline transition-colors ${className}`}
    >
      {children}
    </a>
  );
});

const SubmitButton = memo(function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      className="w-full py-4 px-6 bg-gradient-to-r from-crimson to-deep-maroon text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-crimson focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
    >
      {children}
    </button>
  );
});

const RememberMeSection = memo(function RememberMeSection() {
  return (
    <div className="flex items-center justify-between">
      <Checkbox id="remember" label="จดจำฉัน" />
      <Link href="#">ลืมรหัสผ่าน?</Link>
    </div>
  );
});

const LoginButton = memo(function LoginButton({ loading }) {
  const content = loading ? (
    <div className="flex items-center justify-center">
      <Spinner />
      กำลังเข้าสู่ระบบ...
    </div>
  ) : (
    'เข้าสู่ระบบ'
  );

  return (
    <SubmitButton loading={loading}>
      {content}
    </SubmitButton>
  );
});

const LoginForm = memo(function LoginForm({
  form,
  error,
  loading,
  showPassword,
  inputType,
  onInputChange,
  onTogglePassword,
  onSubmit,
}) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <Header 
        title="RAVEN" 
        subtitle="กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ" 
      />
      
      <ErrorMessage message={error} />
      
      <div className="space-y-6">
        <TextInput
          id="email"
          name="email"
          type="email"
          icon={Mail}
          value={form.email}
          onChange={onInputChange}
          placeholder="กรอกอีเมลของคุณ"
          autoComplete="email"
          required
        />
        
        <TextInput
          id="password"
          name="password"
          type={inputType}
          icon={Lock}
          value={form.password}
          onChange={onInputChange}
          placeholder="กรอกรหัสผ่านของคุณ"
          autoComplete="current-password"
          required
          rightElement={
            <PasswordToggle 
              showPassword={showPassword}
              onClick={onTogglePassword}
            />
          }
        />
        
        <RememberMeSection />
        
        <LoginButton loading={loading} />
      </div>
    </form>
  );
});

const LoginCard = memo(function LoginCard({ children }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="bg-white backdrop-blur-sm border border-white/20 rounded-3xl shadow p-8 md:p-10">
        {children}
      </div>
    </div>
  );
});

const PageBackground = memo(function PageBackground({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-deep-maroon to-deep-maroon flex items-center justify-center p-4">
      {children}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const LoginPage = memo(function LoginPage() {
  const {
    form,
    showPassword,
    error,
    loading,
    checking,
    handleInputChange,
    toggleShowPassword,
    inputType,
    handleSubmit,
  } = useLoginLogic();

  if (checking) return null;

  return (
    <PageBackground>
      <LoginCard>
        <LoginForm
          form={form}
          error={error}
          loading={loading}
          showPassword={showPassword}
          inputType={inputType}
          onInputChange={handleInputChange}
          onTogglePassword={toggleShowPassword}
          onSubmit={handleSubmit}
        />
      </LoginCard>
    </PageBackground>
  );
});

export default LoginPage;