export async function login(email, password) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const body = new URLSearchParams({ username: email, password }).toString();

  const response = await fetch(`${apiUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  return response.json();
}