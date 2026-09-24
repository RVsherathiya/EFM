import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/app/theme/themeProvider';
import { DashboardPage } from '../src/features/dashboard/pages/DashboardPage';

describe('DashboardPage Component', () => {
  it('renders welcome header and key metric cards', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <DashboardPage />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome to Employee Feedback Portal')).toBeInTheDocument();
    expect(screen.getByText('Active Cycle')).toBeInTheDocument();
    expect(screen.getByText('Logged Hours (This Month)')).toBeInTheDocument();
  });
});
