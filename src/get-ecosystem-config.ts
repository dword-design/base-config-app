import parsePackagejsonName from 'parse-packagejson-name';

// See https://dotenvx.com/docs/process-managers/pm2

export default (packageConfig: { name: string }) => {
  const packageName = parsePackagejsonName(packageConfig.name).fullName;
  return {
    apps: [
      {
        cwd: `/var/www/${packageName}/current`,
        exec_mode: 'cluster',
        instances: 'max',
        kill_timeout: 10_000,
        listen_timeout: 20_000,
        name: packageName,
        script: './prod-entry.mjs',
      },
    ],
  };
};
