import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StatusBar } from 'react-native';
import { offlineExchange } from '@urql/exchange-graphcache';
// import { cacheExchange } from '@urql/exchange-graphcache';
import {
  createClient,
  dedupExchange,
  Exchange,
  fetchExchange,
  gql,
  makeErrorResult,
  Provider as UrqlProvider,
} from 'urql';
import { RootNavigator } from './screens/Root.navigator';
import schema from './graphql/graphql.schema.json';
import {
  AddBookmarkMutation,
  AllBookmarksQuery,
  RemoveBookmarkMutation,
} from './graphql/__generated__/operationTypes';
import { BOOKMARKS_QUERY } from './screens/Bookmarks.screen';
import NetInfo from '@react-native-community/netinfo';
// import { useNetInfo } from '@react-native-community/netinfo';
// import { AppOfflinePage } from './components/AppOfflinePage';
import { AppOfflineMessage } from './components/AppOfflineMessage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { makeAsyncStorage } from '@urql/storage-rn';
import { share, pipe, filter, map, merge } from 'wonka';

/**
 * There are 3 levels of offline support:
 *
 * 0 - no support <-= everyone starts with this
 * 1 - blocking notification <-= we will add this
 * 2 - read-only offline support <-= we will add this
 * 3 - read-write offline support <-= not needed for most apps
 *
 */

let disconnect: any;

const offlineMutationExchange: () => Exchange = () => {
  let connected = true;

  if (disconnect) {
    disconnect();
    disconnect = undefined;
  }

  disconnect = NetInfo.addEventListener(state => {
    connected = state.isConnected === true;
  });

  return ({ forward }) => {
    return ops$ => {
      const shared = pipe(ops$, share);
      // split operation into 2 groups
      // mutations when app is offline
      const offlineMutations = pipe(
        shared,
        filter(op => op.kind === 'mutation' && !connected),
        map(op => makeErrorResult(op, new Error('You are offline!'))),
      );

      const rest = pipe(
        shared,
        filter(
          op => op.kind !== 'mutation' || (op.kind === 'mutation' && connected),
        ),
      );
      return merge([forward(rest), offlineMutations]);
      // return forward(ops$);
    };
  };
};
const storage = makeAsyncStorage({
  dataKey: 'my-app-data',
  metadataKey: 'my-app-meta-data',
  maxAge: 5, // 5 days
});

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange,
    offlineExchange({
      storage,
      schema: schema as any,
      resolvers: {
        Query: {
          story: (_, args) => ({ __typename: 'Story', id: args.id }),
        },
      },
      updates: {
        Mutation: {
          addBookmark: (result: AddBookmarkMutation, args, cache) => {
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
    offlineMutationExchange(),
    fetchExchange,
  ],
});

export const App = () => {
  const { isConnected } = NetInfo.useNetInfo();

  // if (isConnected === false) {
  //   return <AppOfflinePage />;
  // }

  console.log('isConnected', isConnected);

  return (
    <SafeAreaProvider>
      <UrqlProvider value={client}>
        <NavigationContainer>
          <StatusBar hidden />
          <RootNavigator />
        </NavigationContainer>
        {isConnected === false ? <AppOfflineMessage /> : null}
      </UrqlProvider>
    </SafeAreaProvider>
  );
};
