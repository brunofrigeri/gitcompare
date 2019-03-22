import React from 'react';
import moment from 'moment';

import logo from '../../assets/logo.png';
import api from '../../services/api';

import { Container, Form } from './styles';

import CompareList from '../../components/CompareList';

export default class Main extends React.Component {
  state = {
    loading: false,
    repositories: [],
    repositoryInput: '',
    repositoryError: false,
  };

  async componentDidMount() {
    this.setState({ loading: true });
    this.setState({
      loading: false,
      repositories: await this.getLocalRepositories(),
    });
  }

  handleAddRepository = async (e) => {
    e.preventDefault();

    this.setState({ loading: true });

    const { repositoryInput, repositories } = this.state;

    try {
      const { data: repository } = await api.get(`./repos/${repositoryInput}`);
      repository.lastCommit = moment(repository.pushed_at).fromNow();

      const localRepositories = await this.getLocalRepositories();

      if (repositories.find(repo => repo.id === repository.id)) {
        this.setState({
          repositoryInput: '',
          repositories: [...repositories],
          repositoryError: true,
        });
      } else {
        this.setState({
          repositoryInput: '',
          repositories: [...repositories, repository],
          repositoryError: false,
        });

        await localStorage.setItem(
          'Key',
          JSON.stringify([...localRepositories, repository]),
        );
      }
    } catch (err) {
      this.setState({ repositoryError: true });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRemovedRepository = async (id) => {
    const { repositories } = this.state;
    const Repositories = repositories.filter(repo => repo.id !== id);

    this.setState({
      repositories: [...Repositories],
    });

    await localStorage.setItem('Key', JSON.stringify([...Repositories]));
  };

  handleUpdatedRepository = async (id) => {
    const { repositories } = this.state;

    const repositoryToUpdate = repositories.find(repo => repo.id === id);

    try {
      const { data } = await api.get(`./repos/${repositoryToUpdate.full_name}`);
      data.lastCommit = moment(data.pushed_at).fromNow();

      const repos = repositories.map(repo => (repo.id === data.id ? data : repo),);

      this.setState({
        repositoryInput: '',
        repositoryError: false,
        repositories: repos,
      });

      await localStorage.setItem('Key', JSON.stringify(repos));
    } catch (err) {
      this.setState({
        repositoryError: true,
      });
    }
  };

  getLocalRepositories = async () => JSON.parse(await localStorage.getItem('Key')) || [];

  render() {
    const {
      repositoryInput,
      repositories,
      repositoryError,
      loading,
    } = this.state;
    return (
      <Container>
        <img src={logo} alt="GitHub Compare" />

        <Form withError={repositoryError} onSubmit={this.handleAddRepository}>
          <input
            type="text"
            placeholder="usuário/repositório"
            value={repositoryInput}
            onChange={e => this.setState({ repositoryInput: e.target.value })}
          />
          <button type="submit">
            {loading ? <i className="fa fa-spinner fa-pulse" /> : 'Enviar'}
          </button>
        </Form>
        <CompareList
          repositories={repositories}
          removeRepository={this.handleRemovedRepository}
          updatedRepository={this.handleUpdatedRepository}
        />
      </Container>
    );
  }
}
