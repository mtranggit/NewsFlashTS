import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { gql, useMutation } from 'urql';
import { StorySummaryFields } from '../graphql/fragments';
import {
  AddBookmarkMutation,
  AddBookmarkMutationVariables,
  RemoveBookmarkMutation,
  RemoveBookmarkMutationVariables,
  StorySummaryFieldsFragment,
} from '../graphql/__generated__/operationTypes';
import { RootStackParamList } from '../types';

const ADD_BOOKMARK_MUTATION = gql`
  mutation AddBookmark($storyId: ID!) {
    addBookmark(storyId: $storyId) {
      id
      story {
        ...StorySummaryFields
      }
    }
  }
  ${StorySummaryFields}
`;

const REMOVE_BOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId)
  }
`;

export const Story: React.FC<{
  item: StorySummaryFieldsFragment;
  cta: 'add' | 'remove';
}> = ({ item, cta }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [{ fetching: isAddingBookmark }, addBookmark] = useMutation<
    AddBookmarkMutation,
    AddBookmarkMutationVariables
  >(ADD_BOOKMARK_MUTATION);

  const [{ fetching: isRemovingBookmark }, removeBookmark] = useMutation<
    RemoveBookmarkMutation,
    RemoveBookmarkMutationVariables
  >(REMOVE_BOOKMARK_MUTATION);

  const handleAddBookmark = React.useCallback(async () => {
    const result = await addBookmark({ storyId: item.id });
    if (result?.error?.message.includes('You are offline!')) {
      Alert.alert(
        'You are offline!',
        'Please check your data connection before adding this story to your bookmark.',
      );
    }
  }, [addBookmark, item.id]);

  const handleRemoveBookmark = React.useCallback(async () => {
    const result = await removeBookmark({ bookmarkId: item.bookmarkId! });
    if (result?.error?.message.includes('You are offline!')) {
      Alert.alert(
        'You are offline!',
        'Please check your data connection before removing this story from your bookmark.',
      );
    }
  }, [removeBookmark, item.bookmarkId]);
  return (
    <Pressable
      onPress={() =>
        navigation.navigate('StoryDetailsModal', {
          id: item.id,
          title: item.title,
        })
      }>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.title} {item.bookmarkId ? '🔖' : ''}
        </Text>
        {!item.bookmarkId && !isAddingBookmark && cta === 'add' ? (
          <Pressable onPress={handleAddBookmark}>
            <Text>Add Bookmark</Text>
          </Pressable>
        ) : item.bookmarkId && !isRemovingBookmark && cta === 'remove' ? (
          <Pressable onPress={handleRemoveBookmark}>
            <Text>Remove Bookmark</Text>
          </Pressable>
        ) : null}
        {(isAddingBookmark || isRemovingBookmark) && <ActivityIndicator />}
      </View>
      <Text style={styles.summary}>{item.summary}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  summary: {
    fontSize: 18,
    color: 'grey',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
