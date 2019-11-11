import * as graphql from "graphql";

const fields = {
  list: ["text", "value"]
};

/**
 * schema type 与 GraphQL type映射
 */
const listItemType = new graphql.GraphQLObjectType({
  name: "ListItem",
  fields: {
    value: { type: graphql.GraphQLID },
    text: { type: graphql.GraphQLString }
  }
});
const listType = new graphql.GraphQLList(listItemType);

export const graphQLTypes = {
  id: graphql.GraphQLID,
  string: graphql.GraphQLString,
  number: graphql.GraphQLInt,
  list: listType,
  enum: listType
};

export const clientGraphQLTypes = {
  id: 'ID',
  string: 'String',
  number: 'Int',
  boolean: 'Boolean',
}

export const viewTypes = {
  id: "input",
  string: "input",
  number: "inputnumber",
  list: "select",
  enum: "radiogroup"
};

/**
 * 这里可以通过sourceDependency
 */
export const remoteSourceTransformer = (type, remoteSource, deps) => {
  let paramsFn;
  let queryFn = remoteSource;
  if (deps && deps.length) {
    paramsFn = `query ${remoteSource}WithArgs (`;
    queryFn += " (";
    deps.forEach((dep, index) => {
      if (index !== deps.length - 1) {
        paramsFn += `$${dep}: ID!, `;
        queryFn += `${dep}: $${dep},`;
      } else {
        paramsFn += `$${dep}: ID!)`;
        queryFn += `${dep}: $${dep})`;
      }
    });
  }

  let returnList;
  if (type === "list") {
    returnList = fields.list.reduce((memo, item) => {
      memo += item + ",";
      return memo;
    }, "");
  }

  let result = queryFn;

  if (returnList) {
    result = `${queryFn} {
${returnList}
}`.trim();
  }

  if (paramsFn) {
    result = `${paramsFn} {
${result}
}`.trim();
  }

  // 等待补充
  return {
    query: paramsFn ? result : `{${result}}`
  };
};

/**
 * submit表单和获取已提交表单
 */
export const formValuesTransformer = (meta, id) => {
  let paramsFn;
  let params = ''
  let mutationParams = '';
  let resultFields = '';
  
  Object.keys(meta.schemas).forEach((fieldKey) => {
    const field = meta.schemas[fieldKey];
    const {
      type,
      valueType,
    } = field;
    const clientGraphQLType = clientGraphQLTypes[valueType || type];
    params += `$${fieldKey}: ${clientGraphQLType},`;
    mutationParams += `${fieldKey}: $${fieldKey},`;
    resultFields += `${fieldKey}, `;
  });

  paramsFn = `mutation ${meta.mutation}WithArgs (${params}) {
    ${meta.mutation} (${mutationParams}) {
      ${resultFields}
  }
}`;

  return { query: paramsFn};
}

export const buildRemoteSourceQuery = schema => {
  const { type, sourceDependencies, resolve } = schema;

  const result = {};
  result.type = graphQLTypes[type];
  result.resolve = resolve;
  if (sourceDependencies) {
    result.args = sourceDependencies.reduce((memo, dep) => {
      memo[dep] = {
        type: graphQLTypes.id // 暂时都用id表示
      };
      return memo;
    }, {});
  }

  return result;
};

export const buildFormMutation = meta => {
  const result = {};
  result.args = buildFormFieldsType(meta.schemas);
  result.type = new graphql.GraphQLObjectType({
    name: meta.type,
    fields: result.args
  });
  result.resolve = meta.resolve;
  return result;
};

function buildFormFieldsType(schemas) {
  const fieldsType = Object.keys(schemas).reduce((memo, fieldKey) => {
    const field = schemas[fieldKey];
    const graphqlType = graphQLTypes[field.valueType || field.type];
    memo[fieldKey] = { type: graphqlType };
    return memo;
  }, {});

  return fieldsType;
}


export const buildViewConfig = (meta, url) => {
  const config = {};
  config.fields = Object.keys(meta.schemas).map((name) => {
    const schema = meta.schemas[name];
    const fieldConfig = {};
    const {
      label,
      type,
      source,
      remoteSource,
      sourceDependencies,
    } = schema;

    fieldConfig.render = viewTypes[type];
    fieldConfig.name = name;
    fieldConfig.label = label || name;
    if(source) {
      fieldConfig.initialSource = source;
    }
    
    if(remoteSource) {
      fieldConfig.remoteSource = {
        url,
        method: 'post',
        params: remoteSourceTransformer(type, remoteSource, sourceDependencies),
        converter: {
          type: 'sula::remoteSource',
          remoteSource,
        }
      };

      if(sourceDependencies && sourceDependencies.length) {
        fieldConfig.remoteSource.init = false;
        fieldConfig.remoteSource.convertParams = {
          type: 'sula::remoteSource',
          sourceDependencies,
        };

        fieldConfig.dependency = {
          source: {
            relates: sourceDependencies,
            defaultOutput: [],
          }
        }
      }
    }

    return fieldConfig;
  });

  config.layout = 'vertical';
  config.submit = {
    url,
    method: 'post',
    params: formValuesTransformer(meta),
  };

  return config;
}