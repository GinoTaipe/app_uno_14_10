import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon } from '../interfaces/pokemon';
import { PokemonModal } from './pokemon-modal';

const CHARMANDER: Pokemon = {
  id: 4,
  name: 'charmander',
  height: 6,
  weight: 85,
  base_experience: 62,
  types: [{ slot: 1, type: { name: 'fire', url: '' } }],
  stats: [
    { base_stat: 39, stat: { name: 'hp', url: '' } },
    { base_stat: 52, stat: { name: 'attack', url: '' } },
  ],
  abilities: [
    { ability: { name: 'blaze', url: '' }, is_hidden: false },
    { ability: { name: 'solar-power', url: '' }, is_hidden: true },
  ],
  sprites: { front_default: 'https://example.com/charmander.png' },
};

describe('PokemonModal', () => {
  let fixture: ComponentFixture<PokemonModal>;
  let component: PokemonModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonModal],
    }).compileComponents();
    fixture = TestBed.createComponent(PokemonModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pokemon', CHARMANDER);
    fixture.detectChanges();
  });

  it('renderiza nombre, medidas y estadísticas', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Charmander');
    expect(compiled.textContent).toContain('0.6 m');
    expect(compiled.textContent).toContain('8.5 kg');
    expect(compiled.querySelectorAll('.stats li').length).toBe(2);
    expect(compiled.textContent).toContain('PS');
    expect(compiled.textContent).toContain('oculta');
  });

  it('emite close al hacer clic en el botón cerrar', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    (fixture.nativeElement as HTMLElement).querySelector('.close')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(closed).toBe(true);
  });

  it('emite close con la tecla Escape', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(true);
  });
});
