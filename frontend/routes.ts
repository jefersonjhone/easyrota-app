export const routes = {
  auth: {
    login: () => 'login',
    signup: () => 'signup',
    recovery: () => 'recovery',
  },
  admin: {
    index: () => 'admin',
    travel: () => 'admin/travel',
    buses: () => 'admin/buses',
    drivers: () => 'admin/drivers',
    routes: () => 'admin/routes',
    admins: () => 'admin/admins',
    reports: () => 'admin/reports',
  }
}
