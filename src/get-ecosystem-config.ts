import parsePackagejsonName from 'parse-packagejson-name';

export default (packageConfig: { name: string }) => {
  const packageName = parsePackagejsonName(packageConfig.name).fullName;
  return {
    apps: [
      {
        args: '-- node .output/server/index.mjs',
        exec_mode: 'cluster',
        instances: 'max',
        name: packageName,
        script: 'dotenv-json-extended',
      },
    ],
  };
};
