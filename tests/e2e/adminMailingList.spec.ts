import { expect, test } from '@playwright/test';

test.describe('Admin mailing list dashboard', () => {
  test('admin can unlock dashboard, remove a subscriber, and send an update', async ({ page }) => {
    const subscribers = [
      {
        id: 'sub-1',
        email: 'first@example.com',
        name: 'First Person',
        subscribedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
      },
      {
        id: 'sub-2',
        email: 'second@example.com',
        name: null,
        subscribedAt: new Date('2024-02-01T12:00:00Z').toISOString(),
      },
    ];

    await page.route('**/api/subscribers**', async route => {
      const method = route.request().method();
      const headers = route.request().headers();

      expect(headers['x-api-key']).toBe('test-admin-key');

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ subscribers }),
        });
        return;
      }

      if (method === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/updates', async route => {
      const headers = route.request().headers();
      expect(headers['x-api-key']).toBe('test-admin-key');

      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ recipientCount: 1, messageId: 'mock-message' }),
      });
    });

    await page.goto('/admin/mailing-list');

    await page.getByLabel('Admin API key').fill('test-admin-key');
    await page.getByRole('button', { name: 'Unlock dashboard' }).click();

    await expect(page.getByRole('heading', { name: 'Mailing list subscribers' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(page.getByText('Subscriber removed.')).toBeVisible();

    await page.getByLabel('Subject').fill('Studio update');
    await page.getByLabel('Plain text body').fill('We shipped a new series.');
    await page.getByRole('button', { name: 'Send update' }).click();

    await expect(page.getByText('Update queued for 1 recipient')).toBeVisible();
    await expect(page.getByText('Message ID: mock-message')).toBeVisible();
  });
});
