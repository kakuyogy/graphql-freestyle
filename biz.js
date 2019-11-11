import axios from 'axios';

exports.fetch = (args) => {
  console.log('args: ', args);
  const {
    query,
    ...variables
  } = args.params;
  axios[args.method](args.url, {
    query,
    variables,
  }).then(res => res.data)
  .then(data => {
    console.log(data);
    return data;
  })
}

exports.history = () => {
  console.log('history');
}