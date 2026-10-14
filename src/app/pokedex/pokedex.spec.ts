import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon, PokemonListItem } from '../interfaces/pokemon';
import { Pokedex } from './pokedex';

const API = 'https://pokeapi.co/api/v2';

/** Catálogo de prueba: 25 pokémon para forzar dos páginas. */
const CATALOG: PokemonListItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name:
    i === 0
      ? 'bulbasaur'
      : i === 1
        ? 'charmander'
        : i === 2
          ? 'charizard'
          : i === 3
            ? 'squirtle'
            : `poke-${String(i + 1).padStart(2, '0')}`,
}));

const TYPE_RESULTS = [
  { name: 'fire', url: `${API}/type/10/` },
  { name: 'water', url: `${API}/type/11/` },
  { name: 'grass', url: `${API}/type/12/` },
];

/** Respuesta cruda de la API (usa `url`, no `id`). */
const API_CATALOG = CATALOG.map((p) => ({ name: p.name, url: `${API}/pokemon/${p.id}/` }));

function detail(name: string, id: number, types: string[] = ['normal']): Pokemon {
  return {
    id,
    name,
    height: 10,
    weight: 100,
    base_experience: 64,
    types: types.map((t, i) => ({ slot: i + 1, type: { name: t, url: '' } })),
    stats: [{ base_stat: 45, stat: { name: 'hp', url: '' } }],
    abilities: [{ ability: { name: 'overgrow', url: '' }, is_hidden: false }],
    sprites: { front_default: null },
  };
}

describe('Pokedex', () => {
  let fixture: ComponentFixture<Pokedex>;
  let component: Pokedex;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pokedex],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Pokedex);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flushCatalog(): void {
    httpMock.expectOne(`${API}/pokemon?limit=2000`).flush({ results: API_CATALOG });
    httpMock.expectOne(`${API}/type`).flush({ results: TYPE_RESULTS });
  }

  function flushDetails(names: string[]): void {
    for (const name of names) {
      const id = CATALOG.find((p) => p.name === name)?.id ?? 1;
      httpMock.expectOne(`${API}/pokemon/${name}`).flush(detail(name, id));
    }
  }

  /** Carga inicial: catálogo + detalles de la primera página. */
  function setupCatalog(): void {
    fixture.detectChanges(); // ngOnInit → peticiones de catálogo
    flushCatalog(); // al llegar la lista → loadPage → peticiones de detalles
    flushDetails(CATALOG.slice(0, 20).map((p) => p.name));
    fixture.detectChanges(); // renderiza la cuadrícula
  }

  function typeSearch(value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '.search',
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('carga el catálogo y renderiza la primera página', () => {
    setupCatalog();
    expect(component['filtered']().length).toBe(25);
    expect(component['pageDetails']().length).toBe(20);
    expect(component['totalPages']()).toBe(2);
    expect(component['loading']()).toBe(false);
  });

  it('filtra por nombre con debounce', async () => {
    setupCatalog();
    typeSearch('char');
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(component['filtered']().map((p) => p.name)).toEqual([
      'charmander',
      'charizard',
    ]);
    // Los detalles ya estaban en caché: no se hicieron peticiones nuevas.
    expect(component['pageDetails']().map((p) => p.name)).toEqual([
      'charmander',
      'charizard',
    ]);
  });

  it('filtra también por número', async () => {
    setupCatalog();
    typeSearch('25');
    await new Promise((resolve) => setTimeout(resolve, 350));
    // poke-25 está en la página 2: no está en caché, hay que pedirlo.
    flushDetails(['poke-25']);
    expect(component['filtered']().map((p) => p.name)).toEqual(['poke-25']);
  });

  it('filtra por tipo y cachea el conjunto del tipo', () => {
    setupCatalog();
    component.toggleType('fire');
    httpMock
      .expectOne(`${API}/type/fire`)
      .flush({
        pokemon: ['charmander', 'charizard'].map((name) => ({
          pokemon: { name, url: `${API}/pokemon/${name}/` },
        })),
      });
    expect(component['filtered']().map((p) => p.name)).toEqual([
      'charmander',
      'charizard',
    ]);

    // Deseleccionar y volver a seleccionar no repite la petición (caché).
    component.toggleType('fire');
    component.toggleType('fire');
    httpMock.expectNone(`${API}/type/fire`);
    expect(component['filtered']().map((p) => p.name)).toEqual([
      'charmander',
      'charizard',
    ]);
  });

  it('intersecta tipos con lógica AND', () => {
    setupCatalog();
    component.toggleType('fire');
    httpMock
      .expectOne(`${API}/type/fire`)
      .flush({
        pokemon: ['charmander', 'charizard'].map((name) => ({
          pokemon: { name, url: `${API}/pokemon/${name}/` },
        })),
      });
    component.toggleType('water');
    httpMock
      .expectOne(`${API}/type/water`)
      .flush({
        pokemon: [{ pokemon: { name: 'squirtle', url: `${API}/pokemon/squirtle/` } }],
      });
    // Ningún pokémon es fuego Y agua a la vez.
    expect(component['filtered']()).toEqual([]);
    expect(component['pageDetails']()).toEqual([]);
  });

  it('pagina con los botones siguiente/anterior', () => {
    setupCatalog();
    component.nextPage();
    flushDetails(CATALOG.slice(20).map((p) => p.name));
    expect(component['page']()).toBe(2);
    expect(component['pageDetails']().length).toBe(5);

    // No avanza más allá de la última página.
    component.nextPage();
    expect(component['page']()).toBe(2);

    component.prevPage();
    expect(component['page']()).toBe(1);
    expect(component['pageDetails']().length).toBe(20);

    // No retrocede antes de la primera página.
    component.prevPage();
    expect(component['page']()).toBe(1);
  });

  it('abre y cierra el modal de detalle', () => {
    setupCatalog();
    const bulbasaur = detail('bulbasaur', 1);
    component.openDetail(bulbasaur);
    expect(component['selectedPokemon']()).toBe(bulbasaur);
    component.closeDetail();
    expect(component['selectedPokemon']()).toBeNull();
  });
});
