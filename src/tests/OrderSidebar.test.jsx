import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrderSidebar } from '../components/organisms/OrderSidebar.tsx';

describe('OrderSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('exibe a marca Lanchonete Pimentinha no cabeçalho da sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/pdv']}>
        <OrderSidebar
          tables={[]}
          activeTableId={null}
          onSelectTable={() => {}}
          onNewTable={() => {}}
          onOpenReports={() => {}}
          onOpenSettings={() => {}}
          onLogout={() => {}}
          onDeleteTable={() => {}}
          ifoodConnected={false}
          ifoodUnreadCount={0}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('LANCHONETE PIMENTINHA')).toBeInTheDocument();
  });
});
