export default {
  routes: [
    {
      method: 'GET',
      path: '/photo-metadata/:id/viewer',
      handler: 'photo-metadata.viewer',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
