import './style.css';
import useData from './useData';

export default function App() {
  const { data, error, loading } = useData<any>({
    url: 'https://swapi.dev/api/people/2',
    expiration: 60 * 24,
  });

  return (
    <div>
      <h1>Hello StackBlitz!</h1>
      {loading && <h2>...loading</h2>}
      {error && <h2>{error.message}</h2>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
