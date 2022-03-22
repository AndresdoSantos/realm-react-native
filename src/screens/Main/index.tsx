/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList} from 'react-native';
import type {ListRenderItemInfo} from 'react-native';
import {Keyboard} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {Repository} from '../../components/Repository';
import {api} from '../../services/api';
import {getRealm} from '../../services/realm';

import {Container, Form, Input, Submit, Title} from './styles';

interface IRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
}

interface IFetchedRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
}

export function Main() {
  const [repoInput, setRepoInput] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<IRepo[]>([]);

  useEffect(() => {
    async function loadRepositories() {
      const realm = await getRealm();

      // true ordena de forma descrescente.
      const data = realm.objects('Repository').sorted('stars', true);

      setRepositories(data as any);
    }

    loadRepositories();
  }, []);

  async function saveRepository(repository: IFetchedRepository) {
    const data = {
      id: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      description: repository.description,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
    };

    const realm = await getRealm();

    // Usa para tudo, adição, remoção, update e delete .write
    realm.write(() => {
      realm.create('Repository', {...data}, 'modified');
    });

    return data;
  }

  async function handleAddRepository() {
    try {
      setLoading(true);

      const {data} = await api.get<IFetchedRepository>(`/repos/${repoInput}`);

      await saveRepository(data);

      setLoading(false);

      setRepoInput('');

      setError(false);

      Keyboard.dismiss();
    } catch (err) {
      setError(true);

      setLoading(false);
    }
  }

  async function handleRefreshRepository(repository: IRepo) {
    const response = await api.get(`/repos/${repository.fullName}`);

    console.log('repo', response.data.stargazers_count);

    const data = await saveRepository(response.data);

    setRepositories(
      repositories.map(repo => (repo.id === data.id ? data : repo)),
    );
  }

  return (
    <Container>
      <Title>Repositórios</Title>

      <Form>
        <Input
          error={error}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Procurar repositório"
          onChangeText={setRepoInput}
          value={repoInput}
        />

        <Submit onPress={handleAddRepository}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Icon name="add" size={22} color="#fff" />
          )}
        </Submit>
      </Form>

      <FlatList
        data={repositories}
        keyExtractor={(item: IRepo) => `${item.id}`}
        renderItem={({item}: ListRenderItemInfo<IRepo>) => (
          <Repository
            data={item}
            onRefresh={() => handleRefreshRepository(item)}
          />
        )}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{marginTop: 20}}
        contentContainerStyle={{paddingHorizontal: 20}}
      />
    </Container>
  );
}
