import './style.css';
import useData from './useData';

export default function App() {
  const { data, error, loading } = useData<any>({
    url: 'https://swapi.dev/api/people/2',
    expiration: 60 * 24,
    optimisticData: {
      "name": "C-3P",
      "height": "168",
      "mass": "75",
      "hair_color": "n/a",
      "skin_color": "red",
      "eye_color": "yellow",
      "birth_year": "112BBY",
      "gender": "n/a",
      "homeworld": "https://swapi.dev/api/planets/1/",
      "films": [
        "https://swapi.dev/api/films/1/",
        "https://swapi.dev/api/films/2/",
        "https://swapi.dev/api/films/3/",
        "https://swapi.dev/api/films/4/",
        "https://swapi.dev/api/films/5/",
        "https://swapi.dev/api/films/6/"
      ],
      "species": [
        "https://swapi.dev/api/species/2/"
      ],
      "vehicles": [],
      "starships": [],
      "created": "2014-12-10T15:10:51.357000Z",
      "edited": "2014-12-20T21:17:50.309000Z",
      "url": "https://swapi.dev/api/people/2/"
    }
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
