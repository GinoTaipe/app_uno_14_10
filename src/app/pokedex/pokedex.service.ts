import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay } from 'rxjs';
import {
  NamedApiResource,
  Pokemon,
  PokemonListItem,
  PokemonTypeItem,
} from '../interfaces/pokemon';

const API = 'https://pokeapi.co/api/v2';

/** Tipos que no interesan filtrar (solo existen en datos internos/formas especiales). */
const HIDDEN_TYPES = new Set(['unknown', 'shadow', 'stellar']);

/**
 * Acceso a la PokeAPI con caché en memoria por sesión.
 * La lista completa de nombres se pide una sola vez; los detalles solo se
 * piden por pokémon (con caché) para no descargar los 1000+ de una vez.
 */
@Injectable({ providedIn: 'root' })
export class PokedexService {
  private readonly http = inject(HttpClient);

  private readonly list$ = this.loadList().pipe(shareReplay(1));
  private readonly types$ = this.loadTypes().pipe(shareReplay(1));
  private readonly typeCache = new Map<string, Observable<Set<string>>>();
  private readonly detailCache = new Map<string, Observable<Pokemon>>();

  /** Lista completa de nombres+ids (una sola petición, cacheada). */
  getPokemonList(): Observable<PokemonListItem[]> {
    return this.list$;
  }

  /** Tipos filtrables (sin unknown/shadow/stellar). */
  getTypes(): Observable<PokemonTypeItem[]> {
    return this.types$;
  }

  /** Conjunto de nombres de pokémon de un tipo; cacheado por tipo. */
  getPokemonNamesByType(type: string): Observable<Set<string>> {
    let cached = this.typeCache.get(type);
    if (!cached) {
      cached = this.http
        .get<{ pokemon: Array<{ pokemon: NamedApiResource }> }>(
          `${API}/type/${type}`,
        )
        .pipe(
          map((res) => new Set(res.pokemon.map((p) => p.pokemon.name))),
          shareReplay(1),
        );
      this.typeCache.set(type, cached);
    }
    return cached;
  }

  /** Detalle de un pokémon; cacheado por nombre. */
  getPokemon(name: string): Observable<Pokemon> {
    let cached = this.detailCache.get(name);
    if (!cached) {
      cached = this.http
        .get<Pokemon>(`${API}/pokemon/${name}`)
        .pipe(shareReplay(1));
      this.detailCache.set(name, cached);
    }
    return cached;
  }

  /** Detalles de una página de nombres, en el mismo orden. */
  getPokemonPage(names: string[]): Observable<Pokemon[]> {
    if (names.length === 0) {
      return of([]);
    }
    return forkJoin(names.map((name) => this.getPokemon(name)));
  }

  private loadList(): Observable<PokemonListItem[]> {
    return this.http
      .get<{ results: NamedApiResource[] }>(`${API}/pokemon?limit=2000`)
      .pipe(
        map((res) =>
          res.results.map((r) => ({ name: r.name, id: this.idFromUrl(r.url) })),
        ),
      );
  }

  private loadTypes(): Observable<PokemonTypeItem[]> {
    return this.http
      .get<{ results: NamedApiResource[] }>(`${API}/type`)
      .pipe(
        map((res) =>
          res.results
            .filter((r) => !HIDDEN_TYPES.has(r.name))
            .map((r) => ({ name: r.name, id: this.idFromUrl(r.url) })),
        ),
      );
  }

  private idFromUrl(url: string): number {
    const segments = url.split('/').filter(Boolean);
    return Number(segments[segments.length - 1]);
  }
}
