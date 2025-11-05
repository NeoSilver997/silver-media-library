export default {
  routes: [
    {
      method: 'GET',
      path: '/media-ui/photos',
      handler: 'media-ui.photosPage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/music',
      handler: 'media-ui.musicPage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/videos',
      handler: 'media-ui.videosPage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/photos',
      handler: 'media-ui.getPhotos',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/music',
      handler: 'media-ui.getMusic',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/api/videos',
      handler: 'media-ui.getVideos',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/media-ui/file/:id',
      handler: 'media-ui.serveFile',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
