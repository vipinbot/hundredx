// src/LoginPage.js
import React from 'react';
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth';

const LoginPage = () => {
  const { login } = useLogin(); // To handle login
  const { logout } = useLogout(); // To handle logout
  const privy = usePrivy(); // Access current user data and authentication status

  if (privy.authenticated) {
    return (
      <div>
        <p>Welcome, {privy.user?.email || 'User'}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={login}>Login / Signup with Privy</button>
    </div>
  );
};

export default LoginPage;
