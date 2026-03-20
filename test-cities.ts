import { CHINA_PROVINCE_CITIES, CHINA_PROVINCE_FULL_NAMES } from './src/china-cities';

const stateCode = 'GD';
const fullProvinceName = CHINA_PROVINCE_FULL_NAMES[stateCode];
console.log("Province:", fullProvinceName);
console.log("Cities:", CHINA_PROVINCE_CITIES[fullProvinceName]);
