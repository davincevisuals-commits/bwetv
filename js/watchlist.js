/**
 * BWE TV - Watchlist & User Profiles
 */

const Watchlist = {
  addShow: (showId, showData) => {
    const watchlist = Storage.get('watchlist', []);
    if (!watchlist.find(s => s.id === showId)) {
      watchlist.push({
        id: showId,
        ...showData,
        addedAt: Date.now()
      });
      Storage.set('watchlist', watchlist);
      showNotification('Added to watchlist!', 'success');
      return true;
    }
    return false;
  },

  removeShow: (showId) => {
    let watchlist = Storage.get('watchlist', []);
    watchlist = watchlist.filter(s => s.id !== showId);
    Storage.set('watchlist', watchlist);
    showNotification('Removed from watchlist', 'info');
    return true;
  },

  getWatchlist: () => Storage.get('watchlist', []),

  isInWatchlist: (showId) => {
    const watchlist = Storage.get('watchlist', []);
    return watchlist.some(s => s.id === showId);
  }
};

const Favorites = {
  toggle: (showId, showData) => {
    let favorites = Storage.get('favorites', []);
    const index = favorites.findIndex(s => s.id === showId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      showNotification('Removed from favorites', 'info');
    } else {
      favorites.push({
        id: showId,
        ...showData,
        favoritedAt: Date.now()
      });
      showNotification('Added to favorites!', 'success');
    }
    
    Storage.set('favorites', favorites);
    return index === -1;
  },

  getFavorites: () => Storage.get('favorites', []),

  isFavorited: (showId) => {
    const favorites = Storage.get('favorites', []);
    return favorites.some(s => s.id === showId);
  }
};

const ViewingHistory = {
  add: (showId, showData, progress = 0) => {
    let history = Storage.get('viewing-history', []);
    
    const existingIndex = history.findIndex(s => s.id === showId);
    const entry = {
      id: showId,
      ...showData,
      progress: progress,
      watchedAt: Date.now()
    };
    
    if (existingIndex > -1) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }
    
    history = history.slice(0, 100);
    Storage.set('viewing-history', history);
    return true;
  },

  getHistory: () => Storage.get('viewing-history', []),

  clear: () => {
    Storage.remove('viewing-history');
    showNotification('Viewing history cleared', 'info');
    return true;
  },

  getProgress: (showId) => {
    const history = Storage.get('viewing-history', []);
    const entry = history.find(s => s.id === showId);
    return entry ? entry.progress : 0;
  }
};

const UserProfile = {
  getProfile: () => {
    let profile = Storage.get('user-profile', null);
    if (!profile) {
      profile = {
        id: `user_${Date.now()}`,
        username: `User_${Math.random().toString(36).substr(2, 9)}`,
        email: null,
        avatar: '',
        reputation: 0,
        joinedAt: Date.now(),
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en'
        }
      };
      Storage.set('user-profile', profile);
    }
    return profile;
  },

  updateProfile: (updates) => {
    const profile = UserProfile.getProfile();
    const updated = { ...profile, ...updates };
    Storage.set('user-profile', updated);
    showNotification('Profile updated successfully', 'success');
    return updated;
  },

  updatePreferences: (preferences) => {
    const profile = UserProfile.getProfile();
    profile.preferences = { ...profile.preferences, ...preferences };
    Storage.set('user-profile', profile);
    return profile;
  },

  addReputation: (points = 1) => {
    const profile = UserProfile.getProfile();
    profile.reputation += points;
    Storage.set('user-profile', profile);
    return profile.reputation;
  }
};
