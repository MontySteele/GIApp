import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
  describe('Card component', () => {
    it('renders children correctly', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      render(<Card>Content</Card>);
      expect(screen.getByText('Content').tagName).toBe('DIV');
    });

    it('applies base classes', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-slate-800');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-slate-700');
      expect(card).toHaveClass('rounded-lg');
    });

    it('merges custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-slate-800');
    });

    it('passes through HTML attributes', () => {
      render(
        <Card data-testid="card" title="My Card">
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveAttribute('title', 'My Card');
    });
  });

  describe('CardHeader component', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header Title</CardHeader>);
      expect(screen.getByText('Header Title')).toBeInTheDocument();
    });

    it('applies header classes', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('px-6');
      expect(header).toHaveClass('py-4');
      expect(header).toHaveClass('border-b');
      expect(header).toHaveClass('border-slate-700');
    });

    it('merges custom className', () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          Header
        </CardHeader>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('px-6');
    });
  });

  describe('CardContent component', () => {
    it('renders children correctly', () => {
      render(<CardContent>Body Content</CardContent>);
      expect(screen.getByText('Body Content')).toBeInTheDocument();
    });

    it('applies content classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('px-6');
      expect(content).toHaveClass('py-4');
    });

    it('does not have border classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).not.toHaveClass('border-b');
      expect(content).not.toHaveClass('border-t');
    });

    it('merges custom className', () => {
      render(
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter component', () => {
    it('renders children correctly', () => {
      render(<CardFooter>Footer Actions</CardFooter>);
      expect(screen.getByText('Footer Actions')).toBeInTheDocument();
    });

    it('applies footer classes with top border', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('px-6');
      expect(footer).toHaveClass('py-4');
      expect(footer).toHaveClass('border-t');
      expect(footer).toHaveClass('border-slate-700');
    });

    it('merges custom className', () => {
      render(
        <CardFooter className="custom-footer" data-testid="footer">
          Footer
        </CardFooter>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('border-t');
    });
  });

  describe('composed Card', () => {
    it('renders full card structure', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <h2>Title</h2>
          </CardHeader>
          <CardContent data-testid="content">
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter data-testid="footer">
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('Card can contain just content without header/footer', () => {
      render(
        <Card data-testid="card">
          <CardContent>Simple Content</CardContent>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Simple Content')).toBeInTheDocument();
    });
  });
});
