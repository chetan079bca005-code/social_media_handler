import cron from 'node-cron';
import prisma from '../config/database';
import * as postService from './post.service';
import * as socialAccountService from './social-account.service';
import * as analyticsService from './analytics.service';

let schedulerStarted = false;

/**
 * Background Job Scheduler
 * 
 * Runs three recurring tasks:
 * 1. Publish scheduled posts when their time arrives (every minute)
 * 2. Sync analytics for all active accounts (every 6 hours)
 * 3. Refresh expiring OAuth tokens (every hour)
 */

// ─── Publish Scheduled Posts ───────────────────────────────────────────

async function processScheduledPosts(): Promise<void> {
  try {
    const now = new Date();

    // Find posts that are scheduled and due
    const duePosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      select: { id: true, workspaceId: true },
      take: 20, // Process in batches
    });

    if (duePosts.length === 0) return;

    console.log(`📤 Publishing ${duePosts.length} scheduled post(s)...`);

    const results = await Promise.allSettled(
      duePosts.map(async (post) => {
        try {
          await postService.publishPost(post.id);
          console.log(`  ✅ Published post ${post.id}`);

          // Create a notification for the author
          const fullPost = await prisma.post.findUnique({
            where: { id: post.id },
            select: { authorId: true, content: true },
          });

          if (fullPost?.authorId) {
            await prisma.notification.create({
              data: {
                userId: fullPost.authorId,
                type: 'POST_PUBLISHED',
                title: 'Post Published',
                message: `Your scheduled post has been published: "${(fullPost.content || '').substring(0, 80)}..."`,
                data: { postId: post.id },
              },
            });
          }
        } catch (err: any) {
          console.error(`  ❌ Failed to publish post ${post.id}:`, err.message);

          // Create failure notification
          const fullPost = await prisma.post.findUnique({
            where: { id: post.id },
            select: { authorId: true, content: true },
          });

          if (fullPost?.authorId) {
            await prisma.notification.create({
              data: {
                userId: fullPost.authorId,
                type: 'POST_FAILED',
                title: 'Post Publishing Failed',
                message: `Failed to publish your scheduled post: ${err.message}`,
                data: { postId: post.id, error: err.message },
              },
            });
          }
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    if (succeeded + failed > 0) {
      console.log(`📊 Scheduled posts: ${succeeded} published, ${failed} failed`);
    }
  } catch (err: any) {
    console.error('Scheduler error (processScheduledPosts):', err.message);
  }
}

// ─── Sync Analytics ────────────────────────────────────────────────────

async function syncAllAnalytics(): Promise<void> {
  try {
    // Get all unique workspaces with active accounts
    const workspaces = await prisma.socialAccount.findMany({
      where: { isActive: true },
      select: { workspaceId: true },
      distinct: ['workspaceId'],
    });

    console.log(`📊 Syncing analytics for ${workspaces.length} workspace(s)...`);

    for (const { workspaceId } of workspaces) {
      try {
        await socialAccountService.syncWorkspaceAccounts(workspaceId);
        // Also create a daily analytics snapshot
        await analyticsService.createAnalyticsSnapshot(workspaceId);
      } catch (err: any) {
        console.error(`  ❌ Analytics sync failed for workspace ${workspaceId}:`, err.message);
      }
    }

    console.log('✅ Analytics sync complete');
  } catch (err: any) {
    console.error('Scheduler error (syncAllAnalytics):', err.message);
  }
}

// ─── Refresh Expiring Tokens ───────────────────────────────────────────

async function refreshExpiringTokens(): Promise<void> {
  try {
    // Find tokens expiring in the next 2 hours
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const expiringAccounts = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
        tokenExpiresAt: { lte: twoHoursFromNow },
        refreshToken: { not: null },
      },
      select: { id: true, platform: true, accountName: true },
    });

    if (expiringAccounts.length === 0) return;

    console.log(`🔄 Refreshing ${expiringAccounts.length} expiring token(s)...`);

    for (const account of expiringAccounts) {
      try {
        await socialAccountService.refreshAccessToken(account.id);
        console.log(`  ✅ Refreshed token for ${account.accountName} (${account.platform})`);
      } catch (err: any) {
        console.error(`  ❌ Token refresh failed for ${account.accountName}:`, err.message);
      }
    }
  } catch (err: any) {
    console.error('Scheduler error (refreshExpiringTokens):', err.message);
  }
}

// ─── Start Scheduler ───────────────────────────────────────────────────

export function startScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Every minute: check for scheduled posts that need publishing
  cron.schedule('* * * * *', processScheduledPosts);

  // Every 6 hours: sync analytics for all connected accounts
  cron.schedule('0 */6 * * *', syncAllAnalytics);

  // Every hour: refresh expiring OAuth tokens
  cron.schedule('0 * * * *', refreshExpiringTokens);

  console.log('⏰ Background scheduler started (posts, analytics, tokens)');
}

export function stopScheduler(): void {
  // node-cron doesn't expose a global stop, but tasks can be destroyed
  schedulerStarted = false;
}
