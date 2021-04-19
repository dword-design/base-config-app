import { endent } from '@dword-design/functions'
import loadPkg from 'load-pkg'
import parsePackagejsonName from 'parse-packagejson-name'

const packageConfig = loadPkg.sync()

const packageName = parsePackagejsonName(packageConfig.name).fullName

export default endent`
  upstream web {
    server web:3000;
  }

  server {
    listen 80;
    server_name ${packageName}.test;

    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }

`
