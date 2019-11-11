import React from "react";
import ReactDOM from "react-dom";
import CreateForm from "@sula-template/create-form";
import axios from "axios";

function remoteSourceConverter(sula) {
  sula.converterType("sula::remoteSource", (ctx, config) => {
    return ctx.data[config.remoteSource];
  });
  sula.convertParamsType("sula::remoteSource", (ctx, config) => {
    const { sourceDependencies } = config;
    const variables = sourceDependencies.reduce((memo, name) => {
      memo[name] = ctx.form.getFieldValue(name);
      return memo;
    }, {});
    const params = {
      ...ctx.params,
      variables,
    }

    delete params.dependencies;
    return params;
  });
}

export default function App() {
  const [config, setConfig] = React.useState(null);
  React.useEffect(() => {
    axios
      .get("/poc/meta")
      .then(res => res.data)
      .then(data => {
        setConfig(data);
      });
  }, []);
  return config ? (
    <CreateForm {...config} formProps={{ plugins: [remoteSourceConverter] }} />
  ) : (
    "loading..."
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
