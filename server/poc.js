import * as graphql from "graphql";
import { buildRemoteSourceQuery, buildFormMutation, buildViewConfig } from "./util";

export const url = "/poc";

const fakeDB = {
  person: [
    {
      name: "梁又年",
      age: 19
    },
    {
      name: "金大雷",
      age: 18
    }
  ],
  province: [
    {
      value: "zhejiang",
      text: "浙江"
    },
    {
      value: "heilongjiang",
      text: "黑龙江"
    }
  ],
  city: province => {
    if (province === "zhejiang") {
      return [
        {
          value: "hangzhou",
          text: "杭州"
        },
        {
          value: "ningbo",
          text: "宁波"
        }
      ];
    } else if (province === "heilongjiang") {
      return [
        {
          value: "haerbin",
          text: "哈尔滨"
        },
        {
          value: "daqing",
          text: "大庆"
        }
      ];
    } else {
      return [
        {
          value: "unknown",
          text: "不知道"
        }
      ];
    }
  }
};

const genderSource = [
  {
    value: "female",
    text: "女"
  },
  {
    value: "male",
    text: "男"
  }
];

/**
 * 元数据，可以理解为来自于注解
 */
const meta = {
  mutation: "createPerson",
  type: 'Person',
  resolve(_, person) {
    console.log("person: ", person);
    return person;
  },
  schemas: {
    name: {
      type: "string"
    },
    age: {
      type: "number"
    },
    gender: {
      type: "enum",
      valueType: 'id',
      source: genderSource
    },
    province: {
      type: "list",
      valueType: 'id',
      remoteSource: "province",
      resolve: () => fakeDB.province,
    },
    city: {
      type: "list",
      valueType: 'id',
      remoteSource: "city",
      sourceDependencies: ["province"],
      resolve: (_, {province}) => fakeDB.city(province),
    }
  }
};


/**
 * 1. 开始构建sourceGraph
 */
const queryObjectType = {
  name: 'Query',
  fields: {},
}

const mutationObjectType = {
  name: 'Mutation',
  fields: {},
}

Object.keys(meta.schemas).forEach((name) => {
  const schema = meta.schemas[name];
  if(schema.remoteSource) {
    queryObjectType.fields[schema.remoteSource] = buildRemoteSourceQuery(schema);
  }
});

mutationObjectType.fields[meta.mutation] = buildFormMutation(meta);

console.log(mutationObjectType.fields[meta.mutation])

export const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType(queryObjectType),
  mutation: new graphql.GraphQLObjectType(mutationObjectType),
});

export const viewConfig = buildViewConfig(meta, url);


