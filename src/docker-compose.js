export default {
  services: {
    proxy: {
      depends_on: ['web'],
      image: 'nginx:1',
      ports: ['80:80'],
      volumes: ['./nginx:/etc/nginx/conf.d'],
    },
    web: {
      command: 'bash -c "yarn --frozen-lockfile && yarn dev"',
      environment: ['HOST=0.0.0.0'],
      image: 'node:12',
      ports: ['3000:3000'],
      volumes: ['.:/app', '/app/node_modules'],
      working_dir: '/app',
    },
  },
  version: '3',
};
