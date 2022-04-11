import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { gql, useQuery } from 'urql';
import { Story } from '../components/Story';
import { StorySummaryFields } from '../graphql/fragments';
import {
  AllBookmarksQuery,
  AllBookmarksQueryVariables,
} from '../graphql/__generated__/operationTypes';

export const BOOKMARKS_QUERY = gql`
  query AllBookmarks {
    bookmarks {
      id
      story {
        ...StorySummaryFields
      }
    }
  }

  ${StorySummaryFields}
`;

export const BookmarksScreen = () => {
  const [{ data, error, fetching }, refetch] = useQuery<
    AllBookmarksQuery,
    AllBookmarksQueryVariables
  >({ query: BOOKMARKS_QUERY });

  const [isRefetching, setIsRefetching] = React.useState(false);

  const handleRefetch = React.useCallback(() => {
    setIsRefetching(true);
    refetch({ requestPolicy: 'network-only' });
  }, [refetch]);

  React.useEffect(() => {
    if (!fetching) {
      setIsRefetching(false);
    }
  }, [fetching]);

  if (fetching) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="grey" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Something went wrong {error.message}</Text>
      </View>
    );
  }

  if (!data?.bookmarks) {
    return (
      <View style={styles.container}>
        <Text>No bookmarks found</Text>
      </View>
    );
  }

  return (
    <FlatList
      refreshing={isRefetching}
      onRefresh={handleRefetch}
      contentContainerStyle={styles.flatListContainer}
      style={styles.flatList}
      data={data.bookmarks}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => <Story item={item.story} cta="remove" />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    paddingHorizontal: 20,
  },
  flatListContainer: {
    paddingTop: 100,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  summary: {
    fontSize: 18,
    color: 'grey',
  },
  separator: {
    height: 1,
    backgroundColor: 'black',
    marginVertical: 40,
  },
});
