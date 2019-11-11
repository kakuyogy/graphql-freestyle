import { remoteSourceTransformer, buildRemoteSourceQuery } from '../util';


let result = remoteSourceTransformer('list', 'province');
console.log('result: ', result);

result = remoteSourceTransformer('list', 'city', ['province']);
console.log('result: ', result);


result = buildRemoteSourceQuery({
  sourceType: 'list',
  resolve() {}
})
console.log('result: ', result);