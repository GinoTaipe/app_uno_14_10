/** Recurso con nombre de la PokeAPI (ej: { name: 'pikachu', url: '...' }). */
export interface NamedApiResource {
  name: string;
  url: string;
}

/** Ítem de la lista de pokémon: nombre + id ya extraído de la URL. */
export interface PokemonListItem {
  name: string;
  id: number;
}

export interface PokemonTypeRef {
  slot: number;
  type: NamedApiResource;
}

export interface PokemonStat {
  base_stat: number;
  stat: NamedApiResource;
}

export interface PokemonAbility {
  ability: NamedApiResource;
  is_hidden: boolean;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
    };
  };
}

/** Detalle completo de un pokémon (GET /pokemon/{name|id}). */
export interface Pokemon {
  id: number;
  name: string;
  /** Altura en decímetros. */
  height: number;
  /** Peso en hectogramos. */
  weight: number;
  base_experience: number | null;
  types: PokemonTypeRef[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
}

/** Tipo de pokémon (GET /type). */
export interface PokemonTypeItem {
  name: string;
  id: number;
}
