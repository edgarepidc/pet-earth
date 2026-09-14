import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const eslintConfig = {
  extends: ['next/core-web-vitals'],
};

export default eslintConfig;
