// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

// Supabase Project Configuration
var SUPABASE_URL = 'https://eyzbfylsbicoeoszcxfs.supabase.co';
var SUPABASE_KEY = 'sb_publishable_dbjWjVoJnaCCO2qdqjvaDA_iSTriMEb';

// Initialize Supabase Client
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get current authenticated user
window.getCurrentUser = async function() {
  var session = await supabase.auth.getSession();
  return session.data.session ? session.data.session.user : null;
};

// Get current user ID (UUID from auth.users)
window.getCurrentUserId = async function() {
  var user = await getCurrentUser();
  return user ? user.id : null;
};

// Check if user is authenticated
window.isUserAuthenticated = async function() {
  var user = await getCurrentUser();
  return !!user;
};

// Sign up new user with email and password
window.signupWithEmail = async function(email, password) {
  try {
    var response = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  } catch (err) {
    console.error('Signup error:', err.message);
    throw err;
  }
};

// Sign in with email and password
window.loginWithEmail = async function(email, password) {
  try {
    var response = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  } catch (err) {
    console.error('Login error:', err.message);
    throw err;
  }
};

// Sign out current user
window.signOutUser = async function() {
  try {
    var response = await supabase.auth.signOut();

    if (response.error) {
      throw new Error(response.error.message);
    }

    return true;
  } catch (err) {
    console.error('Signout error:', err.message);
    throw err;
  }
};

// Get user session
window.getSession = async function() {
  var response = await supabase.auth.getSession();
  return response.data.session;
};

// Listen for auth changes (login/logout)
window.onAuthStateChanged = function(callback) {
  supabase.auth.onAuthStateChange(function(event, session) {
    callback(event, session);
  });
};

// ============================================================================
// SUPABASE TABLE OPERATIONS
// ============================================================================

// Query helper - insert/update/delete with error handling
window.supabaseQuery = async function(operation) {
  try {
    var result = await operation;

    if (result.error) {
      console.error('Supabase error:', result.error.message);
      throw new Error(result.error.message);
    }

    return result.data;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
};

// Get from Supabase with error handling
window.supabaseGet = async function(query) {
  try {
    var result = await query;

    if (result.error) {
      console.error('Supabase get error:', result.error.message);
      return null;
    }

    return result.data;
  } catch (err) {
    console.error('Get error:', err.message);
    return null;
  }
};

// ============================================================================
// ENCRYPTION HELPERS (for API keys)
// ============================================================================

// Simple encryption using base64 (for basic obfuscation)
// In production, use proper encryption library
window.encryptApiKey = function(key) {
  if (!key) return '';
  return btoa(key); // Base64 encode
};

window.decryptApiKey = function(encrypted) {
  if (!encrypted) return '';
  try {
    return atob(encrypted); // Base64 decode
  } catch (e) {
    console.error('Decryption error:', e);
    return '';
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Check authentication on page load
window.checkAuthOnLoad = async function() {
  var user = await getCurrentUser();
  if (user) {
    console.log('User logged in:', user.email);
    // User is authenticated, proceed with app
  } else {
    console.log('No user authenticated');
    // User is not logged in, show login screen
  }
};

// Export supabase client for direct access if needed
window.supabaseClient = supabase;
