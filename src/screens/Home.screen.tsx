import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { gql, useQuery } from 'urql';
import {
  AllStoriesQuery,
  AllStoriesQueryVariables,
} from '../graphql/__generated__/operationTypes';
import { StorySummaryFields } from '../graphql/fragments';
import { Story } from '../components/Story';

const STORIES_QUERY = gql`
  query AllStories {
    stories {
      ...StorySummaryFields
    }
  }

  ${StorySummaryFields}
`;

export const HomeScreen = () => {
  const [{ data, error, fetching }] = useQuery<
    AllStoriesQuery,
    AllStoriesQueryVariables
  >({ query: STORIES_QUERY });

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

  return (
    <FlatList
      contentContainerStyle={styles.flatListContainer}
      style={styles.flatList}
      data={data?.stories}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => <Story item={item} />}
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
    paddingVertical: 20,
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
