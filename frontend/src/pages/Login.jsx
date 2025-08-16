import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/raven.png';
import { login } from '../services/auth';

/* CONSTANTS */
const EMAIL_PLACEHOLDER = 'กรอกอีเมลของคุณ';
const PASSWORD_PLACEHOLDER = 'กรอกรหัสผ่านของคุณ';

/* UTILS */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* CUSTOM HOOKS */
function useLoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const handleInputChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const toggleShowPassword = useCallback(
    () => setShowPassword(s => !s),
    []
  );

  const passwordInputType = useMemo(
    () => (showPassword ? 'text' : 'password'),
    [showPassword]
  );

  const loginButtonContent = useMemo(
    () =>
      loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          กำลังเข้าสู่ระบบ...
        </div>
      ) : (
        'เข้าสู่ระบบ'
      ),
    [loading]
  );

  useEffect(() => {
    let mounted = true;
    fetch(`${import.meta.env.VITE_API_URL}/api/me`, { credentials: 'include' })
      .then(res => {
        if (mounted && res.ok) window.location.href = '/home';
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        if (!isValidEmail(form.email)) {
          setError('รูปแบบอีเมลไม่ถูกต้อง');
          setLoading(false);
          return;
        }
        await login(form.email, form.password);
        window.location.href = '/home';
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [form.email, form.password]
  );

  return {
    form,
    showPassword,
    error,
    loading,
    checking,
    handleInputChange,
    toggleShowPassword,
    passwordInputType,
    loginButtonContent,
    handleSubmit,
    setError,
  };
}

/* PRESENTATIONAL COMPONENTS */
const LoginLogo = memo(function LoginLogo() {
  return (
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-to-br from-crimson to-deep-maroon rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
        <img src={logo} alt="RAVEN LOGO" className="w-14 h-14 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">RAVEN</h2>
      <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
    </div>
  );
});

const LoginError = memo(function LoginError({ error }) {
  if (!error) return null;
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
        <span className="text-red-700 text-sm">{error}</span>
      </div>
    </div>
  );
});

const LoginInput = memo(function LoginInput({
  id,
  name,
  type,
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  rightElement,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700" htmlFor={id}>
        {name === 'email' ? 'อีเมล' : 'รหัสผ่าน'}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={id}
          name={name}
          type={type}
          className={`w-full ${name === 'password' ? 'pl-12 pr-12' : 'pl-12 pr-4'} py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-crimson focus:border-transparent transition-all duration-200 placeholder-gray-400`}
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

const RememberMeAndForgot = memo(function RememberMeAndForgot() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          className="h-4 w-4 text-crimson focus:ring-crimson border-gray-300 rounded"
        />
        <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
          จดจำฉัน
        </label>
      </div>
      <a
        href="#"
        className="text-sm text-crimson hover:text-red-700 font-medium hover:underline transition-colors"
      >
        ลืมรหัสผ่าน?
      </a>
    </div>
  );
});

const LoginButton = memo(function LoginButton({ loading, children }) {
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

/* MAIN COMPONENT */
const Login = memo(function Login() {
  const {
    form,
    showPassword,
    error,
    loading,
    checking,
    handleInputChange,
    toggleShowPassword,
    passwordInputType,
    loginButtonContent,
    handleSubmit,
  } = useLoginForm();

  if (checking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-deep-maroon to-deep-maroon flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white backdrop-blur-sm border border-white/20 rounded-3xl shadow p-8 md:p-10">
          <LoginLogo />
          <LoginError error={error} />
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <LoginInput
              id="email"
              name="email"
              type="email"
              icon={Mail}
              value={form.email}
              onChange={handleInputChange}
              placeholder={EMAIL_PLACEHOLDER}
              autoComplete="email"
              required
            />
            <LoginInput
              id="password"
              name="password"
              type={passwordInputType}
              icon={Lock}
              value={form.password}
              onChange={handleInputChange}
              placeholder={PASSWORD_PLACEHOLDER}
              autoComplete="current-password"
              required
              rightElement={
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={toggleShowPassword}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              }
            />
            <RememberMeAndForgot />
            <LoginButton loading={loading}>{loginButtonContent}</LoginButton>
          </form>
        </div>
      </div>
    </div>
  );
});

export default Login;
