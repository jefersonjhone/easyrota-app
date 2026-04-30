export const routes = {
  // Public routes accessible to all users
  // These routes correspond to informational pages and features available without authentication.
  public: {
    home: () => '/',
    about: () => '/sobre',
    contacts: () => '/contatos',
    routes: () => '/rotas',
    team: () => '/equipe',
    legal: () => '/aviso-legal',
    tos: () => '/termos',

    // Feature routes that are accessible without authentication
    // These routes correspond to specific sections on home page.
    features: {
      confirm: () => '/#app',
      history: () => '/#historico',
      notifications: () => '/#notificacoes',
      checkin: () => '/#checkin',
    },
  },

  // Authentication routes for user login, signup, and password recovery.
  auth: {
    login: () => '/login',
    signup: () => '/signup',
    recovery: () => '/recovery',
  },

  // Admin routes for managing the platform, accessible only to authenticated admin users.
  admin: {
    index: () => '/admin',
    travel: () => '/admin/travel',
    buses: () => '/admin/buses',
    drivers: () => '/admin/drivers',
    routes: () => '/admin/routes',
    admins: () => '/admin/admins',
    reports: () => '/admin/reports',
  }
}

export const externalRoutes = {
  github: {
    org: () => 'https://github.com/EasyRota',
    repo: () => 'https://github.com/EasyRota/app',
    docs: () => '#docs'
  },
  academic: {
    exa613: () => '#exa613',
  },
  instagram: () => '#instagram',
  facebook: () => '#facebook',
}