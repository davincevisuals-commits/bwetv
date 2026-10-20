<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BWE TV Shows</title>
  <meta name="description" content="Browse the BWE TV shows and discover the programs available on the network.">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="site.css" rel="stylesheet">
  <style>
    :root {
      --bwe-brand: #7c2d12;
      --bwe-brand-strong: #78350f;
      --bwe-primary: #dc2626;
      --bwe-accent: #2563eb;
      --bwe-surface: #f8fafc;
    }
    .category-filter { border: 1px solid rgba(124,45,18,.2); }
    .category-filter.active { background: var(--bwe-primary); color: #fff; border-color: var(--bwe-primary); }
    .brand-header { background: var(--bwe-brand); }
    .brand-header-sub { background: var(--bwe-brand-strong); }
    .section-surface { background: var(--bwe-surface); }
  </style>
</head>
<body class="bg-white text-black">
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <header class="brand-header sticky top-0 z-50 text-white shadow-lg">
    <div class="site-shell flex items-center justify-between p-4">
      <a href="index.html" class="brand-mark" aria-label="BWE TV home">
        <img src="assets/images/logo%201.png" alt="BWE TV logo" class="brand-logo">
        <span class="brand-wordmark">BWE TV</span>
      </a>
      <nav class="hidden md:flex space-x-6" aria-label="Primary navigation">
        <a href="index.html" data-nav-link class="hover:text-yellow-200 transition">Home</a>
        <a href="schedule.html" data-nav-link class="hover:text-yellow-200 transition">Programs</a>
        <a href="shows.html" data-nav-link class="hover:text-yellow-200 transition">Shows</a>
        <a href="episodes.html" data-nav-link class="hover:text-yellow-200 transition">Episodes</a>
        <a href="community.html" data-nav-link class="hover:text-yellow-200 transition">Community</a>
        <a href="live-chat.html" data-nav-link class="hover:text-yellow-200 transition">Live Chat</a>
      </nav>
      <button id="mobileMenuBtn" class="md:hidden rounded p-2 text-2xl transition hover:bg-yellow-800" aria-expanded="false" aria-controls="mobileMenu" aria-label="Open navigation menu">☰</button>
    </div>

    <nav id="mobileMenu" class="mobile-menu hidden brand-header-sub md:hidden" aria-label="Mobile navigation">
      <div class="site-shell flex flex-col space-y-3 p-4">
        <a href="index.html" data-nav-link class="hover:text-yellow-200 transition">Home</a>
        <a href="schedule.html" data-nav-link class="hover:text-yellow-200 transition">Programs</a>
        <a href="shows.html" data-nav-link class="hover:text-yellow-200 transition">Shows</a>
        <a href="episodes.html" data-nav-link class="hover:text-yellow-200 transition">Episodes</a>
        <a href="community.html" data-nav-link class="hover:text-yellow-200 transition">Community</a>
        <a href="live-chat.html" data-nav-link class="hover:text-yellow-200 transition">Live Chat</a>
      </div>
    </nav>
  </header>

  <main id="main-content" class="site-shell px-6 py-10">
    <section class="mb-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 p-8 text-white">
      <h1 class="text-4xl font-bold">BWE TV Shows</h1>
      <p class="mt-2">Browse our catalog and find the programs that match your viewing interests.</p>
    </section>

    <div id="showFilters" class="mb-6 flex flex-wrap gap-2"></div>
    <section id="showsContainer" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3"></section>
  </main>

  <footer class="brand-header mt-8 p-4 text-center text-white">
    <div class="site-shell">
      <p>© 2026 BWE TV</p>
      <div class="footer-link-grid mt-3 text-sm font-semibold">
        <a href="about.html" class="hover:text-yellow-200 transition">About</a>
        <a href="privacy.html" class="hover:text-yellow-200 transition">Privacy</a>
        <a href="contact.html" class="hover:text-yellow-200 transition">Contact</a>
        <a href="community.html" class="hover:text-yellow-200 transition">Community</a>
        <a href="episodes.html" class="hover:text-yellow-200 transition">Episodes</a>
      </div>
    </div>
  </footer>

  <script src="content.js" defer></script>
</body>
</html>
