// ============================================================================
// REDP Mobile Client - Main Application Logic (T05 - Phase 2)
// ============================================================================

const app = {
  // State
  user: null,
  lang: 'zh',
  properties: [],
  customers: [],
  followups: [],
  currentFilter: 'all',

  // Configuration
  supabaseUrl: Deno.env?.SUPABASE_URL || 'http://localhost:54321',
  apiKey: Deno.env?.SUPABASE_ANON_KEY || '',

  // Initialize the app
  async init() {
    console.log('Initializing REDP Mobile Client...');
    this.checkOnline();
    this.setupOfflineListener();
    this.setupLanguageSwitcher();
    this.renderPage();
    this.setupNavigation();
    await this.loadUserData();
    this.updateLastSync();
  },

  // Navigation
  setupNavigation() {
    // Handle hash changes
    window.addEventListener('hashchange', () => this.renderPage());

    // Bottom navigation clicks
    document.querySelectorAll('#bottom-nav .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigate(`#/${page}`);
        }
      });
    });

    // Followup form submission
    const followupForm = document.getElementById('followup-form');
    if (followupForm) {
      followupForm.addEventListener('submit', (e) => this.handleFollowupSubmit(e));
    }
  },

  navigate(path) {
    if (path === -1) {
      window.history.back();
    } else {
      window.location.hash = path.replace('#', '');
    }
  },

  // Page Rendering
  renderPage() {
    const hash = window.location.hash.replace('#', '') || '/today';
    const [path] = hash.split('?');

    // Hide bottom nav on followup page
    const bottomNav = document.getElementById('bottom-nav');
    if (path === '/followup') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }

    // Update active nav item
    document.querySelectorAll('#bottom-nav .nav-item').forEach(item => {
      const page = item.dataset.page;
      if (`/${page}` === path) {
        item.classList.add('active');
        item.querySelector('svg')?.setAttribute('stroke', '#1a5674');
      } else {
        item.classList.remove('active');
        item.querySelector('svg')?.setAttribute('stroke', '');
      }
    });

    // Render the page
    switch (path) {
      case '/today':
        this.renderTodayPage();
        break;
      case '/properties':
        this.renderPropertiesPage();
        break;
      case '/customers':
        this.renderCustomersPage();
        break;
      case '/profile':
        this.renderProfilePage();
        break;
      case '/followup':
        this.renderFollowupPage();
        break;
      default:
        console.log('Unknown page:', path);
    }
  },

  // Page: Today
  async renderTodayPage() {
    const container = document.getElementById('app');
    container.innerHTML = document.getElementById('page-today').innerHTML;

    // Set today's date
    const dateEl = document.getElementById('today-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(this.lang === 'ug' ? 'zh-CN' : 'zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }

    // Load today's tasks
    await this.loadTodayTasks();
  },

  async loadTodayTasks() {
    try {
      const response = await fetch('/functions/v1/crm_management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.user?.token || ''}`
        },
        body: JSON.stringify({
          action: 'get_today_tasks'
        })
      });

      const result = await response.json();
      const container = document.getElementById('today-customers');

      if (result.success && result.data) {
        this.followups = result.data;
        this.renderTodayCustomers(container);
      } else {
        // Fallback to mock data
        container.innerHTML = this.getMockTodayCustomers();
      }
    } catch (error) {
      console.error('Failed to load today tasks:', error);
      const container = document.getElementById('today-customers');
      if (container) {
        container.innerHTML = this.getMockTodayCustomers();
      }
    }
  },

  renderTodayCustomers(container) {
    if (!this.followups.length) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>暂无待跟进客户</p>
          <button onclick="app.navigate('#/followup')" class="mt-2 text-blue-600 text-sm">
            + 新增客户
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.followups.map(c => `
      <div class="card">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">${this.escapeHtml(c.customer_name || 'Unknown')}</h3>
            <p class="text-sm text-gray-500">${c.customer_phone || ''}</p>
            ${c.latest_intent_score ? `
              <div class="flex items-center mt-1">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.latest_intent_score >= 7 ? 'bg-green-100 text-green-800' :
                  c.latest_intent_score >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }">
                  意向评分: ${c.latest_intent_score}/10
                </span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            ${c.next_followup_date ? `下次跟进: ${c.next_followup_date}` : '暂无下次安排'}
          </div>
          <button onclick="app.navigate('#/followup?customer_id=' + ${c.id})" class="px-3 py-1 bg-blue-600 text-white text-sm rounded">
            录入跟进
          </button>
        </div>
      </div>
    `).join('');
  },

  getMockTodayCustomers() {
    return `
      <div class="card">
        <h3 class="font-semibold">张伟</h3>
        <p class="text-sm text-gray-500">138****1234 | 意向: 8/10</p>
        <p class="text-sm mt-1">上次跟进: 2026-06-06</p>
        <button onclick="app.navigate('#/followup?customer_id=1')" class="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">
          录入跟进
        </button>
      </div>
      <div class="card">
        <h3 class="font-semibold">李娜</h3>
        <p class="text-sm text-gray-500">139****5678 | 意向: 6/10</p>
        <p class="text-sm mt-1">下次跟进: 2026-06-08</p>
      </div>
    `;
  },

  // Page: Properties
  async renderPropertiesPage() {
    const container = document.getElementById('app');
    container.innerHTML = document.getElementById('page-properties').innerHTML;

    await this.loadProperties();
  },

  async loadProperties() {
    try {
      const response = await fetch('/functions/v1/property_management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          project_id: 'current-project-id'
        })
      });

      const result = await response.json();
      if (result.success) {
        this.properties = result.data || [];
        this.renderProperties(this.properties);
        return;
      }
    } catch (error) {
      console.log('Using mock properties data:', error);
    }

    // Fallback to mock data
    this.properties = this.getMockProperties();
    this.renderProperties(this.properties);
  },

  renderProperties(properties) {
    const container = document.getElementById('properties-list');
    if (!properties.length) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">暂无房源</div>';
      return;
    }

    container.innerHTML = properties.map(p => `
      <div class="card">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">${p.property_code}</h3>
            <p class="text-sm text-gray-500">
              ${p.building_number} - ${p.unit_number}${p.room_number}
              • ${p.floor_area}㎡
            </p>
          </div>
          <span class="px-2 py-1 rounded text-xs font-medium ${
            p.property_status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
            p.property_status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' :
            p.property_status === 'SOLD' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-800'
          }">
            ${this.translateStatus(p.property_status)}
          </span>
        </div>
        <div class="mt-2 flex justify-between items-center">
          <div class="text-lg font-bold text-gray-900">
            ${p.list_price ? this.formatPrice(p.list_price) : '面议'}
          </div>
          <button onclick="app.viewProperty(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="px-3 py-1 bg-blue-600 text-white text-sm rounded">
            详情
          </button>
        </div>
      </div>
    `).join('');
  },

  filterProperties(status) {
    this.currentFilter = status;
    const filtered = status === 'all'
      ? this.properties
      : this.properties.filter(p => p.property_status === status);
    this.renderProperties(filtered);
  },

  // Page: Customers
  async renderCustomersPage() {
    const container = document.getElementById('app');
    container.innerHTML = document.getElementById('page-customers').innerHTML;

    await this.loadCustomers();
  },

  async loadCustomers() {
    try {
      // In a real app, you'd fetch customers via an API
      // For now, use mock data
      this.customers = [
        { id: '1', customer_name: '张伟', customer_phone: '13812341234', latest_intent_score: 8, funnel_stage: 'INTERESTED' },
        { id: '2', customer_name: '李娜', customer_phone: '13956785678', latest_intent_score: 6, funnel_stage: 'CONTACTED' },
        { id: '3', customer_name: '王强', customer_phone: '1478963258', latest_intent_score: 4, funnel_stage: 'INITIAL' }
      ];
      this.renderCustomers(this.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  },

  renderCustomers(customers) {
    const container = document.getElementById('customers-list');
    if (!customers.length) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">暂无客户</div>';
      return;
    }

    container.innerHTML = customers.map(c => `
      <div class="card" onclick="app.viewCustomer('${c.id}')">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-lg">${this.escapeHtml(c.customer_name)}</h3>
            <p class="text-sm text-gray-500">${c.customer_phone}</p>
          </div>
          ${c.latest_intent_score ? `
            <span class="px-2 py-1 rounded-full text-xs font-medium ${
              c.latest_intent_score >= 7 ? 'bg-green-100 text-green-800' :
              c.latest_intent_score >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }">
              ${c.latest_intent_score}/10
            </span>
          ` : ''}
        </div>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs text-gray-500 uppercase">${this.escapeHtml(c.funnel_stage)}</span>
          <button class="px-3 py-1 border border-blue-600 text-blue-600 text-sm rounded" onclick="event.stopPropagation(); app.navigate('#/followup?customer_id=' + '${c.id}')">
            跟进
          </button>
        </div>
      </div>
    `).join('');
  },

  // Page: Profile
  renderProfilePage() {
    const container = document.getElementById('app');
    container.innerHTML = document.getElementById('page-profile').innerHTML;

    if (this.user) {
      document.getElementById('user-name').textContent = this.user.name || '销售员';
      document.getElementById('user-phone').textContent = this.user.phone || '';
    }

    // Update stats
    const customersCount = this.customers.length;
    const followupsCount = this.followups.length;
    document.getElementById('stats-customers').textContent = customersCount;
    document.getElementById('stats-followups').textContent = followupsCount;
  },

  // Page: Followup
  renderFollowupPage() {
    const container = document.getElementById('app');
    container.innerHTML = document.getElementById('page-followup').innerHTML;

    // Populate customer dropdown
    const customerSelect = document.getElementById('followup-customer');
    customerSelect.innerHTML = '<option value="">请选择客户...</option>' +
      this.customers.map(c => `<option value="${c.id}">${this.escapeHtml(c.customer_name)} - ${c.customer_phone}</option>`).join('');

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('followup-date').valueAsDate = tomorrow;

    // Setup followup type buttons
    document.querySelectorAll('.followup-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.followup-type-btn').forEach(b => b.classList.remove('active', 'border-blue-500', 'bg-blue-50'));
        e.target.classList.add('active', 'border-blue-500', 'bg-blue-50');
        // Also set the hidden input
        const type = e.target.textContent === '电话' ? 'CALL'
          : e.target.textContent === '面谈' ? 'VISIT'
            : e.target.textContent === '微信' ? 'WECHAT' : 'SITE_VISIT';
        document.getElementById('followup-type').value = type;
      });
    });
  },

  // Actions
  async handleFollowupSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/functions/v1/crm_management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_followup',
          customer_id: data.customer_id,
          followup_type: data.followup_type || 'CALL',
          followup_content: data.followup_content,
          next_followup_date: data.followup_date || null
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(this.lang === 'ug' ? '跟帖 قىلىندى!' : '跟进记录已保存！');
        this.navigate('#/today');
      } else {
        alert('保存失败: ' + (result.error?.message || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to save followup:', error);
      alert(this.lang === 'ug' ? 'ساقلانمىدى!' : '保存失败，请检查网络连接');
    }
  },

  viewProperty(property) {
    // Show property details in an alert for now
    const msg = `${property.property_code}\n${property.building_number} - ${property.unit_number}${property.room_number}\n` +
      `${property.floor_area}㎡ | ${this.translateStatus(property.property_status)}\n` +
      `参考价: ${this.formatPrice(property.list_price)}`;
    alert(msg);
  },

  viewCustomer(customerId) {
    this.navigate('#/customers/detail?id=' + customerId);
  },

  // Utilities
  async loadUserData() {
    try {
      // In a real app, get the current user from Supabase Auth
      const { data: { user }, error } = await fetchSupabaseUser();
      if (user) {
        this.user = {
          id: user.id,
          token: user.access_token,
          name: user.email?.split('@')[0] || '销售员',
          phone: '',
          role: user.app_metadata?.role || 'sales_team'
        };
      }
    } catch (error) {
      console.log('Using mock user data:', error);
      this.user = {
        id: 'user-1',
        token: 'mock-token',
        name: '张销售',
        phone: '138****1234',
        role: 'sales_team'
      };
    }
  },

  async logout() {
    if (confirm(this.lang === 'ug' ? 'چىقىسىز؟' : '确定要退出登录吗？')) {
      // In a real app, sign out from Supabase Auth
      window.location.href = '/login';
    }
  },

  refreshProperties() {
    this.loadProperties();
  },

  updateLastSync() {
    const el = document.getElementById('last-sync');
    if (el) {
      el.textContent = `最后同步: ${new Date().toLocaleString(this.lang === 'ug' ? 'zh-CN' : 'zh-CN')}`;
    }
  },

  checkOnline() {
    const indicator = document.getElementById('offline-indicator');
    if (!navigator.onLine) {
      indicator.classList.add('offline-active');
    } else {
      indicator.classList.remove('offline-active');
    }
  },

  setupOfflineListener() {
    window.addEventListener('online', () => this.checkOnline());
    window.addEventListener('offline', () => this.checkOnline());
  },

  setupLanguageSwitcher() {
    const btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.textContent = this.lang === 'ug' ? 'UG / CN' : 'CN / UG';
      btn.addEventListener('click', () => {
        this.lang = this.lang === 'zh' ? 'ug' : 'zh';
        btn.textContent = this.lang === 'ug' ? 'UG / CN' : 'CN / UG';
        document.documentElement.lang = this.lang === 'ug' ? 'ug' : 'zh-CN';
        document.documentElement.dir = this.lang === 'ug' ? 'rtl' : 'ltr';

        // Re-render current page
        this.renderPage();
      });
    }
  },

  selectFollowupType(type) {
    // Update the hidden input
    const hiddenInput = document.getElementById('followup-type');
    if (hiddenInput) {
      hiddenInput.value = type;
    }

    // Update button styles
    document.querySelectorAll('.followup-type-btn').forEach(btn => {
      btn.classList.remove('active', 'border-blue-500', 'bg-blue-50');
    });

    // Find and activate the clicked button
    const buttons = {
      'CALL': '电话',
      'VISIT': '面谈',
      'WECHAT': '微信',
      'SITE_VISIT': '实地'
    };
    const btnText = buttons[type];
    if (btnText) {
      document.querySelectorAll('.followup-type-btn').forEach(btn => {
        if (btn.textContent === btnText) {
          btn.classList.add('active', 'border-blue-500', 'bg-blue-50');
        }
      });
    }
  },

  // Helper functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatPrice(price) {
    if (!price) return '面议';
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(price);
  },

  translateStatus(status) {
    const translations = {
      'AVAILABLE': this.lang === 'ug' ? 'سېتىلىشچان' : '可售',
      'RESERVED': this.lang === 'ug' ? 'ئەڭگە ئېلىندى' : '已认购',
      'UNDER_CONTRACT': this.lang === 'ug' ? 'قۇرۇش جەريانىدا' : '合同签署中',
      'SOLD': this.lang === 'ug' ? 'سېتىلىشى' : '已售出',
      'OWNER_OCCUPIED': this.lang === 'ug' ? 'ئۆزى ئىشلىتىش' : '自持',
      'UNAVAILABLE': this.lang === 'ug' ? 'يېتىشمىسى' : '暂不出售'
    };
    return translations[status] || status;
  },

  getMockProperties() {
    return [
      { property_code: 'A-1-1-101', building_number: 'A栋', unit_number: '1单元', room_number: '101', floor_area: 120.5, list_price: 1200000, property_status: 'AVAILABLE' },
      { property_code: 'A-1-2-201', building_number: 'A栋', unit_number: '2单元', room_number: '201', floor_area: 98.3, list_price: 980000, property_status: 'AVAILABLE' },
      { property_code: 'B-2-1-102', building_number: 'B栋', unit_number: '1单元', room_number: '102', floor_area: 156.7, list_price: 1650000, property_status: 'RESERVED' },
      { property_code: 'A-3-3-301', building_number: 'A栋', unit_number: '3单元', room_number: '301', floor_area: 89.2, list_price: 880000, property_status: 'SOLD' }
    ];
  }
};

// Helper function for Supabase Auth (mock)
async function fetchSupabaseUser() {
  // This would normally use the Supabase JS SDK
  return { data: { user: null }, error: new Error('Not implemented') };
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
