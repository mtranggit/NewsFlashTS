import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
  createClient,
  dedupExchange,
  fetchExchange,
  Provider as UrqlProvider,
} from 'urql';
import { RootNavigator } from './screens/Root.navigator';
import schema from './graphql/graphql.schema.json';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange({
      schema: schema as any,
      resolvers: {
        Query: {
          story: (_, args) => ({ __typename: 'Story', id: args.id }),
        },
      },
    }),
    fetchExchange,
  ],
});

export const App = () => {
  return (
    <UrqlProvider value={client}>
      <NavigationContainer>
        <StatusBar hidden />
        <RootNavigator />
      </NavigationContainer>
    </UrqlProvider>
  );
};
