export class Authenticator {
  async login(identifier, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        identifier: identifier,
        password: password
      })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();   // returns a user object
  }

  async register(username, email, password) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();   // returns a user object
  }

  async logout() {
    const res = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async check() {
    const res = await fetch('/api/whoami', {
      method: 'GET',
      credentials: 'include'
    });

    // whoami always returns JSON: either null or a user object
    return res.json();
  }
}