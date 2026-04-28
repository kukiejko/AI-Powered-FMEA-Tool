// ============================================================================
// AUTHENTICATION MODULE - SUPABASE
// ============================================================================

var currentUser = null;
var currentUserId = null;

// ============================================================================
// UI HELPERS
// ============================================================================

window.toggleSignupMode = function() {
  var loginForm = document.getElementById('loginFormMode');
  var signupForm = document.getElementById('signupFormMode');
  var loginBtn = document.getElementById('loginBtn');
  var signupBtn = document.getElementById('signupBtn');
  var loginTitle = document.getElementById('loginTitle');
  var toggleSignupText = document.getElementById('toggleSignupText');
  var toggleLoginText = document.getElementById('toggleLoginText');

  if (loginForm.style.display === 'none') {
    // Switch to login
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginBtn.style.display = 'block';
    signupBtn.style.display = 'none';
    loginTitle.textContent = 'Sign in to continue';
    toggleSignupText.style.display = 'inline';
    toggleLoginText.style.display = 'none';
    clearLoginErrors();
  } else {
    // Switch to signup
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'block';
    loginTitle.textContent = 'Create your account';
    toggleSignupText.style.display = 'none';
    toggleLoginText.style.display = 'inline';
    clearLoginErrors();
  }
};

window.showForgotPassword = function() {
  alert('Password reset functionality coming soon.\n\nFor now, please contact your administrator.');
};

window.toggleColumn = function(key) {
  hiddenCols[key] = !hiddenCols[key];
  (async function(){
    var proj = await getProject(currentProjectId);
    if (proj) { proj.hiddenCols = hiddenCols; await saveProject(proj); }
  })();
  updateColToggleButtons();
  buildHeader();
  renderTable();
};

function updateColToggleButtons() {
  var causeBtn  = document.getElementById('toggleCauseBtn');
  var actionBtn = document.getElementById('toggleActionBtn');
  if (causeBtn) {
    causeBtn.textContent  = hiddenCols.cause  ? 'Cause ✗' : 'Cause ✓';
    causeBtn.classList.toggle('col-hidden', !!hiddenCols.cause);
  }
  if (actionBtn) {
    actionBtn.textContent = hiddenCols.action ? 'Action ✗' : 'Action ✓';
    actionBtn.classList.toggle('col-hidden', !!hiddenCols.action);
  }
}

window.selectMode = function(mode) {
  currentMode = mode;
  document.getElementById('modeSimple').checked   = (mode === 'simple');
  document.getElementById('modeAdvanced').checked = (mode === 'advanced');
  document.getElementById('modeSimpleCard').classList.toggle('mode-card-active',   mode === 'simple');
  document.getElementById('modeAdvancedCard').classList.toggle('mode-card-active', mode === 'advanced');
};

window.toggleApiKeyVisibility = function(inputId) {
  var input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.clearLoginErrors = function() {
  var err = document.getElementById('loginErr');
  if (err) err.textContent = '';
};

window.showLoginError = function(message) {
  var err = document.getElementById('loginErr');
  if (err) err.textContent = '❌ ' + message;
};

window.updateLoginApiKeyUI = function() {
  var provider = document.getElementById('loginProvider').value;
  var hints = {
    'claude': 'Get free credits at console.anthropic.com',
    'gemini': 'Get free $300 credits at console.cloud.google.com',
    'groq': 'Get free API key at console.groq.com',
    'ollama': 'No API key needed — runs on your machine'
  };
  var labels = {
    'claude': 'Claude API Key',
    'gemini': 'Gemini API Key',
    'groq': 'Groq API Key',
    'ollama': 'Ollama Model'
  };
  var placeholders = {
    'claude': 'sk-ant-…',
    'gemini': 'AIza…',
    'groq': 'gsk_…',
    'ollama': 'mistral'
  };

  var keyField = document.getElementById('loginApiKeyField');
  var keyInput = document.getElementById('loginApiKey');
  var label = document.getElementById('loginApiLabel');
  var hint = document.getElementById('loginProviderHint');

  if (provider === 'ollama') {
    keyField.style.display = 'block';
    keyInput.placeholder = placeholders[provider];
    label.textContent = 'Ollama Model (optional — defaults to mistral)';
  } else {
    keyField.style.display = 'block';
    keyInput.placeholder = placeholders[provider];
    label.innerHTML = labels[provider] + ' <span style="font-size:0.72rem;color:#a0aec0;font-weight:400">(optional)</span>';
  }
  if (hint) hint.textContent = hints[provider];
};

// ============================================================================
// GOOGLE SSO
// ============================================================================

window.doLoginWithGoogle = async function() {
  clearLoginErrors();
  try {
    var response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href
      }
    });
    if (response.error) throw new Error(response.error.message);
  } catch (err) {
    showLoginError('Google sign-in failed: ' + err.message);
    console.error('Google OAuth error:', err);
  }
};

// ============================================================================
// LOGIN FUNCTION
// ============================================================================

window.doLogin = async function() {
  clearLoginErrors();

  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPass').value;

  if (!email || !password) {
    showLoginError('Please enter email and password');
    return;
  }

  // Show loading state
  var btn = document.querySelector('#loginBtn');
  var originalText = btn.textContent;
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    await loginWithEmail(email, password);

    // Get current user
    var user = await getCurrentUser();
    if (user) {
      currentUser = email;
      currentUserId = user.id;

      // Store session info
      localStorage.setItem('currentUser', email);
      localStorage.setItem('currentUserId', user.id);

      // Update UI
      document.getElementById('dashUserLabel').textContent = '👤 ' + email;
      document.getElementById('workUserLabel').textContent = '👤 ' + email;

      // Load API keys from Supabase into localStorage cache
      if (typeof loadApiKeysFromSupabase === 'function') {
        await loadApiKeysFromSupabase();
      }

      // Navigate to dashboard
      showScreen('screenDash');
      loadDashboard();
    }
  } catch (err) {
    showLoginError(err.message);
    console.error('Login failed:', err);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
};

// ============================================================================
// SIGNUP FUNCTION
// ============================================================================

window.doSignup = async function() {
  clearLoginErrors();

  var email = document.getElementById('signupEmail').value.trim();
  var password = document.getElementById('signupPass').value;
  var password2 = document.getElementById('signupPass2').value;

  if (!email || !password || !password2) {
    showLoginError('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    showLoginError('Password must be at least 6 characters');
    return;
  }

  if (password !== password2) {
    showLoginError('Passwords do not match');
    return;
  }

  // Show loading state
  var btn = document.getElementById('signupBtn');
  var originalText = btn.textContent;
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    await signupWithEmail(email, password);

    showLoginError('Account created! Please check your email to confirm. Then sign in.');

    // Clear form
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPass').value = '';
    document.getElementById('signupPass2').value = '';

    // Switch back to login after 2 seconds
    setTimeout(function() {
      toggleSignupMode();
    }, 2000);
  } catch (err) {
    showLoginError(err.message);
    console.error('Signup failed:', err);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
};

// ============================================================================
// LOGOUT FUNCTION
// ============================================================================

window.doLogout = async function() {
  try {
    await signOutUser();

    // Clear local state
    currentUser = null;
    currentUserId = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');

    // Clear all app state
    window.currentProjectId = null;
    window.rows = [];
    window.incidents = [];
    window.fileTexts = [];
    window.fileNames = [];

    // Show login screen
    showScreen('screenLogin');

    // Clear form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPass').value = '';
    clearLoginErrors();

  } catch (err) {
    console.error('Logout failed:', err);
    alert('Error logging out: ' + err.message);
  }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

window.checkAuthSession = async function() {
  try {
    var user = await getCurrentUser();

    if (user) {
      currentUser = user.email;
      currentUserId = user.id;
      localStorage.setItem('currentUser', user.email);
      localStorage.setItem('currentUserId', user.id);

      // Update UI
      document.getElementById('dashUserLabel').textContent = '👤 ' + user.email;
      document.getElementById('workUserLabel').textContent = '👤 ' + user.email;

      // Load API keys from Supabase into localStorage cache
      if (typeof loadApiKeysFromSupabase === 'function') {
        await loadApiKeysFromSupabase();
      }

      // User is logged in, show dashboard
      loadDashboard();
      showScreen('screenDash');
      return true;
    } else {
      // User not logged in, show login screen
      currentUser = null;
      currentUserId = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');

      showScreen('screenLogin');
      return false;
    }
  } catch (err) {
    console.error('Session check failed:', err);
    showScreen('screenLogin');
    return false;
  }
};

// ============================================================================
// INITIALIZE AUTH ON PAGE LOAD
// ============================================================================

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async function() {
  // Initialize version display (from utils.js)
  if (typeof initVersionDisplay === 'function') {
    initVersionDisplay();
  }

  // Check auth session
  await checkAuthSession();

  // Set up auth state listener
  onAuthStateChanged(async function(event, session) {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN') {
      // User just signed in
      await checkAuthSession();
    } else if (event === 'SIGNED_OUT') {
      // User just signed out
      currentUser = null;
      currentUserId = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      showScreen('screenLogin');
    } else if (event === 'TOKEN_REFRESHED') {
      // Token was refreshed, update session
      if (session) {
        currentUser = session.user.email;
        currentUserId = session.user.id;
      }
    }
  });
});
