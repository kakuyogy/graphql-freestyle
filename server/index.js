import express from 'express';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import path from 'path';
import personSchema from './person';
import {schema as pocSchema, url as pocUrl, viewConfig} from './poc';

const schema = buildSchema(`
  type Person {
    name: String
    age: Int
    gender: Gender
    children: [Person]
  }
  type Query {
    hello: Person
    person(name: String!): [String]
    person2(name: String!): Person
  }

  type Mutation {
    createPerson(name: String!, age: Int!): String
  }

  enum Gender {
    male
    female
  }
`);

const root = {
  hello: () => {
    return {
      name: 'sula',
      age: 20,
      gender: 'female'
    };
  },
  person: (args) => {
    const { name } = args;
    return [name];
  },
  createPerson: (args, p1, p2) => {
    console.log('p1: ', p1);
    console.log('p2: ', p2);
    const {name, age} = args;
    console.log('person', args);
    return name;
  },
  person2: (person) => {
    return {
      name: person.name,
      children: (rootValue, args) => {
        console.log('rootValue: ', rootValue);
        if(person.name == 'sula') {
          return [{
            name: 'sula1',
            age: 10,
            gender: 'male',
          }, {
            name: 'sula2',
            age: 20,
            gender: 'female',
          }]
        } else {
          return null;
        }
      }
    }
  },
}

const app = express();
const PRODUCTION = process.env.NODE_ENV === 'production';

app.use(express.static(path.join(__dirname, '../dist/client')));

app.use('/gl', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));

app.use('/person', graphqlHTTP({
  schema: personSchema,
  graphiql: true
}))

app.get(`${pocUrl}/meta`, (req, res) => {
  res.send(viewConfig);
})

app.use(pocUrl, graphqlHTTP({
  schema: pocSchema,
  graphiql: true
}))

const serverPort = process.env.PORT || 3000;
app.listen(serverPort);
console.log(`Express server @ http://localhost:${serverPort} (${PRODUCTION ? 'production' : 'development'})\n`);