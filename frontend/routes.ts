export const routes = {
  public: {
    home: () => '/',
    about: () => '/sobre',
    contacts: () => '/contatos',
    routes: () => '/rotas',
    team: () => '/equipe',
    features: {
      confirm: () => '/#app',
      history: () => '/#historico',
      notifications: () => '/#notificacoes',
      checkin: () => '/#checkin',
    },
  },
  auth: {
    login: () => '/login',
    signup: () => '/signup',
    recovery: () => '/recovery',
  },
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