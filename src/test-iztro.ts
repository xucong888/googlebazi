import { astro } from 'iztro';
const astrolabe = astro.bySolar('2000-08-16', 2, '男', true, 'zh-CN');
console.log(astrolabe.palaces.map(p => p.decadal));
