const fs = require('fs');
let content = fs.readFileSync('android-app/app/src/main/assets/www/index.html', 'utf8');

const target = `<div id="ordersView" class="view-container">
    <div style="padding: 16px; font-size: 18px; font-weight: 800;">
      Aapke Orders 📦
    </div>
    <div id="ordersListContainer"></div>
  </div>`;

const accountViewMarkup = `<div id="ordersView" class="view-container">
    <div style="padding: 16px; font-size: 18px; font-weight: 800;">
      Aapke Orders 📦
    </div>
    <div id="ordersListContainer"></div>
  </div>

  <!-- Account & Authentication View -->
  <div id="accountView" class="view-container">
    <!-- Unauthenticated State -->
    <div id="authUnauthenticated">
      <div class="cart-card" style="margin-bottom: 12px; text-align: center; padding: 20px 16px;">
        <div style="font-size: 38px; margin-bottom: 8px;">🔐</div>
        <div style="font-size: 18px; font-weight: 800; color: var(--dark);" id="authHeading">Welcome to Gupta Store</div>
        <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Sign in or create an account for fast orders and order tracking</div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px; background: #f1f5f9; padding: 4px; border-radius: 12px;">
          <button id="authTabSignIn" class="cat-pill active" style="flex: 1; text-align: center; border-radius: 8px;" onclick="switchAuthTab('login')">Sign In</button>
          <button id="authTabSignUp" class="cat-pill" style="flex: 1; text-align: center; border-radius: 8px; background: transparent; color: #475569;" onclick="switchAuthTab('signup')">New User (Sign Up)</button>
        </div>
      </div>

      <!-- Sign In Form -->
      <div id="loginSection" class="cart-card">
        <div class="form-title">Aapka Account Login Karein</div>
        <div id="loginError" style="display:none; color: #dc2626; background: #fee2e2; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 14px;"></div>
        
        <div class="input-group">
          <label class="input-label">Email ID (Registered Email) *</label>
          <input type="email" id="loginEmail" class="text-input" placeholder="e.g. ramesh@gmail.com" autocomplete="email">
        </div>
        <div class="input-group">
          <label class="input-label">Password *</label>
          <input type="password" id="loginPassword" class="text-input" placeholder="Enter password" autocomplete="current-password">
        </div>
        
        <div style="text-align: right; margin-top: -6px; margin-bottom: 14px;">
          <a href="javascript:void(0)" onclick="triggerForgotPassword()" style="color: var(--primary-dark); font-size: 12px; font-weight: 700; text-decoration: none;">Forgot Password?</a>
        </div>

        <button class="btn-whatsapp" id="loginSubmitBtn" style="background: var(--dark); margin-bottom: 10px;" onclick="handleLogin()">
          <span>🔑</span> Sign In
        </button>

        <div style="text-align: center; font-size: 13px; color: #64748b; margin-top: 12px;">
          Naye customer hain? <a href="javascript:void(0)" onclick="switchAuthTab('signup')" style="color: var(--primary-dark); font-weight: 700; text-decoration: none;">Naya Account Banayein</a>
        </div>
      </div>

      <!-- Sign Up Form -->
      <div id="signupSection" class="cart-card" style="display: none;">
        <div class="form-title">Naya Account Banayein</div>
        <div id="signupError" style="display:none; color: #dc2626; background: #fee2e2; border: 1px solid #fecaca; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 14px;"></div>
        
        <div class="input-group">
          <label class="input-label">Full Name (Pura Naam) *</label>
          <input type="text" id="regName" class="text-input" placeholder="e.g. Ramesh Kumar">
        </div>
        <div class="input-group">
          <label class="input-label">Email ID (Email Address) *</label>
          <input type="email" id="regEmail" class="text-input" placeholder="e.g. ramesh@gmail.com" autocomplete="email">
        </div>
        <div class="input-group">
          <label class="input-label">Mobile Number (WhatsApp) *</label>
          <input type="tel" id="regPhone" class="text-input" placeholder="e.g. 9876543210" maxlength="10">
        </div>
        <div class="input-group">
          <label class="input-label">Password (Min. 6 Characters) *</label>
          <input type="password" id="regPassword" class="text-input" placeholder="Create password (min 6 characters)" autocomplete="new-password">
        </div>
        <div class="input-group">
          <label class="input-label">Confirm Password *</label>
          <input type="password" id="regConfirmPassword" class="text-input" placeholder="Re-type password" autocomplete="new-password">
        </div>

        <button class="btn-whatsapp" id="signupSubmitBtn" style="background: var(--primary); margin-bottom: 10px;" onclick="handleSignUp()">
          <span>✨</span> Create Account
        </button>

        <div style="text-align: center; font-size: 13px; color: #64748b; margin-top: 12px;">
          Pehle se account hai? <a href="javascript:void(0)" onclick="switchAuthTab('login')" style="color: var(--primary-dark); font-weight: 700; text-decoration: none;">Sign In Karein</a>
        </div>
      </div>
    </div>

    <!-- Authenticated State (Profile) -->
    <div id="authAuthenticated" style="display: none;">
      <div class="cart-card" style="text-align: center; padding: 24px 16px;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; margin: 0 auto 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);" id="userAvatarText">👤</div>
        <div style="font-size: 18px; font-weight: 800; color: var(--dark);" id="profileUserName">User Name</div>
        <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;" id="profileUserEmail">user@email.com</div>
        <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid #a7f3d0; margin-top: 8px;">✓ Verified Customer</div>
      </div>

      <div class="cart-card">
        <div class="form-title">Account Details</div>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          <div style="display:flex; justify-content:space-between; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
            <span style="color:#64748b;">Phone:</span>
            <span style="font-weight: 700; color: var(--dark);" id="profileUserPhone">-</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
            <span style="color:#64748b;">Default Address:</span>
            <span style="font-weight: 700; color: var(--dark); max-width: 60%; text-align: right;" id="profileUserAddress">Bakani</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#64748b;">Member Since:</span>
            <span style="font-weight: 700; color: var(--dark);" id="profileMemberSince">2026</span>
          </div>
        </div>
      </div>

      <div class="cart-card">
        <button class="cat-pill active" style="width: 100%; padding: 12px; text-align: center; font-size: 14px; margin-bottom: 10px;" onclick="switchTab('orders', document.querySelector('.bottom-nav .nav-item:nth-child(4)'))">
          📦 View My Order History
        </button>
        <button class="cat-pill" style="width: 100%; padding: 12px; text-align: center; font-size: 14px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;" onclick="handleLogout()">
          🚪 Log Out
        </button>
      </div>
    </div>
  </div>`;

if (content.includes(target)) {
  content = content.replace(target, accountViewMarkup);
  fs.writeFileSync('android-app/app/src/main/assets/www/index.html', content, 'utf8');
  console.log('Successfully inserted accountView markup!');
} else {
  console.error('Target ordersView not found!');
}
