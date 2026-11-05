import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChangelogModal from '../components/organisms/ChangelogModal.tsx';

describe('ChangelogModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renderiza notas de release com classe text-secondary (contraste legível)', () => {
    // Forçar o modal a abrir: last seen diferente da versão atual
    localStorage.setItem('acai-last-seen-version', '0.0.0');
    localStorage.setItem('acai-release-notes', 'Notas de exemplo da versão');

    render(<ChangelogModal />);

    // Título do modal deve aparecer
    expect(screen.getByText(/Novidades da versão/)).toBeInTheDocument();

    // O corpo das notas deve usar text-secondary (contraste legível), não text-muted
    const notesContainer = screen.getByText(/Notas de exemplo da versão/);
    expect(notesContainer).toBeInTheDocument();

    // Verificar que o div das notas tem a classe text-secondary
    const notesDiv = notesContainer.closest('div');
    expect(notesDiv).toHaveClass('text-secondary');
    expect(notesDiv).not.toHaveClass('text-muted');
  });
});
