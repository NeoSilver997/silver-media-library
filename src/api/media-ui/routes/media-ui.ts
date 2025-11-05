export default {
  routes: [
    {
      method: 'GET',
      path: '/media-ui/photos',
      handler: 'media-ui.photosPage',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/music',
      handler: 'media-ui.musicPage',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/videos',
      handler: 'media-ui.videosPage',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/photos',
      handler: 'media-ui.getPhotos',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/music',
      handler: 'media-ui.getMusic',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/videos',
      handler: 'media-ui.getVideos',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/file/:id',
      handler: 'media-ui.serveFile',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
