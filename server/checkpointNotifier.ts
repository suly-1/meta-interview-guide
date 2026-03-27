/**
 * Checkpoint Publish Notifier
 *
 * Fires a single owner notification on every production server cold-start.
 * Because the Manus platform always cold-starts the server when a new
 * checkpoint is published, this effectively sends "your new version is live"
 * within seconds of each publish — no manual action required from the owner.
 *
 * In development the notification is skipped so local restarts don't spam.
 */
import { notifyOwner } from "./_core/notification";

const SITE_URL = "https://metaengguide.pro";

// Stamp baked in at build time so each deployment reports its own version.
// Falls back to a UTC timestamp when the env var is absent.
const VERSION =
  process.env.CHECKPOINT_VERSION ??
  new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

export async function fireCheckpointPublishedNotification(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  try {
    const sent = await notifyOwner({
      title: "✅ metaengguide.pro is live — new version deployed",
      content: [
        `A new checkpoint has been published and is now live at ${SITE_URL}.`,
        "",
        `Version: ${VERSION}`,
        `Time: ${new Date().toUTCString()}`,
        "",
        "No further action needed — candidates are already seeing the updated site.",
      ].join("\n"),
    });

    if (sent) {
      console.log("[CheckpointNotifier] Owner notified: new version is live.");
    } else {
      console.warn(
        "[CheckpointNotifier] Notification service unavailable — skipped."
      );
    }
  } catch (err) {
    // Never let a notification failure crash the server startup
    console.warn("[CheckpointNotifier] Failed to send notification:", err);
  }
}
