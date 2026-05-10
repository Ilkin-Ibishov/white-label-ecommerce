'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupMessage, setSetupMessage] = useState('');

  const handleSetupAdmin = async () => {
    setSetupMessage('Creating admin...');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@whitelabel.local',
          password: 'admin123456',
          role: 'admin'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupMessage('Admin created! Email: admin@whitelabel.local / Password: admin123456');
        setEmail('admin@whitelabel.local');
        setPassword('admin123456');
      } else if (data.error?.message?.includes('already')) {
        setSetupMessage('Admin already exists. Use: admin@whitelabel.local / admin123456');
        setEmail('admin@whitelabel.local');
        setPassword('admin123456');
      } else {
        setSetupMessage('Error: ' + data.error?.message);
      }
    } catch (err) {
      setSetupMessage('Setup failed: ' + String(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || 'Login failed');
        return;
      }

      if (result.data.user.role !== 'admin') {
        setError('Admin access required');
        return;
      }

      router.push(redirect);
      router.refresh();

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Sign in to manage your white-label e-commerce platform
          </p>
        </div>
        
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        
        {setupMessage && (
          <div style={{
            backgroundColor: setupMessage.includes('created') || setupMessage.includes('exists') ? '#f0fdf4' : '#fef2f2',
            border: '1px solid ' + (setupMessage.includes('created') || setupMessage.includes('exists') ? '#bbf7d0' : '#fecaca'),
            color: setupMessage.includes('created') || setupMessage.includes('exists') ? '#166534' : '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {setupMessage}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleSetupAdmin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          🛠️ Create Admin User (One-time setup)
        </button>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#9ca3af' : '#0f172a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b'
        }}>
          Sprint 1.2 - Core Commerce | Alpha Agent
        </div>
      </div>
    </div>
  );
}
