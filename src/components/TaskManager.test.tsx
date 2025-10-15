import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskManager from './TaskManager';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';

// Mock the sonner library
vi.mock('sonner', async (importOriginal) => {
    const actual = await importOriginal<typeof import('sonner')>();
    return {
        ...actual,
        toast: {
            success: vi.fn(),
            error: vi.fn(),
        },
    };
});

const TestHost = () => {
    const [showDialog, setShowDialog] = useState(false);
    return (
        <>
            <TaskManager
                showAddDialog={showDialog}
                onShowAddDialogChange={setShowDialog}
                activeTab="tasks"
            />
            <Toaster />
        </>
    )
}

describe('TaskManager', () => {
  it('shows "Task restored!" message when a completed task is marked as incomplete', () => {
    render(<TestHost />);

    // Click the "Add Task" button to open the dialog
    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    // The dialog should now be visible.
    const dialog = screen.getByRole('dialog', { name: 'Add New Task' });

    const titleInput = within(dialog).getByLabelText(/title/i);
    const submitButton = within(dialog).getByRole('button', { name: /add task/i });

    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    fireEvent.click(submitButton);

    // The dialog should close, and the task should be on the screen.
    expect(screen.getByText('Test Task')).toBeInTheDocument();

    // Mark the task as complete
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(toast.success).toHaveBeenCalledWith('Task completed! 🎉');

    // Mark the task as incomplete again
    fireEvent.click(checkbox);

    // Check for the "Task restored!" message
    expect(toast.success).toHaveBeenCalledWith('Task restored!');
  });
});