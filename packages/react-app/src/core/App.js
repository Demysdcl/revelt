import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import Header from "../components/Header";
import Content from "../components/Content";

import ListScreen from "../screens/List";
import PokemonScreen from "../screens/Pokemon";

const App = () => {
  return (
    <>
      <Header />
      <BrowserRouter basename="/react/">
        <Content>
          <Switch>
            <Route exact path="/" component={ListScreen} />
            <Route exact path="/pokemon/:id" component={PokemonScreen} />
          </Switch>
        </Content>
      </BrowserRouter>
    </>
  );
};

export default App;
