// Admin Dashboard Logic
(function () {
  'use strict';

  // --- Auth Guard ---
  const token = localStorage.getItem('consistium_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // --- State ---
  let currentUser = null;

  // --- DOM Elements ---
  const statUsers = document.getElementById('stat-users');
  const statHabits = document.getElementById('stat-habits');
  const statCompletions = document.getElementById('stat-completions');
  const usersTableBody = document.getElementById('users-table-body');
  const adminNameEl = document.getElementById('admin-name');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const refreshBtn = document.getElementById('refresh-users-btn');
  const sidebarItems = document.querySelectorAll('.sidebar-nav li[data-target]');
  const topbarTitle = document.querySelector('.admin-topbar h1');

  // --- API Helper ---
  async function apiFetch(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (res.status === 401 || res.status === 403) {
      // Not authorized – redirect
      alert('You are not authorized to view this page.');
      window.location.href = 'index.html';
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Request failed');
    }

    return res.json();
  }

  // --- Load Current User Info ---
  async function loadCurrentUser() {
    try {
      const data = await apiFetch('/auth/me');
      if (!data) return;
      currentUser = data;
      adminNameEl.textContent = data.name || 'Admin';

      if (data.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'index.html';
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      // If /auth/me doesn't exist, just continue
      adminNameEl.textContent = 'Admin';
    }
  }

  // --- Load Stats ---
  async function loadStats() {
    try {
      const data = await apiFetch('/admin/stats');
      if (!data) return;

      animateCounter(statUsers, data.users || data.totalUsers || 0);
      animateCounter(statHabits, data.habits || data.totalHabits || 0);
      animateCounter(statCompletions, data.completions || data.totalCompletions || 0);
    } catch (err) {
      console.error('Failed to load stats:', err);
      statUsers.textContent = '—';
      statHabits.textContent = '—';
      statCompletions.textContent = '—';
    }
  }

  // --- Animate Counter ---
  function animateCounter(el, target) {
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // --- Load Users ---
  async function loadUsers() {
    try {
      usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Loading users...</td></tr>`;
      const users = await apiFetch('/admin/users');
      if (!users) return;

      if (users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No users found.</td></tr>`;
        return;
      }

      usersTableBody.innerHTML = users
        .map((user) => {
          const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const roleBadge =
            user.role === 'admin'
              ? `<span class="role-badge role-admin">Admin</span>`
              : `<span class="role-badge role-user">User</span>`;
          const isSelf = currentUser && user._id === currentUser._id;
          const deleteBtn = isSelf
            ? `<span style="color: var(--admin-text-muted); font-size: 0.85rem;">You</span>`
            : `<button class="action-btn delete" data-id="${user._id}" title="Delete User"><i class="fa-solid fa-trash"></i></button>`;

          return `
            <tr>
              <td>${escapeHtml(user.name)}</td>
              <td>${escapeHtml(user.email)}</td>
              <td>${roleBadge}</td>
              <td>${joinDate}</td>
              <td>${deleteBtn}</td>
            </tr>
          `;
        })
        .join('');

      // Attach delete handlers
      document.querySelectorAll('.action-btn.delete').forEach((btn) => {
        btn.addEventListener('click', () => handleDeleteUser(btn.dataset.id));
      });
    } catch (err) {
      console.error('Failed to load users:', err);
      usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--admin-danger);">Error loading users: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // --- Delete User ---
  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This will also remove all their habits and completions. This action cannot be undone.')) {
      return;
    }

    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      // Reload data
      loadUsers();
      loadStats();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  }

  // --- Sidebar Navigation ---
  sidebarItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (!target) return;

      // Update active class
      sidebarItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      // Show/hide views
      document.querySelectorAll('.view-section').forEach((section) => {
        section.classList.remove('active-view');
        section.classList.add('hidden-view');
      });

      const targetSection = document.getElementById(target);
      if (targetSection) {
        targetSection.classList.remove('hidden-view');
        targetSection.classList.add('active-view');
      }

      // Update topbar title
      const titles = {
        'dashboard-view': 'Admin Overview',
        'users-view': 'User Management',
      };
      topbarTitle.textContent = titles[target] || 'Admin';
    });
  });

  // --- Logout ---
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('consistium_token');
    window.location.href = 'index.html';
  });

  // --- Refresh ---
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadUsers);
  }

  // --- Utility ---
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Init ---
  async function init() {
    await loadCurrentUser();
    loadStats();
    loadUsers();
  }

  init();
})();
