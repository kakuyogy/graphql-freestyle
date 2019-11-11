import { makeExecutableSchema } from 'graphql-tools';


const fakeDB = {
  person: [{
    name: '梁又年',
    age: 19,
  }, {
    name: '金大雷',
    age: 18,
  }],
  province: [{
    value: 'zhejiang',
    text: '浙江',
  }, {
    value: 'heilongjiang',
    text: '黑龙江'
  }],
  city: (province) => {
    if(province === 'zhejiang') {
      return [{
        value: 'hangzhou',
        text: '杭州'
      }, {
        value: 'ningbo',
        text: '宁波'
      }]
    } else if(province === 'heilongjiang') {
      return [{
        value: 'haerbin',
        text: '哈尔滨'
      }, {
        value: 'daqing',
        text: '大庆'
      }]
    } else {
      return [{
        value: 'unknown',
        text: '不知道'
      }]
    }
  }
}


const typeDefs = `
  type Person {
    name: ID!
    age: Int!
  }

  type Province {
    value: ID!
    text: String!
  }

  type City {
    value: ID!
    text: String!
  }

  type Query {
    persons:[Person]
    provinces: [Province]
    cities(value: ID!): [City]
  }
`;

const resolvers = {
  Query: {
    persons() {
      return fakeDB.person;
    },
    provinces() {
      return fakeDB.province;
    },
    cities(_, args = {}) {
      console.log('args: ', args);
      const { value } = args;
      console.log('value: ', value);
      console.log('enter')
      return fakeDB.city(value);
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers
})

export default schema;