// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { fr } from '@/i18n/fr';
import { NumPad } from './NumPad';

function Harness({ onSubmit, disabled = false }: { onSubmit: (v: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <>
      <output data-testid="value">{value}</output>
      <NumPad value={value} onChange={setValue} onSubmit={() => onSubmit(value)} disabled={disabled} />
    </>
  );
}

describe('NumPad', () => {
  it('saisit, efface et valide au toucher', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: fr.numpad.submit })).toBeDisabled();
    for (const d of ['1', '5', '7']) await user.click(screen.getByRole('button', { name: d }));
    await user.click(screen.getByRole('button', { name: fr.numpad.erase }));
    await user.click(screen.getByRole('button', { name: fr.numpad.submit }));
    expect(onSubmit).toHaveBeenCalledWith('15');
  });

  it('se pilote au clavier et limite à 3 chiffres', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.keyboard('01234{Backspace}{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('12');
  });

  it('ignore la saisie quand il est désactivé', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} disabled />);
    await userEvent.setup().keyboard('5{Enter}');
    expect(screen.getByTestId('value')).toHaveTextContent('');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
