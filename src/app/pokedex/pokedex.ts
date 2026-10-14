import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Pokemon, PokemonListItem, PokemonTypeItem } from '../interfaces/pokemon';
import { PokemonCard } from '../pokemon-card/pokemon-card';
import { PokemonModal } from '../pokemon-modal/pokemon-modal';
import { PokedexService } from './pokedex.service';

const PAGE_SIZE = 20;

/** Pokédex: búsqueda por nombre/número, filtro por tipo y paginación. */
@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.css',
  imports: [PokemonCard, PokemonModal],
})
export class Pokedex implements OnInit {
  private readonly dex = inject(PokedexService);
  private readonly search$ = new Subject<string>();
  private loadedNames: string[] = [];

  protected readonly searchTerm = signal('');
  protected readonly selectedTypes = signal<string[]>([]);
  protected readonly page = signal(1);

  protected readonly allPokemon = signal<PokemonListItem[]>([]);
  protected readonly availableTypes = signal<PokemonTypeItem[]>([]);
  private readonly typeSets = signal<Map<string, Set<string>>>(new Map());

  protected readonly pageDetails = signal<Pokemon[]>([]);
  protected readonly loading = signal(true);
  protected readonly pageLoading = signal(false);
  protected readonly selectedPokemon = signal<Pokemon | null>(null);

  /** Lista completa filtrada por nombre/número y tipos seleccionados (AND). */
  protected readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    let list = this.allPokemon();
    if (term) {
      list = /^\d+$/.test(term)
        ? list.filter((p) => String(p.id).includes(term))
        : list.filter((p) => p.name.includes(term));
    }
    const types = this.selectedTypes();
    if (types.length > 0) {
      const sets = this.typeSets();
      list = list.filter((p) => types.every((t) => sets.get(t)?.has(p.name)));
    }
    return list;
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(1);
        this.loadPage(this.pageItems().map((p) => p.name));
      });
  }

  ngOnInit(): void {
    this.dex.getPokemonList().subscribe({
      next: (list) => {
        this.allPokemon.set(list);
        this.loading.set(false);
        this.loadPage(this.pageItems().map((p) => p.name));
      },
      error: () => this.loading.set(false),
    });
    this.dex.getTypes().subscribe((types) => this.availableTypes.set(types));
  }

  onSearchInput(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  toggleType(type: string): void {
    const selected = this.selectedTypes();
    this.selectedTypes.set(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type],
    );
    this.page.set(1);
    this.ensureTypeSet(type).subscribe(() => {
      this.loadPage(this.pageItems().map((p) => p.name));
    });
  }

  clearFilters(): void {
    this.search$.next('');
    this.searchTerm.set('');
    this.selectedTypes.set([]);
    this.page.set(1);
    this.loadPage(this.pageItems().map((p) => p.name));
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadPage(this.pageItems().map((p) => p.name));
    }
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadPage(this.pageItems().map((p) => p.name));
    }
  }

  openDetail(pokemon: Pokemon): void {
    this.selectedPokemon.set(pokemon);
  }

  closeDetail(): void {
    this.selectedPokemon.set(null);
  }

  private ensureTypeSet(type: string) {
    const existing = this.typeSets().get(type);
    if (existing) {
      return of(existing);
    }
    return this.dex.getPokemonNamesByType(type).pipe(
      tap((names) => this.typeSets.update((m) => new Map(m).set(type, names))),
    );
  }

  private loadPage(names: string[]): void {
    if (names.join(',') === this.loadedNames.join(',')) {
      return;
    }
    this.loadedNames = names;
    if (names.length === 0) {
      this.pageDetails.set([]);
      return;
    }
    this.pageLoading.set(true);
    this.dex.getPokemonPage(names).subscribe({
      next: (pokemons) => {
        this.pageDetails.set(pokemons);
        this.pageLoading.set(false);
      },
      error: () => this.pageLoading.set(false),
    });
  }
}
