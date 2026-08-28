export default defineBackground(() => {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'replay-caption') return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'CC_REPLAY' }).catch(() => undefined);
  });
});
