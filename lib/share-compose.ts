export const SHARE_PAGE = 'https://deskbub.com/free-desktop-pet';
export const SHARE_CAPTION = 'Found DeskBub — a cute little dog that lives on your desktop while you work 🐶 Kaka is free, and you can make a version of your own pet too.\n\nSharing to earn a free custom-pet creation from DeskBub.';
export const SHARE_VIDEO = '/media/share/kaka-portrait-v1.mp4';
export function sharePostText(caption: string = SHARE_CAPTION) {
  return caption.trim() + '\n' + SHARE_PAGE;
}
export function xShareUrl(caption: string = SHARE_CAPTION) {
  return 'https://x.com/intent/tweet?' + new URLSearchParams({ text: caption.trim(), url: SHARE_PAGE }).toString();
}
export const X_SHARE_URL = xShareUrl();
