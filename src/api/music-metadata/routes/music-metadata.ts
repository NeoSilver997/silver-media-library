export default {
  routes: [
    {
      method: 'GET',
      path: '/music-metadata/:id/player',
      handler: 'music-metadata.player',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
