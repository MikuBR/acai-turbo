import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionIndicator } from '../components/atoms/ConnectionIndicator';

describe('ConnectionIndicator', () => {
  it('renders online status with Wifi icon', () => {
    const { container } = render(<ConnectionIndicator isOnline={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders offline status with WifiOff icon', () => {
    const { container } = render(<ConnectionIndicator isOnline={false} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows pending count badge when offline with pending orders', () => {
    render(<ConnectionIndicator isOnline={false} pendingCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ badge when pending count exceeds 9', () => {
    render(<ConnectionIndicator isOnline={false} pendingCount={15} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('does not show pending count when online', () => {
    render(<ConnectionIndicator isOnline={true} pendingCount={5} />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('does not show pending count when offline with 0 pending', () => {
    render(<ConnectionIndicator isOnline={false} pendingCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('has correct title for online state', () => {
    render(<ConnectionIndicator isOnline={true} />);
    expect(screen.getByTitle('Conectado')).toBeInTheDocument();
  });

  it('has correct title for offline state', () => {
    render(<ConnectionIndicator isOnline={false} />);
    expect(screen.getByTitle('Sem conexão — pedidos serão salvos localmente')).toBeInTheDocument();
  });
});
