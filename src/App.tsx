import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
  createClient,
  dedupExchange,
  fetchExchange,
  gql,
  Provider as UrqlProvider,
} from 'urql';
import { RootNavigator } from './screens/Root.navigator';
import schema from './graphql/graphql.schema.json';
import {
  AddbookmarkMutation,
  AllBookmarksQuery,
  RemoveBookmarkMutation,
} from './graphql/__generated__/operationTypes';
import { BOOKMARKS_QUERY } from './screens/Bookmarks.screen';

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
      updates: {
        Mutation: {
          addBookmark: (result: AddbookmarkMutation, args, cache) => {
            if (result.addBookmark) {
              cache.updateQuery(
                {
                  query: BOOKMARKS_QUERY,
                },
                (data: AllBookmarksQuery | null) => {
                  if (data?.bookmarks && result.addBookmark) {
                    data.bookmarks.push(result.addBookmark);
                  }
                  return data;
                },
              );
            }
          },
          removeBookmark: (result: RemoveBookmarkMutation, args, cache) => {
            let storyId: string;
            if (result.removeBookmark) {
              cache.updateQuery(
                {
                  query: BOOKMARKS_QUERY,
                },
                (data: AllBookmarksQuery | null) => {
                  if (data?.bookmarks) {
                    storyId = data.bookmarks.find(
                      item => item.id === args.bookmarkId,
                    )?.story.id as string;
                    data.bookmarks = data.bookmarks.filter(
                      item => item.id !== args.bookmarkId,
                    );
                  }
                  if (storyId) {
                    const fragment = gql`
                      fragment _ on Story {
                        id
                        bookmarkId
                      }
                    `;
                    cache.writeFragment(fragment, {
                      id: storyId,
                      bookmarkId: null,
                    });
                  }
                  return data;
                },
              );
            }
          },
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
