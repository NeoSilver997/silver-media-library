export default {
  routes: [
    {
      method: 'POST',
      path: '/scanner/scan',
      handler: 'scanner.scan',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/scanner/find-duplicates',
      handler: 'scanner.findDuplicates',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/scanner/sessions',
      handler: 'scanner.getSessions',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/scanner/sessions/:id',
      handler: 'scanner.getSession',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
