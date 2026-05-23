/** @vitest-environment jsdom */
import { vi, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPanel from '../AdminPanel';
import Calculator from '../Calculator';
import { addDoc } from 'firebase/firestore';


vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({})) }));

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getAuth: vi.fn(() => ({})),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'cat-123' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
}));

// Minimal props for AdminPanel used in tests
const adminProps = {
  allUsers: [{ id: 'u1', email: 'admin@example.com' }],
  categories: [],
  ads: [],
  allRecipes: [],
  updatePlayerPl: vi.fn(),
  updatePlayer: vi.fn(),
  setActiveTab: vi.fn(),
  setAdminSubTab: vi.fn(),
};

test('AdminPanel can add a new category', async () => {
  render(<AdminPanel {...adminProps} />);
  const input = screen.getByPlaceholderText(/Nazwa kategorii/i);
  const addBtn = screen.getByRole('button', { name: /Dodaj/i });
  fireEvent.change(input, { target: { value: 'Kiełbasy' } });
  fireEvent.click(addBtn);
  await waitFor(() => expect(addDoc).toHaveBeenCalledWith(expect.anything(), { name: 'Kiełbasy' }));
});

test('Calculator shows delete button for owned recipe and calls onDeleteRecipe', () => {
  const mockDelete = vi.fn();
  const recipe = { id: 'r1', name: 'Testowy przepis', ownerId: 'u1' };
  render(
    <Calculator
      user={{ uid: 'u1' }}
      userProfile={{ isAdmin: false }}
      recipe={recipe}
      totalTarget={0}
      setTotalTarget={vi.fn()}
      onBack={vi.fn()}
      onEditRecipe={vi.fn()}
      onDeleteRecipe={mockDelete}
    />
  );
  const deleteBtn = screen.getByRole('button', { name: /Usuń/i });
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
  expect(mockDelete).toHaveBeenCalledWith(recipe);
});
