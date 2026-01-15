import { describe, it, expect } from 'vitest';
import chatSearchReducer, {
  setSearchOpen,
  setSearchQuery,
  setFilteredChats,
} from './chatSearchSlice';

describe('chatSearchSlice', () => {
  const initialState = {
    searchOpen: false,
    searchQuery: '',
    filteredChats: [],
  };

  it('should handle setSearchOpen', () => {
    const state = chatSearchReducer(initialState, setSearchOpen(true));
    expect(state.searchOpen).toBe(true);

    const stateClosed = chatSearchReducer(
      { ...initialState, searchOpen: true, searchQuery: 'test' },
      setSearchOpen(false)
    );
    expect(stateClosed.searchOpen).toBe(false);
    expect(stateClosed.searchQuery).toBe('');
  });

  it('should handle setSearchQuery', () => {
    const state = chatSearchReducer(initialState, setSearchQuery('prompt'));
    expect(state.searchQuery).toBe('prompt');
  });

  it('should handle setFilteredChats', () => {
    const chats = [{ id: '1', title: 'Result', timestamp: 123 }];
    const state = chatSearchReducer(initialState, setFilteredChats(chats));
    expect(state.filteredChats).toEqual(chats);
  });
});
