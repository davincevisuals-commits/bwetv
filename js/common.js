/**
 * BWE TV - Common Utilities & Shared Functions
 * Extracted from duplicate code across pages
 */

// ============================================
// MOBILE MENU TOGGLE
// ============================================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (!mobileMenuBtn || !mobileMenu) return;
  
  mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('visible');
  });
  
  document.querySelectorAll('#mobileMenu a').forEach(link => {
    link.addEventListener('click', function() {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('visible');
    });
  });
}

// ============================================
// SHARE VIDEO FUNCTIONALITY
// ============================================
function shareVideo(title = 'Watch BWE TV Live', text = 'Join me watching BWE TV Live Now!') {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: text,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    const shareUrl = window.location.href;
    const message = `${text}\n${shareUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        showNotification('Link copied to clipboard!', 'success');
      });
    } else {
      alert(`Share this link: ${shareUrl}`);
    }
  }
}

// ============================================
// DARK MODE TOGGLE
// ============================================
function initDarkMode() {
  const darkModeEnabled = localStorage.getItem('bwe-tv-dark-mode') === 'true';
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
  }
}

function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('bwe-tv-dark-mode', isDarkMode);
  return isDarkMode;
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  let bgClass = 'bg-blue-600';
  if (type === 'success') bgClass = 'bg-green-600';
  if (type === 'error') bgClass = 'bg-red-600';
  if (type === 'warning') bgClass = 'bg-yellow-600';
  
  notification.className = `fixed top-4 right-4 px-4 py-3 rounded shadow-lg text-white z-50 ${bgClass}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// ============================================
// FORM VALIDATION
// ============================================
const FormValidator = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  password: (password) => {
    const re = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
  },
  
  username: (username) => {
    return username.length >= 3 && username.length <= 30;
  },
  
  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

function validateForm(formElement) {
  let isValid = true;
  const errors = {};
  
  formElement.querySelectorAll('[required]').forEach(field => {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    
    if (!value) {
      errors[fieldName] = 'This field is required';
      isValid = false;
      return;
    }
    
    if (field.type === 'email' && !FormValidator.email(value)) {
      errors[fieldName] = 'Invalid email address';
      isValid = false;
    }
    
    if (field.type === 'password' && !FormValidator.password(value)) {
      errors[fieldName] = 'Password must be at least 8 characters with 1 uppercase and 1 number';
      isValid = false;
    }
  });
  
  return { isValid, errors };
}

// ============================================
// LAZY LOADING IMAGES
// ============================================
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
  }
}

// ============================================
// ANALYTICS TRACKING
// ============================================
const Analytics = {
  trackPageView: (pageName) => {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'VITE_GOOGLE_ANALYTICS_ID', {
        page_path: window.location.pathname,
        page_title: pageName
      });
    }
  },
  
  trackEvent: (eventName, eventData = {}) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }
  }
};

// ============================================
// ERROR LOGGING
// ============================================
const ErrorLogger = {
  captureException: (error) => {
    console.error('Error captured:', error);
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error);
    }
  },
  
  captureMessage: (message, level = 'info') => {
    console.log(`[${level}] ${message}`);
    if (typeof Sentry !== 'undefined') {
      Sentry.captureMessage(message, level);
    }
  }
};

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const Storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(`bwe-tv-${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      ErrorLogger.captureException(error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`bwe-tv-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      ErrorLogger.captureException(error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(`bwe-tv-${key}`);
      return true;
    } catch (error) {
      ErrorLogger.captureException(error);
      return false;
    }
  },
  
  clear: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('bwe-tv-')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      ErrorLogger.captureException(error);
      return false;
    }
  }
};

// ============================================
// INITIALIZE ON DOM READY
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initDarkMode();
    initLazyLoading();
  });
} else {
  initMobileMenu();
  initDarkMode();
  initLazyLoading();
}
