import { describe, it, expect } from 'vitest';
import notificationReducer, {
  addNotification,
  removeNotification,
  clearNotifications,
  showSuccess,
  showError,
} from './notificationSlice';

describe('notificationSlice', () => {
  const initialState = {
    notifications: [],
  };

  it('should return initial state', () => {
    expect(notificationReducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  it('should handle addNotification', () => {
    const notification = { title: 'Test', type: 'info' as const };
    const state = notificationReducer(
      initialState,
      addNotification(notification)
    );
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.notifications[0].id).toBeDefined();
  });

  it('should handle removeNotification', () => {
    const stateWithNotifications = {
      notifications: [{ id: '1', title: 'Test', type: 'info' as const }],
    };
    const state = notificationReducer(
      stateWithNotifications,
      removeNotification('1')
    );
    expect(state.notifications).toHaveLength(0);
  });

  it('should handle clearNotifications', () => {
    const stateWithNotifications = {
      notifications: [
        { id: '1', title: '1', type: 'info' as const },
        { id: '2', title: '2', type: 'info' as const },
      ],
    };
    const state = notificationReducer(
      stateWithNotifications,
      clearNotifications()
    );
    expect(state.notifications).toHaveLength(0);
  });

  it('helper action creators should create correct actions', () => {
    const successAction = showSuccess('Success Title', 'Success Desc');
    expect(successAction.payload).toMatchObject({
      type: 'success',
      title: 'Success Title',
      description: 'Success Desc',
    });

    const errorAction = showError('Error Title', 'Error Desc', 5000, 'Network');
    expect(errorAction.payload).toMatchObject({
      type: 'error',
      title: 'Error Title',
      description: 'Error Desc',
      duration: 5000,
      category: 'Network',
    });
  });
});
